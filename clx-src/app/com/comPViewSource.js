/************************************************
 * comPDebug.js
 * Created at 2024. 10. 29. 오전 10:36:46.
 *
 * @author HAN
 ************************************************/

var util = createCommonUtil();

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var voInitValue = app.getHostProperty("initValue");
	
	var pageId = voInitValue["pageId"];
	app.lookup("sub1").action = pageId+".clx.js";
	
	util.Submit.send(app, "sub1", function(pbSuccess,poSub){
		var res = poSub.xhr.responseText;
		app.lookup("udcexamace1").value = res;
	});
}
