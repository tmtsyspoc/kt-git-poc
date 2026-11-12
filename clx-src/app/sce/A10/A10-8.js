/************************************************
 * screenLayout.js
 * Created at 2023. 2. 27. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/
/************************************************
 * 전역변수
 ************************************************/
/**
 * 
 */
var util = createCommonUtil();

/************************************************
 * 사용자정의함수
 ************************************************/

/************************************************
 * 컨트롤 이벤트
 ************************************************/
cpr.events.EventBus.INSTANCE.addFilter("keydown", function(e){
	/** @type cpr.controls.UIControl */
	var vcControl = e.control;
	if(typeof vcControl["userAttr"] !== "undefined" && vcControl.userAttr("useSecurityYn") == "Y"){
		//컨트롤 + C 입력 방지
		if(e.ctrlKey && e.keyCode == cpr.events.KeyCode.C){
			e.preventDefault();
			util.Msg.alertDlg(app, "대상 컨트롤의 데이터 복사가 제한되었습니다.");
		}
	}
});

cpr.events.EventBus.INSTANCE.addFilter("contextmenu", function(e){
	/** @type cpr.controls.UIControl */
	var vcControl = e.control;
	if(typeof vcControl["userAttr"] !== "undefined" && vcControl.userAttr("useSecurityYn") == "Y"){
		e.preventDefault();
		util.Msg.alertDlg(app, "대상컨트롤의 데이터 복사 방지를 위해 컨텍스트 메뉴 사용이 제한되었습니다.");
	}
});

///*
// * 그리드에서 copy 이벤트 발생 시 호출.
// * Grid의 선택된 요소를 ctrl + c 로 복사했을 때 발생하는 이벤트.
// */
//function onGrd1Copy(e){
//	var vcGrid = e.control;
//	var voLayout = vcGrid.getColumnLayout();
//	var vbIsSecurityCtrl = voLayout.detail.some(function(each){
//		var vcChildCtrl = vcGrid.detail.getControl(each.cellIndex);
//		return vcChildCtrl.userAttr("useSecurityYn") == "Y";
//	});
//	
//	if(vbIsSecurityCtrl){
//		e.preventDefault();
//		util.Msg.alertDlg(app, "대상 컨트롤의 데이터 복사가 제한되었습니다.");
//	}
//}
