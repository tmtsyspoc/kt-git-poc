/************************************************
 * udcComFormTItle.js
 * Created at 2024. 7. 19. 오후 5:48:47.
 *
 * @author ryu
 ************************************************/

/************************************************
 ** 파일내 로컬변수 선언  
 ************************************************/
var util = createCommonUtil();


/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/
function findTargetCtrl () {
	var vcCtrl = app.getAppProperty("ctrl");
	if(!vcCtrl) {
		var voHost = app.getHost();
		if(voHost) {
			var vcTitleWrap = voHost.getParent();
			var vcParent = vcTitleWrap.getParent();
			var vnCurIndex = vcParent.getChildren().indexOf(vcTitleWrap);
			vcCtrl = vcParent.getChildren()[vnCurIndex+1];
		}
	}
	
	return vcCtrl;
}

function doPopoutView () {
	/** @type cpr.controls.Grid */
	var vcViewCtrl = findTargetCtrl();
	if(vcViewCtrl == null || !(vcViewCtrl instanceof cpr.controls.Container)) {
		util.Msg.notify(app, "확대보기 할 컨트롤을 찾을 수 없습니다.");
		return false;
	}
	
	var copyMdl = createCtrlCopyModule();
	var copyForm = copyMdl.copy(vcViewCtrl);
	
	// 팝 아웃 시키기전 필요한 상태들을 백업 함.
	util.Dialog.open(app, "app/com/comPopoutView", 1600, 770, function(evt){
		/** @type cpr.controls.Dialog */
		var dialog = evt.control;
		var returnValue = dialog.returnValue;
		if(returnValue && returnValue["control"]) {
			var voParent = vcViewCtrl.getParent();
			var voConstraint = voParent.getConstraint(vcViewCtrl);
			voParent.addChild(returnValue["control"], voConstraint);
			voParent.removeChild(vcViewCtrl);
		}
	}, {
		control : copyForm
	}, {
	});
}

/************************************************
 ** 이벤트 핸들러 
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var vcCtrl = app.getAppProperty("ctrl");
	if(vcCtrl){
		app.lookup("optTitle").value = vcCtrl.fieldLabel;
	}else{
		if(app.lookup("optTitle").value == ""){
			app.lookup("optTitle").value = "제목없음";
		}
	}
}

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e){
	
	if(e.property == 'typeClass') {
		var vsTitleType = app.getAppProperty("typeClass");
		var vcOptTit = app.lookup("optTitle");
		
		if(vsTitleType == "sub") {
			vcOptTit.style.removeClass("tit");
			vcOptTit.style.addClass("sub-tit");
		}
	}
	
	if(e.property == "required") {
		var vcOptTit = app.lookup("optTitle");
		vcOptTit.style.addClass("label");
		vcOptTit.style.addClass("required");
	}
}

/*
 * "아래 컨트롤 토글" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e) {
	var button = e.control;
	var vcCtrl = findTargetCtrl();
	
	if(!ValueUtil.isNull(vcCtrl)) {
		vcCtrl.visible = !vcCtrl.visible;
		
		if (button.style.icon.hasClass("off")) {
			button.style.icon.removeClass("off");
		} else {
			button.style.icon.addClass("off");
		}
	}
}

/*
 * "아래 컨트롤 확대/축소" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e) {
	doPopoutView();
}
