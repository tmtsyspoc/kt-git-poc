/************************************************
 * udcOzReport.js
 * Created at 2025. 1. 9. 오후 5:52:43.
 *
 * @author daye
 ************************************************/

var msLocHref = location.protocol + "//" + location.hostname + ":8081";
var msReportFilePath = "/ui/udc/src/report/oz.jsp"; // report 호출 HTML

/************************************************
 * 출판된 함수
 ************************************************/
/**
 * 레포트를 연동합니다.
 */
function start() {
	var epOz = app.lookup("epOz");
	
	/** @type cpr.data.DataMap */
	var voDmParam = app.getAppProperty("datamapProp");
	
	var postMethod = epOz.getPostMethod(msLocHref + msReportFilePath);
	postMethod.addParameter("filePath", app.getAppProperty("filePath"));
	postMethod.addParameter("odiname", app.getAppProperty("odinames"));
	postMethod.addParameter("params", JSON.stringify(voDmParam.getDatas()));
	postMethod.addParameter("zoom", app.getAppProperty("zoom"));
	
	postMethod.submit();
	postMethod.dispose();
	
}
exports.start = start;

/**
 * 레포트를 파기합니다.
 */
exports.destroy = function() {
	app.lookup("epOz").src = "";
}

exports.setOzOption = function(reportObj) {
	
}

/************************************************
 * 이벤트 리스너
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	var vbStartReport = app.getAppProperty("autoStart");
	if (vbStartReport === true) {
		app.getHostAppInstance().addEventListener("load", function() {
			start();
		});
	}
}