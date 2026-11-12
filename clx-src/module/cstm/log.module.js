/************************************************
 * log.module.js
 * Created at 2022. 1. 10. 오후 1:05:55.
 *
 * @author daye
 ************************************************/

var logStatusCode = {
	"-1": "정의되지 않은 예외 발생",
	"0": "정상 수행",

	"1": "대상 Log 디렉토리 생성 실패",
	"2": "Log 메시지 기록 실패",
	
	"3": "대상 Log 디렉토리를 찾을 수 없음",
	"4": "대상 파일을 찾을 수 없음",
	
	"5": "대상 파일을 읽을 수 없음",
	"6": "대상 디렉토리의 파일 리스트 획득 실패",
	
	"7": "대상 디렉토리 경로를 식별할 수 없음",
};

function getStatusCode(stsCd){
	return logStatusCode[stsCd] + "[" + stsCd + "]";
}

function _getConn(app) {
	/** @type cpr.core.AppInstance */
	var rootAppIns = app.getRootAppInstance();
	if (rootAppIns && rootAppIns.hasAppMethod("conn")) { 
		return rootAppIns.callAppMethod("conn");
	}
}

/**
 * 
 * @param {cpr.core.AppInstance} app
 * @param {String} psMsg
 * @param {Boolean} pbSuccessAlert?
 */
globals.setLogMsg = function(app, psMsg, pbSuccessAlert) {
	var conn = _getConn(app);
	if (conn == null || !conn.isConnected()) return;
	
	/* 전체 시나리오 로그 파일 */
	var serviceId = "logsvc.WriteLog";
	var targetDir = cpr.core.AppConfig.INSTANCE.getVarConfig().getValue("downloadFilePath") + "log\\"; //C:\\WR-Poc\\log\\
	var targetFile = "tomatosystem_logFile_" + moment().format("YYYYMMDD") + ".log"; // 로그파일명 수정
	
	conn.send(serviceId, {logDirectory: targetDir, fileName: targetFile, message: psMsg}, function(msg) {
//		console.log("writeLog() service result: " + JSON.stringify(msg));
		
		if (msg["statusCode"] == "0000") {
			var returnValue = msg["return"];
			
			if (returnValue == 0) {
				if(ValueUtil.isNull(pbSuccessAlert) || pbSuccessAlert == true) {
					cpr.core.NotificationCenter.INSTANCE.post("app-msg", {
						type : "success",
						message : "로그 파일이 정상적으로 생성되었습니다."
					});
				}
			} else {
//				util.alert(serviceId + " 에러: " + getStatusCode(returnValue));
			}
		} else {
//			util.alert(serviceId + " 호출 에러: " + ExdeviceUtil.getMsg(msg["statusCode"]));
		}
	}, true);
}

