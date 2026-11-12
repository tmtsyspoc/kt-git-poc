/************************************************
 * comNotiPop.js
 * Created at 2023. 5. 16. 오후 2:35:58.
 *
 * @author csj_9
 ************************************************/
var util = createCommonUtil();
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var voInitvalue = app.getHost().initValue;
	app.lookup('opt2').value = voInitvalue.time;
	app.lookup('hspt1').value = voInitvalue.Text || voInitvalue.MSG;
	
	if(!ValueUtil.isNull(voInitvalue.adminMsg)) {
		app.lookup("grp2").getLayout().setRowVisible(1, true);
		app.lookup("optAdminMsg").value = voInitvalue.adminMsg;
	}
}

/*
 * 루트 컨테이너에서 dblclick 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 더블 클릭할 때 발생하는 이벤트.
 */
function onBodyDblclick(e) {
	var group = e.control;
	util.getMainApp(app).callAppMethod("doOpenMenuToEa", "app/sce/A3/A3-4-1.clx")
}
