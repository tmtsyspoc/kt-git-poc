/************************************************
 * T0002.js
 * Created at 2023. 2. 16. 오후 3:17:12.
 *
 * @author tomatosystem
 ************************************************/

/**************************************************
 * 공통 모듈/전역 변수 선언
 **************************************************/
var util = createCommonUtil();

/**************************************************
 * 사용자 정의 함수
 **************************************************/


/**************************************************
 * 이벤트 리스너 함수
 **************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	var voHost = app.getHost();
	if(voHost) {
		var voInitValue = app.getHostProperty("initValue");
		util.DataMap.setValue(app, "DM_PAY", "CUST_NO", voInitValue["CUST_NO"]);
		util.DataMap.setValue(app, "DM_PAY", "PAY_DATE", voInitValue["PAY_DATE"]);
		util.DataMap.setValue(app, "DM_PAY", "PAY_WAY", voInitValue["PAY_WAY"]);
		util.DataMap.setValue(app, "DM_PAY", "REC_NM", voInitValue["REC_NM"]);
		util.DataMap.setValue(app, "DM_PAY", "AMOUNT", voInitValue["AMOUNT"]);
		util.DataMap.setValue(app, "DM_PAY", "PAY_RSN", voInitValue["PAY_RSN"]);
		util.DataMap.setValue(app, "DM_PAY", "CON_NO", voInitValue["CON_NO"]);
		
		util.Control.redraw(app, "grp5");
	}
}

/*
 * "선택" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e) {
	var button = e.control;
	
	var dmPay = app.lookup("DM_PAY");
	
	var returnValue = {
		"CUST_NO" : dmPay.getValue("CUST_NO"),
		"PAY_DATE" : dmPay.getValue("PAY_DATE"),
		"PAY_WAY" : dmPay.getValue("PAY_WAY"),
		"REC_NM" : dmPay.getValue("REC_NM"),
		"AMOUNT" : dmPay.getValue("AMOUNT"),
		"PAY_RSN" : dmPay.getValue("PAY_RSN"),
		"CON_NO" : dmPay.getValue("CON_NO")
	}
	
	// 입력한 정보를 부모화면에 전달
	app.close(returnValue);
}

/*
 * "닫기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick2(e) {
	var button = e.control;
	
	app.close();
}