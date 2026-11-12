/************************************************
 * K2-1.js
 * @프로그램설명 : 
 *
 * @작성일자 :  2026. 11. 5..
 * @작성자 : dyseo
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/
 
/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/


/************************************************
 ** 글로벌 함수
 ************************************************/


/************************************************
 ** 파일내 로컬변수 선언
 ************************************************/
var util = createCommonUtil();

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술
 ************************************************/

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시)
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	// 대량 Grid 기능 확인용 데이터 조회 (틀고정·편집 / 그룹핑·소계·합계 / 동적 Grouping / Excel)
	util.Submit.send(app, "subAll", function(pbSuccess, sub){
		if(pbSuccess) {
			var rowTotCnt = app.lookup("dvList").getRowCount(); // 조회된 총 로우수
			app.lookup("DM_PAGE_INFO_1").setValue("RECORD_TOTAL", rowTotCnt);
		}
	});
	util.Submit.send(app, "subList");
	util.Submit.send(app, "subList3");
	util.Submit.send(app, "subList4");
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

/*
 * 그리드에서 row-dblclick 이벤트 발생 시 호출.
 * detail이 row를 더블클릭 한 경우 발생하는 이벤트.
 */
function onGrdConsListRowDblclick(e){
	var grdConsList = e.control;
//	var rowIdx = e.rowIndex;
//	var initValue = app.lookup("grdConsList").getRow(rowIdx).getRowData();
//	util.Dialog.open(app, "app/sce/A1/P1-1-2", 800, 510, function(e){
//		/* 팝업 close 후 처리 동작*/
//		var dialog = e.control;
//
//		// 팝업에서 내려받은 파라미터로 현재 화면의 데이터를 구성합니다.
//		var returnValue = dialog.returnValue;
//		if (returnValue) {
//			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CUST_NO", returnValue.CUST_NO);
//			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CONS_DT", returnValue.CONS_DT);
//			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CONS_NM", returnValue.CONS_NM);
//			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CON_NO", returnValue.CON_NO);
//			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "TEL", returnValue.TEL);
//			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CONS_TYPE", returnValue.CONS_TYPE);
//			util.DataSet.setValue(app, "DS_COUNSEL", rowIdx, "CONS_DESC", returnValue.CONS_DESC);
//
//			util.Grid.setRowState(app, "grdConsList", cpr.data.tabledata.RowState.UPDATED, rowIdx);
//		}
//	}, initValue);
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

/*
 * "엑셀 임포트" 버튼(btnImport)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnImportClick(e){
	app.lookup("fit1").openFileChooser();
}

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFit1ValueChange(e){
	var fit1 = e.control;
	var file = fit1.file;
	var vsTypeDiv = app.lookup("rdbDiv").value;

	if(vsTypeDiv == "server") {

		util.Submit.addImportGridFileParameter(app, "subImport", "grdList2", file);
		util.Submit.send(app, "subImport", function(pbSuccess) {
				if (pbSuccess) {
					app.lookup("udcComGridTitle8").rowCount = util.DataSet.getRowCount(app, "dsList3");
				}
		});
	} else {
		ExcelUtil.importExcel(file, app.lookup("grdList2"),function(data){
			app.lookup("grdList2").dataSet.build(data);
		});
	}
}

/*
 * "엑셀 다운로드" 버튼(btnImport2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnImport2Click(e){
	var btnImport2 = e.control;
	app.lookup("grdList2").dataSet.clear();
}
