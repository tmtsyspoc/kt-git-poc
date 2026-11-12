/************************************************
 * comPGridFinder.js
 * @프로그램설명 : 데이터 찾기 팝업 (그리드 우클릭 [찾기] — udcComGridTitle 이 연다)
 *   - AS-IS : sc-grid 기본 찾기 창 sc-grid-finder (dqms-components/public/bower_components/sc-grid/sc-grid.build.js
 *             SCGridFinderBehaviorImpl onSearch·_searchAndFocus·_compareRowValue·onCancelSearch, 그리드 searchItem)
 *             — 원본 화면 파일이 없는 그리드 내장 창이라 파일명은 명명 규칙 형식(2026-10-07 sc-grid-finder → dqmsPGridFinder → comPGridFinder)
 *   - 전환 기록 : eb6-dqms-agent/dqms/conversion/es-dev-filter-sort-grid.md (F20~F26)
 *   - 결정 : decisions.md D-GRD-09 ④ (eXBuilder6에 내장 찾기 창이 없어 새로 만듦), D-GRD-21 (공통 UDC 팝업이라 app/com 으로 옮김),
 *            D-GRD-23 (Enter·포커스·찾은 칸 표시)
 *   - 원형 : templates/팝업화면/2.폼/V_폼
 *   - 호출 : udcComGridTitle.js openGridFinder — util.Dialog.open(그리드 화면 app, "app/com/comPGridFinder", 400, 260, cb, {targetGrid: 그리드}, {modal: false})
 *
 * @작성일자 : 2026.10.06.
 * @작성자 : claude
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 *   2026.10.07. (claude) app/dqms/bmt/grd/dqmsPGridFinder → app/com/comPGridFinder 로 이동·이름 변경(사용자 지시 — D-GRD-21)
 *   2026.10.07. (claude) Enter = [찾기] 버튼, 찾은 뒤 포커스를 찾을말에 유지, 찾은 칸 표시 클래스 dqms-cell-found,
 *                        row 그리드 시작 위치 기억(사용자 지시 — D-GRD-23)
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/
/** 찾은 결과 문구 (AS-IS foundedText·notFoundedText) */
var FOUND_TEXT = "성공";
var NOT_FOUND_TEXT = "해당되는 데이터 없음";

/** 찾은 칸에 붙이는 표시 클래스 (theme/custom/dqms.part.less) */
var FOUND_CELL_CLASS = "dqms-cell-found";

/************************************************
 ** 글로벌 함수
 ************************************************/


/************************************************
 ** 파일내 로컬변수 선언
 ************************************************/
var util = createCommonUtil();

/**
 * 찾을 대상 그리드 (호출자 initValue.targetGrid)
 * @type cpr.controls.Grid
 */
var mcTargetGrid = null;

/**
 * row 단위 그리드의 현재 칸(다음 찾기의 시작 위치). 찾은 칸, 또는 사용자가 그리드에서 누른 칸. 없으면 null.
 * cell 단위 그리드는 그리드의 칸 선택이 현재 칸이라 쓰지 않는다.
 * @type {{rowIndex: Number, cellIndex: Number}}
 */
var moCurCell = null;

/** 찾은 칸 표시(클래스 바인딩)를 건 디테일 셀 인덱스. 없으면 -1 */
var mnMarkedCell = -1;

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술
 ************************************************/
/**
 * 대상 그리드에서 보이는 데이터 칸(디테일 셀 인덱스)을 열 순서대로 돌려준다.
 * 행번호·체크 칸과 숨긴 열은 뺀다. (AS-IS: visible 이고 dataField 가 있는 컬럼)
 * @param {cpr.controls.Grid} grd
 * @return {Number[]}
 */
function getSearchCells(grd) {
	var vaVisible = grd.getCellIndicesByVisible(true);
	var vaCells = [];
	for (var i = 0; i < grd.detail.cellCount; i++) {
		var voColumn = grd.detail.getColumn(i);
		if (voColumn && voColumn.columnName && vaVisible.indexOf(i) > -1) {
			vaCells.push(i);
		}
	}
	return vaCells;
}

/**
 * 대상컬럼 콤보 목록을 만든다: 전체 + 보이는 데이터 열(헤더 글자).
 */
