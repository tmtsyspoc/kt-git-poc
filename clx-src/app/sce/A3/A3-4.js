/************************************************
 * A3-4.js
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

/************************************************
 ** 컨트롤 이벤트
 ************************************************/

/*
 * 인풋 박스에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onInputBoxClick(e){
	var inputBox = e.control;
	util.Dialog.open(app, "app/sce/A3/A3-4P-2", 500, 600, function(e) {
		var dialog = e.control;
		var voReturnValue = dialog.returnValue;
		if(voReturnValue) {
			app.lookup("dmUser").build(voReturnValue.selectRow.getRowData());
			app.lookup("ipbReceiver").redraw();
		}
	});
}

/*
 * "승인" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var ws = getSocket();
	if(app.lookup("cmbDoc").value == "0") {
		util.Msg.alertDlg(app, "문서 종류를 선택해주세요.", null, {
			confirmCallback: function(){
				app.lookup("cmbDoc").focus();
			}
		});
		return;
	} else if(ValueUtil.isNull(app.lookup("dmUser").getValue("userId"))) {
		util.Msg.alertDlg(app, "책임자를 선택해주세요.", null, {
			confirmCallback: function(){
				app.lookup("ipbReceiver").focus();
			}
		});
		return;
	} else if(ValueUtil.isNull(app.lookup("ipbTitle").value)) {
		util.Msg.alertDlg(app, "제목을 입력해주세요.", null, {
			confirmCallback: function(){
				app.lookup("ipbTitle").focus();
			}
		});
		return;		
	}
	
	/** @type cpr.data.DataSet */
	var vcNotiMsg = app.getRootAppInstance().lookup("dsNotiMsg");
	var vaKeyVal = vcNotiMsg.getColumnData("KEY");
	var vnKey = 0;
	if(vaKeyVal.length > 0) vnKey = _.max(vaKeyVal)+1;
	
	var vcUdcEdit = app.lookup("udcEditor"); 
	msWsMsg.receiver = app.lookup("dmUser").getValue("userId"); // 메시지를 받을 사람
	msWsMsg.senderId = util.Main.getUserInfo(app, "USER_ID"); // 메시지를 받을 사람 아이디
	msWsMsg.senderName = util.Main.getUserInfo(app, "USER_NM"); // 메시지를 받을 사람 아이디
	msWsMsg.reqStatus = "REQ"; // 요청 상태
	msWsMsg.message =  vcUdcEdit.getValue();
	msWsMsg.msgTitle =  app.lookup("ipbTitle").value;
	msWsMsg.apprKind = app.lookup("cmbDoc").getSelection()[0].label;
	msWsMsg.key = vnKey;
	msWsMsg.msgType = "APPROVAL_RESPONSIBLE";
	if(ws) {
		ws.send(JSON.stringify(msWsMsg));
		util.Msg.alertDlg(app, "승인이 요청되었습니다.", null, {
			confirmCallback: function(){
				vcNotiMsg.addRowData({
					KEY: vnKey,
					APPR_KIND: msWsMsg.apprKind,
					SENDER_NM: app.lookup("dmUser").getValue("userNm"),
					SENDER_ID: msWsMsg.receiver,
					APPR_RESULT: msWsMsg.reqStatus,
					MSG_TITLE: msWsMsg.msgTitle,
					CONTENTS: msWsMsg.message
				})
				app.getRootAppInstance().lookup("btnMdiRefresh").click();
			}
		});
	}
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	app.lookup("ipbSender").value = util.Main.getUserInfo(app, "USER_NM");
	util.Submit.send(app, "subApproval", function(pbSuccess) {
		if(pbSuccess) {
			
		}
	});
}

/*
 * 콤보 박스에서 before-selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장되기 전에 발생하는 이벤트. 다음 이벤트로 selection-change가 발생합니다.
 */
function onCmbDocBeforeSelectionChange(e){
	if(e.oldSelection[0].value != "0") {
		var voNewSelection = e.newSelection[0];
		util.Msg.confirmDlg(app, "문서 종류를 바꾸시겠습니까?\n작성한 내용은 저장되지 않습니다.", null, {
			confirmCallback: function(){
				if(voNewSelection.value != "0") {
					var voContents = voNewSelection.row.getValue("contents");
					app.lookup("udcEditor").setValue(voContents);
					app.getContainer().redraw();
				} else {
					app.getContainer().redraw();
				}
				e.control.putValue(voNewSelection.value);
				
				app.lookup("grpContents").getLayout().setRowVisible(0, (voNewSelection.value != "0"));	
	
				var voGrpDataLayout = app.lookup("grpInnerContents").getLayout();
				voGrpDataLayout.setRowVisible(1, (voNewSelection.value == "0"));
				voGrpDataLayout.setRowVisible(2, (voNewSelection.value != "0"));
			},
			cancelCallback: function(){
			}
		});
		e.preventDefault();
	} else {
		var voContents = e.newSelection[0].row.getValue("contents");
		app.lookup("udcEditor").setValue(voContents);
		app.getContainer().redraw();	
	}
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbDocSelectionChange(e){
	var cmbDoc = e.control;
	app.lookup("grpContents").getLayout().setRowVisible(0, (cmbDoc.value != "0"));	
	
	var voGrpDataLayout = app.lookup("grpInnerContents").getLayout();
	voGrpDataLayout.setRowVisible(1, (cmbDoc.value == "0"));
	voGrpDataLayout.setRowVisible(2, (cmbDoc.value != "0"));
}
