/************************************************
 * udcComGridTitle.js
 * Created at 2024. 7. 22. 오전 9:01:06.
 *
 * @author ryu
 ************************************************/

/************************************************
 * 공통 모듈 선언
 ************************************************/
var util = createCommonUtil();

/************************************************
 * 그리드 우클릭 메뉴 (앱 속성 useGridCtxMenu, 기본 true — false 로 준 화면만 끈다)
 ************************************************/
//var MA_GRID_CTX_MENUS = [
//	{ label: "필터", value: "filter" },
//	{ label: "필터 해제", value: "filterClear" },
//	{ label: "전체 필터 해제", value: "allFilterClear" },
//	{ label: "세로 틀고정", value: "fixcol" },
//	{ label: "세로 틀고정 해제", value: "fixcolClear" },
//	{ label: "가로 틀고정", value: "fixrow" },
//	{ label: "가로 틀고정 해제", value: "fixrowClear" },
//	{ label: "블록 선택", value: "selectBlock" },
//	{ label: "블록 선택 해제", value: "deselectBlock" },
//	{ label: "찾기", value: "find" },
//	{ label: "정렬 일괄취소", value: "allSortingClear" }
//];

var MA_GRID_CTX_MENUS = [
	{ label: "필터", value: "filter" },
	{ label: "필터 해제", value: "filterClear" },
	{ label: "전체 필터 해제", value: "allFilterClear" },
	{ label: "세로 틀고정", value: "fixcol" },
	{ label: "세로 틀고정 해제", value: "fixcolClear" },
	{ label: "가로 틀고정", value: "fixrow" },
	{ label: "가로 틀고정 해제", value: "fixrowClear" },
	{ label: "찾기", value: "find" },
	{ label: "정렬 일괄취소", value: "allSortingClear" }
];

/** 찾기 팝업 */
var GRID_FINDER_APP_ID = "app/com/comPGridFinder";

/** 피벗 팝업 */
var GRID_PIVOT_APP_ID = "app/com/comPGridPivot";

/** 피벗으로 넘길 최대 행 수 */
var PIVOT_MAX_ROWS = 100000;

/** 대량엑셀다운(S) 진행 중 여부 (진행률 폴링 유지용) */
var mbBulkExporting = false;

/** 대량엑셀다운(S) 서버 진행률을 한 번이라도 받았는지 (이후 -1 이면 파일 전송 완료) */
var mbBulkProgressSeen = false;

/** 대량엑셀다운(S) 시작 시점 (서버 진행률 등록 대기 타임아웃용) */
var mnBulkExportStart = 0;

/** 서버 진행률 등록을 기다리는 최대 시간 */
var BULK_PROGRESS_WAIT_MS = 30000;

/** 윈도우 팝업 호출용 html (clx-src/popup_exb6.html — 메인 화면 base href /ui/ 기준 상대 경로) */
var POPUP_HTML = "popup_exb6.html";

/** 피벗 UDC — 피벗 결과 그리드에 붙은 타이틀에서는 피벗 버튼을 숨긴다 */
var PIVOT_UDC_APP_ID = "udc/exam/udcExamPivotGrid";

/**
 * 지금 떠 있는 우클릭 메뉴. 새 메뉴를 띄우거나 항목을 고르면 없앤다.
 * @type cpr.controls.Menu
 */
var mcGridCtxMenu = null;

/*
 * <sheetJs 제약사항>
 * 1-1. applyClassStyle = false 인 경우 스타일은 인라인으로 직접 설정 or 전역으로 색상코드로 설정 가능
 * 1-2. applyClassStyle = true 인 경우 클래스 스타일도 적용
 * 		-> border-style, border-color, background-color, color, font-size, font-weight(bold 인 경우), text-align, vertical-align 적용
 * 		-> 변수 사용 (ex. @primary) 및 16진수(ex. #fefefe) 로 스타일 지정된 경우 적용 가능.
 * 		-> 단, css 기본색상 (ex. red) 인 경우 컴파일 옵션 소스 난독화 사용시에만 가능합니다.
 * 		-> border을 축약하여 스타일을 작성하는 경우, 1px solid @blue; 형식으로 작성해야 합니다.
 * 2. 틀 고정, 이미지, 차트, 표 기능은 pro 에서만 제공
 * 3. 폰트 사이즈는 px 사용 권장 (px 기준으로만 적용)
 * 4. 페이징 처리 시 전체 그리드를 다운로드 원할 시에는 서버 권장
 * 5. datatype=number이고 format 설정했을 경우, 엑셀에서 제공되는 포맷 형식만 적용
 * 	  -> s#,##0 -> #,##0으로 변환하는 코드 작성 했습니다.
 */

/************************************************
 * 전역 변수 (엑셀 다운로드에서 사용)
 ************************************************/
var EXCEL_STYLE = {
	HEADER_BG_COLOR: "dddddd", // 그리드 헤더 배경 색상
	HEADER_COLOR: "000000", // 헤더 텍스트 색상
	DETAIL_BG_COLOR: "FFFFFF", // 디테일 배경 색상
	GROUP_HEADER_BG_COLOR: "F8F8F8", // 그룹 헤더 배경 색상
	GROUP_FOOTER_BG_COLOR: "dbdfea", // 그룹 푸터 배경 색상
	FOOTER_BG_COLOR: "cde2fe", // 푸터 배경 색상
	FOOTER_COLOR: "000000", // 푸터 텍스트 색상
	BORDER_STYLE: "thin", // border 선 스타일 (ex. thick, thin, dashed, dotted ...)
	BORDER_COLOR: "bbbbbb", // border 색 스타일
	VERTICAL_ALIGN: "center", // vertical-align (ex. top, center, bottom)
	HORIZONTAL_ALIGN: "center", // horizontal-align (ex. left, center, right)
	FONT_SIZE: "11", // 폰트 사이즈
	FONT_FAMILY: "Calibri", // 폰트
	FONT_BOLD: false, // bold
	FONT_ITALIC: false // italic
};

/************************************************
 * 클라이언트 PDF 다운로드
 ************************************************/
function downloadWholeGrid (psTitle, pcGrid) {
	// html2canvas Library Load
	cpr.core.ResourceLoader.loadScript("thirdparty/html2canvas/html2canvas.min.js").then(function(input){
		/**
		 * 그리드의 전체 데이터를 다운로드 받습니다.
		 */
		pcGrid.htmlAttr("uuid", pcGrid.uuid);
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
			/*
			 * htmlAttr 등록 된 후, 진행
			 * 기존에 htmlAttr 등록이 되어 있다면, 아래 소스부터 작성
			 */
			
			// 1) 다운로드를 위해 보이지 않는 그리드 영역 모두 그리기
			var _originMode = pcGrid.getWholeRenderingMode();
			pcGrid.setWholeRenderingMode(true);
			
			// 그리드 변경사항 즉시 적용
			cpr.core.DeferredUpdateManager.INSTANCE.update(); 
			
			// 2) 그리드 높이 계산
			var vnGrdCaptureHeight = 0;
			var headerBand = pcGrid.header;
			var detailBand = pcGrid.detail;
			headerBand.getRowHeights().forEach(function(eachHdr){
				vnGrdCaptureHeight += eachHdr.height;
			});
			var dtlHeight = 0;
			detailBand.getRowHeights().forEach(function(eachDtl){
				dtlHeight += eachDtl.height;
			});
			vnGrdCaptureHeight += (dtlHeight * pcGrid.dataSet.getRowCount());
			
			// 3) 그리드 영영 캡쳐 후 다운로드
			var captureGrd = document.querySelector("div[data-usr-uuid='"+pcGrid.htmlAttr("uuid")+"']");
			if(captureGrd) {
				html2canvas(captureGrd, {
					// Capture Option
					onclone: function (cloneDoc, cloneDiv) {
						if(cloneDiv) {
							// canvas 캡쳐 시, 실제 그리드 사이즈로 변경 (원본 Element 에 영향없음)
							cloneDiv.style.height = (vnGrdCaptureHeight +2) + "px"; 
						} else {
							console.info("Can't find cloneElement...");
						}
					}
				}).then(function(/* HTMLCanvasElement */ canvas) {
					downloadPdf(canvas, psTitle);
					
					// 그리드 설정정보 원복
					pcGrid.setWholeRenderingMode(_originMode);
				});
			}
		});
	});
}

function downloadPdf (/* HTMLCanvasElement */ canvas, psTitle) {
	/**
	 * html2canvas 로 캡쳐한 화면을 PDF 파일로 다운로드 받습니다.
	 * PDF 다운로드를 위해 jsPDF 라이브러리를 사용합니다.
	 */
	
	var resourceLoader = new cpr.core.ResourceLoader();
//	resourceLoader.addScript("thirdparty/html2canvas/jsPDF/polyfills.umd.js"); // IE와 같은 구버전 브라우저에서 사용할 경우 주석 해제
	resourceLoader.addScript("thirdparty/jsPDF/jspdf.umd.min.js");
	resourceLoader.load(function(error){
		window.jsPDF = window.jspdf.jsPDF;
		
		var imgData = canvas.toDataURL("image/png");
		
		var imgWidth = 210; // 이미지 가로 길이(mm) (A4기준)
		var pageHeight = imgWidth * 1.414; // 출력 페이지 세로 길이 계산 (A4 기준)
		var imgHeight = canvas.height * imgWidth / canvas.width;
		var heightLeft = imgHeight;
		
		var doc = new jsPDF({
			orientation: 'p',
			unit: 'mm',
			format: 'a4',
		});
		var margin = 5;
		var position = margin;
		
		// 첫 페이지 출력
		// addImage(imageData, format, x, y, width, height, alias, compression, rotation)
		doc.addImage(imgData, "PNG", margin, position, imgWidth-(margin*2), imgHeight-(margin*2));
		heightLeft -= pageHeight;
		
		// 한 페이지 이상일 경우 루프 돌면서 출력
		while(heightLeft >= 20) {
			position = heightLeft - imgHeight + margin;
			doc.addPage();
			doc.addImage(imgData, "PNG", margin, position, imgWidth-(margin*2), imgHeight-(margin*2));
			heightLeft -= pageHeight;
		}
		
		// 파일 저장
		doc.save(psTitle + ".pdf");
	})
}

/************************************************
 * 클라이언트 엑셀 다운로드
 ************************************************/
/**
 * 클라이언트 방식 라이브러리(xlsx) 로드 후 엑셀로 export 함수 실행
 * @param {String} psExportTitle 파일명 
 * @param {cpr.controls.Control} pcCtrl 대상 그리드
 * @param {
 *   isExcludeHideColumn? : Boolean <!-- 숨김컬럼 제외 여부 (default: true) -->,
 *   excludeColumns? : String <!-- 출력시 숨김컬럼 외 제외할 컬럼명 (여러개인 경우 콤마로 구분)<br> ex) COL1,COL2,COL3 -->,
 *   excludePart?: cpr.controls.gridpart.VLOC_REGION <!-- 출력시 제외영역 (header,detail,footer,gheader,gfooter)<br>ex) footer,gfooter -->,
 *   applyFormat? : Boolean <!-- 익스포트시 포맷을 적용시킬 지 여부 (default: true) --> ,
 *   applySuppress? : Boolean <!-- 엑셀 익스포트시 suppress, mergedToIndexExpr에 의한 셀 병합을 반영할지 여부(default: true) -->,
 *   showRowIndex? : Boolean <!-- rowindex 특수컬럼을 export 할지 여부 (default: false) -->
 * } options? 그리드 엑셀 익스포트 옵션
 */
function loadClientExcel(psExportTitle, pcCtrl, poOptions) {
	// 라이브러리 로드 (해당 라이브러리가 먼저 불러와져야 스타일 안깨짐)
	var resourceLoader = new cpr.core.ResourceLoader();
	resourceLoader.addScript("./thirdparty/excel/FileSaver.min.js");
	resourceLoader.addScript("./thirdparty/excel/xlsx.min.js");
	resourceLoader.addScript("./thirdparty/excel/shim.min.js"); // Internet Explorer and Older Browsers 를 지원하기 위해 필요한 라이브러리
	resourceLoader.load().then(function(input) {
		var resourceAfterLoader = new cpr.core.ResourceLoader();
		resourceAfterLoader.addScript("./thirdparty/excel/xlsx.bundle.js");
		resourceAfterLoader.load().then(function(input) {
			// 엑셀 export
			exportExcelToJSON(psExportTitle + ".xlsx", "sheet1", pcCtrl, poOptions);
		});
	});
}

/*********************** udcPocGridTitle 필요 스크립트 추가 Start ***********************/
/**
 * exportExcelToJSON.js  ─  메인 스레드
 *
 * ── 헤더 누락 버그 원인 및 수정 ────────────────────────────────────────
 *  [원인]
 *  멀티행 헤더(2~3행)에서 rowGroup 하나에 여러 행의 셀이 들어있습니다.
 *  기존 코드는 rowGroup 전체를 하나의 "데이터 행"으로 취급해
 *  curRowIdx 를 maxRowOffset+1 씩만 증가시켰습니다.
 *
 *  그런데 헤더 rowGroup 의 style 배열에는 rowindex:0 인 셀(1행)과
 *  rowindex:1 인 셀(2행), rowindex:2 인 셀(3행)이 섞여 있고,
 *  data 배열도 같은 순서로 반복됩니다.
 *  즉 data[r] 은 "r번째 데이터 행"이 아니라
 *  "r번째 셀 그룹(rowindex 포함)"입니다.
 *
 *  [수정]
 *  rowGroup 을 순회할 때 style 배열의 rowindex 를 직접 참조해
 *  실제 Excel 행 번호(curRowIdx + cellInfo.rowindex)를 계산합니다.
 *  이렇게 하면 병합·멀티행 헤더 모두 정확하게 행이 배치됩니다.
 */

var EXCEL_WORKER_URL = './thirdparty/worker/excel-worker.js'; // ← 실제 경로로 수정

var EMPTY_ARRAY     = Object.freeze([]);
var _SHEETS         = null;
var _CLASS_RULE_MAP = null;

var CSS_PROPS = [
    'font-weight','font-size','font-style','font-family',
    'text-align','vertical-align','color','background-color',
    'border-left-color','border-right-color','border-top-color','border-bottom-color',
    'border-left-style','border-right-style','border-top-style','border-bottom-style',
    'border-left-width','border-right-width','border-top-width','border-bottom-width'
];


