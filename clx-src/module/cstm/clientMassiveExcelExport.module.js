/************************************************
 * i11120_grid_jeeeyul.module.js
 * Created at 2026. 10. 7. 오후 3:11:40.
 *
 * 그리드를 서버 없이 XLSX 로 내보내는 시험 구현(release-test-project#11120, #11144 B안의 값 전용 축소판).
 * 메모리가 데이터량에 비례해 늘지 않도록 다음을 지킨다.
 * - 시트 XML 을 통째로 만들지 않는다. 수백 KB 조각을 만들 때마다 압축기에 넣는다.
 * - 문자열 셀은 sharedStrings 사전 대신 inlineStr 로 쓴다.
 * - 압축은 브라우저 내장 CompressionStream("deflate-raw"), zip 은 크기와 CRC 를 뒤에 쓰는 데이터 디스크립터 방식으로 스트리밍한다.
 * - 압축된 조각은 일정 크기마다 Blob 으로 합쳐 JS 힙에서 내보낸다. 파일 저장 대화상자를 쓰면 디스크에 바로 쓴다.
 * 행은 데이터셋의 뷰 순서로 읽으므로 정렬, 필터가 반영된다. 시간 분할로 메인 스레드를 오래 붙잡지 않는다.
 *
 * @author jeeeyul
 ************************************************/

/// @validator-off

/** 시트 한 장의 데이터 행 수 상한. 엑셀 한계 1,048,576 에서 헤더 행 하나를 뺐다 */
var XLSX_MAX_DATA_ROWS = 1048575;
/** 엑셀 셀 하나의 최대 글자 수 */
var XLSX_MAX_CELL_CHARS = 32767;
/** 시트 XML 조각 하나의 목표 글자 수 */
var XLSX_CHUNK_CHARS = 256 * 1024;
/** 한 번에 메인 스레드를 잡는 시간(ms). 넘으면 이벤트 루프에 양보한다 */
var XLSX_TIME_SLICE = 12;
/** 압축된 조각을 이만큼 모으면 Blob 으로 합친다 */
var XLSX_BLOB_FLUSH_BYTES = 8 * 1024 * 1024;
/** 그리드 너비(px)를 엑셀 열 너비(글자 수)로 바꾸는 값. 서버 엑셀 export 와 같이 7px 을 한 글자로 본다 */
var XLSX_PX_PER_CHAR = 7;
/** 데이터 셀 기본 스타일 번호(가운데 정렬) */
var XLSX_STYLE_CENTER = 2;

var XLSX_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
var XLSX_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
var XLSX_PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";

/* CRC32 (zip) */

var crc32Table = (function() {
	var table = new Int32Array(256);
	for (var n = 0; n < 256; n++) {
		var c = n;
		for (var k = 0; k < 8; k++) {
			c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
		}
		table[n] = c;
	}
	return table;
})();