function buildTargetColumns() {
	/** @type cpr.controls.Grid */
	var grd = mcTargetGrid;
	var vaItems = [{ label: "전체", value: "" }];
	getSearchCells(grd).forEach(function(pnCellIdx) {
		var vsColumnName = grd.detail.getColumn(pnCellIdx).columnName;
		var vsLabel = vsColumnName;
		for (var i = 0; i < grd.header.cellCount; i++) {
			if (grd.header.getColumn(i).targetColumnName == vsColumnName) {
				vsLabel = grd.header.getColumn(i).text;
				break;
			}
		}
		vaItems.push({ label: vsLabel, value: vsColumnName });
	});
	app.lookup("dsTargetColumn").build(vaItems);
	app.lookup("cmbTargetColumn").value = "";
}

/**
 * 칸 값에 찾을말이 들어 있는지 본다. 대소문자를 가리지 않는 부분 일치. (AS-IS _compareRowValue)
 * @param {any} poValue 칸 값
 * @param {String} psWord 소문자로 바꾼 찾을말
 * @return {Boolean}
 */
function isMatch(poValue, psWord) {
	if (poValue == null || poValue === "") {
		return false;
	}
	return String(poValue).toLowerCase().indexOf(psWord) > -1;
}

/**
 * 그리드 선택 단위가 cell 인지. cell 이면 그리드의 칸 선택을 현재 칸(다음 찾기 시작 위치)으로 쓴다.
 * @param {cpr.controls.Grid} grd
 * @return {Boolean}
 */
function isCellUnit(grd) {
	return grd.selectionUnit == "cell";
}

/**
 * 찾기 시작 위치(현재 칸). AS-IS 처럼 현재 칸의 다음 칸부터 찾는다.
 * - cell 그리드: 그리드에서 선택된 칸. 선택이 없으면 AS-IS 처음 포커스처럼 첫 행 첫 데이터 칸.
 * - row 그리드: 마지막으로 찾은 칸 또는 사용자가 누른 칸(moCurCell). 없으면 선택된 행(없으면 첫 행)의 첫 칸부터 —
 *   cellIndex 를 null 로 돌려 그 칸까지 포함해 찾게 한다.
 * @param {cpr.controls.Grid} grd
 * @param {Number[]} paCells 찾을 칸 목록
 * @return {{rowIndex: Number, cellIndex: Number}}
 */
function getCurrentCell(grd, paCells) {
	if (isCellUnit(grd)) {
		var vaSel = grd.getSelectedCellIndices();
		if (vaSel && vaSel.length > 0) {
			return { rowIndex: vaSel[0].rowIndex, cellIndex: vaSel[0].cellIndex };
		}
		return { rowIndex: 0, cellIndex: paCells[0] };
	}
	if (moCurCell) {
		return { rowIndex: moCurCell.rowIndex, cellIndex: moCurCell.cellIndex };
	}
	var vnRow = grd.getSelectedRowIndex();
	return { rowIndex: vnRow > -1 ? vnRow : 0, cellIndex: null };
}

/**
 * 찾은 칸 하나에 표시 클래스를 건다. 행 선택은 건드리지 않는다(업무 화면의 행 선택 동작 보호).
 * 디테일 열 스타일에 행 번호 조건 클래스 바인딩을 걸고, 앞서 건 열의 바인딩은 푼다.
 * 그 열에 이미 클래스 바인딩이 있으면 덮어쓰지 않고 표시를 생략한다.
 * @param {cpr.controls.Grid} grd
 * @param {Number} pnRow 표시할 행. -1 이면 표시만 지운다
 * @param {Number} pnCell 표시할 디테일 셀 인덱스
 */
function markFoundCell(grd, pnRow, pnCell) {
	if (mnMarkedCell > -1) {
		grd.detail.getColumn(mnMarkedCell).style.unbindClass();
		mnMarkedCell = -1;
	}
	if (pnRow > -1) {
		var voStyle = grd.detail.getColumn(pnCell).style;
		if (!voStyle.getClassBindInfo()) {
			voStyle.bindClass().toExpression("getIndex() == " + pnRow + " ? \"" + FOUND_CELL_CLASS + "\" : \"\"");
			mnMarkedCell = pnCell;
		}
	}
	grd.redraw();
}

