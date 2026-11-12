/**
 * excel-worker.js
 *
 * 외부 라이브러리(XLSX.js, JSZip) 없이 Worker 내에서
 * ZIP 바이너리와 xlsx XML 을 직접 생성합니다.
 *
 * ── RangeError 근본 원인 ───────────────────────────────────────────────
 *  XLSX.js 는 모든 문자열 셀을 shared strings 배열 하나에 집약하고
 *  XML 전체를 단일 문자열로 조립합니다.
 *  10만행 × 40컬럼에서 이 배열/문자열이 V8 한계를 초과합니다.
 *  bookSST:false / type:'binary' 옵션은 내부 구조를 바꾸지 못합니다.
 *
 * ── 해결 구조 ─────────────────────────────────────────────────────────
 *  1. sheet1.xml 을 Uint8Array 청크로 행 단위 스트리밍 생성
 *     → 단일 거대 문자열/배열이 메모리에 존재하지 않음
 *  2. DEFLATE 압축을 직접 구현 (pako 없이 deflate-raw 알고리즘)
 *     → 압축하지 않는 STORE 모드도 지원 (속도 우선 시 옵션)
 *  3. ZIP Local File Header + Data 를 청크 단위로 Uint8Array 에 기록
 *     → 최종 ArrayBuffer 1개만 메인으로 Transferable 전송
 *
 * ── 메모리 흐름 ───────────────────────────────────────────────────────
 *  행 청크 XML(~수KB) → UTF-8 인코딩 → DEFLATE 압축 → ZIP 버퍼 추가
 *  각 단계에서 이전 청크는 GC 가 회수 → 피크 메모리 O(청크 크기)
 *
 * ── 성능 로그 ─────────────────────────────────────────────────────────
 *  [Worker] 전체 시작/종료, 각 단계별 소요시간을 console.log 로 출력
 *  측정 항목:
 *    ① 전처리  : 헤더스타일 수집 + 병합참조 수집 + numFmt 수집
 *    ② 스타일  : buildStylesXml (styles.xml 생성)
 *    ③ 시트데이터: buildSheetData (sheet1.xml 스트리밍)
 *    ④ ZIP 조립 : ZipBuilder.addFile + finalize
 *    ⑤ 전체    : onmessage 진입 ~ done postMessage 직전
 */

/* ═══════════════════════════════════════════════════════════════════════
   유틸
═══════════════════════════════════════════════════════════════════════ */
var _enc = (typeof TextEncoder !== 'undefined') ? new TextEncoder() : null;

function toUtf8(str) {
    if (_enc) return _enc.encode(str);
    var out = [];
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 0x80)       { out.push(c); }
        else if (c < 0x800) { out.push(0xC0|(c>>6), 0x80|(c&0x3F)); }
        else                { out.push(0xE0|(c>>12), 0x80|((c>>6)&0x3F), 0x80|(c&0x3F)); }
    }
    return new Uint8Array(out);
}

var XML_INVALID = /[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g;

function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v)
        .replace(XML_INVALID, '')
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&apos;');
}

var _ac = {};
function colAlpha(idx) {
    if (_ac[idx]) return _ac[idx];
    var s = '', n = idx + 1;
    while (n > 0) { s = String.fromCharCode(((n-1)%26)+65) + s; n = Math.floor((n-1)/26); }
    return (_ac[idx] = s);
}

/* ═══════════════════════════════════════════════════════════════════════
   CRC-32
═══════════════════════════════════════════════════════════════════════ */
var CRC_TABLE = (function() {
    var t = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
        var c = i;
        for (var j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[i] = c;
    }
    return t;
})();