/* ── CSS 스타일시트 1회 파싱 ─────────────────────────────────────────── */
function buildClassRuleMap() {
    if (_CLASS_RULE_MAP) return _CLASS_RULE_MAP;
    _CLASS_RULE_MAP = Object.create(null);
    try { _SHEETS = _SHEETS || document.styleSheets; } catch (e) { return _CLASS_RULE_MAP; }
    for (var i = 0; i < _SHEETS.length; i++) {
        var rules;
        try { rules = _SHEETS[i].cssRules || _SHEETS[i].rules; } catch (e) { continue; }
        if (!rules) continue;
        for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            if (!rule.selectorText || !rule.style) continue;
            var m = rule.selectorText.match(/\.([^\s:,>+~[{(]+)/);
            if (!m) continue;
            var cls = m[1];
            if (!_CLASS_RULE_MAP[cls]) _CLASS_RULE_MAP[cls] = Object.create(null);
            for (var p = 0; p < CSS_PROPS.length; p++) {
                var v = rule.style.getPropertyValue(CSS_PROPS[p]);
                if (v) _CLASS_RULE_MAP[cls][CSS_PROPS[p]] = v.trim();
            }
        }
    }
    return _CLASS_RULE_MAP;
}


function getCssFromMap(classes, prop) {
    var map = buildClassRuleMap(), r = '';
    for (var i = 0; i < classes.length; i++) {
        var m = map[classes[i]]; if (m && m[prop]) r = m[prop];
    }
    return r;
}

/* ── 색상 / 보더 유틸 ───────────────────────────────────────────────── */
//function getColor(c) {
//    if (!c) return 'FFFFFF';
//    var v = c.replace('#', '');
//    if (v.length === 3) return (v[0]+v[0]+v[1]+v[1]+v[2]+v[2]).toUpperCase();
//    return v.toUpperCase();
//}
function normBorder(style, width) {
    if (style === 'solid' && width !== '1px') return 'thick';
    if (style === 'solid') return 'thin';
    return style || 'thin';
}

/* ── 헤더 스타일 객체 생성 ──────────────────────────────────────────── */
function buildHeaderStyle(cellInfo, classes, applyClass) {
    var vs = cellInfo.style || EMPTY_ARRAY;
    var bg = getColor(EXCEL_STYLE.HEADER_BG_COLOR);
    var fg = getColor(EXCEL_STYLE.HEADER_COLOR);
    var bold = true, italic = EXCEL_STYLE.FONT_ITALIC;
    var sz   = EXCEL_STYLE.FONT_SIZE;
    var ha   = EXCEL_STYLE.HORIZONTAL_ALIGN;
    var va   = EXCEL_STYLE.VERTICAL_ALIGN;
    var dbc  = getColor(EXCEL_STYLE.BORDER_COLOR);
    var blc=dbc, brc=dbc, btc=dbc, bbc=dbc;
    var bls=EXCEL_STYLE.BORDER_STYLE, brs=bls, bts=bls, bbs=bls;
    var blw='1px', brw='1px', btw='1px', bbw='1px';

    if (applyClass && classes && classes.length) {
        bg  = getCssFromMap(classes,'background-color') || bg;
        fg  = getCssFromMap(classes,'color')            || fg;
        sz  = getCssFromMap(classes,'font-size')        || sz;
        ha  = getCssFromMap(classes,'text-align')       || ha;
        va  = getCssFromMap(classes,'vertical-align')   || va;
        blc = getCssFromMap(classes,'border-left-color')  || blc;
        brc = getCssFromMap(classes,'border-right-color') || brc;
        btc = getCssFromMap(classes,'border-top-color')   || btc;
        bbc = getCssFromMap(classes,'border-bottom-color')|| bbc;
        bls = getCssFromMap(classes,'border-left-style')  || bls;
        brs = getCssFromMap(classes,'border-right-style') || brs;
        bts = getCssFromMap(classes,'border-top-style')   || bts;
        bbs = getCssFromMap(classes,'border-bottom-style')|| bbs;
        blw = getCssFromMap(classes,'border-left-width')  || blw;
        brw = getCssFromMap(classes,'border-right-width') || brw;
        btw = getCssFromMap(classes,'border-top-width')   || btw;
        bbw = getCssFromMap(classes,'border-bottom-width')|| bbw;
    }

    if (vs['background-color'])    bg  = getColor(vs['background-color']);
    if (vs['color'])               fg  = getColor(vs['color']);
    if (vs['font-size'])           sz  = vs['font-size'];
    if (vs['text-align'])          ha  = vs['text-align'];
    if (vs['vertical-align'])      va  = vs['vertical-align'];
    if (vs['border-left-color'])   blc = getColor(vs['border-left-color']);
    if (vs['border-right-color'])  brc = getColor(vs['border-right-color']);
    if (vs['border-top-color'])    btc = getColor(vs['border-top-color']);
    if (vs['border-bottom-color']) bbc = getColor(vs['border-bottom-color']);
    if (vs['border-left-style'])   bls = vs['border-left-style'];
    if (vs['border-right-style'])  brs = vs['border-right-style'];
    if (vs['border-top-style'])    bts = vs['border-top-style'];
    if (vs['border-bottom-style']) bbs = vs['border-bottom-style'];
    if (vs['border-left-width'])   blw = vs['border-left-width'];
    if (vs['border-right-width'])  brw = vs['border-right-width'];
    if (vs['border-top-width'])    btw = vs['border-top-width'];
    if (vs['border-bottom-width']) bbw = vs['border-bottom-width'];
    var fw = vs['font-weight'];
    if (fw && fw !== 'normal' && fw !== 'lighter') bold = true;
    if (vs['font-style'] === 'italic' || vs['font-style'] === 'oblique') italic = true;

    return {
        alignment: { horizontal: ha, vertical: va },
        font: { color:{rgb:fg}, sz:String(sz).replace('px',''), bold:bold, italic:italic,
                name: vs['font-family'] || EXCEL_STYLE.FONT_FAMILY },
        fill:   { fgColor: { rgb: bg } },
        border: {
            top:    { style: normBorder(bts,btw), color:{rgb:btc} },
            bottom: { style: normBorder(bbs,bbw), color:{rgb:bbc} },
            left:   { style: normBorder(bls,blw), color:{rgb:blc} },
            right:  { style: normBorder(brs,brw), color:{rgb:brc} }
        },
        numFmt: normalizeNumFmt(cellInfo.format)
    };
}

/* ── detail 스타일 객체 생성 ────────────────────────────────────────── */
function buildDetailStyle(cellInfo, classes, applyClass) {
    var vs = cellInfo.style || EMPTY_ARRAY;
    var bg = getColor(EXCEL_STYLE.DETAIL_BG_COLOR);
    var fg = getColor(EXCEL_STYLE.HEADER_COLOR);
    var bold = EXCEL_STYLE.FONT_BOLD, italic = EXCEL_STYLE.FONT_ITALIC;
    var sz   = EXCEL_STYLE.FONT_SIZE;
    var ha   = EXCEL_STYLE.HORIZONTAL_ALIGN;
    var va   = EXCEL_STYLE.VERTICAL_ALIGN;
    var dbc  = getColor(EXCEL_STYLE.BORDER_COLOR);
    var blc=dbc, brc=dbc, btc=dbc, bbc=dbc;
    var bls=EXCEL_STYLE.BORDER_STYLE, brs=bls, bts=bls, bbs=bls;
    var blw='1px', brw='1px', btw='1px', bbw='1px';

    if (applyClass && classes && classes.length) {
        bg  = getCssFromMap(classes,'background-color') || bg;
        fg  = getCssFromMap(classes,'color')            || fg;
        sz  = getCssFromMap(classes,'font-size')        || sz;
        ha  = getCssFromMap(classes,'text-align')       || ha;
        va  = getCssFromMap(classes,'vertical-align')   || va;
        blc = getCssFromMap(classes,'border-left-color')   || blc;
        brc = getCssFromMap(classes,'border-right-color')  || brc;
        btc = getCssFromMap(classes,'border-top-color')    || btc;
        bbc = getCssFromMap(classes,'border-bottom-color') || bbc;
        bls = getCssFromMap(classes,'border-left-style')   || bls;
        brs = getCssFromMap(classes,'border-right-style')  || brs;
        bts = getCssFromMap(classes,'border-top-style')    || bts;
        bbs = getCssFromMap(classes,'border-bottom-style') || bbs;
        blw = getCssFromMap(classes,'border-left-width')   || blw;
        brw = getCssFromMap(classes,'border-right-width')  || brw;
        btw = getCssFromMap(classes,'border-top-width')    || btw;
        bbw = getCssFromMap(classes,'border-bottom-width') || bbw;
    }

    if (vs['background-color'])    bg  = getColor(vs['background-color']);
    if (vs['color'])               fg  = getColor(vs['color']);
    if (vs['font-size'])           sz  = vs['font-size'];
    if (vs['text-align'])          ha  = vs['text-align'];
    if (vs['vertical-align'])      va  = vs['vertical-align'];
    if (vs['border-left-color'])   blc = getColor(vs['border-left-color']);
    if (vs['border-right-color'])  brc = getColor(vs['border-right-color']);
    if (vs['border-top-color'])    btc = getColor(vs['border-top-color']);
    if (vs['border-bottom-color']) bbc = getColor(vs['border-bottom-color']);
    if (vs['border-left-style'])   bls = vs['border-left-style'];
    if (vs['border-right-style'])  brs = vs['border-right-style'];
    if (vs['border-top-style'])    bts = vs['border-top-style'];
    if (vs['border-bottom-style']) bbs = vs['border-bottom-style'];
    if (vs['border-left-width'])   blw = vs['border-left-width'];
    if (vs['border-right-width'])  brw = vs['border-right-width'];
    if (vs['border-top-width'])    btw = vs['border-top-width'];
    if (vs['border-bottom-width']) bbw = vs['border-bottom-width'];
    var fw = vs['font-weight'];
    if (fw && fw !== 'normal' && fw !== 'lighter') bold = true;
    if (vs['font-style'] === 'italic' || vs['font-style'] === 'oblique') italic = true;

    return {
        alignment: { horizontal: ha, vertical: va },
        font: { color:{rgb:fg}, sz:String(sz).replace('px',''), bold:bold, italic:italic,
                name: vs['font-family'] || EXCEL_STYLE.FONT_FAMILY },
        fill:   { fgColor: { rgb: bg } },
        border: {
            top:    { style: normBorder(bts,btw), color:{rgb:btc} },
            bottom: { style: normBorder(bbs,bbw), color:{rgb:bbc} },
            left:   { style: normBorder(bls,blw), color:{rgb:blc} },
            right:  { style: normBorder(brs,brw), color:{rgb:brc} }
        },
        numFmt: normalizeNumFmt(cellInfo.format)
    };
}

/* ── footer/gfooter 스타일 객체 생성 ───────────────────────────────── */
function buildFooterStyle(cellInfo, classes, applyClass, isGroup) {
    var vs = cellInfo.style || EMPTY_ARRAY;
    var bg = getColor(isGroup ? EXCEL_STYLE.GROUP_FOOTER_BG_COLOR : EXCEL_STYLE.FOOTER_BG_COLOR);
    var fg = getColor(EXCEL_STYLE.FOOTER_COLOR);
    var bold = true, italic = EXCEL_STYLE.FONT_ITALIC;
    var sz   = EXCEL_STYLE.FONT_SIZE;
    var ha   = EXCEL_STYLE.HORIZONTAL_ALIGN;
    var va   = EXCEL_STYLE.VERTICAL_ALIGN;
    var dbc  = getColor(EXCEL_STYLE.BORDER_COLOR);
    var blc=dbc, brc=dbc, btc=dbc, bbc=dbc;
    var bls=EXCEL_STYLE.BORDER_STYLE, brs=bls, bts=bls, bbs=bls;
    var blw='1px', brw='1px', btw='1px', bbw='1px';

    if (applyClass && classes && classes.length) {
        bg  = getCssFromMap(classes,'background-color') || bg;
        fg  = getCssFromMap(classes,'color')            || fg;
        sz  = getCssFromMap(classes,'font-size')        || sz;
        ha  = getCssFromMap(classes,'text-align')       || ha;
        va  = getCssFromMap(classes,'vertical-align')   || va;
        blc = getCssFromMap(classes,'border-left-color')   || blc;
        brc = getCssFromMap(classes,'border-right-color')  || brc;
        btc = getCssFromMap(classes,'border-top-color')    || btc;
        bbc = getCssFromMap(classes,'border-bottom-color') || bbc;
        bls = getCssFromMap(classes,'border-left-style')   || bls;
        brs = getCssFromMap(classes,'border-right-style')  || brs;
        bts = getCssFromMap(classes,'border-top-style')    || bts;
        bbs = getCssFromMap(classes,'border-bottom-style') || bbs;
        blw = getCssFromMap(classes,'border-left-width')   || blw;
        brw = getCssFromMap(classes,'border-right-width')  || brw;
        btw = getCssFromMap(classes,'border-top-width')    || btw;
        bbw = getCssFromMap(classes,'border-bottom-width') || bbw;
    }

    if (vs['background-color'])    bg  = getColor(vs['background-color']);
    if (vs['color'])               fg  = getColor(vs['color']);
    if (vs['font-size'])           sz  = vs['font-size'];
    if (vs['text-align'])          ha  = vs['text-align'];
    if (vs['vertical-align'])      va  = vs['vertical-align'];
    if (vs['border-left-color'])   blc = getColor(vs['border-left-color']);
    if (vs['border-right-color'])  brc = getColor(vs['border-right-color']);
    if (vs['border-top-color'])    btc = getColor(vs['border-top-color']);
    if (vs['border-bottom-color']) bbc = getColor(vs['border-bottom-color']);
    if (vs['border-left-style'])   bls = vs['border-left-style'];
    if (vs['border-right-style'])  brs = vs['border-right-style'];
    if (vs['border-top-style'])    bts = vs['border-top-style'];
    if (vs['border-bottom-style']) bbs = vs['border-bottom-style'];
    if (vs['border-left-width'])   blw = vs['border-left-width'];
    if (vs['border-right-width'])  brw = vs['border-right-width'];
    if (vs['border-top-width'])    btw = vs['border-top-width'];
    if (vs['border-bottom-width']) bbw = vs['border-bottom-width'];
    var fw = vs['font-weight'];
    if (fw && fw !== 'normal' && fw !== 'lighter') bold = true;
    if (vs['font-style'] === 'italic' || vs['font-style'] === 'oblique') italic = true;

    return {
        alignment: { horizontal: ha, vertical: va },
        font: { color:{rgb:fg}, sz:String(sz).replace('px',''), bold:bold, italic:italic,
                name: vs['font-family'] || EXCEL_STYLE.FONT_FAMILY },
        fill:   { fgColor: { rgb: bg } },
        border: {
            top:    { style: normBorder(bts,btw), color:{rgb:btc} },
            bottom: { style: normBorder(bbs,bbw), color:{rgb:bbc} },
            left:   { style: normBorder(bls,blw), color:{rgb:blc} },
            right:  { style: normBorder(brs,brw), color:{rgb:brc} }
        },
        numFmt: normalizeNumFmt(cellInfo.format)
    };
}

/* ── gheader 스타일 객체 생성 ───────────────────────────────────────── */
function buildGHeaderStyle(cellInfo, classes, applyClass) {
    var vs = cellInfo.style || EMPTY_ARRAY;
    var bg = getColor(EXCEL_STYLE.GROUP_HEADER_BG_COLOR);
    var fg = getColor(EXCEL_STYLE.HEADER_COLOR);
    var bold = true, italic = EXCEL_STYLE.FONT_ITALIC;
    var sz   = EXCEL_STYLE.FONT_SIZE;
    var ha   = EXCEL_STYLE.HORIZONTAL_ALIGN;
    var va   = EXCEL_STYLE.VERTICAL_ALIGN;
    var dbc  = getColor(EXCEL_STYLE.BORDER_COLOR);
    var blc=dbc, brc=dbc, btc=dbc, bbc=dbc;
    var bls=EXCEL_STYLE.BORDER_STYLE, brs=bls, bts=bls, bbs=bls;
    var blw='1px', brw='1px', btw='1px', bbw='1px';

    if (applyClass && classes && classes.length) {
        bg  = getCssFromMap(classes,'background-color') || bg;
        fg  = getCssFromMap(classes,'color')            || fg;
        sz  = getCssFromMap(classes,'font-size')        || sz;
        ha  = getCssFromMap(classes,'text-align')       || ha;
        va  = getCssFromMap(classes,'vertical-align')   || va;
        blc = getCssFromMap(classes,'border-left-color')   || blc;
        brc = getCssFromMap(classes,'border-right-color')  || brc;
        btc = getCssFromMap(classes,'border-top-color')    || btc;
        bbc = getCssFromMap(classes,'border-bottom-color') || bbc;
        bls = getCssFromMap(classes,'border-left-style')   || bls;
        brs = getCssFromMap(classes,'border-right-style')  || brs;
        bts = getCssFromMap(classes,'border-top-style')    || bts;
        bbs = getCssFromMap(classes,'border-bottom-style') || bbs;
        blw = getCssFromMap(classes,'border-left-width')   || blw;
        brw = getCssFromMap(classes,'border-right-width')  || brw;
        btw = getCssFromMap(classes,'border-top-width')    || btw;
        bbw = getCssFromMap(classes,'border-bottom-width') || bbw;
    }

    if (vs['background-color'])    bg  = getColor(vs['background-color']);
    if (vs['color'])               fg  = getColor(vs['color']);
    if (vs['font-size'])           sz  = vs['font-size'];
    if (vs['text-align'])          ha  = vs['text-align'];
    if (vs['vertical-align'])      va  = vs['vertical-align'];
    if (vs['border-left-color'])   blc = getColor(vs['border-left-color']);
    if (vs['border-right-color'])  brc = getColor(vs['border-right-color']);
    if (vs['border-top-color'])    btc = getColor(vs['border-top-color']);
    if (vs['border-bottom-color']) bbc = getColor(vs['border-bottom-color']);
    if (vs['border-left-style'])   bls = vs['border-left-style'];
    if (vs['border-right-style'])  brs = vs['border-right-style'];
    if (vs['border-top-style'])    bts = vs['border-top-style'];
    if (vs['border-bottom-style']) bbs = vs['border-bottom-style'];
    if (vs['border-left-width'])   blw = vs['border-left-width'];
    if (vs['border-right-width'])  brw = vs['border-right-width'];
    if (vs['border-top-width'])    btw = vs['border-top-width'];
    if (vs['border-bottom-width']) bbw = vs['border-bottom-width'];
    var fw = vs['font-weight'];
    if (fw && fw !== 'normal' && fw !== 'lighter') bold = true;
    if (vs['font-style'] === 'italic' || vs['font-style'] === 'oblique') italic = true;

    return {
        alignment: { horizontal: ha, vertical: va },
        font: { color:{rgb:fg}, sz:String(sz).replace('px',''), bold:bold, italic:italic,
                name: vs['font-family'] || EXCEL_STYLE.FONT_FAMILY },
        fill:   { fgColor: { rgb: bg } },
        border: {
            top:    { style: normBorder(bts,btw), color:{rgb:btc} },
            bottom: { style: normBorder(bbs,bbw), color:{rgb:bbc} },
            left:   { style: normBorder(bls,blw), color:{rgb:blc} },
            right:  { style: normBorder(brs,brw), color:{rgb:brc} }
        },
        numFmt: normalizeNumFmt(cellInfo.format),
    };
}

/**
 * 영역(region)에 따라 적절한 스타일 빌더를 호출하는 공용 라우터
 * @param {String} region  header | gheader | detail | footer | gfooter
 * @param {Object} cellInfo
 * @param {Array}  classes
 * @param {Boolean} applyClass
 * @returns {Object|null}  스타일 객체 또는 applyStyle=false 일 때 null
 */
function buildCellStyle(region, cellInfo, classes, applyClass) {
    switch (region) {
        case 'header':  return buildHeaderStyle(cellInfo, classes, applyClass);
        case 'gheader': return buildGHeaderStyle(cellInfo, classes, applyClass);
        case 'detail':  return buildDetailStyle(cellInfo, classes, applyClass);
        case 'footer':  return buildFooterStyle(cellInfo, classes, applyClass, false);
        case 'gfooter': return buildFooterStyle(cellInfo, classes, applyClass, true);
        default:        return null;
    }
}


function pushClasses(t, src) {
    if (!src) return;
    if (Array.isArray(src)) { for (var i=0;i<src.length;i++) { if(src[i]) t.push(src[i]); } }
    else t.push(src);
}
function getCellClasses(vcGrid, region, cellIndex) {
    var part = region==='header'  ? vcGrid.header
             : region==='detail'  ? vcGrid.detail
             : region==='footer'  ? vcGrid.footer
             : region==='gheader' ? vcGrid.gheader
             : region==='gfooter' ? vcGrid.gfooter : null;
    if (!part) return EMPTY_ARRAY;
    var r=[];
    var ctrl=part.getControl(cellIndex); if(ctrl) pushClasses(r, ctrl.style.getClasses());
    var col=part.getColumn(cellIndex);   if(col)  pushClasses(r, col.style.getClasses());
    return r.length ? r : EMPTY_ARRAY;
}

/* ── 컬럼 알파벳 캐시 ───────────────────────────────────────────────── */
function colAlpha(idx, cache) {
    if (cache[idx]) return cache[idx];
    var s='', n=idx+1;
    while(n>0){ s=String.fromCharCode(((n-1)%26)+65)+s; n=Math.floor((n-1)/26); }
    cache[idx]=s; return s;
}

/* ═══════════════════════════════════════════════════════════════════════
   페이로드 빌드

   원본 소스 구조 (헤더/detail 동일):
     rowGroup.data[r]      = r번째 행의 셀 값 배열
     rowGroup.style[c]     = c번째 셀의 레이아웃 정의 (colindex, rowindex, colspan 등)
     rowGroup.style[c].rowindex = 멀티행 헤더일 때 몇 번째 행인지

   → data[r][c] + style[c].rowindex 조합으로 Excel 행/열 위치 결정
   → 헤더와 데이터 모두 동일한 루프로 처리

   ── postMessage OOM 방지 구조 ──────────────────────────────────────────
   스타일 객체를 셀마다 복사해 보내면 대량 데이터(특히 detail 전체)에서
   structuredClone 직렬화 중 메모리 초과(DataCloneError)가 발생한다.

   해결: 스타일 정의는 styleTable[] 배열에 1회만 저장하고
         셀에는 정수 인덱스(si)만 부여한다.
         → Worker로 전송되는 데이터 크기 = 행×열×(정수 1개) 수준으로 감소
         → Worker 내에서 인덱스로 styleTable 참조해 xf 등록
═══════════════════════════════════════════════════════════════════════ */
function normalizeNumFmt(raw) {
    if (!raw) return '';
    // s/S 접두어 제거
    var fmt = raw.replace(/^[sS]/, '');
    // 소수점 이하의 9만 # 으로 변환 (정수부 9는 건드리지 않음)
    var dotIdx = fmt.indexOf('.');
    if (dotIdx >= 0) {
        return fmt.substring(0, dotIdx + 1)
             + fmt.substring(dotIdx + 1).replace(/9/g, '#');
    }
    return fmt;
}

/* s#,##0.99 → #,##0  (소수점 이하 제거한 정수 포맷) */
function normalizeNumFmtInt(raw) {
    if (!raw) return '';
    var fmt = raw.replace(/^[sS]/, '');
    var dotIdx = fmt.indexOf('.');
    return dotIdx >= 0 ? fmt.substring(0, dotIdx) : fmt;
}

/* 값이 소수인지 판별 */
function isDecimalValue(v) {
    if (v === null || v === undefined || v === '') return false;
    var n = Number(v);
    return !isNaN(n) && n % 1 !== 0;
}

/**
 * 셀 값에 따라 적절한 numFmt 반환
 * - 소수점 포맷(s#,##0.99)이고 값이 정수인 경우 → 소수점 없는 포맷(#,##0)
 * - 소수점 포맷이고 값이 소수인 경우            → 소수 포맷(#,##0.##)
 * - 정수 전용 포맷(s#,##0)인 경우               → 기존과 동일(#,##0)
 */
function resolveNumFmt(raw, cellValue) {
    if (!raw) return '';
    var hasDecimalFmt = raw.indexOf('.') >= 0;
    if (hasDecimalFmt && !isDecimalValue(cellValue)) {
        return normalizeNumFmtInt(raw);
    }
    return normalizeNumFmt(raw);
}

function buildPayload(vcGrid, voExportData, excludePartSet, opts) {
    var rowgroups  = voExportData.rowgroups || [];
    var alphaCache = {};
    var rows       = [];
    var colWidths  = [];
    var curRowBase = 1;

    /* ── 스타일 테이블 ───────────────────────────────────────────────────
       styleTable[i] = 스타일 객체, 셀에는 si(정수 인덱스)만 저장
       ─ 개선: JSON.stringify 대신 직접 구성한 경량 키 문자열 사용
         구조가 고정되어 있으므로 프로퍼티를 일정 순서로 이어 붙이는 것으로
         JSON.stringify(400만 회) 비용을 대폭 줄입니다.                   */
    var styleTable  = [];
    var styleKeyMap = Object.create(null);

    function makeStyleKey(s) {
        // font
        var f = s.font || {};
        var fk = (f.bold?'1':'0') + (f.italic?'1':'0') + (f.sz||'') + '|' + ((f.color&&f.color.rgb)||'') + '|' + (f.name||'');
        // fill
        var fi = s.fill && s.fill.fgColor ? s.fill.fgColor.rgb||'' : '';
        // alignment
        var a = s.alignment || {};
        var ak = (a.horizontal||'') + '|' + (a.vertical||'');
        // border (left/right/top/bottom style+color)
        var b = s.border || {};
        function bs(side) {
            var x = b[side]; if (!x) return '';
            return (x.style||'') + ((x.color&&x.color.rgb)||'');
        }
        var bk = bs('left') + '|' + bs('right') + '|' + bs('top') + '|' + bs('bottom');
        return fk + '||' + fi + '||' + ak + '||' + bk + '||' + (s.numFmt||'');
    }

    function getStyleIndex(styleObj) {
        if (!styleObj) return -1;
        var key = makeStyleKey(styleObj);
        if (styleKeyMap[key] !== undefined) return styleKeyMap[key];
        var idx = styleTable.length;
        styleKeyMap[key] = idx;
        styleTable.push(styleObj);
        return idx;
    }

    // 컬럼 너비
    var exportCols = voExportData.cols || [];
    for (var ci = 0; ci < exportCols.length; ci++) {
        colWidths.push({ wch: (parseInt(exportCols[ci].width,10)||0)/5 });
    }
    for (var rg = 0; rg < rowgroups.length; rg++) {
        var rowGroup  = rowgroups[rg];
        var region    = rowGroup.region;
        if (excludePartSet.has(region)) continue;

        var dataList  = rowGroup.data  || [];
        var styleList = rowGroup.style || [];
        var isDetail  = (region === 'detail');

        /* ── 개선: vnLastAddRow를 rowGroup 진입 시 1회만 계산 ────────────
           기존: 매 행마다 styleList 전체를 순회 → 10만행 × 40컬럼 = 400만 회
           개선: rowGroup 단위로 1회만 계산                               */
        var vnLastAddRow = 0;
        for (var sc = 0; sc < styleList.length; sc++) {
            if (styleList[sc] && styleList[sc].rowindex > vnLastAddRow) {
                vnLastAddRow = styleList[sc].rowindex;
            }
        }

        /* ── 개선: 스타일 인덱스도 rowGroup 진입 시 1회만 계산 ──────────
           기존: detail은 r===0 조건으로 첫 행에서만 계산하지만 매 행마다
                 if(isDetail)/if(r===0) 분기 비용 발생
           개선: rowGroup 진입 시점에 styleList 기준으로 미리 계산해
                 colStyleIdxCache[] 를 완성, 이후 행 루프는 캐시 조회만 수행 */
        var colStyleIdxCache = null;
        var isHeaderRegion = (region === 'header');
        var shouldApplyStyle = (opts.applyStyle === true)
            || (opts.applyStyle === false && isHeaderRegion);

        if (shouldApplyStyle) {
            colStyleIdxCache = new Array(styleList.length);
            for (var si0 = 0; si0 < styleList.length; si0++) {
                var ci0 = styleList[si0];
                if (!ci0) { colStyleIdxCache[si0] = -1; continue; }
                var cl0 = opts.applyClassStyle
                    ? getCellClasses(vcGrid, region, ci0.cellIndex)
                    : EMPTY_ARRAY;
                colStyleIdxCache[si0] = getStyleIndex(
                    buildCellStyle(region, ci0, cl0, opts.applyClassStyle)
                );
            }
        }

        /* ── 개선: rowMap 재사용 ─────────────────────────────────────────
           기존: 매 행마다 Object.create(null) 로 새 객체 생성 → GC 압박
           개선: vnLastAddRow+1 크기의 배열을 rowGroup 진입 시 1회 할당,
                 각 행 처리 후 내용만 초기화(null 대입)                   */
        var rowMapArr = new Array(vnLastAddRow + 1);

        for (var r = 0; r < dataList.length; r++) {
            var rowData = dataList[r];

            // rowMapArr 초기화 (배열 재사용)
            for (var ri0 = 0; ri0 <= vnLastAddRow; ri0++) rowMapArr[ri0] = null;

            for (var cellIdx = 0; cellIdx < rowData.length; cellIdx++) {
                var psValue  = rowData[cellIdx];
                var cellInfo = styleList[cellIdx];
                if (!cellInfo) continue;

                var excelRow = curRowBase + cellInfo.rowindex;
                var excelCol = cellInfo.colindex;
                var ref      = colAlpha(excelCol, alphaCache) + excelRow;

                var si = colStyleIdxCache ? colStyleIdxCache[cellIdx] : -1;

                var cs = Math.max(
                    cellInfo.colspan > 1 ? cellInfo.colspan : 1,
                    psValue && psValue.colspan > 1 ? psValue.colspan : 1
                );
                var rs = Math.max(
                    cellInfo.rowspan > 1 ? cellInfo.rowspan : 1,
                    psValue && psValue.rowspan > 1 ? psValue.rowspan : 1
                );

                var ri1 = cellInfo.rowindex;
                if (!rowMapArr[ri1]) rowMapArr[ri1] = [];
                var cellVal = (psValue && psValue.value != null) ? psValue.value : '';
                rowMapArr[ri1].push({
                    ref:    ref,
                    v:      cellVal,
                    t:      cellInfo.type === 'number' ? 'n' : 's',
                    numFmt: resolveNumFmt(cellInfo.format, cellVal),
                    si:     si !== undefined ? si : -1,
                    merge:  (cs > 1 || rs > 1) ? { cs:cs, rs:rs } : null
                });
            }

            for (var ri2 = 0; ri2 <= vnLastAddRow; ri2++) {
                rows.push({ rowIndex: curRowBase + ri2, cells: rowMapArr[ri2] || [] });
            }
            curRowBase += vnLastAddRow + 1;
        }
    }

    return { rows: rows, colWidths: colWidths, totalRows: curRowBase - 1, styleTable: styleTable };
}
/*********************** udcPocGridTitle 필요 스크립트 추가 End ***********************/

/**
 * xlsx 라이브러리 사용
 * @param {String} psFileName 파일명
 * @param {String} psSheetName 시트명
 * @param {cpr.controls.Grid} pcGrid 대상 그리드
 * @param {
 *   isExcludeHideColumn? : Boolean <!-- 숨김컬럼 제외 여부 (default: true) -->,
 *   excludeColumns? : String <!-- 출력시 숨김컬럼 외 제외할 컬럼명 (여러개인 경우 콤마로 구분)<br> ex) COL1,COL2,COL3 -->,
 *   excludePart?: cpr.controls.gridpart.VLOC_REGION <!-- 출력시 제외영역 (header,detail,footer,gheader,gfooter)<br>ex) footer,gfooter -->,
 *   applyFormat? : Boolean <!-- 익스포트시 포맷을 적용시킬 지 여부 (default: true) --> ,
 *   applySuppress? : Boolean <!-- 엑셀 익스포트시 suppress, mergedToIndexExpr에 의한 셀 병합을 반영할지 여부(default: true) -->,
 *   showRowIndex? : Boolean <!-- rowindex 특수컬럼을 export 할지 여부 (default: false) -->
 *   applyClassStyle? : Boolean <!-- 클래스 스타일 적용할지 여부 (default: false) -->
 * } options? 그리드 엑셀 익스포트 옵션
 */
function exportExcelToJSON(psFileName, psSheetName, pcGrid, options) {
	
	/** @type cpr.controls.Progress */
	var vcProgressBar = app.getAppProperty("progressCtrl");
	if (!ValueUtil.isNull(vcProgressBar)) {
		
		util.showLoadMask(app.getHostAppInstance());
		var voActiveLoadmask = util.getLoadMask(app.getHostAppInstance())
		if (voActiveLoadmask) {
			voActiveLoadmask.module.setText("데이터를 가공 중입니다.");
		}
	
		setTimeout(function(){
			options = Object.assign({
		        applyFormat:         true,
		        applySuppress:       true,
		        isExcludeHideColumn: true,
		        showRowIndex:        false,
		        applyStyle:          false,   // 전 영역(header/gheader/detail/footer/gfooter) 스타일 적용 여부 (성능 비교용 on/off)
		        applyClassStyle:     false,  // CSS 클래스 스타일까지 읽어올지 여부 (applyStyle=true 일 때만 유효)
		        workerUrl:           EXCEL_WORKER_URL,
		        onProgress:         function (pct, total, processed){
		        	if(vcProgressBar){
			        	vcProgressBar.visible = true;
			        	vcProgressBar.value = pct;
			        	util.hideLoadMask(app.getHostAppInstance());
		        	}
		        	if (voActiveLoadmask) {
						if(pct == 100){
				        	vcProgressBar.value = pct;
				        	setTimeout(function(){
				        		vcProgressBar.visible = false;
				        	}, 500);
						}
					}
		        }
		    }, options || {});
		
		    var vcGrid = pcGrid;
		    if (options.applyStyle !== true && options.applyClassStyle) buildClassRuleMap();
		
		    /* ── 제외 컬럼/영역 ─────────────────────────────────────────────── */
		    var excludeColSet  = new Set();
		    var excludePartSet = new Set();
		
		    if (options.isExcludeHideColumn) {
		        (vcGrid.getColIndicesByVisible(false)||[]).forEach(function(i){ excludeColSet.add(i); });
		    }
		    if (options.excludePart) {
		        ValueUtil.split(options.excludePart,',').forEach(function(v){ excludePartSet.add(v.trim()); });
		    }
		    if (options.excludeColumns) {
		        ValueUtil.split(options.excludeColumns,',').forEach(function(name){
		            name=name.trim(); if(!name) return;
		            var cols=vcGrid.detail.getColumnByName(name);
		            if(cols) cols.forEach(function(c){ excludeColSet.add(c.colIndex); });
		        });
		    }
		
		    (util.Grid.getGridHeaderCells(vcGrid)||[]).forEach(function(hc){
		        if(hc.columnType==='checkbox'||hc.columnType==='radio') excludeColSet.add(hc.colIndex);
		    });
		    (util.Grid.getGridDetailCells(vcGrid)||[]).forEach(function(dc){
		        if(!options.showRowIndex && dc.columnType==='rowindex') excludeColSet.add(dc.colIndex);
		    });
		    var sc = util.Grid.getHeaderStatusColumn(vcGrid.getAppInstance(), vcGrid.id);
		    if (sc) { var si=sc.colIndex; (Array.isArray(si)?si:[si]).forEach(function(i){ excludeColSet.add(i); }); }
		
		    /* ── Export 데이터 추출 ─────────────────────────────────────────── */
	//	   var start = 0
	//	   var totalRows = vcGrid.getRowCount();
	//	   var adjustedSize = Math.min(5000, totalRows - start);
	//	   var rowIndex = [];
	//	   for (var i = 0; i < adjustedSize; i++) {
	//	   	rowIndex.push(start + i);
	//	   }
		    var voExportData = vcGrid.getExportData({
		        exceptStyle:     false,
	//	        rows : rowIndex,
		        applyFormat:     options.applyFormat,
		        applySuppress:   options.applySuppress,
		        excludeColIndex: Array.from(excludeColSet)
		    });
		    /* ── 페이로드 빌드 ──────────────────────────────────────────────── */
		    var payload = buildPayload(vcGrid, voExportData, excludePartSet, options);
		
		    if (options.onProgress) options.onProgress(0);
		
		    /* ── Worker 실행 ────────────────────────────────────────────────── */
		    return new Promise(function(resolve, reject) {
		        var worker;
		        try { worker = new Worker(options.workerUrl); }
		        catch(e) { return reject(new Error('[exportExcel] Worker 생성 실패: ' + e.message)); }
		        worker.onmessage = function(e) {
		            var msg = e.data;
		            if (msg.type === 'progress') {
		                if (options.onProgress) options.onProgress(Math.round(msg.pct * 0.9), msg.total, msg.processed);
		                return;
		            }
		            if (msg.type === 'done') {
		            	/* [성능] 메인 스레드 연산 종료 */
		                worker.terminate();
		                var clientExportDone = new cpr.events.CUIEvent("client-export-done");
						app.dispatchEvent(clientExportDone);
		                saveAs(new Blob([msg.buffer],{type:'application/octet-stream'}), psFileName);
		                if (options.onProgress) {
			                options.onProgress(100);
		                }
		                resolve();
		                return;
		            }
		            if (msg.type === 'error') {
		                worker.terminate();
		                vcProgressBar.visible = false;
		                reject(new Error(msg.message));
		            }
		        };
		        /* [성능] 메인 스레드 연산 종료 */
		        
		        worker.onerror = function(e) {
		            worker.terminate();
		            reject(new Error('[exportExcel] Worker 오류: ' + e.message));
		            
		            vcProgressBar.visible = false;
		        };
		
		        worker.postMessage({
		            type:       'build',
		            sheetName:  psSheetName,
		            rows:       payload.rows,
		            colWidths:  payload.colWidths,
		            totalRows:  payload.totalRows,
		            styleTable: payload.styleTable   // 스타일 정의 테이블 (셀은 si 인덱스로 참조)
		        });
		    });
		}, 1000);
	} else {
		
		/* options의 기본값 세팅 */
		if (ValueUtil.isNull(options)) options = {};
		options = _.defaults(options, {
			applyFormat: true,
			applySuppress: true,
			isExcludeHideColumn: true,
			showRowIndex: false,
			applyClassStyle: false
		});
		
		/** @type cpr.controls.Grid */
		var vcGrid = pcGrid;
		var voExportData;
		var vaVisibleCols = [];
		var vaExcludePart = [];
		var vaExclColumns = [];
		
		// visible=false 컬럼
		vaVisibleCols = options.isExcludeHideColumn ? vaVisibleCols.concat(vcGrid.getColIndicesByVisible(false)) : vaVisibleCols;
		
		//파라미터로 받아온 출력 제외 영역이 존재하는 경우
		vaExcludePart = !ValueUtil.isNull(options.excludePart) ? ValueUtil.split(options.excludePart, ",") : vaExcludePart;
		//파라미터로 받아온 출력 제외 컬럼이 존재하는 경우
		if (!ValueUtil.isNull(options.excludeColumns)) {
			vaExclColumns = ValueUtil.split(options.excludeColumns, ",");
			var vaDColumns;
			for (var j = 0; j < vaExclColumns.length; j++) {
				// 컬럼명을 컬럼인덱스로 변환
				vaDColumns = vcGrid.detail.getColumnByName(vaExclColumns[j].trim());
				if (vaDColumns) {
					vaDColumns.forEach(function( /* cpr.controls.gridpart.GridDetailColumn */ each) {
						vaVisibleCols = vaVisibleCols.concat(each.colIndex);
					});
				}
			}
		}
		// 특수컬럼 제외
		// 체크박스, 라디오
		var vaHeaderCols = util.Grid.getGridHeaderCells(vcGrid);
		vaHeaderCols.forEach(function(each) {
			if (each.columnType == "checkbox" || each.columnType == "radio") {
				vaVisibleCols = vaVisibleCols.concat(each.colIndex);
			}
		});
		
		// rowindex 컬럼 제외하는 경우
		var vaDetailCols = util.Grid.getGridDetailCells(vcGrid);
		vaDetailCols.forEach(function(each) {
			if (!options.showRowIndex && each.columnType == "rowindex") {
				vaVisibleCols = vaVisibleCols.concat(each.colIndex);
			}
		});
		
		// 상태컬럼 제외
		if (util.Grid.getHeaderStatusColumn(vcGrid.getAppInstance(), vcGrid.id)) {
			var vaStatusCols = util.Grid.getHeaderStatusColumn(vcGrid.getAppInstance(), vcGrid.id).colIndex;
			if (!(vaStatusCols instanceof Array)) {
				vaStatusCols = [vaStatusCols];
			}
			vaVisibleCols = vaVisibleCols.concat(vaStatusCols);
		}
		
		// 그리드 정보
		voExportData = vcGrid.getExportData({
			exceptStyle: false,
			applyFormat: options.applyFormat,
			applySuppress: options.applySuppress, // 동적 병합
			excludeColIndex: vaVisibleCols, // 제외할 컬럼
			useFormat: options.userFormat
		});
		
		if (options.showInfoText) {
			// info 영역을 첫번째 셀에 만든다.
			var voHeader = voExportData["rowgroups"][0];
			voHeader.style.forEach(function(cell) {
				cell.rowindex += 1;
			});
			
			voHeader.data[0].push({value: options.infoText, style: {}});
			voHeader.style.push({
				"type": "string",
				"rowindex": 0,
				"rowspan": 1,
				"colindex": 0,
				"colspan": voExportData.cols.length,
				"cellIndex": voHeader.style.length,
				"style": {
					"font-weight": "bold",
					"font-size": "11px",
					"text-align": "left",
					"vertical-align": "middle",
					"color": "black",
					"border-left-color": "#000000",
					"border-right-color": "#000000",
					"border-top-color": "#000000",
					"border-bottom-color": "#000000",
					"border-left-style": "solid",
					"border-right-style": "solid",
					"border-top-style": "solid",
					"border-bottom-style": "solid",
					"border-left-width": "3px",
					"border-right-width": "3px",
					"border-top-width": "3px",
					"border-bottom-width": "3px",
					"background-color" : "#ffffff"
				}
			});
		}
		
		// 엑셀 생성.
		var wb = XLSX.utils.book_new(); // workbook 생성
		var ws = {}; // sheet 생성
		var vaCols = []; // 엑셀의 cell width를 지정할 부분.
		// 컬럼 width 설정
		// 컬럼 width 설정을 아래 object 형태로 정의
		// {wch:100}
		// 컬럼 width 값 그대로 하면 엑셀에서 너무 크게 지정되기 때문에 임의로 5를 나눠서 적용
		voExportData.cols.forEach(function(poObj) {
			vaCols.push({
				wch: parseInt(poObj.width, 10) / 5
			});
		});
		
		// {"!cols" : [{wch:100},{wch:100}]}
		if (vaCols.length > 0) {
			ws["!cols"] = vaCols;
		}
		
		// 엑셀 전체 데이터를 SheetJS에서 사용 가능하도록 변경.
		// 특정 셀의 값은 아래와 같이 정의한다.
		// {alphabet + row number} : {"v": "출력할Text","t": "Type (s:text/b:boolean/n:number...)","s": {style Object}}
		// ex) A1 : {"v": "테스트","t": "s","s": {"font": {"name": "Courier","sz": 24},fill:{bgColor:{rgb: "FFE9E9E9"}}}}
		var vaMerges = []; // 병합할 셀에 대한 정보 .
		var vnLastColIdx = 0; // 마지막 column을 찾기위한 변수.
		var vsLastColAlphabet; // 마지막 column을 표기하기위한 변수.
		var vnGroupRowIdx = 1; // 마지막 row를 표기하기위한 변수. 각 로우그룹 start는 0부터라 해당값을 더해줘야함.
		
		voExportData.rowgroups.forEach(function(rowGroup) {
			/** @type Array */
			var vaGrpDataList = rowGroup.data; // 데이터 ( 값 )
			var vaGrpStyle = rowGroup.style; // 위치정보( colIndex, rowIndex, merge 정보 )
			var vsGrpRegion = rowGroup.region; // 로우그룹의 타입.(header, detail, gheader, gfooter, footer)
			// exportData에서는 row 정보는 각 그룹내 row정보이므로 중첩되어 증가되도록 선언한다.
			var vnLastAddRow = 0;
			
			// 제외할 영역이 아닌 경우
			if (vaExcludePart.indexOf(vsGrpRegion) == -1) {
				vaGrpDataList.forEach(function(vaGrpData) {
					vaGrpData.forEach(function(psValue, cellIdx) {
						var vaClass = [];
						var voCellInfo = vaGrpStyle[cellIdx]; // 위치정보
						// 클래스 스타일 적용하는 경우
						if(options.applyClassStyle){
							var vnGrdCellIdx = voCellInfo.cellIndex;
							var vaClassName = null; // 해당 셀이 가지고 있는 클래스명 배열
							
							// 해당 셀의 클래스 정보를 가져옴
							if (vsGrpRegion == "header") {
								if (vcGrid.header.getControl(vnGrdCellIdx)) {
									vaClassName = vcGrid.header.getControl(vnGrdCellIdx).style.getClasses(); // 컨트롤 클래스 명
									vaClass = vaClass.concat(vaClassName instanceof Array ? vaClassName : [vaClassName]); 
								}
								if (vcGrid.header.getColumn(cellIdx)) {
									vaClassName = vcGrid.header.getColumn(vnGrdCellIdx).style.getClasses(); // 컬럼 클래스 명
									vaClass = vaClass.concat(vaClassName instanceof Array ? vaClassName : [vaClassName]); 
								}	
							}else if(vsGrpRegion == "detail"){
								if (vcGrid.detail.getControl(vnGrdCellIdx)) {
									vaClassName = vcGrid.detail.getControl(vnGrdCellIdx).style.getClasses(); // 컨트롤 클래스 명
									vaClass = vaClass.concat(vaClassName instanceof Array ? vaClassName : [vaClassName]); 
								}
								if (vcGrid.detail.getColumn(vnGrdCellIdx)) {
									vaClassName = vcGrid.detail.getColumn(vnGrdCellIdx).style.getClasses(); // 컬럼 클래스 명
									vaClass = vaClass.concat(vaClassName instanceof Array ? vaClassName : [vaClassName]); 
								}	
							}else if(vsGrpRegion == "footer"){
								if (vcGrid.footer.getControl(vnGrdCellIdx)) {
									vaClassName = vcGrid.footer.getControl(vnGrdCellIdx).style.getClasses(); // 컨트롤 클래스 명
									vaClass = vaClass.concat(vaClassName instanceof Array ? vaClassName : [vaClassName]); 
								}
								if (vcGrid.footer.getColumn(vnGrdCellIdx)) {
									vaClassName = vcGrid.footer.getColumn(vnGrdCellIdx).style.getClasses(); // 컬럼 클래스 명
									vaClass = vaClass.concat(vaClassName instanceof Array ? vaClassName : [vaClassName]); 
								}
							}
						}
	
						// 해당 로우그룹을 기준으로 올려주는 rowIndex MAX값 
						if (vnLastAddRow < voCellInfo.rowindex) {
							vnLastAddRow = voCellInfo.rowindex;
						}
						// 1. 셀의 위치값을 찾는다.
						var vsColAlphabet = getCellAlphabet(voCellInfo.colindex);
						// 2. 셀의 스타일을 찾는다.
						var vsCellStyle = {};
						vsCellStyle = getCssToXlsxJsStyle(voCellInfo, vsGrpRegion, vaClass, options.applyClassStyle);
						
						// 3. 셀 병합
						var vnStartCol = 0;
						var vnStartRow = 0;
						var vnEndCol = 0;
						var vnEndRow = 0;
						
						// 3-1. colSpan이나 rowSpan이 있는경우 실행.
						if (voCellInfo.colspan > 1 || voCellInfo.rowspan > 1) {
							vnStartCol = voCellInfo.colindex;
							vnStartRow = vnGroupRowIdx + voCellInfo.rowindex - 1;
							vnEndCol = vnStartCol + voCellInfo.colspan - 1;
							vnEndRow = vnStartRow + voCellInfo.rowspan - 1;
							// 셀 병합데이터 추가.(병합정보는 A1 이런식이 아닌 인덱스 0부터 시작)
							vaMerges.push({
								s: {
									r: vnStartRow,
									c: vnStartCol
								},
								e: {
									r: vnEndRow,
									c: vnEndCol
								}
							});
							
							// 단 sheetjs 특성상 셀 병합 시 병합된 셀에도 border style을 넣어줘야 정상적인 border가 입혀지게된다.
							// 하여 시작 col부터 마지막 col & row 까지 모두 border style를 넣어준다.
							for (var sRow = vnStartRow; sRow <= vnEndRow; sRow++) {
								for (var sCol = vnStartCol; sCol <= vnEndCol; sCol++) {
									var startColAlphabet = getCellAlphabet(sCol);
									ws[startColAlphabet + (sRow + 1)] = {
										"v": psValue.value,
										"t": voCellInfo.type == "number" ? "n" : "s",
										"s": vsCellStyle
									};
								}
							}
						}
						
						// 3-2.동적 병합
						if (psValue.colspan > 1 || psValue.rowspan > 1) {
							vnStartCol = voCellInfo.colindex;
							vnStartRow = vnGroupRowIdx + voCellInfo.rowindex - 1;
							vnEndCol = vnStartCol + psValue.colspan - 1;
							vnEndRow = vnStartRow + psValue.rowspan - 1;
							// 셀 병합데이터 추가. (병합정보는 A1 이런식이 아닌 인덱스 0부터 시작)
							vaMerges.push({
								s: {
									r: vnStartRow,
									c: vnStartCol
								},
								e: {
									r: vnEndRow,
									c: vnEndCol
								}
							});
							
							// 단 sheetjs 특성상 셀 병합 시 병합된 셀에도 border style을 넣어줘야 정상적인 border가 입혀지게된다.
							// 하여 시작 col부터 마지막 col & row 까지 모두 border style를 넣어준다.
							for (var sRow = vnStartRow; sRow <= vnEndRow; sRow++) {
								for (var sCol = vnStartCol; sCol <= vnEndCol; sCol++) {
									var vsStartColAlphabet = getCellAlphabet(sCol);
									ws[vsStartColAlphabet + (sRow + 1)] = {
										"v": psValue.value,
										"t": voCellInfo.type == "number" ? "n" : "s",
										"s": vsCellStyle
									};
								}
							}
						}
						if(!ws[vsColAlphabet + (vnGroupRowIdx + voCellInfo.rowindex)]){
							// 4. 셀을 선언한다.
							// 알파벳 + (rowIndex MAX값 + 위치정보의 rowIndex) 가 현재 셀 정보.
							ws[vsColAlphabet + (vnGroupRowIdx + voCellInfo.rowindex)] = {
								"v": psValue.value,
								"t": voCellInfo.type == "number" ? "n" : "s",
								"s": vsCellStyle
							};
						}
						
						// 마지막 컬럼 위치를 저장한다.
						if (vnLastColIdx < voCellInfo.colindex) {
							vnLastColIdx = voCellInfo.colindex;
							vsLastColAlphabet = vsColAlphabet;
						}
					});
					// rowIndex MAX값 
					vnGroupRowIdx += vnLastAddRow + 1;
				});
			}
			
		});
		// 마지막 컬럼값과 마지막 로우를 합쳐 마지막 셀위치 표기.
		vsLastColAlphabet = vsLastColAlphabet + vnGroupRowIdx;
		
		// ref 선언을 해줘서 엑셀에 표기한다.
		ws["!ref"] = "A1:" + vsLastColAlphabet;
		
		// 병합할 셀에 대한 정보가 있다면 추가한다.
		// SheetJS에서는 병합할 셀에 대한 정보를 아래 object처럼 진행한다.
		// {"!merges" : [{ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },{ s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },]}
		if (vaMerges.length > 0) {
			ws["!merges"] = vaMerges;
		}
		// workbook에 새로만든 워크시트에 이름을 주고 붙인다. 
		XLSX.utils.book_append_sheet(wb, ws, psSheetName);
		// 엑셀 파일 쓰기
		var wbout = XLSX.write(wb, {
			bookType: 'xlsx',
			type: 'binary'
		});
		
		// 파일 다운로드
		saveAs(new Blob([s2ab(wbout)], {
			type: "application/octet-stream"
		}), psFileName);
	}
}

/**
 * column index를 통해 엑셀의 알파벳 컬럼을 가져온다.
 * @param {cpr.utils.CellStyle} poCellInfo
 */
function getCellAlphabet(pnColindex) {
	// 위치정보를 excel에 맞게 알파벳 + 로우정보로 변환한다.
	var vsColAlphabet = "";
	var vnColIndex = pnColindex + 1;
	
	// 1. 셀의 위치값을 찾는다.
	// colIndex를 기준으로 알파벳을 찾아낸다.
	// colIndex가 0인 경우 A 이며 Z까지 출력한다.
	// 단 colIndex가 27이상인 경우 AA 와 같이 출력되므로 26을 나눈 뒤 
	// 나머지 값은 현재 위치 값이 되며 나눈 값을 내림으로 처리하여 0보다 클 경우 
	// 해당 값을 기준으로 다시 26나눠 나머지 값을 알파벳으로 추가한다.
	// 알파벳을 구하는 방법은 ascii code 를 기준으로 65(A)~90(Z)를 기준으로 생성한다.
	while (vnColIndex > 0) {
		// 엑셀 열 인덱스 보정: 0 기반 처리 (나머지 계산 후 1 감소)
		var vnColAlphabetCode = (vnColIndex - 1) % 26;
		
		// 알파벳 코드 계산 및 문자열 앞에 추가
		vsColAlphabet = String.fromCharCode(vnColAlphabetCode + 65) + vsColAlphabet;
		
		// 다음 반복을 위한 인덱스 감소
		vnColIndex = Math.floor((vnColIndex - 1) / 26);
	}
	return vsColAlphabet;
}

/**
 * css를 기준으로 SheetJS 양식의 style을 만든다.
 * css가 없는 경우라면 그리드의 region에 맞춰 default color, background-color를 선언한다.
 * @param {Object} poCssJsonObj
 * @param {String} psGrpRegion
 * @param {Array} paClass 클래스명
 * @param {Boolean} pbApplyClassStyle 클래스 스타일 적용 여부
 */
function getCssToXlsxJsStyle(poCssJsonObj, psGrpRegion, paClass, pbApplyClassStyle) {
	var vsBgColor = "";
	var vsFgColor = "";
	var voStyle = poCssJsonObj.style;
	var vsNumFmt = "";
	
	// 폰트 사이즈 ex) 11
	var vsFontSize = EXCEL_STYLE.FONT_SIZE;
	// 글씨 bold, italic
	var vbBold = EXCEL_STYLE.FONT_BOLD;
	var vbItalic = EXCEL_STYLE.FONT_ITALIC;
	// 정렬 ex) center
	var vsVertical = EXCEL_STYLE.VERTICAL_ALIGN;
	var vsHorizontal = EXCEL_STYLE.HORIZONTAL_ALIGN;
	
	// border 색 스타일
	var voBorderLeftColor = getColor(EXCEL_STYLE.BORDER_COLOR);
	var voBorderRightColor = getColor(EXCEL_STYLE.BORDER_COLOR);
	var voBorderTopColor = getColor(EXCEL_STYLE.BORDER_COLOR);
	var voBorderBottomColor = getColor(EXCEL_STYLE.BORDER_COLOR);
	
	// border 선 스타일
	var vsBorderLeft = EXCEL_STYLE.BORDER_STYLE;
	var vsBorderRight = EXCEL_STYLE.BORDER_STYLE;
	var vsBorderTop = EXCEL_STYLE.BORDER_STYLE;
	var vsBorderBottom = EXCEL_STYLE.BORDER_STYLE;
	
	var vsBorderLeftWidth = "1px";
	var vsBorderRightWidth = "1px";
	var vsBorderTopWidth = "1px";
	var vsBorderBottomWidth = "1px";
	
	// 로우 타입에 따라 전역 스타일 적용
	switch (psGrpRegion) {
		case "header":
			vsBgColor = getColor(EXCEL_STYLE.HEADER_BG_COLOR);
			vsFgColor = getColor(EXCEL_STYLE.HEADER_COLOR);
			// 헤더인 경우 bold 처리
			vbBold = true;
			break;
		case "detail":
			vsBgColor = getColor(EXCEL_STYLE.DETAIL_BG_COLOR);
			break;
		case "gheader":
			vsBgColor = getColor(EXCEL_STYLE.GROUP_HEADER_BG_COLOR);
			break;
		case "gfooter":
			vsBgColor = getColor(EXCEL_STYLE.GROUP_FOOTER_BG_COLOR);
			break;
		case "footer":
			vsBgColor = getColor(EXCEL_STYLE.FOOTER_BG_COLOR);
			vsFgColor = getColor(EXCEL_STYLE.FOOTER_COLOR);
			break;
	}
	
	// 클래스 스타일 적용
	if (pbApplyClassStyle) {
		getStyleSheetArray(paClass);
		paClass.forEach(function(each) {
			vbBold = getComputedCss(each, "font-weight") || vbBold; 									// 폰트 굵기
			vsFontSize = getComputedCss(each, "font-size") || vsFontSize;								// 폰트 사이즈
			vsHorizontal = getComputedCss(each, "text-align") || vsHorizontal;							// 글자 정렬
			vsVertical = getComputedCss(each, "vertical-align") || vsVertical;							// 수직 정렬
			vsBgColor = getComputedCss(each, "background-color") || vsBgColor;							// 배경색
			vsFgColor = getComputedCss(each, "color") || vsFgColor;										// 글자색
			voBorderLeftColor = getComputedCss(each, "border-left-color") || voBorderLeftColor;			// 왼쪽 선 색
			voBorderRightColor = getComputedCss(each, "border-right-color") || voBorderRightColor;		// 오른쪽 선 색
			voBorderTopColor = getComputedCss(each, "border-top-color") || voBorderTopColor;			// 위쪽 선 색
			voBorderBottomColor = getComputedCss(each, "border-bottom-color") || voBorderBottomColor;	// 아래쪽 선 색
			vsBorderLeft = getComputedCss(each, "border-left-style") || vsBorderLeft;					// 왼쪽 선 스타일
			vsBorderRight = getComputedCss(each, "border-right-style") || vsBorderRight;				// 오른쪽 선 스타일
			vsBorderTop = getComputedCss(each, "border-top-style") || vsBorderTop;						// 위쪽 선 스타일
			vsBorderBottom = getComputedCss(each, "border-bottom-style") || vsBorderBottom;				// 아래쪽 선 스타일
			vsBorderLeftWidth = getComputedCss(each, "border-left-width") || vsBorderLeftWidth;			// 왼쪽 선 굵기
			vsBorderRightWidth = getComputedCss(each, "border-right-width") || vsBorderRightWidth;		// 오른쪽 선 굵기
			vsBorderTopWidth = getComputedCss(each, "border-top-width") || vsBorderTopWidth;			// 위쪽 선 굵기
			vsBorderBottomWidth = getComputedCss(each, "border-bottom-width") || vsBorderBottomWidth;	// 아래쪽 선 굵기
		});
	}
			
	// 엑셀에서 제공되는 format 형식만 제공
	// s#,##0 -> #,##0
	vsNumFmt = poCssJsonObj.format ? poCssJsonObj.format.replace("s", "") : "";
	
	// 스타일이 있을 경우
	if (Object.keys(voStyle).length > 0) {
		
		// background-color
		vsBgColor = voStyle["background-color"] ? getColor(voStyle["background-color"]) : vsBgColor;
		
		// border colors
		voBorderLeftColor = voStyle["border-left-color"] ? getColor(voStyle["border-left-color"]) : voBorderLeftColor;
		voBorderRightColor = voStyle["border-right-color"] ? getColor(voStyle["border-right-color"]) : voBorderRightColor;
		voBorderTopColor = voStyle["border-top-color"] ? getColor(voStyle["border-top-color"]) : voBorderTopColor;
		voBorderBottomColor = voStyle["border-bottom-color"] ? getColor(voStyle["border-bottom-color"]) : voBorderBottomColor;
		
		// border 선 스타일
		vsBorderLeft = voStyle["border-left-style"] || vsBorderLeft;
		vsBorderRight = voStyle["border-right-style"] || vsBorderRight;
		vsBorderTop = voStyle["border-top-style"] || vsBorderTop;
		vsBorderBottom = voStyle["border-bottom-style"] || vsBorderBottom;
		
		vsBorderLeftWidth =voStyle["border-left-width"] || vsBorderLeftWidth;				
		vsBorderRightWidth = voStyle["border-right-width"] || vsBorderRightWidth;		
		vsBorderTopWidth = voStyle["border-top-width"] || vsBorderTopWidth;				
		vsBorderBottomWidth = voStyle["border-bottom-width"] || vsBorderBottomWidth;	
		
		// font-color
		vsFgColor = voStyle["color"] ? getColor(voStyle["color"]) : vsFgColor;
		// font size
		vsFontSize = voStyle["font-size"] || vsFontSize;
		// 정렬
		vsHorizontal = voStyle['text-align'] || EXCEL_STYLE.HORIZONTAL_ALIGN;
		vsVertical = voStyle['vertical-align'] || EXCEL_STYLE.VERTICAL_ALIGN;

		// italic , oblique 일 경우 italic 적용
		if (voStyle["font-style"] == "oblique" || voStyle["font-style"] == "italic") {
			vbItalic = true;
		}
		// normal, undefined 아닌 경우 bold 적용
		if (voStyle["font-weight"] != undefined && voStyle["font-weight"] != "lighter" && voStyle["font-weight"] != "normal") {
			vbBold = true;
		}
	}
	
	
	// 폰트 ex) @HY견명조
	var vsFontName = voStyle["font-family"] || EXCEL_STYLE.FONT_FAMILY;
	
	// 정렬 스타일 
	// ex) {vertical : "center", horizontal : "center"}
	var voAlign = {
		vertical: vsVertical,
		horizontal: vsHorizontal
	};
	// 폰트 스타일
	// ex) {color: {rgb: "364a63"}, sz: "11", bold : true, italic : false, name : "@HY견명조"}
	var voFont = {
		color: {
			rgb: vsFgColor
		},
		sz: vsFontSize.replace("px", ""),
		bold: vbBold,
		italic: vbItalic,
		name: vsFontName
	};
	// 배경색  
	// ex) {fgColor : {rgb: "FFFFFF"}}
	var voFill = {
		fgColor: {
			rgb: vsBgColor
		}
	};
	
	// border 스타일
	if (vsBorderLeft == "solid" && vsBorderLeftWidth != "1px") {
	    vsBorderLeft = "thick";
	} else if (vsBorderLeft == "solid") {
	    vsBorderLeft = "thin";
	}
	if (vsBorderRight == "solid" && vsBorderRightWidth != "1px") {
	    vsBorderRight = "thick";
	} else if (vsBorderRight == "solid") {
	    vsBorderRight = "thin";
	}
	if (vsBorderTop == "solid" && vsBorderTopWidth != "1px") {
	    vsBorderTop = "thick";
	} else if (vsBorderTop == "solid") {
	    vsBorderTop = "thin";
	}
	if (vsBorderBottom == "solid" && vsBorderBottomWidth != "1px") {
	    vsBorderBottom = "thick";
	} else if (vsBorderBottom == "solid") {
	    vsBorderBottom = "thin";
	}

	// ex) {top:{ style: "thin", color: "ed0d0d"}}
	var voBorder = {
		top: {
			style: vsBorderTop,
			color: {
				rgb: voBorderTopColor
			}
		},
		bottom: {
			style: vsBorderBottom,
			color: {
				rgb: voBorderBottomColor
			}
		},
		left: {
			style: vsBorderLeft,
			color: {
				rgb: voBorderLeftColor
			}
		},
		right: {
			style: vsBorderRight,
			color: {
				rgb: voBorderRightColor
			}
		}
	};
	// 스타일
	return {
		alignment: voAlign,
		font: voFont,
		fill: voFill,
		border: voBorder,
		numFmt: vsNumFmt
	};
}

/**
 * #FFF -> FFFFFF 으로 변환
 * @param {String} psColor
 */
function getColor(psColor) {
	var vsColor = psColor.replace("#", "");
	// FCF 인경우 -> FFCCFF
	if (vsColor.length == 3) {
		var vaSmlhex = vsColor.split("");
		vsColor = "";
		vaSmlhex.forEach(function(vsHex) {
			vsColor += (vsHex + vsHex);
		});
	}
	return vsColor;
}
/**
 * 바이너리 데이터 만드는 함수
 * @param {any} s
 */
function s2ab(s) {
	var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
	var view = new Uint8Array(buf); //create uint8array as viewer
	for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
	return buf;
}

/************************************************
 * 클래스 스타일 가져오기
 ************************************************/
/**
 * @param {Number} width
 * @param {String} str
 * rgb (0, 25, 25) => 에서 16진수로 변환하는 경우 0은 00이 되도록 변환
 */
var fillZero = function(width, str) {
	return str.length >= width ? str : new Array(width - str.length + 1).join('0') + str; //남는 길이만큼 0으로 채움
}
/**
 * 클래스 정보
 */
var _CLASS_INFO = {};
var _OWNER_SET = new Set();
var _SHEETS = null;

/**
 * 
 * @param {Array} classArr
 */
function getStyleSheetArray(classArr) {
	var vaClass = classArr;
	vaClass = vaClass.filter(function(each) {
		return each != "";
	});
	if (vaClass.length > 0 && vaClass[0] instanceof Array) {
		vaClass[0] = vaClass[0][0];
	}
	if (_OWNER_SET.has(JSON.stringify(vaClass))) {
		return;
	}
	_OWNER_SET.add(JSON.stringify(vaClass));
	var results = {};
	if (_SHEETS == null) {
		_SHEETS = document.styleSheets;
	}

	vaClass.forEach(function(eachClass) {
		//룰 가져오기
		var rules = getStyleSheet(eachClass);
		if (rules.length > 0) {
			rules.forEach(function(/*String*/eachRule){
				// 여러 곳에서 스타일을 지정했을 경우 cl-grid 의 스타일이 적용되도록
				if(rules.length > 1){
					if(rules.length > 1 && eachRule.indexOf(".cl-grid") != -1){
						if(eachRule.indexOf(eachClass+",") != -1) {
							eachRule =  eachRule.replace(eachRule.slice(eachRule.indexOf(","),eachRule.indexOf("{")-1),"");
						}
						var classInfo = eachRule.substr(eachRule.indexOf("."+eachClass)).match(/(\.[\w-]+)|(\{[^}]*\})/g);
						var returns = arrayToObject(classInfo);
						assign(_CLASS_INFO, returns);
					}
				}else{
					if(eachRule.indexOf(eachClass+",") != -1) {
						eachRule =  eachRule.replace(eachRule.slice(eachRule.indexOf(","),eachRule.indexOf("{")-1),"");
					}
					var classInfo = eachRule.substr(eachRule.indexOf("."+eachClass)).match(/(\.[\w-]+)|(\{[^}]*\})/g);
					var returns = arrayToObject(classInfo);
					assign(_CLASS_INFO, returns);
				}
			});
			
		}
	});
}

