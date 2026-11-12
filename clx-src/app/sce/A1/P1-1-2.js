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
		util.DataMap.setValue(app, "DM_COUNSEL", "CUST_NO", voInitValue["CUST_NO"]);
		util.DataMap.setValue(app, "DM_COUNSEL", "CONS_DT", voInitValue["CONS_DT"]);
		util.DataMap.setValue(app, "DM_COUNSEL", "CONS_NM", voInitValue["CONS_NM"]);
		util.DataMap.setValue(app, "DM_COUNSEL", "CON_NO", voInitValue["CON_NO"]);
		util.DataMap.setValue(app, "DM_COUNSEL", "TEL", voInitValue["TEL"]);
		util.DataMap.setValue(app, "DM_COUNSEL", "CONS_TYPE", voInitValue["CONS_TYPE"]);
		util.DataMap.setValue(app, "DM_COUNSEL", "CONS_DESC", voInitValue["CONS_DESC"]);
		
		util.Control.redraw(app, "grpData");
	}
}

/*
 * "선택" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e) {
	var button = e.control;
	
	var dmCounsel = app.lookup("DM_COUNSEL");
	
	var returnValue = {
		"CUST_NO" : dmCounsel.getValue("CUST_NO"),
		"CONS_DT" : dmCounsel.getValue("CONS_DT"),
		"CONS_NM" : dmCounsel.getValue("CONS_NM"),
		"CON_NO" : dmCounsel.getValue("CON_NO"),
		"TEL" : dmCounsel.getValue("TEL"),
		"CONS_TYPE" : dmCounsel.getValue("CONS_TYPE"),
		"CONS_DESC" : dmCounsel.getValue("CONS_DESC")
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