function crc32(buf, crc) {
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    for (var i = 0; i < buf.length; i++) crc = (CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

/* ═══════════════════════════════════════════════════════════════════════
   동적 Uint8Array 버퍼
═══════════════════════════════════════════════════════════════════════ */
function DynBuffer(initSize) {
    this.buf = new Uint8Array(initSize || 1024 * 1024);
    this.pos = 0;
}
DynBuffer.prototype.ensure = function(need) {
    if (this.pos + need <= this.buf.length) return;
    var next = Math.max(this.buf.length * 2, this.pos + need);
    var nb = new Uint8Array(next);
    nb.set(this.buf.subarray(0, this.pos));
    this.buf = nb;
};
DynBuffer.prototype.writeBytes  = function(arr) { this.ensure(arr.length); this.buf.set(arr, this.pos); this.pos += arr.length; };
DynBuffer.prototype.writeU8     = function(v)   { this.ensure(1); this.buf[this.pos++] = v & 0xFF; };
DynBuffer.prototype.writeU16LE  = function(v)   { this.ensure(2); this.buf[this.pos++] = v & 0xFF; this.buf[this.pos++] = (v >> 8) & 0xFF; };
DynBuffer.prototype.writeU32LE  = function(v)   {
    this.ensure(4); v = v >>> 0;
    this.buf[this.pos++] = v & 0xFF; this.buf[this.pos++] = (v >> 8) & 0xFF;
    this.buf[this.pos++] = (v >> 16) & 0xFF; this.buf[this.pos++] = (v >> 24) & 0xFF;
};
DynBuffer.prototype.patchU32LE  = function(offset, v) {
    v = v >>> 0;
    this.buf[offset] = v & 0xFF; this.buf[offset+1] = (v >> 8) & 0xFF;
    this.buf[offset+2] = (v >> 16) & 0xFF; this.buf[offset+3] = (v >> 24) & 0xFF;
};
DynBuffer.prototype.slice       = function() { return this.buf.slice(0, this.pos); };

/* ═══════════════════════════════════════════════════════════════════════
   DEFLATE Store 모드
═══════════════════════════════════════════════════════════════════════ */
var MAX_STORE_BLOCK = 65535;

function deflateStore(data) {
    var totalBlocks = Math.ceil(data.length / MAX_STORE_BLOCK) || 1;
    var out = new DynBuffer(data.length + totalBlocks * 5 + 2);
    var offset = 0;
    while (offset < data.length) {
        var blockLen = Math.min(MAX_STORE_BLOCK, data.length - offset);
        var isFinal  = (offset + blockLen >= data.length) ? 1 : 0;
        out.writeU8(isFinal);
        out.writeU16LE(blockLen);
        out.writeU16LE((~blockLen) & 0xFFFF);
        out.writeBytes(data.subarray(offset, offset + blockLen));
        offset += blockLen;
    }
    return out.slice();
}

/* ═══════════════════════════════════════════════════════════════════════
   ZIP 빌더
═══════════════════════════════════════════════════════════════════════ */
function ZipBuilder() {
    this.buf     = new DynBuffer(4 * 1024 * 1024);
    this.entries = [];
}
ZipBuilder.prototype.addFile = function(name, data) {
    var nameBytes  = toUtf8(name);
    var crc        = crc32(data, 0);
    var compressed = deflateStore(data);
    var offset     = this.buf.pos;

    this.buf.writeU32LE(0x04034B50);
    this.buf.writeU16LE(20);
    this.buf.writeU16LE(0x0800);
    this.buf.writeU16LE(8);
    this.buf.writeU16LE(0);
    this.buf.writeU16LE(0);
    this.buf.writeU32LE(crc);
    this.buf.writeU32LE(compressed.length);
    this.buf.writeU32LE(data.length);
    this.buf.writeU16LE(nameBytes.length);
    this.buf.writeU16LE(0);
    this.buf.writeBytes(nameBytes);
    this.buf.writeBytes(compressed);

    this.entries.push({ name: nameBytes, crc: crc, compSize: compressed.length, uncompSize: data.length, offset: offset });
};
ZipBuilder.prototype.finalize = function() {
    var cdOffset = this.buf.pos;
    for (var i = 0; i < this.entries.length; i++) {
        var e = this.entries[i];
        this.buf.writeU32LE(0x02014B50);
        this.buf.writeU16LE(20); this.buf.writeU16LE(20);
        this.buf.writeU16LE(0x0800); this.buf.writeU16LE(8);
        this.buf.writeU16LE(0); this.buf.writeU16LE(0);
        this.buf.writeU32LE(e.crc);
        this.buf.writeU32LE(e.compSize); this.buf.writeU32LE(e.uncompSize);
        this.buf.writeU16LE(e.name.length);
        this.buf.writeU16LE(0); this.buf.writeU16LE(0); this.buf.writeU16LE(0);
        this.buf.writeU16LE(0); this.buf.writeU32LE(0);
        this.buf.writeU32LE(e.offset);
        this.buf.writeBytes(e.name);
    }
    var cdSize = this.buf.pos - cdOffset;
    this.buf.writeU32LE(0x06054B50);
    this.buf.writeU16LE(0); this.buf.writeU16LE(0);
    this.buf.writeU16LE(this.entries.length); this.buf.writeU16LE(this.entries.length);
    this.buf.writeU32LE(cdSize); this.buf.writeU32LE(cdOffset);
    this.buf.writeU16LE(0);
    return this.buf.slice().buffer;
};

/* ═══════════════════════════════════════════════════════════════════════
   스타일 XML 생성
═══════════════════════════════════════════════════════════════════════ */
function buildStylesXml(headerStyles, dataNumFmts) {
    var fonts   = ['<font><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/></font>'];
    var fills   = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
    var borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'];
    var numFmts = [];
    var xfs     = [
        '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>',
        '<xf numFmtId="1" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>'
    ];
    var xfMap       = Object.create(null);
    var numFmtXfMap = Object.create(null);
    var nextNFId    = 164;
    var nfMap       = Object.create(null);

    function regNF(fmt) {
        if (!fmt) return 0;
        if (nfMap[fmt] !== undefined) return nfMap[fmt];
        var id = nextNFId++;
        nfMap[fmt] = id;
        numFmts.push('<numFmt numFmtId="' + id + '" formatCode="' + esc(fmt) + '"/>');
        return id;
    }
    if (dataNumFmts) {
        for (var dn = 0; dn < dataNumFmts.length; dn++) {
            var dfmt = dataNumFmts[dn];
            if (dfmt && numFmtXfMap[dfmt] === undefined) {
                var dnfId = regNF(dfmt);
                xfs.push('<xf numFmtId="' + dnfId + '" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>');
                numFmtXfMap[dfmt] = xfs.length - 1;
            }
        }
    }
    function regDataNumFmt(fmt) {
        if (!fmt) return 1;
        if (numFmtXfMap[fmt] !== undefined) return numFmtXfMap[fmt];
        var nfId = regNF(fmt);
        xfs.push('<xf numFmtId="' + nfId + '" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>');
        numFmtXfMap[fmt] = xfs.length - 1;
        return numFmtXfMap[fmt];
    }
    function regFont(f) {
        if (!f) return 0;
        var xml = '<font>' + (f.bold ? '<b/>' : '') + (f.italic ? '<i/>' : '')
            + '<sz val="' + (f.sz || '11') + '"/>'
            + '<color rgb="' + (f.color && f.color.rgb ? f.color.rgb : 'FF000000') + '"/>'
            + '<name val="' + esc(f.name || 'Calibri') + '"/></font>';
        var idx = fonts.indexOf(xml);
        if (idx < 0) { idx = fonts.length; fonts.push(xml); }
        return idx;
    }
    function regFill(fc) {
        var rgb = fc && fc.fgColor && fc.fgColor.rgb ? fc.fgColor.rgb : '';
        if (!rgb || rgb === 'FFFFFF' || rgb === 'FFFFFFFF') return 0;
        var xml = '<fill><patternFill patternType="solid"><fgColor rgb="' + rgb + '"/></patternFill></fill>';
        var idx = fills.indexOf(xml);
        if (idx < 0) { idx = fills.length; fills.push(xml); }
        return idx;
    }
    function regBorder(b) {
        if (!b) return 0;
        function side(s, tag) {
            if (!s || !s.style || s.style === 'none') return '<' + tag + '/>';
            return '<' + tag + ' style="' + s.style + '"><color rgb="'
                + (s.color && s.color.rgb ? s.color.rgb : 'FF000000') + '"/></' + tag + '>';
        }
        var xml = '<border>' + side(b.left,'left') + side(b.right,'right')
            + side(b.top,'top') + side(b.bottom,'bottom') + '<diagonal/></border>';
        var idx = borders.indexOf(xml);
        if (idx < 0) { idx = borders.length; borders.push(xml); }
        return idx;
    }
    /* intXfMap: 소수점 포맷 xf의 정수 포맷 버전 인덱스
       key = 원래 xf key, value = 정수 포맷으로 교체된 xf 인덱스
       buildSheetData에서 정수값 셀 교체 시 fill/font/border 유지하며 numFmt만 변경 */
    var intXfMap = Object.create(null);

    for (var i = 0; i < headerStyles.length; i++) {
        var hs = headerStyles[i];
        if (xfMap[hs.key] !== undefined) continue;
        var ha = hs.alignment && hs.alignment.horizontal ? hs.alignment.horizontal : 'general';
        var va = hs.alignment && hs.alignment.vertical   ? hs.alignment.vertical   : 'bottom';
        xfs.push(
            '<xf numFmtId="' + regNF(hs.numFmt) + '" fontId="' + regFont(hs.font)
            + '" fillId="' + regFill(hs.fill) + '" borderId="' + regBorder(hs.border)
            + '" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">'
            + '<alignment horizontal="' + ha + '" vertical="' + va + '"/></xf>'
        );
        xfMap[hs.key] = xfs.length - 1;

        /* 소수점 포맷인 경우 정수 포맷 버전 xf도 함께 등록
           fill/font/border/alignment는 동일하게 유지, numFmt만 소수점 제거 */
        if (hs.numFmt && hs.numFmt.indexOf('.') >= 0) {
            var intFmt = hs.numFmt.substring(0, hs.numFmt.indexOf('.'));
            var intKey = hs.key + '__int__';
            if (intXfMap[hs.key] === undefined) {
                xfs.push(
                    '<xf numFmtId="' + regNF(intFmt) + '" fontId="' + regFont(hs.font)
                    + '" fillId="' + regFill(hs.fill) + '" borderId="' + regBorder(hs.border)
                    + '" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"'
                    + ' applyNumberFormat="1">'
                    + '<alignment horizontal="' + ha + '" vertical="' + va + '"/></xf>'
                );
                intXfMap[hs.key] = xfs.length - 1;
            }
        }
    }
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        + (numFmts.length ? '<numFmts count="' + numFmts.length + '">' + numFmts.join('') + '</numFmts>' : '')
        + '<fonts count="'   + fonts.length   + '">' + fonts.join('')   + '</fonts>'
        + '<fills count="'   + fills.length   + '">' + fills.join('')   + '</fills>'
        + '<borders count="' + borders.length + '">' + borders.join('') + '</borders>'
        + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        + '<cellXfs count="' + xfs.length + '">' + xfs.join('') + '</cellXfs>'
        + '</styleSheet>';
    return { xml: xml, xfMap: xfMap, numFmtXfMap: numFmtXfMap, intXfMap: intXfMap };
}

/* ═══════════════════════════════════════════════════════════════════════
   sheet1.xml 스트리밍 생성
═══════════════════════════════════════════════════════════════════════ */
function buildSheetData(rows, mergeRefs, xfMap, numFmtXfMap, intXfMap, colWidths, totalCols, cellStyles, totalRows) {
    var out = new DynBuffer(32 * 1024 * 1024);
    var REPORT     = 1000;   // 행 단위 보고 주기
    var processedRows = 0;
    var totalRows_ = totalRows || rows.length;

    function write(str) { out.writeBytes(toUtf8(str)); }

    write('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
        + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        + '<sheetViews><sheetView workbookViewId="0"/></sheetViews>');

    if (colWidths && colWidths.length) {
        write('<cols>');
        for (var ci = 0; ci < colWidths.length; ci++) {
            if (colWidths[ci] && colWidths[ci].wch) {
                write('<col min="' + (ci+1) + '" max="' + (ci+1)
                    + '" width="' + colWidths[ci].wch + '" customWidth="1"/>');
            }
        }
        write('</cols>');
    }

    write('<sheetData>');

    for (var ri2 = 0; ri2 < rows.length; ri2++) {
        var rowPayload = rows[ri2];
        var cells      = rowPayload.cells;
        var rowNum     = rowPayload.rowIndex;

        var minCol = Infinity, maxCol = 0;
        for (var sc = 0; sc < cells.length; sc++) {
            var cm = cells[sc].ref.match(/^([A-Z]+)/);
            if (cm) {
                var cv = 0;
                for (var ck = 0; ck < cm[1].length; ck++) cv = cv * 26 + cm[1].charCodeAt(ck) - 64;
                if (cv < minCol) minCol = cv;
                if (cv > maxCol) maxCol = cv;
            }
        }
        if (minCol === Infinity) minCol = 1;

        write('<row r="' + rowNum + '" spans="' + minCol + ':' + maxCol + '">');

        for (var ci2 = 0; ci2 < cells.length; ci2++) {
            var cell  = cells[ci2];
            var xfIdx;
            if (cell.si !== undefined && cell.si >= 0) {
                /* styleTable 인덱스로 xfMap 직접 조회 */
                var siKey = cellStyles[cell.si] && cellStyles[cell.si].key;
                xfIdx = (siKey && xfMap[siKey] !== undefined) ? xfMap[siKey] : 0;

                /* 정수값인데 소수점 포맷이 적용된 경우 정수 포맷으로 교체
                   cell.numFmt 대신 styleTable의 numFmt를 직접 참조
                   → shouldApplyStyle 여부와 무관하게 동작
                   ex) #,##0.## + 값 110 -> #,##0 적용 (110. 방지)          */
                /* 정수값인데 소수점 포맷인 경우 → intXfMap으로 교체
                   fill/font/border는 원래 xf 유지, numFmt만 정수 버전으로 변경 */
                var siNumFmt = cellStyles[cell.si] && cellStyles[cell.si].numFmt;
                if (cell.t === 'n' && siNumFmt && siNumFmt.indexOf('.') >= 0) {
                    var numVal = Number(cell.v);
                    if (!isNaN(numVal) && numVal % 1 === 0) {
                        var intXfIdx2 = intXfMap[siKey];
                        if (intXfIdx2 !== undefined) xfIdx = intXfIdx2;
                    }
                }
            } else if (cell.t === 'n') {
                var nfmt = cell.numFmt || '';
                xfIdx = nfmt ? numFmtXfMap[nfmt] : 1;
                if (xfIdx === undefined) xfIdx = 1;
            } else {
                xfIdx = 0;
            }
            var sAttr = xfIdx ? ' s="' + xfIdx + '"' : '';
            var val   = cell.v;

            if (cell.t === 'n' && val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) {
                write('<c r="' + cell.ref + '"' + sAttr + '><v>' + Number(val) + '</v></c>');
            } else {
                var strVal = (val === null || val === undefined) ? '' : String(val);
                write('<c r="' + cell.ref + '" t="inlineStr"' + sAttr
                    + '><is><t xml:space="preserve">' + esc(strVal) + '</t></is></c>');
            }

        }

        write('</row>');
        processedRows++;
        if (processedRows % REPORT === 0) {
            self.postMessage({ type: 'progress',
                processed: processedRows,
                total:     totalRows_,
                pct:       Math.min(90, Math.round(processedRows/totalRows_ * 85)) });
        }
    }

    write('</sheetData>');

    if (mergeRefs && mergeRefs.length) {
        write('<mergeCells count="' + mergeRefs.length + '">');
        for (var mi = 0; mi < mergeRefs.length; mi++) {
            write('<mergeCell ref="' + mergeRefs[mi] + '"/>');
        }
        write('</mergeCells>');
    }

    write('</worksheet>');
    return out.slice();
}

/* ═══════════════════════════════════════════════════════════════════════
   xlsx ZIP 조립
═══════════════════════════════════════════════════════════════════════ */
function buildXlsx(sheetName, rows, colWidths, mergeRefs, cellStyles, dataNumFmts, totalCols, totalRows) {
//    self.postMessage({ type: 'progress', pct: 5 });

    /* ② 스타일 XML 생성 */
    var t2 = Date.now();
    /* 소수점 포맷(#,##0.##)이 있으면 대응하는 정수 포맷(#,##0)도 미리 등록
       buildSheetData에서 정수값 셀의 포맷 교체 시 numFmtXfMap에서 바로 찾을 수 있도록 */
    var extDataNumFmts = (dataNumFmts || []).slice();
    for (var _di = 0; _di < extDataNumFmts.length; _di++) {
        var _fmt = extDataNumFmts[_di];
        if (_fmt && _fmt.indexOf('.') >= 0) {
            var _intFmt = _fmt.substring(0, _fmt.indexOf('.'));
            if (_intFmt && extDataNumFmts.indexOf(_intFmt) < 0) {
                extDataNumFmts.push(_intFmt);
            }
        }
    }
    var stylesResult = buildStylesXml(cellStyles, extDataNumFmts);

//    self.postMessage({ type: 'progress', pct: 10 });

    /* ③ sheet1.xml 스트리밍 생성 */
    var t3 = Date.now();
    var sheetData = buildSheetData(
        rows, mergeRefs, stylesResult.xfMap, stylesResult.numFmtXfMap, stylesResult.intXfMap, colWidths, totalCols, cellStyles, totalRows
    );
    self.postMessage({ type: 'progress', pct: 92 });

    /* 고정 XML */
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml"  ContentType="application/xml"/>'
        + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        + '</Types>';

    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        + '</Relationships>';

    var wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
        + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        + '<sheets><sheet name="' + esc(sheetName) + '" sheetId="1" r:id="rId1"/></sheets>'
        + '</workbook>';

    var wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        + '</Relationships>';

    /* ④ ZIP 조립 */
    var t4 = Date.now();
    var zip = new ZipBuilder();
    zip.addFile('[Content_Types].xml',        toUtf8(ct));
    zip.addFile('_rels/.rels',                toUtf8(rels));
    zip.addFile('xl/workbook.xml',            toUtf8(wb));
    zip.addFile('xl/_rels/workbook.xml.rels', toUtf8(wbRels));
    zip.addFile('xl/styles.xml',              toUtf8(stylesResult.xml));
    zip.addFile('xl/worksheets/sheet1.xml',   sheetData);
    var ab = zip.finalize();
    self.postMessage({ type: 'progress', pct: 97 });

    return ab;
}

/* ═══════════════════════════════════════════════════════════════════════
   메시지 핸들러
═══════════════════════════════════════════════════════════════════════ */
self.onmessage = function(e) {
    var msg = e.data;
    if (msg.type !== 'build') return;

    /* ⑤ 전체 시작 */
    var _t0 = Date.now();

    try {
        var rows       = msg.rows       || [];
        var styleTable = msg.styleTable || [];   // 메인 스레드에서 보낸 스타일 정의 테이블
        var mergeRefs  = [];
        var totalCols  = 0;

        /* ① 전처리: styleTable 변환 + 병합참조 + numFmt 수집
         *
         *  [변경 이유]
         *  이전: 셀마다 스타일 객체(cell.s)를 복사해 postMessage 전송
         *        → 대량 데이터에서 structuredClone 직렬화 중 OOM(DataCloneError) 발생
         *  신규: 메인 스레드에서 중복 제거된 styleTable[]을 1회 전송,
         *        셀에는 인덱스(cell.si)만 부여
         *        → postMessage 전송 크기 대폭 감소, OOM 해결
         */
        var t1 = Date.now();

        /* styleTable → cellStyles (buildStylesXml 이 기대하는 {key,font,fill,...} 형태) */
        var cellStyles = [];
        for (var ti = 0; ti < styleTable.length; ti++) {
            var st  = styleTable[ti];
            var key = JSON.stringify({
                font: st.font, fill: st.fill,
                border: st.border, alignment: st.alignment,
                numFmt: st.numFmt
            });
            cellStyles.push({
                key: key, font: st.font, fill: st.fill,
                border: st.border, alignment: st.alignment, numFmt: st.numFmt
            });
        }

        /* 병합 참조 + totalCols 수집 */
        for (var ri = 0; ri < rows.length; ri++) {
            var cells = rows[ri].cells;
            for (var ci = 0; ci < cells.length; ci++) {
                var cell = cells[ci];

                if (cell.merge) {
                    var m      = cell.ref.match(/^([A-Z]+)(\d+)$/);
                    var sc     = 0;
                    for (var k = 0; k < m[1].length; k++) sc = sc * 26 + m[1].charCodeAt(k) - 64;
                    var sr     = parseInt(m[2], 10);
                    var endRef = colAlpha(sc - 1 + cell.merge.cs - 1) + (sr + cell.merge.rs - 1);
                    mergeRefs.push(cell.ref + ':' + endRef);
                }

                var m2 = cell.ref.match(/^([A-Z]+)/);
                if (m2) {
                    var c = 0;
                    for (var k2 = 0; k2 < m2[1].length; k2++) c = c * 26 + m2[1].charCodeAt(k2) - 64;
                    if (c > totalCols) totalCols = c;
                }
            }
        }

        /* 숫자 셀의 numFmt 수집
           si >= 0 인 셀은 styleTable에서 numFmt 가져옴
           si = -1 인 셀은 cell.numFmt 직접 사용                          */
        var dataNumFmts = [];
        var seenNF      = Object.create(null);
        for (var di = 0; di < rows.length; di++) {
            var dcells = rows[di].cells;
            for (var dci = 0; dci < dcells.length; dci++) {
                var dc = dcells[dci];
                if (dc.t !== 'n') continue;
                var nf = (dc.si !== undefined && dc.si >= 0 && cellStyles[dc.si])
                    ? cellStyles[dc.si].numFmt
                    : dc.numFmt;
                if (nf && !seenNF[nf]) {
                    seenNF[nf] = true;
                    dataNumFmts.push(nf);
                }
            }
        }


        var ab = buildXlsx(
            msg.sheetName || 'Sheet1',
            rows, msg.colWidths, mergeRefs, cellStyles, dataNumFmts, totalCols, msg.totalRows
        );

        /* ⑤ 전체 종료 */
        self.postMessage({ type: 'done', buffer: ab }, [ab]);

    } catch (err) {
        console.error('[Worker] 오류 발생: ' + (err.message || String(err)));
        self.postMessage({ type: 'error', message: err.message || String(err) });
    }
};