/**
 * 빌드된 스타일 시트에서 해당 클래스를 포함한 CSSStyleRule 에서 cssText를 변환
 * @param {String} className
 */
function getStyleSheet(className) {
	if (_CLASS_INFO.hasOwnProperty(className)) {
		return null;
	}
	var vaRules = [];
	for (var i = 0; i < _SHEETS.length; i++) {
	    var voSheet = _SHEETS[i];
	
	    for (var j = 0; j < voSheet.cssRules.length; j++) {
	        var tempRule = voSheet.cssRules[j];
	
	        if (tempRule.selectorText && tempRule.selectorText.indexOf("." + className) !== -1) {
	            vaRules.push(tempRule.cssText);
	        }
	    }
	}
	return vaRules;
};

/**
 * Array 형태 Object 형태로 변환 (ex. ['.a', '{ color: rgb(0, 125, 27); }']  => .a: {color: rgb(0, 125, 27)})
 * @param {Array} pArray
 */
function arrayToObject(pArray) {
	var value = pArray.pop(); // 배열의 마지막 값을 추출합니다.
	var nestedObject = cssStringToObject(value);
	
	// 배열을 역순으로 순회하면서 중첩된 객체를 만듭니다.
	for (var i = pArray.length - 1; i >= 0; i--) {
		// Edge IE모드에서도 지원가능하도록 ES6→ES5문법으로 변경 (2025.02.04)
		var tmpNestedObj = {};
		tmpNestedObj[pArray[i]] = nestedObject;
		nestedObject = tmpNestedObj;
	}
	
	return nestedObject;
};

