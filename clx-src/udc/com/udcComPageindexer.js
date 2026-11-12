/************************************************
 * udcComPageindexer.js
 * Created at 2023. 2. 20. 오후 5:43:36.
 *
 * @author tomatosystem
 ************************************************/

/**************************************************
 * 전역 변수 선언
 **************************************************/

var util = createCommonUtil();

/**************************************************
 * 사용자 정의 함수
 **************************************************/

/**
 * POC를 위한 로컬 데이터 페이징 처리 메소드
 */
function setPagingLocalData() {
	
	var hostAppIns = app.getHostAppInstance();
	
	/** @type cpr.controls.Grid */
	var ctrl = app.getAppProperty("ctrl");
	var dataSet = ctrl.dataSet;
	
	/** @type cpr.data.DataMap */
	var dmPageInfo = app.getAppProperty("pageInfo");
	var pageIdxCtrl = app.lookup("pageIndex");
	
	var totCnt = dmPageInfo.getValue("RECORD_TOTAL");
	var rowSize = dmPageInfo.getValue("RECORD_CNT_PER_PAGE");
	var pageIdx = dmPageInfo.getValue("PAGE_NO");
	var pageSize = dmPageInfo.getValue("PAGE_INDEXER_CNT");
	var dataViewId = dmPageInfo.getValue("DATA_VIEW_ID");
	
	var startIdx = (Number(pageIdx) - 1) * Number(rowSize);
	var lastIdx = Number(pageIdx) * Number(rowSize);
	
	// 조회된 데이터에서 페이징 로우수 만큼 filter 적용
	var filterExp = "getIndex() >= '" + startIdx + "' && getIndex() < '" + lastIdx + "'";	
	dataSet.clearData();
	hostAppIns.lookup(dataViewId).copyToDataSet(dataSet, filterExp);
	
	dataSet.setRowStateAll(cpr.data.tabledata.RowState.UNCHANGED);
			
	var pageCnt = 0;
	if (totCnt > 0 && rowSize > 0) {
		pageCnt = Math.ceil(totCnt / rowSize);
	}
	
	if(Number(totCnt) == 0) totCnt = 1;
	pageIdxCtrl.totalRowCount = Number(totCnt);
	pageIdxCtrl.pageRowCount = Number(rowSize);
	
	app.lookup("optPageCnt").value = pageCnt;
	pageIdxCtrl.redraw();
}

/**************************************************
 * 이벤트 리스너 함수
 **************************************************/

/*
 * Body에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad( /* cpr.events.CEvent */ e) {
	
	/** @type cpr.data.DataMap */
	var voPageInfo = app.getAppProperty("pageInfo");
	/** @type cpr.controls.Grid */
	var vcCtrl = app.getAppProperty("ctrl");
	if (!voPageInfo || !vcCtrl) return;
	
	voPageInfo.addEventListener("update", function(e) {
		var totCnt = voPageInfo.getValue("RECORD_TOTAL");
		var rowSize = voPageInfo.getValue("RECORD_CNT_PER_PAGE");
		var pageIdx = voPageInfo.getValue("PAGE_NO");
		var pageSize = voPageInfo.getValue("PAGE_INDEXER_CNT");
		
		app.lookup("optTot").value = totCnt;
		app.lookup("optRecordCountPerPage").value = rowSize;
		
		var pageCnt = 0;
		if (totCnt > 0 && rowSize > 0) pageCnt = Math.ceil(totCnt / rowSize);
		app.lookup("optPageCnt").value = pageCnt;
		
		var pageIndex = app.lookup("pageIndex");
		
		var vnFirstPageNoOn = parseInt((pageIdx - 1) / pageSize) * pageSize + 1;
		
		pageIndex.init(totCnt, vnFirstPageNoOn, pageIdx);
		pageIndex.currentPageIndex = Number(pageIdx);		
		pageIndex.pageRowCount = Number(rowSize);
		pageIndex.viewPageCount = Number(pageSize);
		pageIndex.totalRowCount = Number(totCnt);
				
		setPagingLocalData();
		
		app.getHostAppInstance().getContainer().redraw();
	});
	
	var vbShowExport = app.getAppProperty("showExportExcel");
	
	if (app.targetScreen.name == "mobile") {
		app.lookup("grpPaging").getLayout().setColumnVisible(0, false);
		app.lookup("grpPaging").getLayout().setColumnVisible(2, false);
				
		if (voPageInfo) voPageInfo.setValue("PAGE_INDEXER_CNT", 5);
	}
	
}

