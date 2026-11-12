/************************************************
 * comPGridPivot.js
 * @프로그램설명 : 그리드 피벗 팝업 (udcComGridTitle [피벗] 버튼 → 컨텍스트 메뉴 [윈도우 팝업]·[다이얼로그])
 *   - 넘겨받은 피벗 데이터(컬럼·행)를 dsPivotSrc 로 만든 뒤 udc/exam/udcExamPivotGrid 로 행·열·값을 끌어다 놓아 피벗한다.
 *   - 피벗 데이터 : {title: String, columns: {name, dataType, info}[], rows: Object[]} (udcComGridTitle.js buildPivotPayload)
 *   - 호출
 *       다이얼로그   : util.Dialog.open(그리드 화면 app, "app/com/comPGridPivot", …, {pivotData: 피벗 데이터})
 *       윈도우 팝업 : window.open("popup_exb6.html?appId=app/com/comPGridPivot&pivotKey=키") — 데이터는 부모 창 window.__gridPivotData[키]
 *
 * @작성일자 : 2026.10.16.
 * @작성자 : claude
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 파일내 로컬변수 선언
 ************************************************/
var util = createCommonUtil();

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술
 ************************************************/
/**
 * 피벗 데이터를 가져온다. 다이얼로그면 initValue, 윈도우 팝업이면 부모 창에서 키로 읽고 지운다.
 * @return {{title: String, columns: Array, rows: Array}}
 */
function getPivotData() {
	// 다이얼로그
	var voInit = null;
	try {
		voInit = app.getHostProperty("initValue");
	} catch (ex) {}
	if (voInit && voInit.pivotData) {
		return voInit.pivotData;
	}

	// 윈도우 팝업
	var vaMatch = /[?&]pivotKey=([^&]+)/.exec(location.search);
	if (!vaMatch || !window.opener) {
		return null;
	}
	var vsKey = decodeURIComponent(vaMatch[1]);
	var voStore = null;
	try {
		voStore = window.opener.__gridPivotData;
	} catch (ex) {}
	if (!voStore || !voStore[vsKey]) {
		return null;
	}
	var voData = voStore[vsKey];
	delete voStore[vsKey];
	if (voData.title) {
		document.title = String(voData.title); // 윈도우 팝업 창 제목
	}
	return voData;
}

/**
 * 피벗 데이터로 dsPivotSrc 를 채운다.
 * 윈도우 팝업이면 데이터가 부모 창 객체라 컬럼·행을 이 창의 객체로 다시 만들어 넣는다.
 * @param {{columns: Array, rows: Array}} poData
 */
function fillPivotSource(poData) {
	var vcDs = app.lookup("dsPivotSrc");
	var vaNames = [];
	for (var i = 0; i < poData.columns.length; i++) {
		var voCol = poData.columns[i];
		var voHeader = new cpr.data.header.DataHeader(String(voCol.name), String(voCol.dataType || "string"));
		voHeader.setInfo(String(voCol.info || voCol.name));
		vcDs.addColumn(voHeader);
		vaNames.push(String(voCol.name));
	}

	var vnColLen = vaNames.length;
	var vaSrcRows = poData.rows;
	var vnRowLen = vaSrcRows.length;
	var vaRows = new Array(vnRowLen);
	for (var ri = 0; ri < vnRowLen; ri++) {
		var voSrc = vaSrcRows[ri];
		var voRow = {};
		for (var ci = 0; ci < vnColLen; ci++) {
			voRow[vaNames[ci]] = voSrc[vaNames[ci]];
		}
		vaRows[ri] = voRow;
	}
	vcDs.build(vaRows);
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 피벗 UDC 는 자기 load 때 (아직 빈) 데이터셋으로 필드를 만들기 때문에,
 * 데이터를 채운 뒤 setupHelper 로 필드를 다시 만들고 피벗을 다시 그린다.
 */
function onBodyLoad(e) {
	var voData = getPivotData();
	if (!voData) {
		util.Msg.notify(app, "피벗할 데이터를 찾을 수 없습니다. 그리드 화면에서 다시 열어 주세요.");
		return;
	}
	fillPivotSource(voData);
	app.lookup("udcPivot").setupHelper({ rows: [], cols: [], values: [] }, false, true);
}