/**
 * 찾은 칸을 보이고 그 칸으로 스크롤한다. 다음 찾기는 이 칸 다음부터 이어진다.
 * 키보드 포커스는 찾을말 칸에 남긴다 — 그리드로 옮기면(focusCell) 다음 Enter 가 그리드로 가서 찾기가 이어지지 않는다(AS-IS 도 찾을말에 남음).
 * 찾은 칸은 표시 클래스(markFoundCell)로 보인다. 칸 선택은 선택의 기준 칸을 칠하지 않아 칸 하나만 선택하면 보이지 않으므로(실행 확인)
 * 칸 선택은 현재 칸을 기억하는 데만 쓴다. row 그리드는 칸 선택이 없어 moCurCell 로 기억한다.
 * @param {cpr.controls.Grid} grd
 * @param {Number} pnRow
 * @param {Number} pnCell
 */
function focusFoundCell(grd, pnRow, pnCell) {
	if (isCellUnit(grd)) {
		grd.selectCells([{ rowIndex: pnRow, cellIndex: pnCell }]);
	} else {
		moCurCell = { rowIndex: pnRow, cellIndex: pnCell };
	}
	markFoundCell(grd, pnRow, pnCell);
	grd.moveToCell(pnRow, pnCell);
}

/**
 * 행 범위 안에서 칸을 차례로 훑어 처음 맞는 칸을 찾는다. (AS-IS _searchAndFocus)
 * 시작 행은 pnStartPos 번째 칸부터, 다음 행부터는 첫 칸부터 본다.
 * @param {cpr.controls.Grid} grd
 * @param {Number} pnStartRow 시작 행(포함)
 * @param {Number} pnEndRow 끝 행(제외)
 * @param {Number} pnStartPos 시작 행에서 볼 첫 칸의 위치(paCells 안의 순번)
 * @param {Number[]} paCells
 * @param {String} psWord
 * @return {{rowIndex: Number, cellIndex: Number}} 못 찾으면 null
 */
function searchCells(grd, pnStartRow, pnEndRow, pnStartPos, paCells, psWord) {
	for (var r = pnStartRow; r < pnEndRow; r++) {
		for (var p = (r == pnStartRow ? pnStartPos : 0); p < paCells.length; p++) {
			if (isMatch(grd.getCellValue(r, paCells[p]), psWord)) {
				return { rowIndex: r, cellIndex: paCells[p] };
			}
		}
	}
	return null;
}

/**
 * 한 열에서 현재 행 다음부터 찾는다. 되돌리기면 끝에서 첫 행으로 돌아가 현재 행까지 본다. (AS-IS 그리드 searchItem)
 * @param {cpr.controls.Grid} grd
 * @param {Number} pnCellIdx
 * @param {Number} pnCurRow
 * @param {String} psWord
 * @param {Boolean} pbRepeat
 * @return {{rowIndex: Number, cellIndex: Number}} 못 찾으면 null
 */
function searchColumn(grd, pnCellIdx, pnCurRow, psWord, pbRepeat) {
	var vnCount = grd.rowCount;
	for (var r = pnCurRow + 1; r < vnCount; r++) {
		if (isMatch(grd.getCellValue(r, pnCellIdx), psWord)) {
			return { rowIndex: r, cellIndex: pnCellIdx };
		}
	}
	if (pbRepeat) {
		for (var j = 0; j <= pnCurRow && j < vnCount; j++) {
			if (isMatch(grd.getCellValue(j, pnCellIdx), psWord)) {
				return { rowIndex: j, cellIndex: pnCellIdx };
			}
		}
	}
	return null;
}

/**
 * 찾기를 실행한다. (AS-IS sc-grid-finder onSearch, F21~F25)
 * 찾을말이 비어 있으면 아무것도 하지 않는다.
 */