/*
 * 페이지 인덱서에서 before-selection-change 이벤트 발생 시 호출.
 * Page index를 선택하여 선택된 페이지가 변경되기 전에 발생하는 이벤트. 다음 이벤트로 selection-change를 발생합니다.
 */
function onPageIndexBeforeSelectionChange( /* cpr.events.CSelectionEvent */ e) {
	/**
	 * @type cpr.controls.PageIndexer
	 */
	var pageIndex = e.control;
	
	var selectionEvent = new cpr.events.CSelectionEvent("before-pagechange", {
		oldSelection: e.oldSelection,
		newSelection: e.newSelection
	});
	
	app.dispatchEvent(selectionEvent);
	
	// 기본처리가 중단되었을 때 변경을 취소함.
	if (selectionEvent.defaultPrevented == true) {
		e.preventDefault();
	}
}

/*
 * 페이지 인덱서에서 selection-change 이벤트 발생 시 호출.
 * Page index를 선택하여 선택된 페이지가 변경된 후에 발생하는 이벤트.
 */
function onPageIndexSelectionChange( /* cpr.events.CSelectionEvent */ e, mPageIndex) {
	/**
	 * @type cpr.controls.PageIndexer
	 */
	var pageIndex = e.control;
	
	app.lookup("ipbCurrentIdx").putValue("");
	var selectionEvent = new cpr.events.CSelectionEvent("pagechange", {
		oldSelection: e.oldSelection ? e.oldSelection : (mPageIndex - 1),
		newSelection: e.newSelection ? e.newSelection : mPageIndex
	});
	
	/**
	 * @type cpr.data.DataMap
	 */
	var voPageInfo = app.getAppProperty("pageInfo");
	voPageInfo.setValue("PAGE_NO", e.newSelection);
	
	app.dispatchEvent(selectionEvent);
}

/*
 * 인풋 박스에서 value-change 이벤트 발생 시 호출.
 * 변경된 value가 저장된 후에 발생하는 이벤트.
 */