/** crc 는 이전 값(처음은 0). 갱신한 값을 반환한다 */
function crc32Update(crc, bytes) {
	var c = crc ^ -1;
	for (var i = 0, len = bytes.length; i < len; i++) {
		c = crc32Table[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
	}
	return (c ^ -1) >>> 0;
}

/* 출력 싱크 */

/**
 * 압축된 조각을 Blob 으로 모으는 싱크. 조각이 XLSX_BLOB_FLUSH_BYTES 만큼 쌓이면 기존 Blob 과 합친다.
 * Blob 은 JS 힙 밖(브라우저 저장소)에 있고 기존 Blob 을 합칠 때 바이트를 복사하지 않는다.
 */
function createBlobSink(mimeType) {
	var blob = new Blob([], { type: mimeType });
	var pending = [];
	var pendingBytes = 0;
	var position = 0;
	function flush() {
		if (pending.length > 0) {
			blob = new Blob([blob].concat(pending), { type: mimeType });
			pending = [];
			pendingBytes = 0;
		}
	}
	return {
		position: function() {
			return position;
		},
		write: function(bytes) {
			pending.push(bytes);
			pendingBytes += bytes.length;
			position += bytes.length;
			if (pendingBytes >= XLSX_BLOB_FLUSH_BYTES) {
				flush();
			}
			return Promise.resolve();
		},
		close: function() {
			flush();
			return Promise.resolve(blob);
		},
		abort: function() {
			pending = [];
			blob = null;
			return Promise.resolve();
		}
	};
}

/**
 * File System Access API 의 쓰기 스트림으로 디스크에 바로 쓰는 싱크.
 */
function createFileSink(writable) {
	var position = 0;
	return {
		position: function() {
			return position;
		},
		write: function(bytes) {
			position += bytes.length;
			return writable.write(bytes);
		},
		close: function() {
			return writable.close().then(function() {
				return null;
			});
		},
		abort: function() {
			return writable.abort();
		}
	};
}

/* zip 스트리밍 기록 */

function dosDateTime(date) {
	var time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
	var day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
	return { time: time, date: day };
}

/**
 * zip 을 싱크에 차례로 기록한다. 엔트리는 모두 deflate 압축이고, 크기와 CRC 는 데이터 디스크립터로 뒤에 쓴다.
 * Zip64 는 지원하지 않으므로 엔트리 하나의 원본 크기와 전체 크기는 4GB 를 넘을 수 없다.
 */
function createZipWriter(sink) {
	var encoder = new TextEncoder();
	var entries = [];
	var stamp = dosDateTime(new Date());
	var aborted = false;
	var current = null;

	function u16(view, offset, value) {
		view.setUint16(offset, value, true);
	}
	function u32(view, offset, value) {
		view.setUint32(offset, value >>> 0, true);
	}
	function checkSize(value, what) {
		if (value > 0xFFFFFFFF) {
			throw new Error(what + " exceeds 4GB (Zip64 is not supported)");
		}
	}

	/**
	 * 엔트리 하나를 기록한다.
	 * @param name 엔트리 경로
	 * @param produce function(write) — write(Uint8Array) 는 압축기가 받아들이면 끝나는 Promise. produce 는 다 쓰면 끝나는 Promise 를 반환한다.
	 */
	function addEntry(name, produce) {
		var nameBytes = encoder.encode(name);
		var offset = sink.position();
		checkSize(offset, "zip size");

		var header = new Uint8Array(30 + nameBytes.length);
		var hv = new DataView(header.buffer);
		u32(hv, 0, 0x04034B50);
		u16(hv, 4, 20); // version needed
		u16(hv, 6, 0x0808); // bit 3: data descriptor, bit 11: UTF-8 이름
		u16(hv, 8, 8); // deflate
		u16(hv, 10, stamp.time);
		u16(hv, 12, stamp.date);
		// CRC, 크기는 0 (데이터 디스크립터에 쓴다)
		u16(hv, 26, nameBytes.length);
		header.set(nameBytes, 30);

		var crc = 0;
		var rawSize = 0;
		var compressedSize = 0;
		var compression = new CompressionStream("deflate-raw");
		var writer = compression.writable.getWriter();
		var reader = compression.readable.getReader();
		current = { writer: writer, reader: reader };

		// 압축 출력은 따로 계속 읽어 싱크로 보낸다. 읽지 않으면 압축기가 막혀 입력도 멈춘다.
		var pump = (function next() {
			return reader.read().then(function(result) {
				if (result.done) {
					return null;
				}
				compressedSize += result.value.length;
				return sink.write(result.value).then(next);
			});
		})();

		function write(bytes) {
			if (aborted) {
				return Promise.reject(new Error("aborted"));
			}
			crc = crc32Update(crc, bytes);
			rawSize += bytes.length;
			return writer.write(bytes);
		}

		return sink.write(header).then(function() {
			return produce(write);
		}).then(function() {
			return writer.close();
		}).then(function() {
			return pump;
		}).then(function() {
			current = null;
			checkSize(rawSize, name);
			checkSize(compressedSize, name);
			var descriptor = new Uint8Array(16);
			var dv = new DataView(descriptor.buffer);
			u32(dv, 0, 0x08074B50);
			u32(dv, 4, crc);
			u32(dv, 8, compressedSize);
			u32(dv, 12, rawSize);
			entries.push({ nameBytes: nameBytes, crc: crc, compressedSize: compressedSize, rawSize: rawSize, offset: offset });
			return sink.write(descriptor);
		});
	}

	/** 문자열 하나로 된 작은 엔트리 */
	function addTextEntry(name, text) {
		return addEntry(name, function(write) {
			return write(encoder.encode(text));
		});
	}

	/** 중앙 디렉터리와 끝 레코드를 쓰고 싱크를 닫는다. */
	function finish() {
		var start = sink.position();
		var size = 0;
		var parts = entries.map(function(entry) {
			var record = new Uint8Array(46 + entry.nameBytes.length);
			var v = new DataView(record.buffer);
			u32(v, 0, 0x02014B50);
			u16(v, 4, 20); // version made by
			u16(v, 6, 20); // version needed
			u16(v, 8, 0x0808);
			u16(v, 10, 8);
			u16(v, 12, stamp.time);
			u16(v, 14, stamp.date);
			u32(v, 16, entry.crc);
			u32(v, 20, entry.compressedSize);
			u32(v, 24, entry.rawSize);
			u16(v, 28, entry.nameBytes.length);
			u32(v, 42, entry.offset);
			record.set(entry.nameBytes, 46);
			size += record.length;
			return record;
		});
		checkSize(start + size, "zip size");
		var end = new Uint8Array(22);
		var ev = new DataView(end.buffer);
		u32(ev, 0, 0x06054B50);
		u16(ev, 8, entries.length);
		u16(ev, 10, entries.length);
		u32(ev, 12, size);
		u32(ev, 16, start);
		parts.push(end);

		var chain = Promise.resolve();
		parts.forEach(function(part) {
			chain = chain.then(function() {
				return sink.write(part);
			});
		});
		return chain.then(function() {
			return sink.close();
		});
	}

	function abort() {
		aborted = true;
		if (current) {
			try { current.writer.abort(); } catch (e) { /* 이미 닫힘 */ }
			try { current.reader.cancel(); } catch (e) { /* 이미 닫힘 */ }
		}
		return sink.abort();
	}

	return { addEntry: addEntry, addTextEntry: addTextEntry, finish: finish, abort: abort };
}

/* XLSX 부품 */

function xlsxColumnLetter(index) {
	var name = "";
	index += 1;
	while (index > 0) {
		var mod = (index - 1) % 26;
		name = String.fromCharCode(65 + mod) + name;
		index = Math.floor((index - 1) / 26);
	}
	return name;
}

var XML_INVALID_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

function xmlEscape(text) {
	if (/[&<>\u0000-\u001F\uFFFE\uFFFF]/.test(text) == false) {
		return text;
	}
	return text.replace(XML_INVALID_CHARS, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 셀 XML. 빈 값이면 빈 문자열 셀. style 이 0 이면 가운데 정렬 스타일을 쓴다 */
function xlsxCell(ref, value, numeric, style) {
	if (value == null || value === "") {
		// 빈 셀을 비워 두면 옆 셀의 긴 텍스트가 넘쳐 보이므로, 서버 엑셀 export 처럼 빈 문자열 셀로 쓴다
		return "<c r=\"" + ref + "\" t=\"inlineStr\" s=\"" + (style || XLSX_STYLE_CENTER) + "\"><is><t></t></is></c>";
	}
	var styleAttr = " s=\"" + (style || XLSX_STYLE_CENTER) + "\"";
	if (numeric) {
		if (typeof value == "number" && isFinite(value)) {
			return "<c r=\"" + ref + "\"" + styleAttr + "><v>" + value + "</v></c>";
		}
		if (typeof value == "object" && typeof value.toString == "function" && /^-?\d+(\.\d+)?$/.test(String(value))) {
			return "<c r=\"" + ref + "\"" + styleAttr + "><v>" + String(value) + "</v></c>"; // DecimalType
		}
	}
	var text = String(value);
	if (text.length > XLSX_MAX_CELL_CHARS) {
		text = text.substring(0, XLSX_MAX_CELL_CHARS);
	}
	var preserve = /^\s|\s$/.test(text) ? " xml:space=\"preserve\"" : "";
	return "<c r=\"" + ref + "\" t=\"inlineStr\"" + styleAttr + "><is><t" + preserve + ">" + xmlEscape(text) + "</t></is></c>";
}

/**
 * 셀 스타일 목록. 0 은 기본, 1 은 헤더(굵게, 회색 배경, 얇은 회색 테두리, 가운데 정렬. 서버 엑셀 export 헤더와 같다),
 * 2 는 데이터 기본(가운데 정렬), 3 부터는 표시 형식(numFmt)별 스타일(가운데 정렬)이다.
 * 시트를 쓰는 동안 필요한 형식이 생길 때마다 늘어나고, styles.xml 은 시트를 다 쓴 뒤에 만든다.
 */
function createStyleRegistry() {
	var codes = [];
	var styleByCode = {};
	return {
		/** 표시 형식 코드의 스타일 번호 */
		numFmt: function(code) {
			if (styleByCode.hasOwnProperty(code) == false) {
				codes.push(code);
				styleByCode[code] = codes.length + 2;
			}
			return styleByCode[code];
		},
		xml: function() {
			var numFmts = "";
			var xfs = "";
			codes.forEach(function(code, index) {
				numFmts += "<numFmt numFmtId=\"" + (164 + index) + "\" formatCode=\"" + xmlEscape(code).replace(/"/g, "&quot;") + "\"/>";
				xfs += "<xf numFmtId=\"" + (164 + index) + "\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\"/></xf>";
			});
			return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
				+ "<styleSheet xmlns=\"" + XLSX_NS + "\">"
				+ (codes.length > 0 ? "<numFmts count=\"" + codes.length + "\">" + numFmts + "</numFmts>" : "")
				+ "<fonts count=\"2\"><font><sz val=\"11\"/><name val=\"맑은 고딕\"/></font><font><b/><sz val=\"11\"/><name val=\"맑은 고딕\"/></font></fonts>"
				+ "<fills count=\"3\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill>"
				+ "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFDDDDDD\"/><bgColor indexed=\"64\"/></patternFill></fill></fills>"
				+ "<borders count=\"2\"><border><left/><right/><top/><bottom/><diagonal/></border>"
				+ "<border><left style=\"thin\"><color rgb=\"FFBBBBBB\"/></left><right style=\"thin\"><color rgb=\"FFBBBBBB\"/></right>"
				+ "<top style=\"thin\"><color rgb=\"FFBBBBBB\"/></top><bottom style=\"thin\"><color rgb=\"FFBBBBBB\"/></bottom><diagonal/></border></borders>"
				+ "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>"
				+ "<cellXfs count=\"" + (codes.length + 3) + "\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>"
				+ "<xf numFmtId=\"49\" fontId=\"1\" fillId=\"2\" borderId=\"1\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\">"
				+ "<alignment horizontal=\"center\" vertical=\"center\"/></xf>"
				+ "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\"/></xf>"
				+ xfs + "</cellXfs>"
				+ "<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>"
				+ "</styleSheet>";
		}
	};
}

/* 그리드 표시 형식 → 엑셀 */

/** 엑셀 서식 코드에서 리터럴로 써야 하는 글자 묶음을 따옴표로 감싼다 */
function xlsxQuoteLiteral(text) {
	return /^[-\/:., ()]*$/.test(text) ? text : "\"" + text.replace(/"/g, "") + "\"";
}

/** 숫자 셀에 쓸 값 문자열. 숫자로 볼 수 없으면 null */
function xlsxNumberText(value) {
	if (typeof value == "number") {
		return isFinite(value) ? String(value) : null;
	}
	var text = String(value).trim(); // DecimalType, 숫자 문자열
	return /^-?\d+(\.\d+)?$/.test(text) ? text : null;
}

/**
 * eXBuilder6 숫자 format(s#,##0.## 등)을 엑셀 서식으로 바꾼다. s(부호 허용)는 버리고 9 는 0 으로 본다.
 * 소수부의 # 자리(있으면 보이는 자리)는 엑셀에서 정수일 때 끝에 점이 남으므로, 값마다 소수 자릿수에 맞는 서식을 고른다.
 * 정수부에 0 이 없으면(#,###) 엑셀은 0 을 비워 보이지만 그리드는 0 을 보이므로 마지막 # 을 0 으로 바꾼다.
 */
function createNumberFormatter(format, styles) {
	var text = String(format).replace(/^s/, "");
	var dot = text.indexOf(".");
	var intPart = (dot < 0 ? text : text.substring(0, dot)).replace(/9/g, "0");
	var decPart = (dot < 0 ? "" : text.substring(dot + 1)).replace(/9/g, "0");
	if (/[#0]/.test(intPart) == false) {
		return null;
	}
	if (intPart.indexOf("0") < 0) {
		var last = intPart.lastIndexOf("#");
		intPart = intPart.substring(0, last) + "0" + intPart.substring(last + 1);
	}
	intPart = intPart.replace(/[^#0,]+/g, xlsxQuoteLiteral);
	var minDec = (decPart.match(/0/g) || []).length;
	var maxDec = (decPart.match(/[#0]/g) || []).length;
	var styleByDec = [];
	function style(decimals) {
		if (styleByDec[decimals] == null) {
			styleByDec[decimals] = styles.numFmt(intPart + (decimals > 0 ? "." + new Array(decimals + 1).join("0") : ""));
		}
		return styleByDec[decimals];
	}
	return function(ref, value) {
		var number = xlsxNumberText(value);
		if (number == null) {
			return xlsxCell(ref, value, false, 0);
		}
		var decimals = minDec;
		if (maxDec > minDec) {
			var fraction = Number(number).toFixed(maxDec).replace(/0+$/, "").split(".")[1] || "";
			decimals = Math.max(minDec, fraction.length);
		}
		return "<c r=\"" + ref + "\" s=\"" + style(decimals) + "\"><v>" + number + "</v></c>";
	};
}

var XLSX_DATE_TOKENS = /YYYY|YY|MM|DD|HH|hh|mm|ss|SSS/g;
var XLSX_DATE_TOKEN_CODES = { YYYY: "yyyy", YY: "yy", MM: "mm", DD: "dd", HH: "hh", hh: "hh", mm: "mm", ss: "ss", SSS: "000" };
/** 엑셀 날짜 일련번호의 기준(1899-12-30)을 UTC ms 로 */
var XLSX_DATE_EPOCH = Date.UTC(1899, 11, 30);

/**
 * eXBuilder6 날짜 형식(YYYY-MM-DD HH:mm:ss 등)으로 된 값을 엑셀 날짜 숫자로 쓰고, 표시 형식을 엑셀 서식으로 붙인다.
 * 값은 구분자를 빼고 숫자만 형식의 토큰 순서대로 읽는다(YYYYMMDD, YYYY-MM-DD 어느 쪽이든 같은 결과). 읽지 못하면 원래 문자열로 쓴다.
 * @param valueFormat 값을 읽는 형식(데이트인풋 format, 아웃풋 dateValueFormat). 없으면 표시 형식으로 읽는다
 * @param displayFormat 화면 표시 형식(데이트인풋 mask, 아웃풋 format)
 */
function createDateFormatter(valueFormat, displayFormat, styles) {
	var parseTokens = String(valueFormat || displayFormat).match(XLSX_DATE_TOKENS);
	if (!parseTokens) {
		return null;
	}
	var code = "";
	var lastIndex = 0;
	String(displayFormat).replace(XLSX_DATE_TOKENS, function(token, index, whole) {
		if (index > lastIndex) {
			code += xlsxQuoteLiteral(whole.substring(lastIndex, index));
		}
		code += (token == "SSS" ? "." : "") + XLSX_DATE_TOKEN_CODES[token];
		lastIndex = index + token.length;
		return token;
	});
	if (lastIndex < String(displayFormat).length) {
		code += xlsxQuoteLiteral(String(displayFormat).substring(lastIndex));
	}
	var style = styles.numFmt(code);

	function serial(value) {
		var parts = { YYYY: 0, MM: 1, DD: 1, HH: 0, mm: 0, ss: 0, SSS: 0 };
		if (value instanceof Date) {
			if (isNaN(value.getTime())) {
				return null;
			}
			parts = { YYYY: value.getFullYear(), MM: value.getMonth() + 1, DD: value.getDate(), HH: value.getHours(), mm: value.getMinutes(), ss: value.getSeconds(), SSS: value.getMilliseconds() };
		} else {
			var digits = String(value).replace(/\D/g, "");
			var position = 0;
			for (var i = 0; i < parseTokens.length && position < digits.length; i++) {
				var token = parseTokens[i];
				var piece = digits.substr(position, token.length);
				if (piece.length < token.length) {
					return null;
				}
				position += token.length;
				var number = parseInt(piece, 10);
				if (token == "YY") {
					parts.YYYY = 2000 + number;
				} else {
					parts[token == "hh" ? "HH" : token] = number;
				}
			}
			if (position == 0 || position < digits.length) {
				return null;
			}
		}
		if (parts.YYYY < 1900 || parts.MM < 1 || parts.MM > 12 || parts.DD < 1 || parts.DD > 31 || parts.HH > 23 || parts.mm > 59 || parts.ss > 59) {
			return null;
		}
		return (Date.UTC(parts.YYYY, parts.MM - 1, parts.DD, parts.HH, parts.mm, parts.ss, parts.SSS) - XLSX_DATE_EPOCH) / 86400000;
	}

	return function(ref, value) {
		if (value == null || value === "") {
			return xlsxCell(ref, value, false, 0);
		}
		var number = serial(value);
		if (number == null) {
			return xlsxCell(ref, value, false, 0);
		}
		return "<c r=\"" + ref + "\" s=\"" + style + "\"><v>" + number + "</v></c>";
	};
}

/** 마스크에서 값 한 글자를 받는 자리 문자. 나머지는 그대로 찍는 리터럴이다 */
var XLSX_MASK_PLACEHOLDERS = /[09#XxAa]/;

/** 마스크(XXX-XXXX 등)를 값에 입혀 문자열로 쓴다. 값이 마스크보다 길면 남는 글자를 뒤에 붙인다 */
function createMaskFormatter(mask) {
	var pattern = String(mask);
	return function(ref, value) {
		if (value == null || value === "") {
			return xlsxCell(ref, value, false, 0);
		}
		var raw = String(value);
		var text = "";
		var position = 0;
		for (var i = 0; i < pattern.length && position < raw.length; i++) {
			var ch = pattern.charAt(i);
			text += XLSX_MASK_PLACEHOLDERS.test(ch) ? raw.charAt(position++) : ch;
		}
		return xlsxCell(ref, text + raw.substring(position), false, 0);
	};
}

/**
 * 디테일 셀 컨트롤의 표시 형식에 맞는 셀 작성 함수. 형식이 없거나 다루지 않는 컨트롤이면 null(값 그대로 쓴다).
 * 넘버에디터·아웃풋(number) format, 데이트인풋 format/mask, 아웃풋(date) dateValueFormat/format, 마스크에디터 mask, 아웃풋(string) format
 */
function createCellFormatter(control, styles) {
	if (!control) {
		return null;
	}
	if (control instanceof cpr.controls.NumberEditor) {
		return control.format ? createNumberFormatter(control.format, styles) : null;
	}
	if (control instanceof cpr.controls.DateInput) {
		var mask = control.mask || control.format;
		return mask ? createDateFormatter(control.format, mask, styles) : null;
	}
	if (control instanceof cpr.controls.MaskEditor) {
		return control.mask ? createMaskFormatter(control.mask) : null;
	}
	if (control instanceof cpr.controls.Output && control.format) {
		var dataType = String(control.dataType).toLowerCase();
		if (dataType == "number") {
			return createNumberFormatter(control.format, styles);
		}
		if (dataType == "date") {
			return createDateFormatter(control.dateValueFormat, control.format, styles);
		}
		return createMaskFormatter(control.format);
	}
	return null;
}

function xlsxPackageParts(sheetCount, sheetName, stylesXml) {
	var head = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n";
	var types = head + "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">"
		+ "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
		+ "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
		+ "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>"
		+ "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>";
	var sheets = "";
	var rels = "";
	for (var i = 1; i <= sheetCount; i++) {
		types += "<Override PartName=\"/xl/worksheets/sheet" + i + ".xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>";
		var name = sheetName ? (i > 1 ? sheetName + " (" + i + ")" : sheetName) : "Sheet" + i;
		sheets += "<sheet name=\"" + xmlEscape(name).replace(/"/g, "&quot;") + "\" sheetId=\"" + i + "\" r:id=\"rId" + i + "\"/>";
		rels += "<Relationship Id=\"rId" + i + "\" Type=\"" + XLSX_REL_NS + "/worksheet\" Target=\"worksheets/sheet" + i + ".xml\"/>";
	}
	types += "</Types>";
	rels += "<Relationship Id=\"rId" + (sheetCount + 1) + "\" Type=\"" + XLSX_REL_NS + "/styles\" Target=\"styles.xml\"/>";
	return {
		"[Content_Types].xml": types,
		"_rels/.rels": head + "<Relationships xmlns=\"" + XLSX_PKG_REL_NS + "\">"
			+ "<Relationship Id=\"rId1\" Type=\"" + XLSX_REL_NS + "/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>",
		"xl/workbook.xml": head + "<workbook xmlns=\"" + XLSX_NS + "\" xmlns:r=\"" + XLSX_REL_NS + "\"><sheets>" + sheets + "</sheets></workbook>",
		"xl/_rels/workbook.xml.rels": head + "<Relationships xmlns=\"" + XLSX_PKG_REL_NS + "\">" + rels + "</Relationships>",
		"xl/styles.xml": stylesXml
	};
}

/**
 * 그리드의 데이터 컬럼(체크, 라디오, 행 번호 제외)을 화면 순서대로. 헤더 텍스트는 같은 열의 헤더 셀에서 가져온다.
 * styles 를 주면 셀 컨트롤의 표시 형식을 읽어 컬럼마다 셀 작성 함수(formatter)를 붙인다.
 * width 는 셀이 걸친 그리드 컬럼 너비(px)의 합이다. 숨긴 컬럼(columnVisible false)은 빼고 내보낸다.
 */
function gridExportColumns(grid, styles) {
	var gridWidths = grid.getColumnWidths();
	var hiddenCols = {};
	var layout = grid.getColumnLayout(true);
	(layout.columnLayout || []).forEach(function(column, colIndex) {
		if (column && column.visible === false) {
			hiddenCols[colIndex] = true;
		}
	});
	(layout.header || []).concat(layout.detail || []).forEach(function(cell) {
		if (cell.visible === false) {
			for (var i = cell.colIndex; i < cell.colIndex + (cell.colSpan || 1); i++) {
				hiddenCols[i] = true;
			}
		}
	});
	var headerTexts = {};
	grid.header.getCellIndices().forEach(function(index) {
		var cell = grid.header.getColumn(index);
		if (cell) {
			headerTexts[cell.colIndex] = cell.getText ? cell.getText() : cell.text;
		}
	});
	var dataSet = grid.dataSet;
	var columns = [];
	grid.detail.getCellIndices().forEach(function(index) {
		var cell = grid.detail.getColumn(index);
		if (cell && cell.columnName && hiddenCols[cell.colIndex] !== true) {
			var header = dataSet.getHeader(cell.columnName);
			var dataType = header ? String(header.getDataType()).toLowerCase() : "string";
			var width = 0;
			for (var i = cell.colIndex; i < cell.colIndex + (cell.colSpan || 1); i++) {
				width += parseFloat(gridWidths[i]) || 0;
			}
			columns.push({
				width: width,
				name: cell.columnName,
				label: headerTexts[cell.colIndex] || cell.columnName,
				numeric: dataType == "number" || dataType == "decimal",
				colIndex: cell.colIndex,
				formatter: styles ? createCellFormatter(cell.control, styles) : null
			});
		}
	});
	columns.sort(function(a, b) {
		return a.colIndex - b.colIndex;
	});
	return columns;
}

/** 이벤트 루프에 양보한다. setTimeout 의 최소 지연을 피하려고 MessageChannel 을 쓴다 */
var yieldToEventLoop = (function() {
	if (typeof MessageChannel == "undefined") {
		return function() {
			return new Promise(function(resolve) { setTimeout(resolve, 0); });
		};
	}
	var channel = new MessageChannel();
	var queue = [];
	channel.port1.onmessage = function() {
		var resolve = queue.shift();
		if (resolve) {
			resolve();
		}
	};
	return function() {
		return new Promise(function(resolve) {
			queue.push(resolve);
			channel.port2.postMessage(null);
		});
	};
})();

/**
 * 그리드를 XLSX 로 내보낸다. 행은 그리드가 바인딩한 데이터셋의 뷰 순서(정렬, 필터 반영)다.
 * @param grid 내보낼 그리드
 * @param options {
 *   fileName: string — 기본 "export.xlsx",
 *   sheetName: string — 없으면 Sheet1, Sheet2 ... 주면 그 이름, 시트가 나뉘면 "이름 (2)" ...,
 *   useFilePicker: boolean — true 면 파일 저장 대화상자로 디스크에 바로 쓴다(Chrome, Edge). 클릭 처리 중에 불러야 한다,
 *   applyFormat: boolean — 기본 true. 셀 컨트롤의 표시 형식(숫자 format, 날짜 mask, 마스크)을 엑셀 서식으로 옮긴다. false 면 값만 쓴다,
 *   onStart: function({ totalRows, sheetCount, columnCount }) — 저장 대화상자 확정 등 싱크 준비가 끝나 실제 쓰기를 시작할 때 한 번 불린다,
 *   onProgress: function({ phase, processedRows, totalRows, ratio, sheet, sheetCount })
 * }
 * @returns { start: Promise<void>, done: Promise<Blob|null>, cancel: function } — start 는 쓰기 시작 시점에 끝나고(싱크를 못 열면 reject),
 *   done 은 Blob 싱크면 Blob, 파일 싱크면 null 로 끝난다
 */
function exportGridToXLSX(grid, options) {
	options = options || {};
	var fileName = options.fileName || "export.xlsx";
	var sheetName = options.sheetName || null;
	var onProgress = options.onProgress || function() {};
	var onStart = options.onStart || function() {};
	var mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
	var cancelled = false;
	var zip = null;

	if (typeof CompressionStream == "undefined" || typeof TextEncoder == "undefined") {
		var unsupported = Promise.reject(new Error("CompressionStream is not supported"));
		unsupported.catch(function() {}); // start 를 쓰지 않는 호출부의 unhandled rejection 방지
		return { start: unsupported, done: unsupported, cancel: function() {} };
	}

	var dataSet = grid.dataSet;
	var styles = createStyleRegistry();
	var columns = gridExportColumns(grid, options.applyFormat === false ? null : styles);
	var refs = columns.map(function(column, index) {
		return xlsxColumnLetter(index);
	});
	var totalRows = dataSet.getRowCount();
	var sheetCount = Math.max(1, Math.ceil(totalRows / XLSX_MAX_DATA_ROWS));
	var processedRows = 0;
	var encoder = new TextEncoder();

	function openSink() {
		if (options.useFilePicker && typeof window.showSaveFilePicker == "function") {
			return window.showSaveFilePicker({
				suggestedName: fileName,
				types: [{ description: "Excel", accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] } }]
			}).then(function(handle) {
				return handle.createWritable();
			}).then(function(writable) {
				return createFileSink(writable);
			});
		}
		return Promise.resolve(createBlobSink(mimeType));
	}

	function writeSheet(sheetIndex, write) {
		var firstRow = sheetIndex * XLSX_MAX_DATA_ROWS;
		var lastRow = Math.min(totalRows, firstRow + XLSX_MAX_DATA_ROWS);
		var lastRef = refs.length > 0 ? refs[refs.length - 1] : "A";
		var cols = "";
		for (var w = 0; w < columns.length; w++) {
			if (columns[w].width > 0) {
				cols += "<col min=\"" + (w + 1) + "\" max=\"" + (w + 1) + "\" width=\"" + (columns[w].width / XLSX_PX_PER_CHAR) + "\" customWidth=\"1\"/>";
			}
		}
		var head = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
			+ "<worksheet xmlns=\"" + XLSX_NS + "\">"
			+ "<dimension ref=\"A1:" + lastRef + (lastRow - firstRow + 1) + "\"/>"
			+ "<sheetViews><sheetView workbookViewId=\"0\"/></sheetViews>"
			+ (cols ? "<cols>" + cols + "</cols>" : "")
			+ "<sheetData><row r=\"1\">";
		for (var c = 0; c < columns.length; c++) {
			head += xlsxCell(refs[c] + "1", columns[c].label, false, 1);
		}
		head += "</row>";

		var rowIndex = firstRow;
		var parts = [head];
		var partChars = head.length;
		// 마지막으로 이벤트 루프에 양보한 시각. 조각 하나는 금방 만들어지고 압축기 쓰기도 마이크로태스크로 끝나므로,
		// 조각마다가 아니라 마지막 양보 이후의 누적 시간으로 양보 여부를 정한다.
		var lastYield = Date.now();

		function step() {
			if (cancelled) {
				return Promise.reject(new Error("cancelled"));
			}
			while (rowIndex < lastRow) {
				var excelRow = rowIndex - firstRow + 2;
				var xml = "<row r=\"" + excelRow + "\">";
				for (var c = 0; c < columns.length; c++) {
					var column = columns[c];
					var value = dataSet.getValue(rowIndex, column.name);
					xml += column.formatter ? column.formatter(refs[c] + excelRow, value) : xlsxCell(refs[c] + excelRow, value, column.numeric, 0);
				}
				xml += "</row>";
				parts.push(xml);
				partChars += xml.length;
				rowIndex++;
				if (partChars >= XLSX_CHUNK_CHARS) {
					break;
				}
			}
			var done = rowIndex >= lastRow;
			if (done) {
				parts.push("</sheetData></worksheet>");
			}
			var bytes = encoder.encode(parts.join(""));
			parts = [];
			partChars = 0;
			processedRows = rowIndex;
			onProgress({ phase: "write", processedRows: processedRows, totalRows: totalRows, ratio: totalRows ? processedRows / totalRows : 1, sheet: sheetIndex + 1, sheetCount: sheetCount });
			return write(bytes).then(function() {
				if (done) {
					return null;
				}
				// 시간 조각을 다 썼으면 이벤트 루프에 양보해 화면이 멈추지 않게 한다
				if (Date.now() - lastYield < XLSX_TIME_SLICE) {
					return step();
				}
				return yieldToEventLoop().then(function() {
					lastYield = Date.now();
					return step();
				});
			});
		}
		return step();
	}

	var resolveStart, rejectStart;
	var start = new Promise(function(resolve, reject) {
		resolveStart = resolve;
		rejectStart = reject;
	});
	start.catch(function() {}); // start 를 쓰지 않는 호출부의 unhandled rejection 방지(done 이 같은 오류로 reject 된다)

	var done = openSink().then(function(sink) {
		zip = createZipWriter(sink);
		onStart({ totalRows: totalRows, sheetCount: sheetCount, columnCount: columns.length });
		resolveStart();
		var chain = Promise.resolve();
		for (var s = 0; s < sheetCount; s++) {
			(function(sheetIndex) {
				chain = chain.then(function() {
					return zip.addEntry("xl/worksheets/sheet" + (sheetIndex + 1) + ".xml", function(write) {
						return writeSheet(sheetIndex, write);
					});
				});
			})(s);
		}
		return chain.then(function() {
			onProgress({ phase: "finalize", processedRows: totalRows, totalRows: totalRows, ratio: 1, sheet: sheetCount, sheetCount: sheetCount });
			var packageParts = xlsxPackageParts(sheetCount, sheetName, styles.xml());
			var partChain = Promise.resolve();
			Object.keys(packageParts).forEach(function(name) {
				partChain = partChain.then(function() {
					return zip.addTextEntry(name, packageParts[name]);
				});
			});
			return partChain;
		}).then(function() {
			return zip.finish();
		});
	}).then(function(blob) {
		if (blob) {
			downloadBlob(blob, fileName);
		}
		return blob;
	}, function(error) {
		rejectStart(error); // 이미 start 가 끝났다면 무시된다
		if (zip) {
			zip.abort();
		}
		throw error;
	});

	return {
		start: start,
		done: done,
		cancel: function() {
			cancelled = true;
		}
	};
}

function downloadBlob(blob, fileName) {
	var url = URL.createObjectURL(blob);
	var anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	setTimeout(function() {
		URL.revokeObjectURL(url);
	}, 60000);
}

globals.exportGridToXLSX = exportGridToXLSX;
