/************************************************
 * A3-4P-2.js
 * Created at 2025. 8. 5. 오후 4:34:34.
 *
 * @author 
 ************************************************/
var util = createCommonUtil();
/*
 * "닫기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var button = e.control;
	app.close();
}

/*
 * "선택" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick2(e){
	if(app.lookup("tre_lsit").getSelection().length == 0){
		util.Msg.alertDlg(app, "책임자를 선택해주세요.");
		return;
	}
	var voSelectedRow = app.lookup("tre_lsit").getSelection()[0].row;
	var voReturnValue = {
		selectRow : voSelectedRow
	}
	app.close(voReturnValue);
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
}

/*
 * 트리에서 item-dblclick 이벤트 발생 시 호출.
 * 아이템 더블 클릭시 발생하는 이벤트.
 */
function onTre_lsitItemDblclick(e){
	app.lookup("btnSelect").click();
}
