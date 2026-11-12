/************************************************
 * udcDashItem8.js
 * Created at 2026. 5. 15. 오전 9:19:54.
 *
 * @author suhyu
 ************************************************/

var util = createCommonUtil();
/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e) {
	var button = e.control;
	
	util.Control.setVisible(app.getHostAppInstance(), true, ["grpHd","grpDashSetBtns", "grpItemListWrap"]);
	
	app.getHostAppInstance().callAppMethod("setCustomMode","UPDATE")
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick3(e) {
	var button = e.control;
	util.getMainApp(app).lookup("btnLogout").click();
}

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e) {
	if(e.property == "name") {
		app.lookup("optName").redraw();
	}
}
