/************************************************
 * A2-3.js
 * Created at 2025. 2. 12. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/

var util = createCommonUtil();


/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	
	var vcRdbDuplLogin = app.lookup("rdbDuplLogin");
	if(AppProperties.MAIN_DUPL_LOGIN_ALLOWED){
		vcRdbDuplLogin.value = "Y";
	} else {
		vcRdbDuplLogin.value = "N";
	}	
}

/*
 * "로그인 시간 변경" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	var voMainApp = util.getMainApp(app);
	if(voMainApp.hasAppMethod("setSessionTime")){
		voMainApp.callAppMethod("setSessionTime", 3);	
	}	
}

/*
 * "로그인 시간 연장" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	
	var voMainApp = util.getMainApp(app);
	var vcSessionTime = voMainApp.lookup("btnAddTime");
	if(vcSessionTime){
		vcSessionTime.click();
	}	
		
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdb1SelectionChange(e){
	var rdb1 = e.control;
	
	if(rdb1.value == "Y"){
		sendDuplicateLoginOption(true);
	} else {
		sendDuplicateLoginOption(false);
	}	
}

// 중복 로그인 허용 여부 전달하는 함수
function sendDuplicateLoginOption(allow) {
	var ws = getSocket();
    var message = {
        receiver: util.Main.getUserInfo(app, "USER_TYPE"),
        allowDuplicateLogin: allow
    };
    
    ws.send(JSON.stringify(message));
}

