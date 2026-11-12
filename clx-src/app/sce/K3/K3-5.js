/************************************************
 * K3-5.js
 * @프로그램설명 : 
 *
 * @작성일자 :  2026. 11. 5..
 * @작성자 : dyseo
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/
 
/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/ 


/************************************************
 ** 글로벌 함수
 ************************************************/ 


/************************************************
 ** 파일내 로컬변수 선언  
 ************************************************/ 
var util = createCommonUtil();

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/ 

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/* ==== [app/sce/A6/A6-2.clx] 6.2 반응형 디자인 ==== */
/*
 * "시나리오 S1 화면 호출" 버튼(btn11)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn11Click(e){
	var btn11 = e.control;
	var rootAppIns = app.getRootAppInstance();
	if(rootAppIns.hasAppMethod("doOpenMenuToEa")) {
		rootAppIns.callAppMethod("doOpenMenuToEa", "app/sce/A1/A1-1.clx");
	}
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	app.lookup("SUB_LIST").send();
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdb1SelectionChange(e){
	var vsSelection = e.newSelection.value;
	var vcGrdCust = app.lookup("grdCust");
	
	vcGrdCust.userAttr("transform-on-mobile", vsSelection);
	if(vsSelection == "list" || vsSelection == "massiveList") {
		vcGrdCust.userAttr("view-column-indicies", "");
	} else {
		vcGrdCust.userAttr("view-column-indicies", "0,1,2");
	}
	
	app.dispatchEvent(new cpr.events.CScreenChangeEvent({name: "default"}));
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		var voTargetScrn = app.targetScreen;
		app.dispatchEvent(new cpr.events.CScreenChangeEvent({name: voTargetScrn.name, media: voTargetScrn.media}));
	});
}
