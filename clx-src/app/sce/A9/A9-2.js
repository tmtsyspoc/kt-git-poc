/************************************************
 * A9-2.js
 * Created at 2025. 2. 13. 오전 10:12:49.
 *
 * @author daye
 ************************************************/

var util = createCommonUtil();

/*
 * "Layer Popup 호출" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	util.Dialog.open(app, "app/sce/A9/P9-2-1", 500, -1, function(){
		
	}, {}, {
		modal: ValueUtil.fixBoolean(app.lookup("rdb1").value),
		resizable: ValueUtil.fixBoolean(app.lookup("rdb2").value),
		headerVisible: ValueUtil.fixBoolean(app.lookup("rdb3").value),
		headerMax: ValueUtil.fixBoolean(app.lookup("rdb4").value),
		headerMin: ValueUtil.fixBoolean(app.lookup("rdb5").value),
		headerMovable: ValueUtil.fixBoolean(app.lookup("rdb6").value),
		headerClose: ValueUtil.fixBoolean(app.lookup("rdb7").value)
	})	
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
}