function onIpbCurrentIdxValueChange( /* cpr.events.CValueChangeEvent */ e) {
	/**
	 * @type cpr.controls.InputBox
	 */
	var ipbCurrentIdx = e.control;
	if (ValueUtil.isNull(ipbCurrentIdx.value) || ipbCurrentIdx.value == "0") {
		return false;
	}
	var tot = app.lookup("optPageCnt").value;
	
	if (Number(tot) < 1) {
		return;
	} else if (Number(tot) < Number(ipbCurrentIdx.value)) {
		ipbCurrentIdx.putValue(tot);
	}
	
	var vsOldSelection = app.lookup("pageIndex").currentPageIndex;
	
	/**@type cpr.data.DataMap */
	var voPageInfo = app.getAppProperty("pageInfo");
	voPageInfo.setValue("PAGE_NO", ipbCurrentIdx.value);
	app.lookup("pageIndex").currentPageIndex = Number(ipbCurrentIdx.value);
	
	/* 로컬 데이터 페이징 처리 로직*/
	setPagingLocalData();
	
	var selectionEvent = new cpr.events.CSelectionEvent("pagechange", {
		oldSelection: vsOldSelection,
		newSelection: ipbCurrentIdx.value
	});
	
	app.dispatchEvent(selectionEvent);
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onIpbRecordCountPerPageSelectionChange(e) {
	var ipbRecordCountPerPage = e.control;
	
	var vsOldSelection = app.lookup("pageIndex").currentPageIndex;
	var optTotVal = app.lookup("optTot").value;
	
	if (Number(optTotVal) < Number(ipbRecordCountPerPage.value)) {
		app.lookup("optRecordCountPerPage").value = optTotVal;
	} else {
		app.lookup("optRecordCountPerPage").value = ipbRecordCountPerPage.value;
	}
	
	app.lookup("pageIndex").pageRowCount = ipbRecordCountPerPage.value;
	
	/**
	 * @type cpr.data.DataMap
	 */
	var voPageInfo = app.getAppProperty("pageInfo");
	voPageInfo.setValue("PAGE_NO", 1);
	voPageInfo.setValue("RECORD_CNT_PER_PAGE", ipbRecordCountPerPage.value);
	
	/* 로컬 데이터 페이징 처리 로직*/
	setPagingLocalData();
	
	var selectionEvent = new cpr.events.CSelectionEvent("pagechange", {
		oldSelection: vsOldSelection,
		newSelection: 1
	});
	
	app.dispatchEvent(selectionEvent);
}

/**************************************************
 * 모바일
 **************************************************/

var mnOldX = null;
var mnOldY = null;

/*
 * 그룹에서 touchstart 이벤트 발생 시 호출.
 * 하나 이상의 터치 포인트가 터치 표면상에 배치될 때 발생하는 이벤트.
 */
function onGrpPagingTouchstart( /* cpr.events.CTouchEvent */ e) {
	/**
	 * @type cpr.controls.Container
	 */
	var grpPaging = e.control;
	mnOldX = e.changedTouches.item(0).clientX;
	mnOldY = e.changedTouches.item(0).clientY;
	grpPaging.addEventListenerOnce("touchmove", onGrpPagingTouchmove);
}

var msDir = null;
/*
 * 그룹에서 touchstart 이벤트 발생 시 호출.
 * 하나 이상의 터치 포인트가 터치 표면상에 배치될 때 발생하는 이벤트.
 */
function onGrpPagingTouchmove( /* cpr.events.CTouchEvent */ e) {
	/**
	 * @type cpr.controls.Container
	 */
	var grpPaging = e.control;
	var vnMoveX = e.changedTouches.item(0).clientX;
	var vnMoveY = e.changedTouches.item(0).clientY;
	if (Math.abs(mnOldX - vnMoveX) < 12 && Math.abs(mnOldY - vnMoveY) < 50) {
		return;
	}
	if (mnOldX > vnMoveX) { // right to left
		grpPaging.style.css({
			"transition": "transform 0.3s ease-out 0s",
			"transform": "translate3d(-50px, 0px, 0px)"
		});
		msDir = "l";
	} else { //left to right
		grpPaging.style.css({
			"transition": "transform 0.3s ease-out 0s",
			"transform": "translate3d(50px, 0px, 0px)"
		});
		msDir = "r";
	}
	if (msDir == "l") {
		if (doCheckLastIndex()) {
			grpPaging.style.css({
				"transition": "transform 0.3s ease-out 0s",
				"transform": "translate3d(0px, 0px, 0px)"
			});
			return;
		}
	}
	grpPaging.addEventListenerOnce("touchend", onGrpPagingTouchend);
}

/*
 * 그룹에서 touchstart 이벤트 발생 시 호출.
 * 하나 이상의 터치 포인트가 터치 표면상에 배치될 때 발생하는 이벤트.
 */
function onGrpPagingTouchend( /* cpr.events.CTouchEvent */ e) {
	/**
	 * @type cpr.controls.Container
	 */
	var grpPaging = e.control;
	grpPaging.style.css({
		"transition": "transform 0.3s ease-out 0s",
		"transform": "translate3d(0px, 0px, 0px)"
	});
	var vnCurrent = app.lookup("pageIndex").currentPageIndex;
	vnCurrent = msDir == "r" ? (vnCurrent - 1 == 0 ? 1 : vnCurrent - 1) : vnCurrent + 1;
	onPageIndexSelectionChange(e, vnCurrent);
	mnOldX, mnOldY = null;
	msDir = null;
}

function doCheckLastIndex() {
	var vnLastIndex = Math.ceil(app.lookup("pageIndex").totalRowCount / app.lookup("pageIndex").pageRowCount);
	if (vnLastIndex == app.lookup("pageIndex").currentPageIndex) {
		return true;
	}
	return false;
}

exports.setPageIndex = function (pnIndex) {
	var pageIndex = app.lookup("pageIndex");
	pageIndex.dispatchEvent(new cpr.events.CSelectionEvent("selection-change", {
		newSelection: pnIndex,
		oldSelection: pageIndex.currentPageIndex
	}))
}

exports.setPageScroll = function (pnRowPerCnt) {
	
	var hostAppIns = app.getHostAppInstance();
	
	/** @type cpr.controls.Grid */
	var ctrl = app.getAppProperty("ctrl");
	var dataSet = ctrl.dataSet;
	
	/** @type cpr.data.DataMap */
	var dmPageInfo = app.getAppProperty("pageInfo");	
	var dataViewId = dmPageInfo.getValue("DATA_VIEW_ID");
	
	var startIdx = dataSet.getRowCount();
	var lastIdx = startIdx + pnRowPerCnt;
	
	// 조회된 데이터에서 페이징 로우수 만큼 filter 적용
	var filterExp = "getIndex() >= '" + startIdx + "' && getIndex() < '" + lastIdx + "'";
	hostAppIns.lookup(dataViewId).copyToDataSet(dataSet, filterExp);
	
	dataSet.setRowStateAll(cpr.data.tabledata.RowState.UNCHANGED);	
}

exports.setMiniSize = function() {
	app.lookup("grpPaging").getLayout().setColumnVisible(1, false);
	app.lookup("grpPaging").getLayout().setColumnVisible(3, false);
}

exports.setTabSize = function() {
	app.lookup("grpPaging").getLayout().setColumnVisible(3, false);
}

/**
 * 모바일 스크롤 페이징
 * @param {cpr.core.AppInstance} app 앱 인스턴스
 * @param {String} psRootCtrlID 최상위 그룹 ID
 * @param {String} psContentCtrlID 표시되는 영역 ID
 */
exports.setMPaging = function(app, psRootCtrlID) {
	/**
	 * @type cpr.controls.Container
	 */
	var vcRootCtrl = app.lookup(psRootCtrlID);
	vcRootCtrl.addEventListener("scroll", function(e) {
		var vnScrollTop = vcRootCtrl.getViewPortRect().top;
		doFloatArea(app, vnScrollTop);
	});
}

function doFloatArea( /*cpr.core.AppInstance*/ poApp, pnY) {
	/**
	 * @type cpr.controls.Grid
	 */
	var vcCtrl = app.getAppProperty("ctrl");
	var vnStart = vcCtrl.getOffsetRect().top;
	
	if (vnStart < pnY) {
		var floattarget = poApp.lookup("grpSearchArea");
		floattarget.style.css("background-color", "#ffffff");
		floattarget.style.css({
			top: "0px"
		});
		poApp.floatControl(floattarget);
	}
}

/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 호출되는 이벤트.
 */
function onBodyScreenChange( /* cpr.events.CScreenChangeEvent */ e) {	
	var scrnNm = e.screen.name;
	
	var vcPageIndex = app.lookup("pageIndex");
	var voGrpLot = app.lookup("grpPaging").getLayout();
	/** @type cpr.data.DataMap */
	var voPageInfo = app.getAppProperty("pageInfo");
	var pageSize = 10;
	
	if(scrnNm == "mobile"){
		voGrpLot.setColumnVisible(0, false);
		voGrpLot.setColumnVisible(2, false);
		pageSize = 5;
				
	} else {
		voGrpLot.setColumnVisible(0, true);
		voGrpLot.setColumnVisible(2, true);
		
		if(scrnNm == "tablet") pageSize = 5;
	}
	
	if (voPageInfo) pageSize = voPageInfo.setValue("PAGE_INDEXER_CNT", pageSize);
}