function doFind() {
	/** @type cpr.controls.Grid */
	var grd = mcTargetGrid;
	var vsWord = app.lookup("sipFindWord").displayingText || app.lookup("sipFindWord").value;
	if (!grd || vsWord == null || String(vsWord).trim() == "" || grd.rowCount == 0) {
		return;
	}
	vsWord = String(vsWord).toLowerCase();
	var vbRepeat = app.lookup("cbxRepeatSearch").value == "Y";
	var vsTarget = app.lookup("cmbTargetColumn").value;
	var vaCells = getSearchCells(grd);
	var voCur = getCurrentCell(grd, vaCells);
	var voFound = null;

	// row 그리드에서 현재 칸이 없으면(cellIndex null) 시작 행도 포함해 찾는다
	var vbFromRowStart = voCur.cellIndex == null;
	if (vsTarget) {
		// F24 대상컬럼: 그 열에서만 현재 행 다음부터
		voFound = searchColumn(grd, grd.getCellIndex(vsTarget), vbFromRowStart ? voCur.rowIndex - 1 : voCur.rowIndex, vsWord, vbRepeat);
	} else {
		// F21 전체: 현재 칸의 다음 칸부터 → 다음 행들. 되돌리기면 첫 행부터 현재 행까지 (F23)
		// 되돌리기 범위에 현재 행을 넣어 현재 칸까지 다시 본다 — 맞는 칸이 하나뿐이어도 Enter 마다 그 칸을 다시 찾는다(대상컬럼 searchColumn 과 같음).
		// 현재 칸 뒤쪽은 앞에서 이미 봤으므로 다시 봐도 결과는 같다.
		var vnPos = vaCells.indexOf(voCur.cellIndex);
		var vnStartPos = vbFromRowStart ? 0 : (vnPos < 0 ? 0 : vnPos) + 1;
		voFound = searchCells(grd, voCur.rowIndex, grd.rowCount, vnStartPos, vaCells, vsWord);
		if (!voFound && vbRepeat) {
			voFound = searchCells(grd, 0, voCur.rowIndex + 1, 0, vaCells, vsWord);
		}
	}

	if (voFound) {
		focusFoundCell(grd, voFound.rowIndex, voFound.cellIndex);
	}
	app.lookup("optFindResult").value = voFound ? FOUND_TEXT : NOT_FOUND_TEXT;
	app.lookup("sipFindWord").focus();
}

/**
 * 대상 그리드에서 사용자가 칸을 누르면 그 칸을 현재 칸으로 삼고(AS-IS: 누른 칸에서 다시 찾기 시작) 앞서 찾은 칸 표시를 지운다.
 * cell 그리드는 누른 칸이 칸 선택으로 남으므로 표시만 지운다.
 * @param {cpr.events.CGridEvent} e
 */
function onTargetGridCellClick(e) {
	/** @type cpr.controls.Grid */
	var grd = e.control;
	if (e.relativeTargetName != "detail") {
		return;
	}
	if (!isCellUnit(grd)) {
		moCurCell = { rowIndex: e.rowIndex, cellIndex: e.cellIndex };
	}
	markFoundCell(grd, -1, -1);
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시)
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 */
function onBodyLoad(e) {
	/** @type {{targetGrid: cpr.controls.Grid}} */
	var voInit = app.getHostProperty("initValue") || {};
	mcTargetGrid = voInit.targetGrid || null;
	if (mcTargetGrid) {
		buildTargetColumns();
		mcTargetGrid.addEventListener("cell-click", onTargetGridCellClick);
	}
	app.lookup("sipFindWord").focus();
}

/*
 * 찾을말(sipFindWord)에서 search 이벤트 발생 시 호출. Enter 키는 [찾기] 버튼을 누른 것과 같다. (F25)
 */
function onSipFindWordSearch(e) {
	app.lookup("btnFind").click();
}

/*
 * "찾기" 버튼(btnFind)에서 click 이벤트 발생 시 호출.
 */
function onBtnFindClick(e) {
	doFind();
}

/*
 * "찾기 취소" 버튼(btnCancelFind)에서 click 이벤트 발생 시 호출. 찾은 결과 문구를 지운다. (AS-IS onCancelSearch, F26)
 */
function onBtnCancelFindClick(e) {
	app.lookup("optFindResult").value = "";
}

/*
 * "닫기" 버튼(btnClose)에서 click 이벤트 발생 시 호출. (F26)
 */
function onBtnCloseClick(e) {
	app.close();
}

/*
 * 루트 컨테이너에서 unload 이벤트 발생 시 호출. 대상 그리드에 건 리스너와 찾은 칸 표시를 푼다.
 */
function onBodyUnload(e) {
	if (mcTargetGrid && !mcTargetGrid.disposed) {
		mcTargetGrid.removeEventListener("cell-click", onTargetGridCellClick);
		markFoundCell(mcTargetGrid, -1, -1);
	}
}
