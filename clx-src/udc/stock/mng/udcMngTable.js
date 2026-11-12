/************************************************
 * udcMngTable.js
 * Created at 2025. 4. 11. 오후 3:00:45.
 *
 * @author HWPS
 ************************************************/

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};


exports.getData = function(){
	
	return {
		value : app.lookup("ipbTitle").value,
		type:"table",
		hasSub: "Y",
		sub_value: [{"value":app.lookup("edt1").getValue()}]
	}
}

exports.setData = function(poData){
	console.log(poData);
	app.lookup("ipbTitle").value = poData["value"];
	if(poData["sub_value"]) {
		
		app.lookup("edt1").setValue(poData["sub_value"][0]["value"]);
	}
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	app.lookup("edt1").initValue = "table"
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var button = e.control;
	var evt = new cpr.events.CAppEvent("mng-delete");
	app.dispatchEvent(evt);
}
