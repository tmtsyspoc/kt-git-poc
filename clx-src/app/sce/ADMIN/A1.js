/************************************************
 * A1.js
 * Created at 2025. 8. 4. 오후 2:22:25.
 *
 * @author dyseo
 ************************************************/

/************************************************
 ** 공통모듈
 ************************************************/
var util = createCommonUtil();

/************************************************
 ** 글로벌 변수, 전역변수
 ************************************************/
var ws;

var msWsMsg = {
	receiver : "",
	message : "",
	reqStatus: "",
	SENDER_ID: ""
}

/************************************************
 ** 사용자 정의 함수
 ************************************************/

/************************************************
 ** 컨트롤 이벤트
 ************************************************/

/*
 * "조회" 버튼(btnSearch2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearch2Click(e) {
	var btnSearch2 = e.control;
	var vcDataset = app.lookup("dsTerminal");
	var vcIpb2 = app.lookup("ipb2");
	var vcIpb3 = app.lookup("ipb3");
	if (ValueUtil.isNull(vcIpb2.value) && ValueUtil.isNull(vcIpb3.value)) {
		vcDataset.clearFilter();
	} else if (!ValueUtil.isNull(vcIpb2.value) && ValueUtil.isNull(vcIpb3.value)) {
		vcDataset.setFilter("userId *= #ipb2.value || userNm *= #ipb2.value");
	} else if (ValueUtil.isNull(vcIpb2.value) && !ValueUtil.isNull(vcIpb3.value)) {
		vcDataset.setFilter("fileNm *= #ipb3.value");
	} else {
		vcDataset.setFilter("(userId *= #ipb2.value || userNm *= #ipb2.value) && fileNm *= #ipb3.value");
	}
}


/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	ws = getSocket();
	
	// 접속현황 리스트 조회
	util.Submit.send(app, "subOnLoad", function(pbSuccess, sub) {
		if (pbSuccess) {
			app.lookup("grd1").sort("date desc");
		}
	});
}

/*
 * "로그 수집" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	if (app.lookup("dsConnectStatus").findAllRow("isLogCollect == \"Y\"").length == 0) {
		util.Msg.alertDlg(app,"로그를 수집할 사용자를 체크하세요.");
	} else {
		app.lookup("dsConnectStatus").findAllRow("isLogCollect == \"Y\"").forEach(function(each){
			msWsMsg.receiver = app.lookup("grd1").getCellValue(each.getIndex(), 1); // 메시지를 받을 사람
			msWsMsg.reqStatus = "COLT"; // 로그 수집
			ws.send(JSON.stringify(msWsMsg));
		});
		
		// 로그 수집하고 데이터 불러오는데까지 임의로 1초 딜레이 걸었음
		setTimeout(function(){
			util.Submit.send(app, "subOnLoad", function(pbSuccess, sub) {
				if (pbSuccess) {
					util.Control.redraw(app, "grd2");
					util.Tab.setSelectedTabItemById(app, "tab1", 2);
				}
			});
		}, 1000);
	}
	
}

/*
 * 그리드에서 cell-click 이벤트 발생 시 호출.
 * Grid의 Cell 클릭시 발생하는 이벤트.
 */
function onGrd1CellClick(e){
	var grd1 = e.control;
	
	var vsUserId = util.Main.getUserInfo(app, "USER_ID");
	
	if (e.relativeTargetName == "detail" && e.cellIndex == 9) {
		if (grd1.getCellValue(e.rowIndex, e.cellIndex) == "Y") {
			msWsMsg.receiver = grd1.getCellValue(e.rowIndex, 1); // 메시지를 받을 사람
			msWsMsg.reqStatus = "LOGOUT"; // 로그아웃
			msWsMsg.SENDER_ID = vsUserId; // 메시지를 보낸 사람
			ws.send(JSON.stringify(msWsMsg));
		}
	}
}

/*
 * 탭 폴더에서 selection-change 이벤트 발생 시 호출.
 * Tab Item을 선택한 후에 발생하는 이벤트.
 */
function onTab1SelectionChange(e){
	var tab1 = e.control;
	
	if (e.newSelection.id == 2) {
		app.lookup("grp2").visible = false;
	} else {
		app.lookup("grp2").visible = true;
	}
	
}

/*
 * 그리드에서 dblclick 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 더블 클릭할 때 발생하는 이벤트.
 */
function onGrd2Dblclick(e){
	var grd2 = e.control;
	var vsAppId = util.Grid.getCellValue(app, "grd2", "appId");
	var vsCallPage;
	// 임베딩 화면 예외처리
	if (vsAppId == "A5-9-1") {
		vsCallPage = "app/sce/A5/A5-9.clx";
	} else {
		/** @type cpr.data.DataSet */
		var vcDsAllMenu = app.getRootAppInstance().lookup("dsAllMenu");
		if(vcDsAllMenu.findUnfilteredFirstRow("MENU_ID == '" + vsAppId + "'")) {
			vsCallPage = vcDsAllMenu.findUnfilteredFirstRow("MENU_ID == '" + vsAppId + "'").getValue("CALL_PAGE");	
		}
	}
	
	util.getMainApp(app).callAppMethod("doOpenMenuToEa", vsCallPage)
}

/*
 * 인풋 박스에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onIpb3Keydown(e) {
	var ipb3 = e.control;
	if (e.keyCode == cpr.events.KeyCode.ENTER) {
		app.lookup("btnSearch").click();
	}
}
