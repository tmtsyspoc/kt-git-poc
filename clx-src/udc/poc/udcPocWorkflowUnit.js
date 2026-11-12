/************************************************
 * udcPocWorkflowUnit.js
 * Created at 2025. 8. 7. 오전 9:49:04.
 *
 * @author cin07
 ************************************************/

/************************************************
 ** 공통모듈
 ************************************************/
var util = createCommonUtil();

/************************************************
 ** 사용자 정의 함수
 ************************************************/
/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

/**
 * 활성화 적용
 */
exports.setActive = function setActive(){
	var vsEmbId = app.getAppProperty("embId");
	util.Control.addClass(app, "btnUnit", "active");
	util.EmbApp.dispose(app.getHostAppInstance(), vsEmbId);
	util.EmbApp.setPage(app.getHostAppInstance(), vsEmbId, app.getAppProperty("src"), {"appId" : app.id, "title" : app.getAppProperty("btnText")})
}

/**
 * 활성화 제거
 */
exports.removeActive = function removeActive(){
	util.Control.removeClass(app, "btnUnit", "disabled");
	util.Control.removeClass(app, "btnUnit", "active");
}

/************************************************
 ** 컨트롤 이벤트
 ************************************************/
/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e){
	// 버튼 모양
	if(e.property == "shape"){
		util.Control.setClasses(app, "btnUnit", "shape " + app.getAppProperty("shape"));
	}
	// 버튼명
	if(e.property == "btnText"){
		util.Control.setValue(app, "btnUnit", app.getAppProperty("btnText"));
	}
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	// 기본 shape은 rectangle 처리
	var vsShape = app.getAppProperty("shape");
	if(ValueUtil.isNull(vsShape)) {
		vsShape = "rectangle";
		app.setAppProperty("shape", vsShape);
	}
	
	// 기본은 disabled 처리
	util.Control.setClasses(app, "btnUnit", ["shape", vsShape, "disabled"]);
}

/*
 * "워크플로우 Unit" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	// disabled 아닌 경우
	if(!app.lookup("btnUnit").style.hasClass("disabled")){
		// 부모창에 버튼 인덱스 전달
		app.getHostAppInstance().setAppProperty("btnIndex", app.getAppProperty("index"));
		var vsEmbId = app.getAppProperty("embId");
		
		// 버튼 다시 활성화
		util.Control.addClass(app, "btnUnit", "active");
		// 기존 임베디드 제거 후 다시 오픈
		util.EmbApp.dispose(app.getHostAppInstance(), vsEmbId);
		// 임베디드 앱에 타이틀 전달
		util.EmbApp.setPage(app.getHostAppInstance(), vsEmbId, app.getAppProperty("src"), {"appId" : app.id,"title" : app.getAppProperty("btnText")})
		
		// 버튼 이벤트 출판
		var evt = new cpr.events.CUIEvent("btn-click");
		app.dispatchEvent(evt);
	}
}


