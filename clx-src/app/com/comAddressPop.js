/************************************************
 * comEmpPop.js
 * Created at 2026. 5. 18. 오후 7:28:42.
 *
 * @author dyseo
 ************************************************/

/*
 * "닫기" 버튼(btnClose)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCloseClick(e) {
	var btnClose = e.control;
	app.close();
}

/*
 * "확인" 버튼(btnClose2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnClose2Click(e) {
	var btnClose2 = e.control;
	
	var vcGrid = app.lookup("grdList");
	
	var voData = "";
	if(vcGrid.getSelectedRowIndex() > -1) {
		voData = vcGrid.getSelectedRow().getRowData();
	}
	app.close(voData);
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	var vsInitValue = app.getHostProperty("initValue");
	if(!ValueUtil.isNull(vsInitValue)) {
		app.lookup("ipb").value = vsInitValue["addr"];
		app.lookup("btnSearch").click();
	}
}

/*
 * "조회" 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e) {
	var btnSearch = e.control;
	
	var vcGrid = app.lookup("grdList");
	var vsIpb = app.lookup("ipb").value;
	if(!ValueUtil.isNull(vsIpb)) {
		vcGrid.setFilter("ROAD_ADDR *= '"+vsIpb+"' || JIBUN_ADDR *= '"+vsIpb+"'");
	} else {
		vcGrid.clearFilter();
	}
}

/*
 * 그리드에서 row-dblclick 이벤트 발생 시 호출.
 * detail이 row를 더블클릭 한 경우 발생하는 이벤트.
 */
function onGrdListRowDblclick(e) {
	app.lookup("btnSelect").click();
}

/*
 * 인풋 박스에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onIpbKeydown(e) {
	if(e.keyCode == cpr.events.KeyCode.ENTER) {
		app.lookup("btnSearch").click();
	}
}
