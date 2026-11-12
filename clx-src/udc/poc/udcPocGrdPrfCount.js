/************************************************
 * udcPocGrdPrfCount.js
 * Created at 2023. 02. 20. 오전 10:52:17.
 *
 * @author tomatosystem
 ************************************************/

/************************************************
 * import stopwatch
 ************************************************/
var ip_intervalId = -1;

/** @type Number */
var ip_beginTime;

function startImport() {
	if (ip_intervalId !== -1) {
		return;
	}
	ip_beginTime = new Date().getTime();
	ip_intervalId = setInterval(importLoop, 50);
}

function stopImport() {
	if (ip_intervalId == -1) {
		return;
	};
	clearInterval(ip_intervalId);
	ip_intervalId = -1;
}

function importLoop() {
	var elapsed = new Date().getTime() - ip_beginTime ;
	app.lookup("optUploadTime").value = elapsed;
}

exports.startImport = startImport;
exports.stopImport = stopImport;

exports.setImportTime = function(value){
	app.lookup("optUploadTime").value = value;
}

/************************************************
 * export stopwatch
 ************************************************/
var intervalId = -1;

/** @type Number */
var beginTime;

function start() {
	if (intervalId !== -1) {
		return;
	}
	beginTime = new Date().getTime();
	intervalId = setInterval(loop, 50);
}

function stop() {
	if (intervalId == -1) {
		return;
	};
	
	clearInterval(intervalId);
	intervalId = -1;
	var elapsed = new Date().getTime() - beginTime ;
	app.lookup("time-field").value = elapsed;
	//app.lookup("icon").visible = false;
}

function loop() {
	//var elapsed = ((new Date().getTime() - beginTime) / 1000).toFixed(3);
	var elapsed = new Date().getTime() - beginTime ;
	app.lookup("time-field").value = elapsed;
}

exports.start = start;
exports.stop = stop;

exports.getText = function(){
	return app.lookup("time-field").value;
};

exports.getElapsedTime = function(){
	return parseFloat(app.lookup("time-field").value);
};

exports.setDownloadTime = function(value){
	app.lookup("time-field").value = value;
}

var beginRander = -1;
exports.startRander = function (){ 
	beginRander= new Date().getTime();
	app.lookup("optStartTime").value = moment().format("HH:mm:ss:SSS");
}

exports.endRander = function (){ 
	app.lookup("optEndTime").value = moment().format("HH:mm:ss:SSS");
	app.lookup("optTotalTime").value = new Date().getTime() - beginRander;
}

exports.firstLoadRander = function (time){ 
	app.lookup("firstLoadTime").value = new Date().getTime() - beginRander;
}

exports.resetRander = function (){ 
	app.lookup("optStartTime").value = 0;
	app.lookup("optEndTime").value = 0;
	app.lookup("optTotalTime").value = 0;
	app.lookup("firstLoadTime").value = 0;
	app.lookup("optRowCount").value = 0;
	app.lookup("optUploadTime").value = 0;
	app.lookup("optRanderTime").value = 0;
	app.lookup("optNetworkTime").value = 0;
	app.lookup("optServerTime").value = 0;
}

exports.getLog = getLog;
/************************************************
 * property-change 이벤트
 ************************************************/
/*
 * Body에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(/* cpr.events.CPropertyChangeEvent */ e){
	
	if(e.property == "rowCount"){
		app.lookup("optRowCount").redraw();
	}else if(e.property == "randerTime"){
		app.lookup("optRanderTime").redraw();
	}else if(e.property == "serverTime"){
		app.lookup("optServerTime").redraw();
	}else if(e.property == "networkTime"){
		app.lookup("optNetworkTime").redraw();
	}else if(e.property == "downloadTime") {
		app.lookup("time-field").redraw();
	}else if (e.property == "uploadTime") {
		app.lookup("optUploadTime").redraw();
	}else if (e.property == "totalTime") {
		app.lookup("optTotalTime").redraw();
	}else if(e.property == "titleVisible"){
		app.lookup("optTitle").visible = app.getAppProperty("titleVisible");
	}else if(e.property == "randerVisible"){		
		app.lookup("grp3").visible = app.getAppProperty("randerVisible");
	}else if(e.property == "networkVisible"){
		app.lookup("grp9").visible = app.getAppProperty("networkVisible");
	}else if(e.property == "serverTimeVisible"){
		app.lookup("grp10").visible = app.getAppProperty("serverTimeVisible");
	}else if(e.property == "rowCountVisible"){		
		app.lookup("grp5").visible = app.getAppProperty("rowCountVisible");
	} else if(e.property == "downloadTimeVisible") {				
		app.lookup("grp2").visible = app.getAppProperty("downloadTimeVisible");
	} else if(e.property == "uploadTimeVisible") {
		app.lookup("grp1").visible = app.getAppProperty("uploadTimeVisible");		
	} else if(e.property == "totalTimeVisible"){
		app.lookup("grp6").visible = app.getAppProperty("totalTimeVisible");
	} else if(e.property == "startTimeVisible"){
		app.lookup("grp4").visible = app.getAppProperty("startTimeVisible");
	} else if(e.property == "endTimeVisible"){
		app.lookup("grp7").visible = app.getAppProperty("endTimeVisible");
	} else if(e.property == "firstLoadTimeVisible"){
		app.lookup("grp8").visible = app.getAppProperty("firstLoadTimeVisible");
	}
		
}

function getLog(psFirstLog){
	var vsLogs = "";
	//xml read 시간
	var vsXmlRead = app.lookup("optUploadTime").value;
	var vsStartTime = app.lookup("optStartTime").value;
	var vsEndTime = app.lookup("optEndTime").value;
	var vsFirstLoadTime = app.lookup("firstLoadTime").value;
	var vsTotalTime = app.lookup("optTotalTime").value;
	var vsRowCount = app.lookup("optRowCount").value;
	var vsXmlReadRtn = ValueUtil.isNull(vsXmlRead) ? "" : "XML READ 시간 : " + vsXmlRead +"ms\n";
	
	return psFirstLog + "시작시각 : " + vsStartTime +"ms\n" + "종료시각 : " + vsEndTime + "ms\n" + vsXmlReadRtn+ "최초 로드 시간 : " + vsFirstLoadTime + "ms\n" + "처리시간 : " + vsTotalTime + "ms\n" +  "총건수 : " + vsRowCount+"건";
}