/**
 * css 스타일 String 형태 Object 형태로 변환 (ex. '{ color: rgb(0, 125, 27); }' => { color: rgb(0, 125, 27); })
 * @param {String} cssString
 */
function cssStringToObject(cssString) {
	var cssObject = {};
	var properties = cssString
		.replace(/[{|}]/g, '') // 중괄호 제거
		.split(';'); // 세미콜론으로 분리
	
	properties.forEach(function(property) {
		var arrays = property.split(":").map(function(each) {
			return each.trim();
		});
		var key = arrays[0];
		var value = arrays[1];
		if (key) {
			cssObject[key] = value;
		}
	})
	
	return cssObject;
}

/**
 * @param {Object} arg1
 * @param {Object} arg2
 */
function assign(arg1, arg2) {
	if (!(arg2 instanceof Object)) {
		arg1 = arg2;
	}
	Object.keys(arg2).forEach(function(each) {
		
		if (arg1.hasOwnProperty(each)) {
			if (!(arg2[each] instanceof Object)) {
				arg1[each] = arg2[each];
				return;
			}
			if (JSON.stringify(arg1[each]) == JSON.stringify(arg2[each])) {
				return;
			}
			assign(arg1[each], arg2[each]);
		} else {
			arg1[each] = arg2[each];
		}
	});
};
/**
 * 클래스의 해당 스타일 값을 반환합니다.
 * @param {String} className
 * @param {"background-color"|"color"|"font-weight"|"font-size"|"text-align"|"vertical-align"|"border-right-width"|"border-left-style"} propertyNm
 */
