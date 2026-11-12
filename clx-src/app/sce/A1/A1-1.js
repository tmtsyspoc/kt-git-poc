/************************************************
 * screenLayout.js
 * Created at 2023. 2. 27. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/

/**************************************************
 * 공통 모듈/전역 변수 선언
 **************************************************/
var portlet = createPortlet();
var util = createCommonUtil(); //공통유틸

// 페이징 처리를 위한 탭별 페이지 데이터 컨트롤
/** @type Array<{ filterExp : String, dvList : cpr.data.DataView, dmPageInfo : cpr.data.DataMap }>*/
var maPageDataInfo = [];


/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	app.focuscyclic = true;
	portlet.portletIndividual().updateConstraintByCookie(app, "grpData");
	var grpDataLayout = app.lookup("grpData").getLayout();
	grpDataLayout.setRows(["180px", "1fr"]);
	grpDataLayout.setRowAutoSizing(0, true);
}


/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	app.lookup("subInitValue").send();
	
	// 포틀릿 적용
	portlet.createDragManager(app);

	// 공통코드 조회(국적)
	app.lookup("subComCd").send().then(function(input){
		util.Control.redraw(app, "cmbNation");
	});
	
	// 페이징 처리를 위한 탭별 페이지 데이터 컨트롤
	maPageDataInfo = [{
		"dvList": app.lookup("dvList"),
		"dmPageInfo": app.lookup("DM_PAGE_INFO_1")
	}];
	
	//지급이력 그리드의 번호 컬럼은 데이터셋의 expression column으로 인덱스 표현 하여 필터와 소트 기능은 제외
	//(반응형으로 폼형식 그리드 표현시 column type rowindex는 데이터가 출력 되지 않음)
	var vcGrdPayList = app.lookup("grdPayList");
	var voNumColumn = vcGrdPayList.header.getColumn(0);
	voNumColumn.filterable = false;
	voNumColumn.sortable = false;
}

/*
 * "조회" 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e){
	var btnSearch = e.control;
	
	if(!util.validate(app, "grpSearch")) return;
	
	/* 검색조건 적용 및 페이지 정보 초기화*/
	maPageDataInfo.forEach(function(pageCtrl) {
		// 페이지 번호 초기화 
		var dmPageInfo = pageCtrl.dmPageInfo;
		dmPageInfo.setValue("PAGE_NO", 1);
	});
	
	/* 고객정보 조회(dmCustInfo) */
	util.Submit.send(app, "subAll", function(pbSuccess) {
		if(pbSuccess){
			/*
			 * 조회 완료 후 각 탭별 조회된 총 로우수를 적용합니다.
			 * 이 후 페이지 인덱서 컴포넌트에서 페이징 처리를 수행합니다.
			 */
			maPageDataInfo.forEach(function(pageCtrl) {
				var rowTotCnt = pageCtrl.dvList.getRowCount(); // 조회된 총 로우수
				pageCtrl.dmPageInfo.setValue("RECORD_TOTAL", rowTotCnt); // 페이징 정보에 setValue
			});
			
			// 알림 - "조회되었습니다"
			util.Msg.notify(app, "INF-M001");
			
			/* 차트에 변경된 데이터를 삽입합니다.*/
			app.lookup("cmnInTimeChart").pushData();
			app.lookup("cmnCounsTypeChart").pushData();
			app.lookup("cmnCsCounsTypeChart").pushData();
			app.lookup("cmnCsContractNumChart").pushData();
	
		}
	});
}

/*
 * 인풋 박스에서 value-change 이벤트 발생 시 호출.
 * 변경된 value가 저장된 후에 발생하는 이벤트.
 */
function onIpbCustNoValueChange(e){
	var ipbCustNo = e.control;
	goCustNo = ipbCustNo.value;
}

/*
 * "필수값 초기화" 버튼(btnReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnResetClick(e){
	var btnReset = e.control;
	//필수값 체크 확인을 위한 초기화 
	util.DataMap.setValue(app, "dmCustInfo", "job", "");
	util.DataMap.setValue(app, "dmCustInfo", "drvYn", "");
	util.Control.redraw(app, ["rdbJob", "rdbDriv"]);
}

/*
 * "저장" 버튼(btnSave)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSaveClick(e){
	var btnSave = e.control;
	if(!util.validate(app, "grpCustInfo")) return;
	
	util.Msg.notify(app, "INF-M000", ["필수값이 모두 입력되었습니다."]);
}

/*
 * 그리드에서 row-dblclick 이벤트 발생 시 호출.
 * detail이 row를 더블클릭 한 경우 발생하는 이벤트.
 */
