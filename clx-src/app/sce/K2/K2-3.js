/************************************************
 * K2-3.js
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

/*
 * 라디오 아이템의 value 를 class 이름으로 보고 미리보기 컨테이너의 테마 class 를 교체한다.
 * 조직/업무 테마가 늘어나도(LESS 믹스인 호출 추가 + 라디오 아이템 추가) 이 함수는 수정하지 않는다.
 * @param {cpr.controls.RadioButton} pcRadio 조직 또는 업무 라디오 버튼
 */
function applyThemeClass(pcRadio) {
	var vcPreview = app.lookup("grpOrgPreview");
	var vaItems = pcRadio.getItems();

	for (var i = 0; i < vaItems.length; i++) {
		vcPreview.style.removeClass(vaItems[i].value);
	}
	vcPreview.style.addClass(pcRadio.value);
}

/*
 * 선택된 조직/업무 이름과 적용된 class 를 화면에 표시한다.
 */
function refreshOrgPreview() {
	var vcRdbOrg = app.lookup("rdbOrg");
	var vcRdbWork = app.lookup("rdbWork");

	app.lookup("optPvOrg").value = vcRdbOrg.getItemByValue(vcRdbOrg.value).label;
	app.lookup("optPvWork").value = vcRdbWork.getItemByValue(vcRdbWork.value).label;
	app.lookup("optApplied").value = "org-preview " + vcRdbOrg.value + " " + vcRdbWork.value;
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/* [A12/A12-2.clx] */
/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbColorSelectionChange(e){
	var voElBody = document.body;
	
	var vcItem = e.newSelection;
	var vsItemColor = vcItem.value;
	if (vsItemColor == "default") {
		var vsDefault = localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-theme") || "light";
		voElBody.setAttribute("data-cl-mode", vsDefault);
	} else {
		voElBody.setAttribute("data-cl-mode", vcItem.value);
	}
	
	localStorage.setItem(AppProperties.PROJECT_NM + "data-xb-color", vcItem.value);
}

/* [A12/A12-2.clx] */
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	app.lookup("rdbColor").value = localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-color") || "default";
}

/* [A12/A12-2.clx] */
/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCbx1ValueChange(e){
	var cbx1 = e.control;
	
	var rootAppIns = app.getRootAppInstance();
	var rootContainer = rootAppIns.getContainer();
	
	if(rootContainer.style.hasClass("invert")) {
		rootContainer.style.removeClass("invert");
	} else {
		rootContainer.style.addClass("invert");
	}
}

/* [A12/A12-2.clx] */
/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCbx3ValueChange(e){
	var cbx = e.control;
	
	var voRootAppIns = app.getRootAppInstance();
	var voElBody = document.body;
	if(cbx.checked) {
		voElBody.setAttribute("class", "dark-mode");
	} else {
		voElBody.removeAttribute("class", "dark-mode");
	}
	
	if(voRootAppIns.hasAppMethod("setDarkLogo")) {
		voRootAppIns.callAppMethod("setDarkLogo", voElBody.classList.contains("dark-mode"));
	}
}

/* [K2-3.clx] */
/*
 * 조직 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbOrgSelectionChange(e){
	applyThemeClass(e.control);
	refreshOrgPreview();
}

/* [K2-3.clx] */
/*
 * 업무 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbWorkSelectionChange(e){
	applyThemeClass(e.control);
	refreshOrgPreview();
}