function getComputedCss(className, propertyNm) {
	if (!_CLASS_INFO.hasOwnProperty("." + className)) {
		return null;
	}
	var vsPropertyName = propertyNm;
	var voClass = _CLASS_INFO["." + className];

	var vsBorderStyleNm = propertyNm.replace(/border-(left|right|top|bottom)-style/, "border-style");	// border-style
	var vsBorderColorNm = propertyNm.replace(/border-(left|right|top|bottom)-color/, "border-color");	// border-color
	var vsBorderWidthNm = propertyNm.replace(/border-(left|right|top|bottom)-width/, "border-width");	// border-width
	var vsBorderSideNm = propertyNm.replace(/(border-\w+)-(color|style|width)/g, "$1"); 						// border-(left|right|top|bottom)

	/** @type String */
	// 먼저 클래스에서 직접 해당 속성을 찾음
	var target = voClass[vsPropertyName];
	if (target == null) {
		// 스타일이 border | border-(left|right|top|bottom) | border-(style|color) 로 정의되어 있는 경우
		if(vsPropertyName.indexOf("border") == 0){
			
			if (voClass[vsBorderStyleNm] != null) {
				vsPropertyName = vsBorderStyleNm;
			} else if (voClass[vsBorderColorNm] != null) {
				vsPropertyName = vsBorderColorNm;
			} else if(voClass[vsBorderWidthNm] != null){
				vsPropertyName = vsBorderWidthNm;
			} else if (voClass[vsBorderSideNm] != null) {
				vsPropertyName = vsBorderSideNm;
			} else {
			    vsPropertyName = "border";
			}
			target = voClass[vsPropertyName];
		    if (target == null) {
		        return "";
		    }
		}else{
			return "";
		}
	}
	target = target.trim();
	// 색상 변환
	if (target.indexOf("rgb") != -1 && !/(border-)(\w*-)(style)/g.test(propertyNm) && !/(border-)(\w*-)(width)/g.test(propertyNm)) {
		if (propertyNm.indexOf("border") != -1) {
			target = target.split("rgb")[1];
		}
		var background = target.match(/([0-9]+)/g);
		if (background && background.length > 0) {
			var newBgColor = fillZero(2, parseInt(background[0]).toString(16).toUpperCase()) +
				fillZero(2, parseInt(background[1]).toString(16).toUpperCase()) +
				fillZero(2, parseInt(background[2]).toString(16).toUpperCase());
			if (background.length > 3 && background[3] == "0") {
				newBgColor = "FFFFFF";
			}
		}
		return newBgColor;
	// bold 인 경우만 적용
	} else if (propertyNm == "font-weight") {
		return target == "bold";
	//  border-left , border 로 스타일이 지정되어있는 경우
	} else if (/^border-(left|right|top|bottom)$/.test(vsPropertyName) || vsPropertyName == "border") {
		if(/border-(left|right|top|bottom)-style/.test(propertyNm)){
			// " " (공백)으로 분리하고 두 번째 값을 반환
       		return target.split(" ")[1];
		}else{
			// " " (공백)으로 분리하고 첫 번째 값을 반환
        	return target.split(" ")[0];
		}
    }else {
		return target;
	}
}


/************************************************
 * 사용자 함수
 ************************************************/
/**
 * 프린트할 html 반환
 */
function getHTMLToGrid(gridArr, pageInfo) {
	var htmlTagArr = [];
	htmlTagArr[htmlTagArr.length] = "<div class='page'>";
	
	if (pageInfo != null) {
		// 제목
		if (pageInfo.hasOwnProperty("title")) {
			htmlTagArr[htmlTagArr.length] = "<h1>" + pageInfo["title"] + "</h1>";
		}
		// 결재선 테이블
		if (pageInfo.hasOwnProperty("approvalLine")) {
			var approvalLineTagArr = [];
			approvalLineTagArr[approvalLineTagArr.length] = "<table class='approval_table' >";
			approvalLineTagArr[approvalLineTagArr.length] = "<tr>";
			for (var i = 0; i < pageInfo["approvalLine"].length; i++) {
				approvalLineTagArr[approvalLineTagArr.length] = "<td>" + pageInfo["approvalLine"][i] + "</td>";
			}
			approvalLineTagArr[approvalLineTagArr.length] = "</tr><tr>";
			for (var i = 0; i < pageInfo["approvalLine"].length; i++) {
				approvalLineTagArr[approvalLineTagArr.length] = "<td></td>";
			}
			approvalLineTagArr[approvalLineTagArr.length] = "</tr>";
			approvalLineTagArr[approvalLineTagArr.length] = "</table>";
			htmlTagArr[htmlTagArr.length] = approvalLineTagArr.join("");
		}
	}
	
	// 그리드
	for (var i = 0; i < gridArr.length; i++) {
		htmlTagArr[htmlTagArr.length] = getGridTable(gridArr[i]).join("");
		
		if (i != (gridArr.length - 1)) {
			htmlTagArr[htmlTagArr.length] = "<div style='page-break-before: always; '> </div>";
		}
	}
	htmlTagArr[htmlTagArr.length] = "</div>";
	
	return htmlTagArr.join("");
}

/**
 * 그리드 데이터를 통한 table 반환
 * @param {cpr.controls.Grid} grid
 */
