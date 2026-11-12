/************************************************
 * debuggingContext.module.js
 * Created at 2024. 10. 28. 오후 5:40:26.
 * CTRL + 우클릭시 디버깅 컨텍스트 메뉴를 생성하기 위한 모듈
 * console객체의 error, log 함수 오버라이드로 콘솔창에 표시되는 로그 정보를 변수에 저장하고 출력하는데 사용
 * @author HAN
 ************************************************/
var logs = [];
var errors = [];
var isCtrl = false;
var context = null;
var debugModule = null;
var CSRF_TOKEN = null;

globals.getCSRFToken = function(){
	return CSRF_TOKEN;
}
globals.setCSRFToken = function(str){
	CSRF_TOKEN = str;
}
//
//console._error = console.error;
//console.error = function(){
//	this._error.apply(null,arguments);
//	logs.push({"type":"_error","msg":Array.from(arguments),"time":moment()});
//	
//}

globals.getErrorLog = function(){
	return errors;
}
globals.clearErrorLog = function(){
	errors = [];
}
globals.getLog = function(){
	return logs;
}
globals.clearLog = function(){
	logs = [];
}
//
//console._log = console.log;
//console.log = function(){
////	this._log.apply(null,arguments);
//	logs.push({"type":"_log","msg":Array.from(arguments),"time":moment()});
//}
//
//console._all = function(){
//	logs.forEach(function(each){
//		var callee = console[each.type];
//		each.msg.forEach(function(each){
//			callee(each);
//		})
//	});
//}
//
/**
 * 
 * @param {cpr.events.CUIEvent} e
 */
function logPush(e) {
	var control = e.targetControl;
	if(control) {
		var apps = control.getAppInstance ? control.getAppInstance() : null;
		if(apps && logs.length > 0) {
			if(logs[logs.length-1].targetControl.getAppInstance() !=apps) {
				logs = [];
			}
		}
			logs.push(e);
	}
}

cpr.core.Platform.INSTANCE.onerror = function(report){
	errors.push(report);
	cpr.core.NotificationCenter.INSTANCE.post("error-occured", {"data":report});
};

cpr.events.EventBus.INSTANCE.addFilter("click", function(e){
	if(e.control == e.targetControl) {
		logPush(e);
	}
});
cpr.events.EventBus.INSTANCE.addFilter("item-click", function(e){
	logPush(e);
});
cpr.events.EventBus.INSTANCE.addFilter("selection-change", function(e){
	logPush(e);
});
/**
 * 우클릭 컨텍스트 메뉴를 생성하고 변수에 저장하는 함수
 */
function createContextMenu(){
	if (!context) {
		
		var vaMenuList = [
			{label:"로그 보기",value:"log",parentValue:""},
			{label:"dataCollection 보기 (CTRL+ALT+A)",value:"data",parentValue:""},
			{label:"소스보기",value:"source",parentValue:""},
			{label:"전체 새로고침",value:"refresh_all",parentValue:""},
			{label:"새로고침",value:"refresh",parentValue:""},
			{label:'소스 에러 관리',value:"error",parentvalue:""}
			
		]
		var vcMenu = new cpr.controls.Menu();
		
		vaMenuList.forEach(function(each){
			vcMenu.addItem(new cpr.controls.MenuItem(each.label, each.value, each.parentValue));
		});
		vcMenu.addEventListener("item-click", function(e){
			e.control.visible = false;
			var vsValue = e.item.value;
			
			if (vsValue == "log") {
				var util = createCommonUtil();
				var vcApp = e.control.getAppInstance();
				util.Dialog.open(vcApp,"app/sce/A5/A5-4P",900,600,function(){
					
				});
				
			} else if (vsValue == "data") {
				
				if (debugModule == null) {
					
					debugModule = cpr.core.Module.require("module/cstm/createNewAppIns");
				}
				debugModule._openDialog();
			} else if (vsValue == "source") {
				var util = createCommonUtil();
				var vcApp = util.getMenuApp(e.control.getAppInstance());
				var voRealApp = vcApp.app;
				var vsAppId = voRealApp.id;
				util.Dialog.open(vcApp, "app/com/comPViewSource", 900, 600, function(){
					
				},{pageId:vsAppId});
				
			} else if (vsValue == "refresh_all") {
				
				location.reload();
			} else if (vsValue == "refresh") {
				
				var vcApp = e.control.getAppInstance();
				var voRealApp = vcApp.app;
				var vsAppId = voRealApp.id;
				var voHost = vcApp.getHost();
				context = null;
				vcApp.dispose();
				var vaIns = voRealApp.getInstances();
				if (vaIns.length < 1) {
					
					voRealApp.unload();
				}
				cpr.core.App.load(vsAppId, function(loadedApp) {
					if (voHost) {
						
						voHost.app = loadedApp;
						voHost.ready(function(ea) {
							ea.getEmbeddedAppInstance()["_menuApp"] = true;
						});
					} else {
						
						loadedApp.createNewInstance().run();
					}
				});
			}
			else if(vsValue == "error") {
				
				var util = createCommonUtil();
				var vcApp = e.control.getAppInstance();
				util.Dialog.open(vcApp, "app/sce/A10/A10-3P", 900, 600, function(){
					
				},{"errors" : errors});
			}
		});
		vcMenu.addEventListener("blur", function(e){
			e.control.visible = false;
			e.control.clearSelection();
		});
		
		context = vcMenu;
	}
	
	return context;
}

cpr.events.EventBus.INSTANCE.addFilter("contextmenu", function(e){
	var control = e.control;
	if(isCtrl) {
		e.stopPropagation();
		e.preventDefault();
		var util = createCommonUtil();
		/** @type cpr.core.AppInstance */
		var _app = control.getAppInstance();
		if(_app.isUDCInstance()) {
			_app = _app.getHostAppInstance();
		}
		var voRect = _app.getActualRect();
		var target = null;
		if(!context || ValueUtil.isNull(context.getAppInstance())) {
			context = null;
			target = createContextMenu();
		} else {
			target = context;
		}
		
		if(ValueUtil.isNull(target)) return;
		
		var targetLeft = e.clientX - voRect.x;
		var targetTop = e.clientY - voRect.y;
		var itemConstraint = {//근사값
			"width" : 270,
			"height": 152
		}
		if(targetLeft + itemConstraint.width > voRect.width) {
			targetLeft -= itemConstraint.width;
		}
		if(targetTop + itemConstraint.height > voRect.height) {
			targetTop -= itemConstraint.height;
		}
		_app.floatControl(target,{
			left: targetLeft+"px",
			top: targetTop+"px",
			width:"auto",
			height:"auto"			
		});
		target.visible = true;
		target.focus();
	} else {
		if(context){
			context.visible = false;
		}
	}
});

//window.addEventListener("keydown", function(e){
//	if(e.keyCode == cpr.events.KeyCode.CTRL) {
//		isCtrl = true;
//	}
//});
//window.addEventListener('keyup', function(e){
//	if(e.keyCode == cpr.events.KeyCode.CTRL) {
//		isCtrl = false;
//	}
//});
