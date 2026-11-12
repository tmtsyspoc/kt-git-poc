/************************************************
 * A12-2.js
 * Created at 2025. 2. 13. 오후 1:16:46.
 *
 * @author daye
 ************************************************/


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

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	app.lookup("rdbColor").value = localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-color") || "default";
}

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
