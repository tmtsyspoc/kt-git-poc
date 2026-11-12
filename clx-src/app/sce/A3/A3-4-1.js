/************************************************
 * A3-4-1.js
 * Created at 2025. 8. 1. 오후 4:34:34.
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
var msWsMsg = {
	receiver : "",
	message : ""
}
/************************************************
 ** 사용자 정의 함수
 ************************************************/
function copyToRootMsg() {
	/** @type cpr.data.DataSet */
	var vcDsNotiMsg = app.getRootAppInstance().lookup("dsNotiMsg");
	if(vcDsNotiMsg.getRowCount() > 0) {
		var vcDsApproval = app.lookup("dsApproval");
		vcDsApproval.clearData();
		vcDsNotiMsg.copyToDataSet(vcDsApproval);	
		vcDsApproval.refresh();
		
		if (util.DataSet.getRowCount(app, "dsApproval") > 0) {
			util.Grid.selectRow(app, "grdApproval", 0);
		}
	}
}

/**
 * 승인/반려에 따라 메인화면내 메시지 상태값 변경
 * @param {String} psApproval
 * @param {Number} pnKey
 */
function replaceRootMsg(psApproval, pnKey) {
	/** @type cpr.data.DataSet */
	var vcDsNotiMsg = app.getRootAppInstance().lookup("dsNotiMsg");
	var voFirstRow = vcDsNotiMsg.findFirstRow("KEY == '" + pnKey + "'");
	if(voFirstRow) {
		if(psApproval == "APR") { // 승인
			vcDsNotiMsg.putValue(voFirstRow.getIndex(), "APPR_RESULT", psApproval);
		} else if(psApproval == "REJ") { // 반려
			vcDsNotiMsg.putValue(voFirstRow.getIndex(), "APPR_RESULT", psApproval);
		}	
		copyToRootMsg();
	}
}

function getConfirmApprove (type, callback) {
	util.Dialog.open(app, "app/sce/A3/A3-4P-3", 500, -1, function(evt) {
		/** @type cpr.controls.Dialog */
		var dialog = evt.control;
		var returnValue = dialog.returnValue;
		if(returnValue) {
			callback(returnValue);
		}
	}, {
		type : type
	});
}

/************************************************
 ** 컨트롤 이벤트
 ************************************************/
/*
 * 그리드에서 selection-change 이벤트 발생 시 호출.
 * detail의 cell 클릭하여 설정된 selectionunit에 해당되는 단위가 선택될 때 발생하는 이벤트.
 */
function onGrdApprovalSelectionChange(e){
	var grdApproval = e.control;
	var vnRow = e.newSelection[0];
	var vsContents = grdApproval.getRow(vnRow).getValue("CONTENTS");
	app.lookup("optMsg").value = grdApproval.getRow(vnRow).getValue("ADMIN_MSG");
	app.lookup("udcEditor").setValue(vsContents);
}

/*
 * "승인" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var grdApproval = app.lookup("grdApproval");
	if(grdApproval.getSelectedRowIndex() == -1) {
		util.Msg.alertDlg(app, "승인할 건이 없습니다.");
		return;
	} else if(grdApproval.getRow(grdApproval.getSelectedRowIndex()).getValue("APPR_RESULT") != "REQ") {
		util.Msg.alertDlg(app, "처리가 완료된 건입니다.");
		return;
	}
	
	getConfirmApprove("승인", function (msg){
		var vsReceiver = grdApproval.getRow(grdApproval.getSelectedRowIndex()).getValue("SENDER_ID");
		var ws = getSocket();
		msWsMsg.receiver = vsReceiver;
		msWsMsg.senderId = util.Main.getUserInfo(app, "USER_ID"); // 메시지를 받을 사람 아이디
		msWsMsg.senderName = util.Main.getUserInfo(app, "USER_NM"); // 메시지를 받을 사람 아이디
		msWsMsg.message =  grdApproval.getRow(grdApproval.getSelectedRowIndex()).getValue("CONTENTS");
		msWsMsg.msgTitle =  grdApproval.getRow(grdApproval.getSelectedRowIndex()).getValue("MSG_TITLE");
		msWsMsg.apprKind =  grdApproval.getRow(grdApproval.getSelectedRowIndex()).getValue("APPR_KIND");
		msWsMsg.key =  grdApproval.getRow(grdApproval.getSelectedRowIndex()).getValue("KEY");
		msWsMsg.reqStatus = "APR"; // 요청 상태
		msWsMsg.msgType = "APPROVAL_RESPONSIBLE";
		msWsMsg.adminMsg = msg;
		if(ws) {
			ws.send(JSON.stringify(msWsMsg));
			replaceRootMsg("APR", grdApproval.dataSet.getValue(grdApproval.getSelectedRowIndex(), "KEY"));
		}
	});
}

/*
 * "반려" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick2(e){
	var grdApproval = app.lookup("grdApproval");
	if(grdApproval.getSelectedRowIndex() == -1) {
		util.Msg.alertDlg(app, "반려할 건이 없습니다.");
		return;
	}
	
	getConfirmApprove("반려", function (msg) {
		var vsReceiver = grdApproval.getRow(grdApproval.getSelectedRowIndex()).getValue("SENDER_ID");
		var ws = getSocket();
		
		msWsMsg.receiver = vsReceiver;
		msWsMsg.senderId = util.Main.getUserInfo(app, "USER_ID"); // 메시지를 받을 사람 아이디
		msWsMsg.senderName = util.Main.getUserInfo(app, "USER_NM"); // 메시지를 받을 사람 아이디
		msWsMsg.message =  grdApproval.getRow(grdApproval.getSelectedRowIndex()).getValue("CONTENTS");
		msWsMsg.msgTitle =  grdApproval.getRow(grdApproval.getSelectedRowIndex()).getValue("MSG_TITLE");
		msWsMsg.key =  grdApproval.getRow(grdApproval.getSelectedRowIndex()).getValue("KEY");
		msWsMsg.reqStatus = "REJ"; // 요청 상태
		msWsMsg.msgType = "APPROVAL_RESPONSIBLE";
		msWsMsg.adminMsg = msg;
		if(ws) {
			ws.send(JSON.stringify(msWsMsg));
			replaceRootMsg("REJ", grdApproval.dataSet.getValue(grdApproval.getSelectedRowIndex(), "KEY"));
		}
	});
}

/*
 * 사용자 정의 컨트롤에서 afterLoad 이벤트 발생 시 호출.
 */
function onUdcEditorAfterLoad(e){
	var udcEditor = e.control;
	udcEditor.setReadOnly(true);
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	copyToRootMsg();
	if(util.Main.getUserInfo(app, "USER_TYPE") != "admin") {
		app.lookup("grpData").getLayout().setRowVisible(0, false);
		app.lookup("grdApproval").header.getColumn(3).text = "결재자";
		
		app.lookup("grpContent").getLayout().setRowVisible(0, true);
	}
}
