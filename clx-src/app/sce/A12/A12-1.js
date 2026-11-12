/************************************************
 * A12-1.js
 * Created at 2025. 2. 13. 오후 1:16:41.
 *
 * @author daye
 ************************************************/

var util = createCommonUtil();

/*
 * "Button" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	util.Msg.confirmDlg(app, "버튼 Click 이벤트가 발생했습니다.")
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit2(e){
	app.focuscyclic = true;
}
