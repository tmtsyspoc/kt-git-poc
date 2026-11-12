/************************************************
 * P1-1-5.js
 * Created at 2025. 2. 12. 오후 2:39:27.
 *
 * @author daye
 ************************************************/

var util = createCommonUtil();

exports.setReturnValue = function(returnValue) {
	if(returnValue) {
		app.lookup("dsList").build(returnValue);
		window.focus();
	}
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
}


/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var voHost = app.getHost();
	if(voHost) {
		// Layer Popup
		var initValue = voHost["initValue"];
		if(initValue) {
			app.lookup("dsList").build(initValue);
			
			/** @type cpr.controls.Dialog */
			var dialog = app.getHost();
			dialog.headerTitle = app.app.title +app.getRootAppInstance().dialogManager.getDialogName(dialog);
		}
	} else {
		// Window Popup
		var voWinInit = window.opener ? window.opener.initValue : window.parent.initValue;
		window.opener._childApp.push(app);
		if (voWinInit != undefined && voWinInit != null) {
			app.lookup("dsList").build(voWinInit);
		}
	}
}

/*
 * "전달" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	
	var voHost = app.getHost();
	var voRtnValue = app.lookup("dsList").getRowDataRanged();
	if (voHost) {
		// Layer Popup
		var dialogMngr = app.getRootAppInstance().dialogManager;
		var vaDlgNames = dialogMngr.getDialogNames();
		vaDlgNames.splice(vaDlgNames.indexOf(dialogMngr.getDialogName(app.getHost())), 1);
		
		if(vaDlgNames.length == 0) {
			// 모든 다이얼로그 닫힘
			// 부모 화면에 데이터 전달
			var hostAppInstance = util.Dialog.getOpenerApp(app);
			if(hostAppInstance.hasAppMethod("setReturnValue")) {
				hostAppInstance.callAppMethod("setReturnValue", voRtnValue);
				app.close();
			}
		} else {
			var voTargetDialog = dialogMngr.getDialogByName(vaDlgNames[vaDlgNames.length-1]);
			if(voTargetDialog) {
				// 다른 다이얼로그 존재
				// 자식 다이얼로그에 데이터 전달
				var voPopAppIns = voTargetDialog.getEmbeddedAppInstance();
				if(voPopAppIns.hasAppMethod("setReturnValue")) {
					voPopAppIns.callAppMethod("setReturnValue", voRtnValue);
					dialogMngr.activateDialogByName(vaDlgNames[vaDlgNames.length-1]);
					app.close();
				}
			}
		}
		
	} else {
		// Window Popup
		var hostApp = window.opener._app;
		var childApp = window.opener._childApp;
		childApp.splice(childApp.indexOf(app), 1);
		
		if(childApp.length == 0) {
			// 모든 자식 window pop 닫힘
			// 부모 화면에 데이터 전달
			if(hostApp && hostApp.hasAppMethod("setReturnValue")) {
				hostApp.callAppMethod("setReturnValue", voRtnValue);
				window.close();
			}
		} else {
			// 다른 자식 window 존재
			// 자식 window에 데이터 전달
			/** @type cpr.core.AppInstance */
			var voTargetWin = childApp[childApp.length-1];
			if(voTargetWin && voTargetWin.hasAppMethod("setReturnValue")) {
				voTargetWin.callAppMethod("setReturnValue", voRtnValue);
				window.close();
			}
		}
	}
}

/*
 * "닫기" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	var voHost = app.getHost();
	if(voHost) {
		app.close();
	} else {
		window.close();
	}
}

/*
 * 루트 컨테이너에서 before-unload 이벤트 발생 시 호출.
 * 앱이 언로드되기 전에 발생하는 이벤트 입니다. 취소할 수 있습니다.
 */
function onBodyBeforeUnload(e){
	if(!app.getHost()) {
		var childApp = window.opener._childApp;
		childApp.splice(childApp.indexOf(app), 1);
		window.opener._childApp = childApp;
	}
}
