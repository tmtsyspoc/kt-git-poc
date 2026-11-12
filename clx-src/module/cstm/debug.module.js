/************************************************
 * debug.module.js
 * Created at 2022. 1. 5. 오후 5:35:07.
 *
 * @author daye
 ************************************************/

var mcDataset = new cpr.data.DataSet();
mcDataset.parseData({
	"columns" : [
		{"name": "type"},
		{"name": "msg"}
	]
});

var mbTraceEvt = true;

cpr.events.EventBus.INSTANCE.addFilter("click", function(e){
	/** @type cpr.controls.UIControl */
	var control = e.control;
	
	if(!(control instanceof cpr.controls.UIControl) || control.getAppInstance() == null || !mbTraceEvt) return;

	var util = createCommonUtil();
	
	var vsAppId = control.getAppInstance().app.id;
	var vsMsg = "[" + moment().format("YYYY-MM-DD HH:mm:ss:SSS") + "] " +  e.type + " 이벤트 발생 - " + control.type + " (" + vsAppId + ".clx)";
	
	_insertLog(e, vsMsg);
	
	//_pushLog는 eXDevice+가 필요 현재는 제외 하기로 함
	//_pushLog(e, util);
});


cpr.events.EventBus.INSTANCE.addFilter("selection-change", function(e){
	/** @type cpr.controls.UIControl */
	var control = e.control;
	
	if(!(control instanceof cpr.controls.UIControl) || control.getAppInstance() == null || !mbTraceEvt) return;

	var util = createCommonUtil();
	
	var vsAppId = control.getAppInstance().app.id;
	var vsMsg = "[" + moment().format("YYYY-MM-DD HH:mm:ss:SSS") + "] " +  e.type + " 이벤트 발생 - " + control.type + " (" + vsAppId + ".clx)";
	
	_insertLog(e, vsMsg);
	
	//_pushLog는 eXDevice+가 필요 현재는 제외 하기로 함
	//_pushLog(e, util);
});

cpr.events.EventBus.INSTANCE.addFilter("before-submit", function(e){
	/** @type cpr.controls.UIControl */
	var control = e.control;
	
	if(!(control instanceof cpr.controls.UIControl) || control.getAppInstance() == null || !mbTraceEvt) return;

	var util = createCommonUtil();
	
	var vsAppId = control.getAppInstance().app.id;
	var vsMsg = "[" + moment().format("YYYY-MM-DD HH:mm:ss:SSS") + "] " +  e.type + " 이벤트 발생 - " + control.type + " (" + vsAppId + ".clx)";
	
	_insertLog(e, vsMsg);
	
	//_pushLog는 eXDevice+가 필요 현재는 제외 하기로 함
	//_pushLog(e, util);
});

cpr.events.EventBus.INSTANCE.addFilter("submit-done", function(e){
	/** @type cpr.controls.UIControl */
	var control = e.control;
	
	if(!(control instanceof cpr.controls.UIControl) || control.getAppInstance() == null || !mbTraceEvt) return;

	var util = createCommonUtil();
	
	var vsAppId = control.getAppInstance().app.id;
	var vsMsg = "[" + moment().format("YYYY-MM-DD HH:mm:ss:SSS") + "] " +  e.type + " 이벤트 발생 - " + control.type + " (" + vsAppId + ".clx)";
	
	_insertLog(e, vsMsg);
	
	//_pushLog는 eXDevice+가 필요 현재는 제외 하기로 함
	//_pushLog(e, util);
});

function _insertLog (evt, psMsg) {
	
	if(mcDataset == null) return;
	
	if(mcDataset.getRowCount() == 100) {
		mcDataset.clearData();	
	}	
	
	// TODO DB연동 으로 할 경우 서버와 연동하는 스크립트를 작성하십시오.	
	mcDataset.pushRowData({
		"type" : evt.type,
		"msg" : psMsg
	});
	
	// 이벤트 추적 메시지 로그에 저장
	//setLogMsg는 eXDevice+가 필요 현재는 제외 하기로 함
	//setLogMsg(evt.control.getAppInstance(), psMsg, false);
}


function _pushLog (evt, util) {
	
	/** @type cpr.controls.UIControl */
	var control = evt.control;
	var voRootAppIns = control.getAppInstance().getRootAppInstance();
	
	if(voRootAppIns && voRootAppIns.app.id == "app/com/main") {
		
		var vsUserNm = cpr.core.Platform.INSTANCE.getParameter("userNm");
		if(vsUserNm != "user1") return;
		
		var vsParam = {
			"log": JSON.stringify(mcDataset.getRowDataRanged()),
			"type": "LOG",
			"from": vsUserNm,
			"to": "admin"
		};
		
		voRootAppIns.lookup("subPush").removeAllParameters();
		
		var voParams = JSON.stringify(vsParam);
		util.Submit.addParameter(voRootAppIns, "subPush", "messageTxt", voParams);
		util.Submit.send(voRootAppIns, "subPush", function(pbSuccess) {
			if (pbSuccess) {
			}
		}, null, "none");
		
	}
}

exports.getLogMsg = function (){
	return mcDataset;
}

exports.setTraceEvt = function (pbTrace){
	mbTraceEvt = pbTrace;
}