function getGridTable(grid) {
	var exportData = grid.getExportData({
		exceptStyle: false,
		applyFormat: true,
		applySuppress: true
	});
	
	var tableTagArr = [];
	tableTagArr[tableTagArr.length] = "<table class='cl-control cl-grid'>";
	var cols = exportData.cols;
	tableTagArr[tableTagArr.length] = "<colgroup>";
	var colWidths = [];
	var totalColumnWidth = 0;
	for (var ci = 0; ci < cols.length; ci++) {
		var colWidth = cpr.utils.ParamUtil.parseSize(cols[ci]["width"]).size;
		totalColumnWidth += colWidth;
		colWidths[colWidths.length] = colWidth;
	}
	for (var ci = 0; ci < colWidths.length; ci++) {
		tableTagArr[tableTagArr.length] = "<col style='width : " + (colWidths[ci] / totalColumnWidth) + "%'>";
	}
	tableTagArr[tableTagArr.length] = "</colgroup>";
	
	var layouts = exportData.rowgroups;
	for (var li = 0; li < layouts.length; li++) {
		var layout = layouts[li];
		var datas = layout.data;
		var styles = layout.style;
		var trTagArr = [];
		
		// 셀별 데이터를 trTagArr에 배열로 추가
		for (var ri = 0; ri < datas.length; ri++) {
			var tdTagArr = [];
			for (var ci = 0; ci < datas[ri].length; ci++) {
				var rowIndex = styles[ci]["rowindex"];
				if (tdTagArr[rowIndex] == null) {
					tdTagArr[rowIndex] = [];
				}
				if (Object.keys(datas[ri][ci]).length != 0) {
					tdTagArr[rowIndex][tdTagArr[rowIndex].length] = getTd(datas[ri][ci], styles[ci]).join("");
				}
			}
			trTagArr = trTagArr.concat(tdTagArr);
		}
		
		if (layout["region"] == "header") {
			tableTagArr[tableTagArr.length] = "<thead class='cl-grid-header'>";
		}
		for (var tri = 0; tri < trTagArr.length; tri++) {
			tableTagArr[tableTagArr.length] = "<tr class='cl-grid-row'>";
			tableTagArr[tableTagArr.length] = trTagArr[tri].join("");
			tableTagArr[tableTagArr.length] = "</tr>";
		}
		if (layout["region"] == "header") {
			tableTagArr[tableTagArr.length] = "</thead>";
		}
	}
	
	tableTagArr[tableTagArr.length] = "</table>";
	return tableTagArr;
	
}

/**
 * 셀 데이터를 통한 td 반환
 * @param {any} cell
 * @param {any} columnInfo
 * @returns {string[]}
 */
function getTd(cell, columnInfo) {
	var value = cell["value"];
	var cellStyle = cell["style"];
	var columnStyle = columnInfo["style"];
	var style = _.extend({}, columnStyle, cellStyle);
	var styleKeys = Object.keys(style);
	
	var tdTagArr = [];
	tdTagArr[tdTagArr.length] = "<td class='cl-grid-cell'";
	if (cell.hasOwnProperty("rowspan")) {
		if (cell["rowspan"] > 1) {
			tdTagArr[tdTagArr.length] = " rowspan='" + cell["rowspan"] + "'";
		}
	} else if (columnInfo["rowspan"] > 1) {
		tdTagArr[tdTagArr.length] = " rowspan='" + columnInfo["rowspan"] + "'";
	}
	if (cell.hasOwnProperty("colspan")) {
		if (cell["colspan"] > 1) {
			tdTagArr[tdTagArr.length] = " colspan='" + cell["colspan"] + "'";
		}
	} else if (columnInfo["colspan"] > 1) {
		tdTagArr[tdTagArr.length] = " colspan='" + columnInfo["colspan"] + "'";
	}
	
	if (styleKeys.length > 0) {
		tdTagArr[tdTagArr.length] = " style='";
		for (var si = 0; si < styleKeys.length; si++) {
			tdTagArr[tdTagArr.length] = styleKeys[si] + " : " + style[styleKeys[si]] + "; ";
		}
		tdTagArr[tdTagArr.length] = "'";
	}
	tdTagArr[tdTagArr.length] = ">" + value + "</td>";
	
	return tdTagArr;
}

/**
 * 그리드 컨트롤 바인딩 여부
 * @returns {Boolean}
 */
function isGridCtrl() {
	/**@type cpr.controls.Grid */
	var grid = app.getAppProperty("ctrl");
	if (grid == null || grid.type !== "grid") {
		util.Msg.alertDlg(app, "Can not find Target Grid Control!");
		return false;
	}
	return true;
}

function findTargetCtrl () {
	var vcCtrl = app.getAppProperty("ctrl");
	if(!vcCtrl) {
		var voHost = app.getHost();
		if(voHost) {
			var vcTitleWrap = voHost.getParent();
			var vcParent = vcTitleWrap.getParent();
			var vnCurIndex = vcParent.getChildren().indexOf(vcTitleWrap);
			vcCtrl = vcParent.getChildren()[vnCurIndex+1];
		}
	}
	
	return vcCtrl;
}

function doPopoutView () {
	/** @type cpr.controls.Grid */
	var vcViewCtrl = findTargetCtrl();
	if(vcViewCtrl == null || !(vcViewCtrl instanceof cpr.controls.Grid)) {
		util.Msg.notify(app, "확대보기 할 컨트롤을 찾을 수 없습니다.");
		return false;
	}
	
	// 팝 아웃 시키기전 필요한 상태들을 백업 함.
	var voOriginConfig = vcViewCtrl.getInitConfig();
	util.Dialog.open(app, "app/com/comPopoutView", 1600, 770, function(evt){
		/** @type cpr.controls.Dialog */
		var dialog = evt.control;
	}, {
		control : vcViewCtrl,
		config : voOriginConfig
	}, {
	});
}

/************************************************
 * 그리드 우클릭 메뉴
 ************************************************/
/**
 * 디테일 셀과 같은 데이터 컬럼을 대상으로 하는 헤더 셀 인덱스를 찾는다.
 * @param {cpr.controls.Grid} grd
 * @param {String} psColumnName 데이터 컬럼명
 * @return {Number} 헤더 셀 인덱스. 없으면 -1
 */
function getCtxHeaderCellIndex(grd, psColumnName) {
	if (!psColumnName) {
		return -1;
	}
	for (var i = 0; i < grd.header.cellCount; i++) {
		if (grd.header.getColumn(i).targetColumnName == psColumnName) {
			return i;
		}
	}
	return -1;
}

/**
 * 컬럼 0번부터 지정한 컬럼까지의 너비 합(px). 세로 틀고정 영역 너비로 쓴다.
 * 화면 밖 셀은 getCellBounds 가 null 이라 getColumnWidths 로 계산한다.
 * @param {cpr.controls.Grid} grd
 * @param {Number} pnLastIndex 마지막 고정 컬럼 인덱스
 * @return {Number}
 */
function getCtxLeftWidth(grd, pnLastIndex) {
	var vaWidths = grd.getColumnWidths();
	var vnWidth = 0;
	for (var i = 0; i <= pnLastIndex; i++) {
		vnWidth += parseFloat(vaWidths[i]);
	}
	return vnWidth;
}

/**
 * 우클릭 메뉴를 마우스 위치에 띄운다.
 * @param {cpr.controls.Grid} grd
 * @param {cpr.events.CMouseEvent} e 그리드 contextmenu 이벤트
 * @param {{rowIndex: Number, columnName: String, prevCells: Array}} poTarget 우클릭한 칸
 */
function showGridCtxMenu(grd, e, poTarget) {
	closeGridCtxMenu();
	var vcMenu = new cpr.controls.Menu("ctxGrdMenu");
	mcGridCtxMenu = vcMenu;
	MA_GRID_CTX_MENUS.forEach(function(poItem) {
		vcMenu.addItem(new cpr.controls.MenuItem(poItem.label, poItem.value, "root"));
	});
	vcMenu.addEventListener("item-click", function(/* cpr.events.CItemEvent */ ev) {
		var vsValue = ev.item.value;
		closeGridCtxMenu();
		doGridCtxMenuAction(grd, vsValue, poTarget);
	});
	vcMenu.addEventListenerOnce("blur", function(ev) {
		closeGridCtxMenu();
	});

	var vcRoot = grd.getAppInstance().getRootAppInstance().getContainer();
	var zoom = cpr.core.Platform.INSTANCE.getZoom();
	var voConstraint = {
		"position": "absolute",
		"width": "auto",
		"height": "auto",
		"top": ((e.clientY + document.documentElement.scrollTop) / zoom )+ "px",
		"left": (e.clientX / zoom) + "px"
	};
	var voLayout = vcRoot.getLayout();
	if (voLayout instanceof cpr.controls.layouts.FormLayout || voLayout instanceof cpr.controls.layouts.VerticalLayout) {
		vcRoot.floatControl(vcMenu, voConstraint);
	} else {
		vcRoot.addChild(vcMenu, voConstraint);
	}
	vcMenu.focus();
}

/**
 * 떠 있는 우클릭 메뉴를 없앤다.
 */
function closeGridCtxMenu() {
	if (mcGridCtxMenu && !mcGridCtxMenu.disposed) {
		mcGridCtxMenu.dispose();
	}
	mcGridCtxMenu = null;
}

/**
 * 우클릭 메뉴 항목을 실행한다.
 * @param {cpr.controls.Grid} grd
 * @param {String} psAction 메뉴 값
 * @param {{rowIndex: Number, columnName: String, prevCells: Array}} poTarget 우클릭한 칸
 */
function doGridCtxMenuAction(grd, psAction, poTarget) {
	var vnHeaderIdx = getCtxHeaderCellIndex(grd, poTarget.columnName);
	switch (psAction) {
		// 필터 — 고른 열에 그리드 기본 필터(깔때기)를 켠다
		case "filter":
			if (vnHeaderIdx < 0) return;
			grd.header.getColumn(vnHeaderIdx).filterable = true;
			break;
		// 필터 해제 — 그 열의 필터와 깔때기를 없앤다
		case "filterClear":
			if (vnHeaderIdx < 0) return;
			grd.header.getColumn(vnHeaderIdx).clearFilter();
			grd.header.getColumn(vnHeaderIdx).filterable = false;
			break;
		// 전체 필터 해제
		case "allFilterClear":
			grd.header.clearFilter();
			for (var i = 0; i < grd.header.cellCount; i++) {
				grd.header.getColumn(i).filterable = false;
			}
			break;
		// 세로 틀고정 — 우클릭한 열까지 고정
		case "fixcol":
			if (vnHeaderIdx < 0) return;
			grd.setLeftSplitCellIndex(vnHeaderIdx);
			// 다중 헤더는 헤더 셀 인덱스(cellIndex)와 열 위치(colIndex)가 달라 열 위치로 너비를 계산한다
			if (grd.header.getRowHeights().length > 1) {
				var voHeaderCol = grd.header.getColumn(vnHeaderIdx);
				grd.leftSplitWidth = getCtxLeftWidth(grd, voHeaderCol.colIndex + voHeaderCol.colSpan - 1);
			} else {
				grd.leftSplitWidth = getCtxLeftWidth(grd, vnHeaderIdx);
			}
			break;
		case "fixcolClear":
			grd.leftSplit = 0;
			grd.leftSplitWidth = 0;
			break;
		// 가로 틀고정 — 우클릭한 행까지 고정 (헤더에서는 동작 없음)
		case "fixrow":
			if (poTarget.rowIndex < 0) return;
			grd.topSplit = poTarget.rowIndex + 1;
			grd.topSplitHeight = (poTarget.rowIndex + 1) * grd.detail.getRowHeight(0);
			break;
		case "fixrowClear":
			grd.topSplit = 0;
			grd.topSplitHeight = 0;
			break;
		// 블록 선택(해제) — 우클릭한 열의 모든 행 칸을 선택에 더한다(뺀다)
		case "selectBlock":
		case "deselectBlock":
			setCtxBlockColumn(grd, poTarget, psAction == "selectBlock");
			break;
		// 찾기
		case "find":
			openGridFinder(grd);
			break;
		// 정렬 일괄취소
		case "allSortingClear":
			grd.header.clearSort();
			break;
	}
}

/**
 * 우클릭한 열의 모든 행 칸을 칸 선택에 더하거나 뺀다. 기준은 메뉴를 띄우기 직전의 선택(poTarget.prevCells)이다.
 * selectionUnit="cell" 인 그리드에서만 동작한다.
 * @param {cpr.controls.Grid} grd
 * @param {{columnName: String, prevCells: Array}} poTarget 우클릭한 칸
 * @param {Boolean} pbSelect true 면 더하고, false 면 뺀다
 */
function setCtxBlockColumn(grd, poTarget, pbSelect) {
	if (!poTarget.columnName || grd.selectionUnit != "cell") {
		return;
	}
	var vaCellIdx = [];
	for (var i = 0; i < grd.detail.cellCount; i++) {
		if (grd.detail.getColumn(i).columnName == poTarget.columnName) {
			vaCellIdx.push(i);
		}
	}
	// 앞서 고른 블록 = 이전 선택 중 모든 행이 선택된 열. 그 밖의 칸(우클릭 전에 선택돼 있던 칸 하나 등)은 버린다
	var vnRowCount = grd.getRowCount();
	var voColCount = {};
	(poTarget.prevCells || []).forEach(function(poPos) {
		voColCount[poPos.cellIndex] = (voColCount[poPos.cellIndex] || 0) + 1;
	});
	var vaCells = (poTarget.prevCells || []).filter(function(poPos) {
		return vaCellIdx.indexOf(poPos.cellIndex) < 0 && voColCount[poPos.cellIndex] >= vnRowCount;
	});
	if (pbSelect) {
		vaCellIdx.forEach(function(pnCell) {
			for (var r = 0; r < vnRowCount; r++) {
				vaCells.push({ rowIndex: r, cellIndex: pnCell });
			}
		});
	}
	if (vaCells.length > 0) {
		grd.selectCells(vaCells);
	} else {
		grd.clearSelection();
	}
}

/**
 * 찾기 팝업을 모달 없이 연다. 이미 열려 있으면 그 팝업을 앞으로 가져온다.
 * @param {cpr.controls.Grid} grd
 */
function openGridFinder(grd) {
	var voGridApp = grd.getAppInstance();
	if (util.Dialog.isOpend(voGridApp, GRID_FINDER_APP_ID, true, true)) {
		return;
	}
	util.Dialog.open(voGridApp, GRID_FINDER_APP_ID, 400, -1, function(dialog) {}, {
		targetGrid: grd
	}, {
		modal: false
	});
}

/**
 * 그리드 contextmenu 이벤트. 브라우저 기본 메뉴를 막고, 데이터 칸이면 그 칸을 선택한 뒤 메뉴를 띄운다.
 * @param {cpr.events.CMouseEvent} e
 */
function onCtrlGridContextmenu(e) {
	e.preventDefault();
	/** @type cpr.controls.Grid */
	var vcGrid = e.control;
	/** @type {{rowIndex: Number, cellIndex: Number}} */
	var voObj = e.targetObject || {};
	var vnRowIndex = typeof voObj.rowIndex == "number" ? voObj.rowIndex : -1;
	var vnCellIndex = typeof voObj.cellIndex == "number" ? voObj.cellIndex : -1;
	var vsColumnName = null;
	// 메뉴를 띄우기 전의 칸 선택 — [블록 선택]·[블록 선택 해제]가 이 선택에 열을 더하고 뺀다
	var vaPrevCells = (vcGrid.selectionUnit == "cell" && vcGrid.getSelectedCellIndices()) || [];
	if (vnCellIndex >= 0) {
		if (vnRowIndex >= 0) {
			var voDetail = vcGrid.detail.getColumn(vnCellIndex);
			vsColumnName = voDetail ? voDetail.columnName : null;
			// 우클릭한 칸이 이미 선택 안에 있으면 선택을 그대로 둔다(엑셀과 같음). 아니면 그 칸을 선택한다(찾기 시작 위치)
			var vbInSelection = vaPrevCells.some(function(poPos) {
				return poPos.rowIndex == vnRowIndex && poPos.cellIndex == vnCellIndex;
			});
			if (vsColumnName && !vbInSelection) {
				vcGrid.selectCells([{ rowIndex: vnRowIndex, cellIndex: vnCellIndex }]);
				vcGrid.focusCell(vnRowIndex, vnCellIndex);
			}
		} else {
			var voHeader = vcGrid.header.getColumn(vnCellIndex);
			vsColumnName = voHeader ? voHeader.targetColumnName : null;
		}
	}
	showGridCtxMenu(vcGrid, e, { rowIndex: vnRowIndex, columnName: vsColumnName, prevCells: vaPrevCells });
}


/************************************************
 * 이벤트 핸들러
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad( /* cpr.events.CEvent */ e) {
	var vcCtrl = app.getAppProperty("ctrl");
	if (vcCtrl) {
		
		if (app.getAppProperty("showTitle")) {
			var vsTitle = app.getAppProperty("title");
			var vsFieldLabel = vcCtrl.fieldLabel;
			
			if (ValueUtil.isNull(vsTitle) || "No Title" == vsTitle) {
				if (ValueUtil.isNull(vsFieldLabel)) {
					app.lookup("optTitle").value = "No Title";
				} else {
					app.lookup("optTitle").value = vsFieldLabel;
				}
				
			} else {
				app.lookup("optTitle").value = vsTitle;
			}
		} else {
			app.lookup("optTitle").value = "";
		}
		
		if (vcCtrl.type == "grid") {
			if (vcCtrl.dataSet) {
				app.setAppProperty("rowCount", vcCtrl.dataSet.getRowCount());
			} else {
				app.setAppProperty("rowCount", "0");
			}

			// 그리드 우클릭 메뉴 (useGridCtxMenu, 기본 true)
			var vbUseCtxMenu = app.getAppProperty("useGridCtxMenu");
			if (vbUseCtxMenu !== false && vbUseCtxMenu !== "false") {
				vcCtrl.addEventListener("contextmenu", onCtrlGridContextmenu);
			}

			// 피벗 결과 그리드에서는 피벗 버튼 숨김
			if (vcCtrl.getAppInstance().app.id == PIVOT_UDC_APP_ID) {
				app.lookup("btnPivot").visible = false;
			}

			/** @type cpr.data.DataSet */
			var vcTargetDs = vcCtrl.dataSet;
			
			if(vcTargetDs === null || vcTargetDs === undefined) {
				return;
			}
			vcTargetDs.addEventListener("load", function(ev){
				app.setAppProperty("rowCount",ev.control.getRowCount());
			});
			vcTargetDs.addEventListener("insert", function(ev){
				app.setAppProperty("rowCount",ev.control.getRowCount());
			});
			vcTargetDs.addEventListener("delete", function(ev){
				app.setAppProperty("rowCount",ev.control.getRowCount());
			});
			vcTargetDs.addEventListener("clear", function(ev){
				app.setAppProperty("rowCount",ev.control.getRowCount());
			});
		}
	} else {
		app.lookup("btn1").visible = false;
		app.lookup("btn2").visible = false;
	}
	
	// 다운로드 권한이 없으면... 엑셀버튼 숨김
//	if (util.Main.getMenuInfo(app, "DOWNLD_YN") !== "Y") {
//		app.setAppProperty("showExportExcel", false);
//	}
	
	// 모바일 화면이면... 엑셀버튼 숨김
//	var mainApp = util.getMainApp(app);
//	if(mainApp){
//		if(mainApp.getContainer().userAttr("adaptive-screen") === "true"){
//			app.setAppProperty("showExportExcel", false);
//			app.lookup("btnExcelExport").visible = false;
//		}
//	}
}

