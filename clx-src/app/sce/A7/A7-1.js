/************************************************
 * screenLayout.js
 * Created at 2023. 2. 27. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/
var util = createCommonUtil();
/*
 * "조회" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	util.Submit.send(app, "subRetrieve", function(){
		
		var vcEmb = app.lookup("embpage1");
		var contentWindow = document.getElementsByName(vcEmb.frameName).item(0).contentWindow;
		var vaData = app.lookup("dsData").getRowDataRanged();
		contentWindow.postMessage({
			"type":"data",
			"data": vaData
		},"*");
	});
}

/*
 * "필터" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	var embpage1 = e.control;
	var vcEmb = app.lookup("embpage1");
	var contentWindow = document.getElementsByName(vcEmb.frameName).item(0).contentWindow;
	contentWindow.postMessage({
		"type" : "filter",
		"data" : util.Control.getValue(app, "ipbSearch")
	},"*");
}

/*
 * 인풋 박스에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onIpbSearchKeydown(e){
	var ipbSearch = e.control;
	if(e.keyCode == cpr.events.KeyCode.ENTER) {
		
		app.lookup("btnFilter").click();
	}
}

