/************************************************
 * comPErrorLog.js
 * Created at 2024. 10. 29. 오후 2:53:27.
 *
 * @author HAN
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	/** @type Array */
	var voInitValue = app.getHostProperty("initValue")["errors"];
	var data = [];
	
	voInitValue.forEach(function(each){
		var oneRow = {};
		oneRow["context"] = each.context;
		oneRow["timestamp"] = moment(each.timestamp).format("YYYY-MM-DD HH:mm:sss");
		oneRow["message"] = each.message;
		oneRow["stack"] = each.stack.join("\n");
		oneRow["on"] = "";
		
		data.push(oneRow);
	});
	
	app.lookup("ds1").build(data);
	app.lookup("grd1").redraw();
}
