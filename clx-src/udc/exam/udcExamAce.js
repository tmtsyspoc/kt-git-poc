/************************************************
 * udcScrAce.js
 * Created at 2021. 1. 26. 오후 5:21:36.
 *
 * @author ryu
 ************************************************/

var myCodeMirror = null;

var loaded = false;
/**
 * 코드를 정렬합니다.
 * @param {String} value
 */
function beautify(value) {
	
	if (value == null || value == "") {
		return "";
	}
	
	var code = String(value);
	var mode = app.getAppProperty("language");
	
	if (mode == "javascript") {
		code = js_beautify(code);
	} else if (mode == "text/css" || mode == "text/x-less") {
		code = css_beautify(code);
	} else if (mode == "text/html") {
		code = html_beautify(code);
	}
	
	return code;
}

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange( /* cpr.events.CPropertyChangeEvent */ e) {
	if (!myCodeMirror) {
		return;
	}
	if (e.property == "value") {
		myCodeMirror.setValue(beautify(e.newValue));
	}
}

/*
 * 쉘에서 init 이벤트 발생 시 호출.
 */
function onShlCdMrInit( /* cpr.events.CUIEvent */ e) {
	if (!loaded || myCodeMirror) {
		e.preventDefault();
	}
}

/*
 * 쉘에서 load 이벤트 발생 시 호출.
 */
function onShlCdMrLoad( /* cpr.events.CUIEvent */ e) {
	var code = app.getAppProperty("value") || "";
	var mode = app.getAppProperty("language");
	var theme = "eclipse";
	
	myCodeMirror = CodeMirror(e.content, {
		value: beautify(code),
		mode: mode,
		theme: theme,
		lineNumbers: true,
		readOnly: true
	});
	//Ace 에디터 로드 시점에 이벤트 넣을수 있도록 로직 구현
	var event = new cpr.events.CUIEvent("afterLoad");
	app.dispatchEvent(event);
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad( /* cpr.events.CEvent */ e) {
//	app.lookup("shlCdMr").style.css("overflow", "hidden");
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 * CheckBox의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onCbxFldEdtValueChange( /* cpr.events.CValueChangeEvent */ e) {
	/** 
	 * @type cpr.controls.CheckBox
	 */
	var cbxFldEdt = e.control;
	
	var vcGrpCn = app.getContainer();
	var voGrpCnLt = vcGrpCn.getLayout();
	
	var vbFold = cbxFldEdt.checked;
	voGrpCnLt.setRowVisible(1, !vbFold);
}

/*
 * 버튼(btnCp)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCpClick( /* cpr.events.CMouseEvent */ e) {
	myCodeMirror.execCommand("selectAll");
	myCodeMirror.focus();
	document.execCommand("copy");
	
	myCodeMirror.setSelection({
		line: -1
	});
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	
	//해당 스크립트가 먼저 불러와져야 함
	var resourceLoader = new cpr.core.ResourceLoader();
	resourceLoader.addScript("./thirdparty/codemirror/codemirror-5.60.0/lib/codemirror.js");
	
	var resourceLoaderAfter = new cpr.core.ResourceLoader();

	resourceLoader.load().then(function(input) {
		
		resourceLoaderAfter.addScript("./thirdparty/codemirror/codemirror-5.60.0/mode/javascript/javascript.js");
		resourceLoaderAfter.addScript("./thirdparty/codemirror/codemirror-5.60.0/mode/clike/clike.js");
		resourceLoaderAfter.addScript("./thirdparty/codemirror/codemirror-5.60.0/mode/css/css.js");
		resourceLoaderAfter.addScript("./thirdparty/codemirror/codemirror-5.60.0/mode/xml/xml.js");
		resourceLoaderAfter.addScript("./thirdparty/codemirror/codemirror-5.60.0/mode/sql/sql.js");
		resourceLoaderAfter.addScript("./thirdparty/codemirror/js-beautify/beautify.js");
		resourceLoaderAfter.addScript("./thirdparty/codemirror/js-beautify/beautify-html.js");
		resourceLoaderAfter.addScript("./thirdparty/codemirror/js-beautify/polyfill.min.js");
		resourceLoaderAfter.addCSS("./thirdparty/codemirror/codemirror-5.60.0/lib/codemirror.css");
		resourceLoaderAfter.addCSS("./thirdparty/codemirror/codemirror-5.60.0/theme/eclipse.css");
		
		resourceLoaderAfter.load().then(function(input){
			loaded = true;
			app.lookup("shlCdMr").redraw();
			
		});
	});	
	
}
