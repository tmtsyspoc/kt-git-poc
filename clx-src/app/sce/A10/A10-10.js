/************************************************
 * N3-1.js
 * Created at 2025. 8. 1. 오후 4:35:36.
 *
 * @author dyseo
 ************************************************/

/************************************************
 ** 공통모듈
 ************************************************/
var util = createCommonUtil();

/************************************************
 ** 글로벌 변수, 전역변수
 ************************************************/

/************************************************
 ** 사용자 정의 함수
 ************************************************/

/************************************************
 ** 컨트롤 이벤트
 ************************************************/

/*
 * "관리자 메뉴" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	if (util.getMainApp(app).callAppMethod("getUserInfo", "USER_TYPE") == "admin") {
		util.getMainApp(app).callAppMethod("doOpenMenuToEa", "app/sce/ADMIN/A1.clx")
	} else {
		util.Msg.alertDlg(app, "WRN-M030");
	}
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	var userType = util.Main.getUserInfo(app, "USER_TYPE");
	if(userType == "admin") {
		app.lookup("embAdmin").visible = true;
	}
}