/*
 * Body에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange( /* cpr.events.CPropertyChangeEvent */ e) {
	if (e.property == "rowCount") {
		app.lookup("optRowCount").redraw();
	} else if (e.property == "showExportExcel") {
		if(e.newValue){
			app.lookup("btnExcelExport").visible = true;
		} else {
			app.lookup("btnExcelExport").visible = false;
		}
	} else if (e.property == "title") {
		app.lookup("optTitle").value = e.newValue;
	} else if(e.property == "showOption"){
		if(e.newValue){
			app.lookup("btnTools").visible = true;
		}else {
			app.lookup("btnTools").visible = false;
		}
	} else if(e.property == 'typeClass') {
		var vsTitleType = app.getAppProperty("typeClass");
		var vcOptTit = app.lookup("optTitle");
		
		if(vsTitleType == "sub") {
			vcOptTit.style.removeClass("tit");
			vcOptTit.style.addClass("sub-tit");
		}
	}
}


/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 호출되는 이벤트.
 */
function onBodyScreenChange(e) {
}

/**
 * 데이터 컬럼의 헤더 텍스트를 찾는다. targetColumnName 이 같은 헤더 → 같은 열 위치의 헤더 순으로 본다.
 * 헤더 줄바꿈("판매\r\n구분")은 한 줄로 바꾼다.
 * @param {cpr.controls.Grid} grd
 * @param {cpr.controls.gridpart.GridDetailColumn} poDetail
 * @return {String} 없으면 빈 문자열
 */
function getPivotHeaderText(grd, poDetail) {
	var vsText = "";
	var vsByColIndex = "";
	for (var i = 0; i < grd.header.cellCount; i++) {
		var voHeader = grd.header.getColumn(i);
		if (!voHeader.text) continue;
		if (voHeader.targetColumnName == poDetail.columnName) {
			vsText = voHeader.text;
			break;
		}
		if (!vsByColIndex && voHeader.colIndex == poDetail.colIndex && voHeader.colSpan == poDetail.colSpan) {
			vsByColIndex = voHeader.text;
		}
	}
	return String(vsText || vsByColIndex).replace(/\s+/g, " ").trim();
}

/**
 * 피벗 팝업에 넘길 데이터를 만든다. 그리드 객체 대신 이 데이터를 넘겨 다이얼로그·윈도우 팝업이 같은 방식으로 받는다.
 *   - 컬럼 : 그리드 디테일에 매핑된 데이터 컬럼 (특수 컬럼·중복 제외, 그리드 순서), 이름은 헤더 텍스트
 *   - 행   : 그리드 필터가 없으면 데이터셋 전체를 한 번에, 필터로 줄어 있으면 그리드에 보이는 행만
 * @param {cpr.controls.Grid} grid
 * @return {{title: String, columns: {name: String, dataType: String, info: String}[], rows: Object[]}}
 */
function buildPivotPayload(grid) {
	/** @type cpr.data.DataSet */
	var vcSrcDs = grid.dataSet;
	var vaColumns = [];
	var vaNames = [];
	for (var i = 0; i < grid.detail.cellCount; i++) {
		var voDetail = grid.detail.getColumn(i);
		var vsName = voDetail.columnName;
		if (!vsName || voDetail.columnType == "checkbox" || voDetail.columnType == "rowindex" || voDetail.columnType == "radio") continue;
		if (vaNames.indexOf(vsName) > -1) continue;
		var voSrcHeader = vcSrcDs.getHeader(vsName);
		if (!voSrcHeader) continue;
		vaNames.push(vsName);
		vaColumns.push({
			name: vsName,
			dataType: voSrcHeader.getDataType(),
			info: getPivotHeaderText(grid, voDetail) || String(voSrcHeader.getInfo() || vsName).replace(/\s+/g, " ").trim()
		});
	}

	// 피벗에는 최대 PIVOT_MAX_ROWS 건만 넘긴다.
	var vnGridRowCount = Math.min(grid.getRowCount(), PIVOT_MAX_ROWS);
	var vaSrcRows;
	if (vnGridRowCount == vcSrcDs.getRowCount()) {
		vaSrcRows = vcSrcDs.getRowDataRanged();
	} else {
		vaSrcRows = new Array(vnGridRowCount);
		for (var r = 0; r < vnGridRowCount; r++) {
			vaSrcRows[r] = grid.getRow(r).getRowData();
		}
	}
	var vnColLen = vaNames.length;
	var vaRows = new Array(vaSrcRows.length);
	for (var ri = 0; ri < vaSrcRows.length; ri++) {
		var voSrc = vaSrcRows[ri];
		var voRow = {};
		for (var ci = 0; ci < vnColLen; ci++) {
			voRow[vaNames[ci]] = voSrc[vaNames[ci]];
		}
		vaRows[ri] = voRow;
	}

	var vsTitle = app.lookup("optTitle").value;
	return {
		title: "피벗" + (ValueUtil.isNull(vsTitle) || vsTitle == "No Title" ? "" : " - " + vsTitle),
		columns: vaColumns,
		rows: vaRows
	};
}

/**
 * 피벗을 다이얼로그(화면 안 팝업)로 연다.
 * @param {cpr.controls.Grid} grid
 */
function openPivotDialog(grid) {
	var voPayload = buildPivotPayload(grid);
	util.Dialog.open(grid.getAppInstance(), GRID_PIVOT_APP_ID, 1200, 760, function(dialog) {}, {
		pivotData: voPayload
	}, {
		modal: false,
		headerTitle: voPayload.title,
		dialogName: grid.getAppInstance().id + "_" + grid.id + "_pivot"
	});
}

/**
 * 피벗을 브라우저 윈도우 팝업(새 창)으로 연다.
 * 새 창에는 객체를 넘길 수 없어 이 창(window.__gridPivotData)에 데이터를 두고 키를 주소로 넘긴다.
 * 새 창은 window.opener 에서 키로 데이터를 읽은 뒤 지운다. (app/com/comPGridPivot.js)
 * @param {cpr.controls.Grid} grid
 */
function openPivotWindow(grid) {
	var vsKey = "pivot" + new Date().getTime();
	window.__gridPivotData = window.__gridPivotData || {};
	window.__gridPivotData[vsKey] = buildPivotPayload(grid);

	var vnWidth = Math.min(1400, window.screen.availWidth);
	var vnHeight = Math.min(860, window.screen.availHeight);
	var vnLeft = Math.max(0, (window.screen.availWidth - vnWidth) / 2);
	var vnTop = Math.max(0, (window.screen.availHeight - vnHeight) / 2);
	var voWindow = window.open(POPUP_HTML + "?appId=" + encodeURIComponent(GRID_PIVOT_APP_ID) + "&pivotKey=" + vsKey, vsKey,
		"menubar=0,resizable=yes,scrollbars=yes,status=0,top=" + vnTop + ",left=" + vnLeft + ",width=" + vnWidth + ",height=" + vnHeight);
	if (!voWindow) {
		delete window.__gridPivotData[vsKey];
		util.Msg.notify(app, "팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제해 주세요.");
	}
}

/*
 * 버튼(btnPivot)에서 click 이벤트 발생 시 호출.
 * 컨텍스트 메뉴로 [윈도우 팝업]·[다이얼로그] 중 여는 방식을 고른다.
 */
function onBtnPivotClick( /* cpr.events.CMouseEvent */ e) {
	if(!isGridCtrl()) return false;

	/** @type cpr.controls.Grid */
	var grid = app.getAppProperty("ctrl");
	if (!grid.dataSet || grid.getRowCount() < 1) {
		util.Msg.notify(app, "피벗할 데이터가 존재하지 않습니다.");
		return;
	}

	var ctxMenu = new cpr.controls.Menu("ctxPivotMenu");
	ctxMenu.addItem(new cpr.controls.MenuItem("피벗(새창)", "window", "root"));
	ctxMenu.addItem(new cpr.controls.MenuItem("피벗(다이얼로그)", "dialog", "root"));

	ctxMenu.addEventListener("item-click", function( /**@type cpr.events.CItemEvent */ ev) {
		var vsValue = ev.item.value;
		ctxMenu.blur();
		var fnOpen = function() {
			if (vsValue == "window") {
				openPivotWindow(grid);
			} else {
				openPivotDialog(grid);
			}
		};
		if (grid.getRowCount() > PIVOT_MAX_ROWS) {
			util.Msg.alertDlg(app, "원활한 데이터 확인을 위해 10만 건 이하의 데이터만 조회 가능합니다.", null, {
			});
			return;
		} else {
			fnOpen();
		}
	});
	ctxMenu.addEventListenerOnce("blur", function( /**@type cpr.events.CFocusEvent*/ ev) {
		ev.control.dispose();
	});

	/**@type cpr.controls.Container */
	var rootContainer = null;
	var showConstraint = {
		"position": "absolute",
		"width": "auto",
		"height": "auto"
	};
	
	var zoom = cpr.core.Platform.INSTANCE.getZoom();
	var topY = (e.clientY / zoom);
	var leftX = (e.clientX / zoom);
	if (util.Dialog.isDialogPopup(grid.getAppInstance())) {
		rootContainer = grid.getAppInstance().getContainer();
		showConstraint.top = (topY - rootContainer.getActualRect().top) + "px";
		showConstraint.left = (leftX - rootContainer.getActualRect().left) + "px";
	} else {
		rootContainer = grid.getAppInstance().getRootAppInstance().getContainer();
		showConstraint.top = (topY + document.documentElement.scrollTop) + "px";
		showConstraint.left = leftX + "px";
	}

	var layout = rootContainer.getLayout();
	if (layout instanceof cpr.controls.layouts.FormLayout ||
		layout instanceof cpr.controls.layouts.VerticalLayout) {
		rootContainer.floatControl(ctxMenu, showConstraint);
	} else {
		rootContainer.addChild(ctxMenu, showConstraint);
	}
	ctxMenu.focus();
}