function onGrdPayListRowDblclick(e){
	var grdPayList = e.control;
	var rowIdx = e.rowIndex;
	var initValue = app.lookup("grdPayList").getRow(rowIdx).getRowData();
	util.Dialog.open(app, "app/sce/A1/P1-1-1", 600, 310, function(e){
		/* 팝업 close 후 처리 동작*/
		var dialog = e.control;
		
		// 팝업에서 내려받은 파라미터로 현재 화면의 데이터를 구성합니다.
		var returnValue = dialog.returnValue;
		if (returnValue) {
			util.DataSet.setValue(app, "DS_PAY", rowIdx, "CUST_NO", returnValue.CUST_NO);
			util.DataSet.setValue(app, "DS_PAY", rowIdx, "PAY_DATE", returnValue.PAY_DATE);
			util.DataSet.setValue(app, "DS_PAY", rowIdx, "PAY_WAY", returnValue.PAY_WAY);
			util.DataSet.setValue(app, "DS_PAY", rowIdx, "REC_NM", returnValue.REC_NM);
			util.DataSet.setValue(app, "DS_PAY", rowIdx, "AMOUNT", returnValue.AMOUNT);
			util.DataSet.setValue(app, "DS_PAY", rowIdx, "PAY_RSN", returnValue.PAY_RSN);
			util.DataSet.setValue(app, "DS_PAY", rowIdx, "CON_NO", returnValue.CON_NO);
			
			util.Grid.setRowState(app, "grdPayList", cpr.data.tabledata.RowState.UPDATED, rowIdx);
		}
	}, initValue);
}

/*
 * 그리드에서 row-dblclick 이벤트 발생 시 호출.
 * detail이 row를 더블클릭 한 경우 발생하는 이벤트.
 */
function onGrdConsListRowDblclick(e){
	var grdConsList = e.control;
	var rowIdx = e.rowIndex;
	var initValue = app.lookup("grdConsList").getRow(rowIdx).getRowData();
	util.Dialog.open(app, "app/sce/A1/P1-1-2", 800, 510, function(e){
		/* 팝업 close 후 처리 동작*/
		var dialog = e.control;
		
		// 팝업에서 내려받은 파라미터로 현재 화면의 데이터를 구성합니다.
		var returnValue = dialog.returnValue;
		if (returnValue) {
			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CUST_NO", returnValue.CUST_NO);
			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CONS_DT", returnValue.CONS_DT);
			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CONS_NM", returnValue.CONS_NM);
			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CON_NO", returnValue.CON_NO);
			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "TEL", returnValue.TEL);
			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CONS_TYPE", returnValue.CONS_TYPE);
			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CONS_DESC", returnValue.CONS_DESC);
			
			util.Grid.setRowState(app, "grdConsList", cpr.data.tabledata.RowState.UPDATED, rowIdx);
		}
	}, initValue);
}

/*
 * "인입시간대별 분포" 아웃풋에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onOutputClick(e){
	var output = e.control;
	getDatasetExportData("DS_IN_TIME", "인입시간대별 분포");
}

function getDatasetExportData(psDataSetId, psFileName){
	
	var tgtDataSet = app.lookup(psDataSetId);
	if(tgtDataSet.getRowCount() == 0) return;
	
	var exportdata = cpr.utils.ExportUtil.getExportData(tgtDataSet);
	exportdata.name = psFileName;
	for(var i=0;i<exportdata.rowgroups[0].data[0].length;i++){
		exportdata.rowgroups[0].data[0][i] = tgtDataSet.getHeaders()[i].getInfo();
	}
	
	var subExport = new cpr.protocols.Submission();
	subExport.action = "../export/" + psFileName.replace("\/", "") + "." + "xlsx";
	subExport.mediaType = "application/json";
	subExport.responseType = "blob";
	subExport.addParameter("filename", psFileName.replace("\/", ""));
	subExport.setRequestObject(exportdata);
	return subExport.send();
}

/*
 * "상담유형별 분포" 아웃풋(opt7)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onOpt7Click(e){
	var opt7 = e.control;
	getDatasetExportData("DS_COUNS_TYPE", "상담유형별 분포");
}

/*
 * "상담사-상담유형별 분포" 아웃풋(opt8)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onOpt8Click(e){
	var opt8 = e.control;
	getDatasetExportData("DS_CS_COUNT_TYPE", "상담사-상담유형별 분포");
}

/*
 * "상담유형-계약번호별 분포" 아웃풋(opt9)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onOpt9Click(e){
	var opt9 = e.control;
	getDatasetExportData("DS_CS_CONTRACT_NUM", "상담유형-계약번호별 분포");
}

/*
 * 사용자 정의 컨트롤에서 customer-value-change 이벤트 발생 시 호출.
 * [고객검색 컴포넌트]에서 고객정보 변경 후 발생하는 이벤트
 */
