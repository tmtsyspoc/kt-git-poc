/************************************************
 * comPGridFilter.js
 * @프로그램설명 : 그리드 열 필터 팝업 (그리드 우클릭 [필터]·헤더 깔때기 — udcComGridTitle 이 연다)
 *   - AS-IS : sc-grid 기본 필터 창 sc-grid-filter (dqms-components/public/bower_components/sc-grid/sc-grid.build.js
 *             SCGridFilterBehaviorImpl show·filterValueChanged·_onCheckAll·_onNoneCheckAll·onHandlePaste·onApplyClipboard·applyAutoFilter)
 *   - 구성(AS-IS 순서) : 검색 칸 · 전체 선택/전체 해제 + Results : n · 값 목록(체크) · 조건 콤보 + 값 · [클립보드 가져오기] [적용] [닫기]
 *   - 필터 상태·적용은 module/dqms/dqmsGridFilter (열 안 값·조건 OR, 열 사이 AND)
 *   - 원형 : templates/팝업화면/2.폼/V_폼 (app/com/comPGridFinder 와 같은 골격)
 *   - 호출 : udcComGridTitle.js openGridFilter — util.Dialog.open(그리드 화면 app, "app/com/comPGridFilter", …, {targetGrid: 그리드, columnName: 데이터 컬럼명})
 *
 * @작성일자 : 2026.10.07.
 * @작성자 : claude
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/
/** [클립보드 가져오기] 실패 문구 키 — language.json NLS-WRN-Q309 (AS-IS resources/language/smart-grid-i18n.js FIL016 문구 그대로) */
var CLIPBOARD_FAIL_MSG = "WRN-Q309";

/************************************************
 ** 파일내 로컬변수 선언
 ************************************************/
var util = createCommonUtil();

/**
 * 필터 대상 그리드 (호출자 initValue.targetGrid)
 * @type cpr.controls.Grid
 */
var mcTargetGrid = null;

/** 필터 대상 데이터 컬럼명 (호출자 initValue.columnName) */
var msColumnName = null;

/**
 * 값 목록 전체(검색으로 숨긴 값 포함). checked 는 체크 여부 — 검색으로 목록을 다시 만들어도 체크가 남게 여기 둔다.
 * @type {Array<{value: any, label: String, checked: Boolean}>}
 */
var maItems = [];

/** 값 목록 그리드 DOM 에 건 paste 리스너 (닫을 때 뗀다) */
var mfPasteHandler = null;

/** 값 목록 그리드 (paste 리스너에서 포커스 확인용. unload 때는 lookup 할 수 없어 기억해 둔다 — 실행 확인) */
var mcValueGrid = null;

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술
 ************************************************/
/**
 * 그리드 필터 모듈
 * @return {module.dqms.dqmsGridFilter}
 */
function getFilterModule() {
	return cpr.core.Module.require("module/dqms/dqmsGridFilter");
}

/**
 * 값 목록 그리드에 보이는 행의 체크를 maItems 에 옮긴다. 목록 행의 idx 열이 maItems 순번이다.
 */
function syncChecks() {
	var grd = app.lookup("grdValues");
	var vaChecked = grd.getCheckRowIndices();
	for (var r = 0; r < grd.getRowCount(); r++) {
		maItems[Number(app.lookup("dsValues").getValue(r, "idx"))].checked = vaChecked.indexOf(r) > -1;
	}
}

/**
 * 검색 글자에 맞는 값으로 목록을 다시 만들고 체크를 되살린다. 대소문자는 가리지 않는다. (AS-IS filterValueChanged — upper value like)
 */
function renderList() {
	var grd = app.lookup("grdValues");
	var vsWord = String(app.lookup("sipSearch").displayingText || "").toLowerCase();
	var vaRows = [];
	maItems.forEach(function(poItem, pnIdx) {
		if (!vsWord || String(poItem.label).toLowerCase().indexOf(vsWord) > -1) {
			vaRows.push({ label: poItem.label, value: String(poItem.value), idx: pnIdx });
		}
	});
	app.lookup("dsValues").build(vaRows);
	vaRows.forEach(function(poRow, pnRow) {
		if (maItems[poRow.idx].checked) {
			grd.setCheckRowIndex(pnRow, true);
		}
	});
	app.lookup("optResults").value = "Results : " + vaRows.length;
	grd.redraw();
}

/**
 * 글자 목록과 같은 값(화면 글자 또는 원래 값)을 체크한다. 없는 값은 무시한다. (AS-IS onHandlePaste·onApplyClipboard)
 * @param {String} psText 줄바꿈·탭으로 나뉜 글자 (엑셀 한 열 복사 등)
 * @param {Boolean} pbClearFirst true 면 먼저 모든 체크를 푼다 (AS-IS [클립보드 가져오기])
 */
function checkByText(psText, pbClearFirst) {
	if (!psText) {
		return;
	}
	syncChecks();
	if (pbClearFirst) {
		maItems.forEach(function(poItem) { poItem.checked = false; });
	}
	var voWords = {};
	psText.split(/\r?\n/).forEach(function(psLine) {
		psLine.split("\t").forEach(function(psWord) {
			var vsWord = psWord.trim();
			if (vsWord) {
				voWords[vsWord] = true;
			}
		});
	});
	maItems.forEach(function(poItem) {
		if (voWords[String(poItem.label)] || voWords[String(poItem.value)]) {
			poItem.checked = true;
		}
	});
	renderList();
}

/**
 * 고른 값과 조건으로 대상 그리드에 필터를 걸고 닫는다. (AS-IS applyAutoFilter)
 */