/*
 * 버튼(btnTools)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnToolsClick( /* cpr.events.CMouseEvent */ e) {
	if(!isGridCtrl()) return false;
	
	/**@type cpr.controls.Grid */
	var grid = app.getAppProperty("ctrl");
	
	var vsGridKey = grid.getAppInstance().id + grid.id;
	
	var ctxMenu = new cpr.controls.Menu("ctx_menu");
	ctxMenu.addItem(new cpr.controls.TreeItem("정렬", "sort", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("정렬 표시", "sortable", "sort"));
	ctxMenu.addItem(new cpr.controls.TreeItem("정렬 초기화", "sortInit", "sort"));
	ctxMenu.addItem(new cpr.controls.TreeItem("정렬 취소", "sortCancel", "sort"));
	ctxMenu.addItem(new cpr.controls.TreeItem("필터", "filter", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("필터 표시", "filterable", "filter"));
	ctxMenu.addItem(new cpr.controls.TreeItem("필터 초기화", "filterInit", "filter"));
	ctxMenu.addItem(new cpr.controls.TreeItem("필터 취소", "filterCancel", "filter"));
	ctxMenu.addItem(new cpr.controls.MenuItem("개인화", "personalized", "root"));
//	ctxMenu.addItem(new cpr.controls.MenuItem("빠른 검색", "quickSearch", "root"));
	ctxMenu.addItem(new cpr.controls.MenuItem("초기화", "initial", "root"));
//	ctxMenu.addItem(new cpr.controls.MenuItem("인쇄", "print", "root"));
	
	// 인쇄시 그리드에 선택된 행이 존재할 경우 컨트롤 영역이 보여져 그리드 선택 clear 후 재 선택되도록 수정 (2021.07.29 추가)
	var vaGrdSelectIdx = grid.getSelectedIndices();
	ctxMenu.addEventListener("before-selection-change", function(e) {
		vaGrdSelectIdx = grid.getSelectedIndices();
		grid.clearSelection();
	});
	
	// 인쇄시 그리드에 선택된 행이 존재할 경우 컨트롤 영역이 보여져 그리드 선택 clear 후 재 선택되도록 수정 (2021.07.29 추가)
	ctxMenu.addEventListener("dispose", function(e) {
		grid.selectRows(vaGrdSelectIdx);
	});
	
	ctxMenu.addEventListener("item-click", function( /**@type cpr.events.CItemEvent */ e) {
		var itemValue = e.item.value;
		
		if (itemValue == "sort" || itemValue == "filter") {
			//정렬, 필터 선택시 컨텍스트 메뉴가 닫히지 않음
			ctxMenu.selectItem(ctxMenu.selectItemByValue(itemValue));
			return;
			
			//정렬 표시
		} else if (itemValue == "sortable") {
			for (var i = 0, len = grid.header.cellCount; i < len; i++) {
				grid.header.getColumn(i).sortable = true;
			}
			
			//정렬 초기화
		} else if (itemValue == "sortInit") {
			if (grid) grid.header.clearSort();
			//정렬 취소
		} else if (itemValue == "sortCancel") {
			if (grid) grid.header.clearSort();
			for (var i = 0, len = grid.header.cellCount; i < len; i++) {
				grid.header.getColumn(i).sortable = false;
			}
			//필터 보여주기
		} else if (itemValue == "filterable") {
			var isHFiltered = false;
			var column, filterStr;
			for (var i = 0, len = grid.header.cellCount; i < len; i++) {
				column = grid.header.getColumn(i);
				filterStr = column.getFilter();
				if (filterStr != null && filterStr[0] != "__all__") {
					isHFiltered = true;
					break;
				}
			}
			if (!isHFiltered) {
				var hTRowIndex = app.getAppProperty("headerRowIndex");
				for (var i = 0, len = grid.header.cellCount; i < len; i++) {
					column = grid.header.getColumn(i);
					if (hTRowIndex > -1) {
						if ((column.rowIndex + column.rowSpan) == (hTRowIndex + 1) && column.targetColumnName != "") {
							column.filterable = true;
						}
					} else {
						if (column.targetColumnName != "") {
							column.filterable = true;
						}
					}
				}
			}
			//필터 초기화
		} else if (itemValue == "filterInit") {
			if (grid) grid.header.clearFilter();
			//필터 해제 및 필터 숨김 (필터 취소)
		} else if (itemValue == "filterCancel") {
			if (grid) {
				grid.header.clearFilter();
				for (var i = 0, len = grid.header.cellCount; i < len; i++) {
					grid.header.getColumn(i).filterable = false;
				}
			}
			//인쇄
		} else if (itemValue == "print") {
			
			sessionStorage.setItem("print-content", getHTMLToGrid([grid], {
				title: grid.fieldLabel,
			}));
			
			var windowWidth = (window.innerWidth | document.body.clientWidth) - 500;
			var windowHeight = (window.innerHeight | document.body.clientHeight) - 300;
			var width = windowWidth > 600 ? windowWidth : 600;
			var height = windowHeight > 400 ? windowHeight : 400;
			var popWindow = window.open('app/com/inc/print.html', "print", 'left=100,top=100, resizable=yes, height=' + height + ',width=' + width);
		
		// 그리드 개인화 설정(컬럼설정, 틀고정)
		} else if (itemValue == "personalized") {
			util.Dialog.open(app, "app/com/comPGridSetting", 800, -1, function(dialog) {
				
			}, {
				targetGrid: grid
			}, {
				modal: false
			});
			
			// 그리드 개인화 초기화
		} else if (itemValue == "initial") {
			localStorage.setItem(vsGridKey, null);
			grid.resetGrid();
			
			util.Grid.init(grid.getAppInstance(), grid.id);
			//소트/필터 컬럼 자동지정
//			var dColumn, hColumn, vaHColumns;
//			for (var j = 0, jlen = grid.detail.cellCount; j < jlen; j++) {
//				dColumn = grid.detail.getColumn(j);
//				if (dColumn.columnType == "checkbox" || dColumn.columnType == "rowindex" || dColumn.columnType == "radio") continue;
//				if (dColumn.columnName == null || dColumn.columnName == "") continue;
//				vaHColumns = grid.header.getColumnByColIndex(dColumn.colIndex, dColumn.colSpan);
//				if (vaHColumns) {
//					vaHColumns.forEach(function( /* cpr.controls.gridpart.GridHeaderColumn */ column) {
//						column.sortable = true;
//						column.filterable = true;
//						if (column.targetColumnName == null || column.targetColumnName == "") {
//							column.targetColumnName = dColumn.columnName;
//						}
//					});
//				}
//			}
			
			util.Msg.notify(app, "그리드가 초기화 되었습니다.");
			
		} else if (itemValue == "quickSearch" ) {
			util.Control.setVisible(app, true, "grpSearch")
		}
		
		ctxMenu.blur();
	});
	
	ctxMenu.addEventListenerOnce("blur", function( /**@type cpr.events.CFocusEvent*/ e) {
		// 인쇄시 그리드에 선택된 행이 존재할 경우, 컨트롤 영역이 보여져 그리드 선택 clear 후 재 선택되도록 수정 (2021.07.29 추가)
		grid.selectRows(vaGrdSelectIdx);
		e.control.dispose();
	});
	
	/**@type cpr.controls.Container */
	var rootContainer = null;
	var showConstraint = {
		"position": "absolute",
		"width": "auto",
		"height": "auto"
	};
	
	var zoom = cpr.core.Platform.INSTANCE.getZoom();
	var topY = (e.clientY / zoom);
	var leftX = (e.clientX / zoom);
	if (util.Dialog.isDialogPopup(grid.getAppInstance())) {
		rootContainer = grid.getAppInstance().getContainer();
		
		if ((topY - rootContainer.getActualRect().top + 130) > rootContainer.getActualRect().height)
			showConstraint.top = (topY - rootContainer.getActualRect().top - 130) + "px";
		else
			showConstraint.top = (topY - rootContainer.getActualRect().top) + "px";
		
		showConstraint.left = (leftX - (rootContainer.getActualRect().left + 130)) + "px";
	} else {
		rootContainer = grid.getAppInstance().getRootAppInstance().getContainer();
		// 스크롤 이동 후 컨텍스트 메뉴를 띄운 경우 클릭된 위치에 스크롤 이동량 추가
		showConstraint.top = (topY + e.view.scrollY) + "px";
		showConstraint.left = (leftX) + "px";
		
	}
	
	var layout = rootContainer.getLayout();
	if (layout instanceof cpr.controls.layouts.FormLayout ||
		layout instanceof cpr.controls.layouts.VerticalLayout) {
		rootContainer.floatControl(ctxMenu, showConstraint);
	} else {
		rootContainer.addChild(ctxMenu, showConstraint);
	}
	
	ctxMenu.focus();
}

/*
 * "엑셀출력" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnExcelExportClick( /* cpr.events.CMouseEvent */ e) {
	if(!isGridCtrl()) return false;
	
	/** @type cpr.controls.Grid*/
	var vcCtrl = app.getAppProperty("ctrl");
	var vnRowCnt = vcCtrl.getRowCount();
	var vsExportType = app.getAppProperty("exportType");
	var vsExportMassiveType = app.getAppProperty("exportMassiveType");
	var vsApplyStyle = app.getAppProperty("applyExcelStyle"); // all : 전체 스타일 /true : 헤더 스타일 /false : 스타일 적용 X
	if(vsApplyStyle == "false"){
		vsApplyStyle = false
	}else if(vsApplyStyle == "true"){
		vsApplyStyle = true
	}
	
	if (vnRowCnt < 1) {		
		if (util.getMainApp(app).app.id == AppProperties.MAIN_APP_ID) {
			util.Msg.notify(app, "출력할 데이터가 존재하지 않습니다.");
		} else {
			util.Msg.alertDlg(app, "출력할 데이터가 존재하지 않습니다.");
		}		
		return;
	}
	
	var exportTitle = !ValueUtil.isNull(app.getAppProperty("exportExcelTitle")) ? app.getAppProperty("exportExcelTitle") : app.lookup("optTitle").value;
	var _app = vcCtrl.getAppInstance();
	
	// 엑셀 export 옵션
	var voOptions = {
		// 숨긴 컬럼 제외여부
		isExcludeHideColumn: !app.getAppProperty("exportHiddenColumn"),
		// 추가적으로 제외할 컬럼
		excludeColumns: app.getAppProperty("exportExcludeColumns"),
		// 제외할 영역  ex.header, gfooter
		excludePart: app.getAppProperty("exportExcludePart"),
		// 포맷 적용 여부
		applyFormat: app.getAppProperty("exportApplyFormat"),
		// 동적 병합 적용 여부
		applySuppress: app.getAppProperty("exportApplySuppress"),
		// rowindex 특수컬럼 export 여부
		showRowIndex: app.getAppProperty("exportshowRowIndex"),
		// 클래스 스타일 적용 여부
		applyClassStyle: app.getAppProperty("exportApplyClassStyle"),
		// 엑셀 포맷 기능 사용 여부
		useFormat: app.getAppProperty("exportUseFormat"),
		showInfoText : app.getAppProperty("showInfoText"),
		infoText : app.getAppProperty("infoText"),
		applyStyle : vsApplyStyle
	};
	/* EXCEL - 클라이언트 방식 */
	if (vsExportType == "client") {
		loadClientExcel(exportTitle, vcCtrl, voOptions);
		// 미리보기일 경우 클라이언트 방식
	} else if (window.eb6Preview) {
		// 미리보기 화면입니다.\n 서버가 아닌 클라이언트 방식으로 엑셀이 다운로드됩니다.
		util.Msg.alertDlg(app, "INF-M024", null, {
			confirmCallback: function() {
				loadClientExcel(exportTitle, vcCtrl, voOptions);
			}
		});
		
	/* EXCEL - 서버 방식 (대량엑셀다운) */
	} else {
		if (vsExportMassiveType == "standard") {
			util.Grid.exportData(_app, vcCtrl.id, exportTitle, null, voOptions);	
		}else{
			// udcPocGridTitle 기능의 컨텍스트 메뉴 추가 (2026.06.29)
			if (!app.getAppProperty("showCtxMenu"))
				util.Grid.exportMassiveData(_app, vcCtrl.id, exportTitle, voOptions);
			else {
				// 컨텍스트 메뉴 만들어서 체크
				//만약 대용량 엑셀 export인 경우에는 컨텍스트 메뉴를 통해서 fetch형태로 할것인지 서버에서 직접 export할것인지 선택			
				var ctxMenu = new cpr.controls.Menu();
				if (vcCtrl.dataSet.type == "dataset") {
					ctxMenu.addItem(new cpr.controls.MenuItem("서버 Export", "fetchExport", "root"));
					ctxMenu.addItem(new cpr.controls.MenuItem("클라이언트 Export", "clientExport", "root"));
					ctxMenu.addItem(new cpr.controls.MenuItem("조회 결과 기준 Export", "serverExport", "root"));
					ctxMenu.addItem(new cpr.controls.MenuItem("CSV Export", "CSVExport", "root"));
				}
				ctxMenu.setFilter("\""+app.getAppProperty("filterCtxMenu")+"\".indexOf(value) > -1");
				
				// 인쇄시 그리드에 선택된 행이 존재할 경우 컨트롤 영역이 보여져 그리드 선택 clear 후 재 선택되도록 수정 (2021.07.29 추가)
				var vaGrdSelectIdx = vcCtrl.getSelectedIndices();
				ctxMenu.addEventListener("before-selection-change", function(e) {
					vaGrdSelectIdx = vcCtrl.getSelectedIndices();
					vcCtrl.clearSelection();
				});
				
				// 인쇄시 그리드에 선택된 행이 존재할 경우 컨트롤 영역이 보여져 그리드 선택 clear 후 재 선택되도록 수정 (2021.07.29 추가)
				ctxMenu.addEventListener("dispose", function(e) {
					vcCtrl.selectRows(vaGrdSelectIdx);
				});
				
				ctxMenu.addEventListener("item-click", function( /**@type cpr.events.CItemEvent */ e) {
					var itemValue = e.item.value;
					
					if (vnRowCnt < 1) {
						if (util.getMainApp(app).app.id == AppProperties.MAIN_APP_ID) {
							util.Msg.notify(app, "출력할 데이터가 존재하지 않습니다.");
						} else {
							util.Msg.alertDlg(app, "출력할 데이터가 존재하지 않습니다.");
						}
						return;
					}
					
					if (itemValue == "fetchExport") {
		//						util.Grid.exportMassiveData(_app, vcCtrl.id, exportTitle, voOptions);
						var exportEvent = new cpr.events.CUIEvent("fetch-export");
						exportEvent.userData = voOptions;
						app.dispatchEvent(exportEvent);
					} else if (itemValue == "serverExport") {
						var exportEvent = new cpr.events.CUIEvent("server-export");
						app.dispatchEvent(exportEvent);
					} else if (itemValue == "CSVExport"){
						var exportEvent = new cpr.events.CUIEvent("csv-export");
						app.dispatchEvent(exportEvent);
					} else if (itemValue == "clientExport"){
						if (app.getAppProperty("useBulkExcel")) {
							bulkExcelExportClient(vcCtrl, exportTitle + ".xlsx");
						} else {
							loadClientExcel(exportTitle, vcCtrl, voOptions);
						}
						var clientExport = new cpr.events.CUIEvent("client-export");
						app.dispatchEvent(clientExport);
					} else {
						util.Grid.exportData(_app, vcCtrl.id, exportTitle, null, voOptions);
					}
					
					ctxMenu.blur();
				});
				
				ctxMenu.addEventListenerOnce("blur", function( /**@type cpr.events.CFocusEvent*/ e) {
					// 인쇄시 그리드에 선택된 행이 존재할 경우, 컨트롤 영역이 보여져 그리드 선택 clear 후 재 선택되도록 수정 (2021.07.29 추가)
					vcCtrl.selectRows(vaGrdSelectIdx);
					e.control.dispose();
				});
				
				/**@type cpr.controls.Container */
				var rootContainer = null;
				var showConstraint = {
					"position": "absolute",
					"width": "auto",
					"height": "auto"
				};
				
				var zoom = cpr.core.Platform.INSTANCE.getZoom();
				var topY = (e.clientY / zoom);
				var leftX = (e.clientX / zoom);
				if (util.Dialog.isDialogPopup(vcCtrl.getAppInstance())) {
					rootContainer = vcCtrl.getAppInstance().getContainer();
					
					if ((topY - rootContainer.getActualRect().top + 130) > rootContainer.getActualRect().height)
						showConstraint.top = (topY - rootContainer.getActualRect().top - 130) + "px";
					else
						showConstraint.top = (topY - rootContainer.getActualRect().top) + "px";
					
					showConstraint.left = (leftX - (rootContainer.getActualRect().left + 130)) + "px";
				} else {
					rootContainer = vcCtrl.getAppInstance().getRootAppInstance().getContainer();
					// 스크롤 이동 후 컨텍스트 메뉴를 띄운 경우 클릭된 위치에 스크롤 이동량 추가
					showConstraint.top = (topY + e.view.scrollY) + "px";
					if (leftX < 130) {
						showConstraint.left = "0px";
					} else {
						showConstraint.left = (leftX) + "px";
					}
				}
				
				var layout = rootContainer.getLayout();
				if (layout instanceof cpr.controls.layouts.FormLayout ||
					layout instanceof cpr.controls.layouts.VerticalLayout) {
					rootContainer.floatControl(ctxMenu, showConstraint);
				} else {
					rootContainer.addChild(ctxMenu, showConstraint);
				}
				ctxMenu.focus();
			}

		}
	}
}

/**
 * 대량엑셀다운 시작/종료 이벤트(bulk-export-start, bulk-export-end)를 화면에 알린다.
 * @param {String} psEventName
 * @param {"server"|"client"} psType
 */
function dispatchBulkExportEvent(psEventName, psType) {
	var voEvent = new cpr.events.CUIEvent(psEventName);
	voEvent.userData = {
		type: psType
	};
	app.dispatchEvent(voEvent);
}


/**
 * 대량엑셀다운(C) - 그리드를 클라이언트에서 엑셀(XLSX)로 내보낸다. i11120_grid_jeeeyul.module.js 의 exportGridToXLSX 를 쓴다.
 * 파일 저장 대화상자로 디스크에 바로 쓴다(Chrome, Edge).
 * @param {cpr.controls.Grid} pcGrid
 * @param {String} psFileName
 */
function bulkExcelExportClient(pcGrid, psFileName) {
	var _app = pcGrid.getAppInstance();
	

	var job = exportGridToXLSX(pcGrid, {
		fileName: psFileName,
		useFilePicker: true,
		onProgress: function(p) {
			util.showLoadMask(_app);
		}
	});
	job.start.then(function(input){
		dispatchBulkExportEvent("bulk-export-start", "client");
	});
	job.done.then(function(blob) {
		util.hideLoadMask(_app);
		dispatchBulkExportEvent("bulk-export-end", "client");
	}, function(error) {
		util.hideLoadMask(_app);
	});
}

/*
 * 버튼(btnPdfExport)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPdfExportClick(e){
	if(!isGridCtrl()) return false;
	
	/** @type cpr.controls.Grid*/
	var vcCtrl = app.getAppProperty("ctrl");
	var vnRowCnt = vcCtrl.getRowCount();
	var vsExportType = app.getAppProperty("exportType");
	
	if (vnRowCnt < 1) {		
		if (util.getMainApp(app).app.id == AppProperties.MAIN_APP_ID) {
			util.Msg.notify(app, "출력할 데이터가 존재하지 않습니다.");
		} else {
			util.Msg.alertDlg(app, "출력할 데이터가 존재하지 않습니다.");
		}		
		return;
	}
	
	var exportTitle = !ValueUtil.isNull(app.getAppProperty("exportExcelTitle")) ? app.getAppProperty("exportExcelTitle") : app.lookup("optTilte").value;
	var _app = vcCtrl.getAppInstance();
	
	// 엑셀 export 옵션
	var voOptions = {
		// 숨긴 컬럼 제외여부
		isExcludeHideColumn: !app.getAppProperty("exportHiddenColumn"),
		// 추가적으로 제외할 컬럼
		excludeColumns: app.getAppProperty("exportExcludeColumns"),
		// 제외할 영역  ex.header, gfooter
		excludePart: app.getAppProperty("exportExcludePart"),
		// 포맷 적용 여부
		applyFormat: app.getAppProperty("exportApplyFormat"),
		// 동적 병합 적용 여부
		applySuppress: app.getAppProperty("exportApplySuppress"),
		// rowindex 특수컬럼 export 여부
		showRowIndex: app.getAppProperty("exportshowRowIndex"),
		// 클래스 스타일 적용 여부
		applyClassStyle: app.getAppProperty("exportApplyClassStyle"),
		// 엑셀 포맷 기능 사용 여부
		useFormat: app.getAppProperty("exportUseFormat"),
		showInfoText : app.getAppProperty("showInfoText"),
		infoText : app.getAppProperty("infoText")
	};
	
	/* PDF - 서버 방식 */
	var pdfOption = voOptions;
	pdfOption.fileType = "pdf";
	pdfOption.sheetName = [exportTitle];
	util.Grid.exportData(_app, vcCtrl.id, exportTitle, {
		printPageOrientation: "landscape"
	}, pdfOption);
}

/*
 * "닫기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e) {
	var button = e.control;
	
	/** @type cpr.controls.Grid */
	var grid = app.getAppProperty("ctrl");
	for (var i = 0; i < grid.detail.cellCount; i++) {
		if (grid.detail.getControl(i) instanceof cpr.controls.Output) {
			
			/** @type cpr.controls.Output */
			var control = grid.detail.getControl(i);
			control.displayExp = "#" + app.getHost().id + ".callAppMethod(\"getHighlightedString\", text,'')"
		}
	}
	
	app.getAppProperty("ctrl").redraw();
	
	util.Control.setValue(app, "searchInput", "")
	util.Control.setVisible(app, false, "grpSearch")
}

/*
 * 서치 인풋에서 search 이벤트 발생 시 호출.
 * Searchinput의 enter키 또는 검색버튼을 클릭하여 인풋의 값이 Search될때 발생하는 이벤트
 */
function onSearchInputSearch(e) {
	var searchInput = e.control;
	/** @type cpr.controls.Grid */
	var grid = app.getAppProperty("ctrl");
	for (var i = 0; i < grid.detail.cellCount; i++) {
		if (grid.detail.getControl(i) instanceof cpr.controls.Output) {
			
			/** @type cpr.controls.Output */
			var control = grid.detail.getControl(i);
			control.displayExp = "#" + app.getHost().id + ".callAppMethod(\"getHighlightedString\", text,'"+ app.lookup("searchInput").displayingText +"')"
		}
	}
	
	app.getAppProperty("ctrl").redraw();
}

/**
 * 전체 문자열에서 특정 문자열에 스타일을 적용한 문자열을 반환합니다.
 * @param {String} fullText 전체 문자열
 * @param {String} keyword 스타일을 적용할 문자열
 * @return {cpr.ufc.StyledString} 스타일이 적용된 객체
 */
function getHighlightedString(fullText, keyword) {
	var result = new cpr.ufc.StyledString();
	
	// 찾을 텍스트가 없거나 빈 문자열이면 원본 그대로 반환
	if (!keyword || fullText.indexOf(keyword) === -1) {
		result.append(fullText);
		return result;
	}
	
	var startIdx = 0;
	var foundIdx;
	
	// label에서 text가 발견되는 동안 반복
	while ((foundIdx = fullText.indexOf(keyword, startIdx)) !== -1) {
		// 1. 일치하는 부분 앞의 일반 텍스트 추가
		if (foundIdx > startIdx) {
			result.append(fullText.substring(startIdx, foundIdx));
		}
		
		// 2. 일치하는 텍스트에 스타일 적용하여 추가
		result.append(keyword, {
			style: {
				color: "red",
				backgroundColor: "yellow",
  				fontWeight: "bold"
			}
		});
		
		// 3. 다음 검색 시작 위치 갱신
		startIdx = foundIdx + keyword.length;
	}
	
	// 4. 마지막 일치 이후 남은 텍스트 추가
	if (startIdx < fullText.length) {
		result.append(fullText.substring(startIdx));
	}
	return result;
}

// getHighlightedString 함수 출판(표현식에서 해당 함수 사용) 
exports.getHighlightedString = getHighlightedString;


/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 전파되는 이벤트.
 */
function onBodyScreenChange2(e) {
	var vsTargetScrnNm = app.targetScreen.name;
	if (AppProperties.SCREEN_MOBILE_NM.indexOf(vsTargetScrnNm) > -1) {
		util.Control.setVisible(app, false, "grpSearch")
	}
}

/*
 * "아래 컨트롤 토글" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e) {
	var button = e.control;
	var vcCtrl = findTargetCtrl();
	
	if(!ValueUtil.isNull(vcCtrl)) {
		vcCtrl.visible = !vcCtrl.visible;
		
		if (button.style.icon.hasClass("off")) {
			button.style.icon.removeClass("off");
		} else {
			button.style.icon.addClass("off");
		}
	}
}

/*
 * "아래 컨트롤 확대/축소" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e) {
	doPopoutView();
}
