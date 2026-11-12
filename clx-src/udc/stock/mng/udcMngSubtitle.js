/************************************************
 * udcMngSubtitle.js
 * Created at 2025. 4. 11. 오전 9:43:38.
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
		value : app.lookup("txa1").value,
		type:"subtitle"
	}
}

exports.setData = function(poData){
	app.lookup("txa1").value = poData["value"];
	app.getContainer().redraw();
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
