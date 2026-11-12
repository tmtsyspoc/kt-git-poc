/************************************************
 * udcCmnCustomerSearch.js
 * Created at 2023. 2. 16. 오후 2:04:42.
 *
 * @author tomatosystem
 ************************************************/

var util = createCommonUtil();

/**************************************************
 * 이벤트 리스너 함수
 **************************************************/

/*
 * 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e) {
	var btnSearch = e.control;
	
	/* 팝업 호출 */
	util.Dialog.open(app, "app/src/1_demonstration/T0002", 1100, 720, function(e) {
		/* 팝업 close 후 처리 동작*/
		var dialog = e.control;
		
		// 팝업에서 내려받은 파라미터로 현재 화면의 데이터를 구성합니다.
		var returnValue = dialog.returnValue;
		
		if (returnValue) {
			app.lookup("ipbCsNam").value = returnValue["CS_NAM"];		// 고객명
			app.lookup("mseRrn").value = returnValue["RRN"];			// 주민등록번호
			
			app.setAppProperty("GNDR_SECD", returnValue["GNDR_SECD"]);	// 성별
			app.setAppProperty("PRCMPAG", returnValue["PRCMPAG"]);		// 보험나이
			app.setAppProperty("RGDT", returnValue["RGDT"]);			// 상령일
			app.setAppProperty("CPNM", returnValue["CPNM"]);			// 직업
			app.setAppProperty("DRVG_SENM", returnValue["DRVG_SENM"]);	// 운전
			
			// 선택한 고객정보를 return받아 고객정보 변경시 이벤트 출판
			var event = new cpr.events.CValueChangeEvent("customer-value-change", {				
				newValue: returnValue
			});
						
			app.dispatchEvent(event);			
		}	
	});
	
}

/*
 * 인풋 박스에서 keyup 이벤트 발생 시 호출.
 * 사용자가 키에서 손을 뗄 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onIpbCustomerNmKeyup(e) {
	var ipbCustomerNm = e.control;
	
	// 엔터키 입력시 고객검색 팝업 호출
	if (e.keyCode == cpr.events.KeyCode.ENTER) {
		app.lookup("btnSearch").click();
	}
}

/*
 * 인풋 박스에서 clear 이벤트 발생 시 호출.
 * 인풋박스에서 esc키 또는 클리어버튼을 클릭하여 인풋의 값이 Clear될때 발생하는 이벤트
 */
function onIpbCustomerNmClear(e) {
	var ipbCustomerNm = e.control;
	
	// 이름 clear시 주민등록번호 clear
	app.lookup("mseRrn").clear();
}

/*
 * 인풋 박스에서 value-change 이벤트 발생 시 호출.
 * 변경된 value가 저장된 후에 발생하는 이벤트.
 */
function onIpbCustomerNmValueChange(e) {
	var ipbCustomerNm = e.control;
	
	// 이름 제거시 주민등록번호 clear
	if (ValueUtil.isNull(ipbCustomerNm.value)) {
		app.lookup("mseRrn").clear();
	}
}