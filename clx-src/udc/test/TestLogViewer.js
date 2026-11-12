/************************************************
 * TestLog.js
 * Created at 2023. 03. 06. 오전 11:59:25.
 *
 * @author tomatosystem
 ************************************************/

/**
 * 
 * @param {Number} idx
 * @param {Boolean} success
 * @param {String} expected
 * @param {String} actual
 * @param {String} note
 */
exports.setResult = function(idx, success, expected, actual, note) {
	var row = app.lookup("ds1").getRow(idx);
	row.setValue("success", String(success));
	row.setValue("expected", String(expected));
	row.setValue("actual", String(actual));
	row.setValue("note", String(note || ""));
	app.lookup("grd1").redraw();
}

/**
 * 
 * @param {String} title
 * @param {String} code
 */
exports.addTest = function(title, code) {
	app.lookup("ds1").addRowData({
		title: title,
		code: code
	});
}

function show(){
	app.getHost().style.addClass("shown");
};

function hide(){
	app.getHost().style.removeClass("shown");	
}

exports.show = show;
exports.hide = hide;

/*
 * "..." 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(/* cpr.events.CMouseEvent */ e){
	var showing = app.getHost().style.hasClass("shown");
	if(showing){
		hide();
	}else{
		show();
	}
}

/*
 * "닫기" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	hide();
}