function doApply() {
	syncChecks();
	var vaValues = [];
	maItems.forEach(function(poItem) {
		if (poItem.checked) {
			vaValues.push(poItem.value);
		}
	});
	getFilterModule().setColumnFilter(mcTargetGrid, msColumnName, {
		values: vaValues,
		kind: app.lookup("cmbKind").value,
		word: app.lookup("ipbWord").value
	});
	app.close();
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시)
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 값 목록·조건을 만들고, 이미 걸린 필터가 있으면 그 값 체크·조건을 되살린다(AS-IS 도 다시 열면 걸린 값이 체크돼 있다).
 */
function onBodyLoad(e) {
	// 팝업 바깥(오버레이)을 누르면 [닫기]처럼 적용하지 않고 닫는다 (사용자 지시 2026.10.12.)
	var vcHost = app.getHost();
	if (vcHost) {
		vcHost.addEventListener("overlay-click", function(e) {
			app.close();
		});
	}
	/** @type {{targetGrid: cpr.controls.Grid, columnName: String}} */
	var voInit = app.getHostProperty("initValue") || {};
	mcTargetGrid = voInit.targetGrid || null;
	msColumnName = voInit.columnName || null;
	var voModule = getFilterModule();
	app.lookup("dsKind").build(voModule.FILTER_KINDS);
	app.lookup("cmbKind").value = "includePattern";
	if (!mcTargetGrid || !msColumnName) {
		return;
	}

	var voState = voModule.getColumnState(mcTargetGrid, msColumnName);
	var voChecked = {};
	if (voState) {
		(voState.values || []).forEach(function(poValue) {
			voChecked[typeof poValue + ":" + String(poValue)] = true;
		});
		app.lookup("cmbKind").value = voState.kind || "includePattern";
		app.lookup("ipbWord").value = voState.word || "";
	}
	maItems = voModule.getUniqueItems(mcTargetGrid, msColumnName).map(function(poItem) {
		return { value: poItem.value, label: poItem.label, checked: !!voChecked[typeof poItem.value + ":" + String(poItem.value)] };
	});
	renderList();
	app.lookup("grpCondition").redraw();

	// 값 목록에 Ctrl+V — 붙여넣은 값을 체크한다 (AS-IS onHandlePaste).
	// 그리드 붙여넣기 이벤트로는 글자를 받을 수 없고 그리드 DOM 을 id 로 찾을 수 없어(실행 확인) 문서에 걸고, 값 목록에 포커스가 있을 때만 처리한다.
	mcValueGrid = app.lookup("grdValues");
	mfPasteHandler = function(ev) {
		if (!mcValueGrid || mcValueGrid.disposed || !mcValueGrid.focused) {
			return;
		}
		ev.preventDefault();
		ev.stopPropagation();
		var voData = ev["clipboardData"] || window["clipboardData"];
		checkByText(voData ? voData["getData"]("Text") : "", false);
	};
	document.addEventListener("paste", mfPasteHandler, true);
}

/*
 * 루트 컨테이너에서 unload 이벤트 발생 시 호출. 값 목록에 건 paste 리스너를 뗀다.
 */
function onBodyUnload(e) {
	if (mfPasteHandler) {
		document.removeEventListener("paste", mfPasteHandler, true);
	}
	mcValueGrid = null;
	mfPasteHandler = null;
}

/*
 * 검색 칸(sipSearch)에서 input·clear 이벤트 발생 시 호출. 입력한 글자가 들어간 값만 목록에 남긴다. (AS-IS filterValueChanged, F12)
 */
function onSipSearchInput(e) {
	syncChecks();
	renderList();
}

/*
 * 검색 칸(sipSearch)에서 search 이벤트 발생 시 호출. Enter·돋보기는 [적용]과 같다. (AS-IS trigger-click → onApplyFilter)
 */
function onSipSearchSearch(e) {
	doApply();
}

/*
 * "전체 선택" 버튼(btnCheckAll)에서 click 이벤트 발생 시 호출. 목록에 보이는 값을 모두 체크한다. (AS-IS _onCheckAll)
 */
function onBtnCheckAllClick(e) {
	app.lookup("grdValues").checkAllRow();
}

/*
 * "전체 해제" 버튼(btnUncheckAll)에서 click 이벤트 발생 시 호출. (AS-IS _onNoneCheckAll)
 */
function onBtnUncheckAllClick(e) {
	app.lookup("grdValues").clearAllCheck();
}

/*
 * 조건 값(ipbWord)에서 keydown 이벤트 발생 시 호출. Enter 는 [적용]과 같다. (AS-IS onFilterKeypress)
 */
function onIpbWordKeydown(e) {
	if (e.keyCode == cpr.events.KeyCode.ENTER) {
		doApply();
	}
}

/*
 * "클립보드 가져오기" 버튼(btnClipboard)에서 click 이벤트 발생 시 호출. (AS-IS onApplyClipboard)
 * 클립보드 글자와 같은 값만 체크한다. 브라우저가 읽기를 허용하지 않으면 AS-IS 안내 문구를 띄운다.
 */
function onBtnClipboardClick(e) {
	var voClipboard = navigator["clipboard"];
	if (!voClipboard || !voClipboard.readText) {
		util.Msg.alertDlg(app, CLIPBOARD_FAIL_MSG);
		return;
	}
	voClipboard.readText().then(function(psText) {
		checkByText(psText, true);
	})["catch"](function() {
		util.Msg.alertDlg(app, CLIPBOARD_FAIL_MSG);
	});
}

/*
 * "적용" 버튼(btnApply)에서 click 이벤트 발생 시 호출. (AS-IS onApplyFilter)
 */
function onBtnApplyClick(e) {
	doApply();
}

/*
 * "닫기" 버튼(btnClose)에서 click 이벤트 발생 시 호출. 적용하지 않고 닫는다. (AS-IS onFilterClose)
 */
function onBtnCloseClick(e) {
	app.close();
}
