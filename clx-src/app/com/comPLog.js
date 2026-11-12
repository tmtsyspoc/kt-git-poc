/************************************************
 * comPLog.js
 * Created at 2024. 10. 29. 오전 11:21:44.
 *
 * @author HAN
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var voInitValue = app.getHostProperty("initValue");
	/** @type Array */
	var data = voInitValue["data"];
	
	data.forEach(function(each){
		var msg = each.msg;
		createLogItem(each.type,each.msg,each.time);
	});
}

/**
 * 
 * @param {"_log"|"_error"} type
 * @param {Array} msg
 * @param {moment} time
 */
function createLogItem(type,msg,time){
	
	var vcContainer = new cpr.controls.Container();
	var voForm = new cpr.controls.layouts.FormLayout();
	var row = new cpr.controls.layouts.FormDivision("28px");
	row.autoSizing = true;
	voForm.setRowDivisions([row]);
	voForm.setColumns(["1fr","150px"]);
	voForm.bottomMargin = "10px"
	vcContainer.setLayout(voForm);
	vcContainer.style.setClasses(["border-b-2","border-b-base","border-solid"]);
	var errorLog = new cpr.controls.Output();
	if(type == "_error") {
		errorLog.style.addClass("text-danger");
	}
	errorLog.value = msg.map(function(each){
		return objectString(each);
	}).join("\n");
	vcContainer.addChild(errorLog, {	
		rowIndex:0,
		colIndex:0
	});
	var times = new cpr.controls.Output();
	times.value = time.format("YYYY-MM-DD HH:MM:sss");
	vcContainer.addChild(times,{
		rowIndex:0,
		colIndex:1,
		verticalAlign : "top"
	});
	
	app.lookup("grpLog").addChild(vcContainer, {
		autoSize: "height"
	});
}

/**
 * 
 * @param {Object} obj
 */
function objectString(obj) {
	
	if(!(obj instanceof Object)) {
		return JSON.stringify(obj);
	}
	var result = obj.constructor.name + ": {";
	for(var im in obj) {
		result += "'"+im+"':"+"'"+obj[im]+"',";
	}
	result = result.slice(0,-1)+"}"
	return result;
}