function onUdcCmnCustNoSearchCustomerValueChange(e){
	var udcCmnCustNoSearch = e.control;
//	var returnValue = e.newValue;
	
	//고객정보 셋팅
	var custInfo = app.lookup("dmCustInfo");
	custInfo.clear();
	
	var data = e.newValue;
	custInfo.build(data);
	util.Control.redraw(app, ["grpSearch","grpCustInfo"]);
	
	//글로벌변수 셋팅
	goCustNo = udcCmnCustNoSearch.custNo;
	goKorNm = udcCmnCustNoSearch.korNm;
	//고객번호조회시 자동조회
	if(ValueUtil.isNull(udcCmnCustNoSearch.custNo)){
		app.lookup("DS_COUNSEL").clearData();
		app.lookup("dvList").clearData();
		app.lookup("DS_PAY").clearData();
		app.lookup("DS_IN_TIME").clearData();
		app.lookup("DS_COUNS_TYPE").clearData();
		app.lookup("DS_CS_COUNT_TYPE").clearData();
		app.lookup("DS_CS_CONTRACT_NUM").clearData();
		app.lookup("udcComGridTitle2").rowCount = 0;
		app.lookup("udcComGridTitle3").rowCount = 0;
		
		app.lookup("cmnInTimeChart").pushData();
		app.lookup("cmnCounsTypeChart").pushData();
		app.lookup("cmnCsCounsTypeChart").pushData();
		app.lookup("cmnCsContractNumChart").pushData();
		
		util.Control.redraw(app, "grpData");
	}else{
		app.lookup("btnSearch").click();
	}
}

/*
 * "개인화 저장" 버튼(btnSave2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSave2Click(e){
	var btnSave2 = e.control;
	portlet.portletIndividual().setCookie(app, "grpData", 30);
}

/*
 * "Multi Tab+" 버튼(btnSave3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSave3Click(e){
	var btnSave3 = e.control;
	
	var rootApp = app.getRootAppInstance();
	if(rootApp.hasAppMethod("doOpenMenuToEa")) {
		rootApp.callAppMethod("doOpenMenuToEa", app.app.id +".clx", null, {forceOpen:true,isSelect:false});
	}
//	var vsHref = location.href;
//	if(vsHref.indexOf(app.app.id) == -1) {
//		vsHref += ("/ui/" + app.app.id + ".clx");
//	}
//	window.open(vsHref);
}


/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdb1SelectionChange(e){
	var rdb1 = e.control;
	
	var dmPageInfo = app.lookup("DM_PAGE_INFO_1");
	var pageindexer = app.lookup("udccompageindexer2");
	var grpTabLayt2 = app.lookup("grpTabCont2").getLayout();
	
	if(rdb1.value == "paging"){
		// 체크 시 : 페이징 처리
		util.DataMap.setValue(app, "DM_PAGE_INFO_1", "RECORD_TOTAL", util.DataMap.getValue(app, "DM_PAGE_INFO_1", "RECORD_TOTAL"));
		pageindexer.setPageIndex(1);
		grpTabLayt2.setRowVisible(1, true);
	} else {
		// 체크 해제 시 : 스크롤 처리
		app.lookup("DS_COUNSEL").clearData();			
		pageindexer.setPageIndex(1);
		pageindexer.setPageScroll(20);
		grpTabLayt2.setRowVisible(1, false);
	}
	
	pageindexer.redraw();
}

var mnWinCnt = 1;
var mnDlgCnt = 1;
/*
 * "팝업 오픈" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;

	var initValue = app.lookup("dsInitValue").getRowDataRanged();
	var vnPopCnt = app.lookup("nbePopCnt").value;
		
	var vcRdbType = app.lookup("rdbPopType");
	for(var idx = 0; idx < vnPopCnt; idx++){
		if(vcRdbType.value == "window") {
			// Window Popup
			 var popup = window.open(location.origin+"/ui/app/sce/A1/P1-1-5.clx", mnWinCnt, "top=150, left=200, width=1100, height=550");
		    if (popup) {
				mnWinCnt++;
		    }
	        window._app = app;
	        if(window._childApp == null || window._childApp == undefined) window._childApp = [];
	        window.initValue = initValue;
		} else if(vcRdbType.value == "layer") {
			// Layer Popup
			util.Dialog.open(app, "app/sce/A1/P1-1-5", 900, -1, function(evt){
				/** @type cpr.controls.Dialog */
				var dialog = evt.control;
				mnDlgCnt--;
				var returnValue = dialog.returnValue;
				if(returnValue) {
					app.lookup("dsInitValue").build(returnValue);
				}
			}, initValue, {
				modal: false,
				dialogName : mnDlgCnt
			});
			mnDlgCnt++;
		}
	}
}

exports.setReturnValue = setReturnValue;
function setReturnValue (returnValue) {
	mnWinCnt--;
	if(returnValue) {
		app.lookup("dsInitValue").build(returnValue);
	}
}

/*
 * 그리드에서 scroll 이벤트 발생 시 호출.
 * 그리드 컨텐츠가 스크롤될 때 발생하는 이벤트.
 */
function onGrdConsListScroll(e){
	var grdConsList = e.control;
	
	var hasVScroll = grdConsList.hasVScroll();
	if(hasVScroll && app.lookup("rdbPaging").value == "scroll"){			    
	    if(e.scrollTop == e.maxScrollTop){
	        app.lookup("udccompageindexer2").setPageScroll(20);    
	    }
	}
}
