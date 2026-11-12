/************************************************
 * udcClipReport.js
 * Created at 2025. 1. 9. 오후 1:41:15.
 *
 * @author daye
 ************************************************/

var moReportObj = null; // 기존 그려진 clip report object
var msLocHref = location.protocol + "//"+location.hostname + ":8081";

/************************************************
 * 출판된 함수
 ************************************************/
/**
 * 레포트를 연동합니다.
 */
function start() {
	var voContent = app.lookup("shlClip").getComponent("content");
	if(!voContent) return false;
	
	if(moReportObj != null) {
		// 기존에 그려진 레포트가 있을 경우 close
		moReportObj.callCloseView(); 
	}
	
	var oof = new OOFDocument();
	oof.addFile("crf.root", ("%root%/crf/" + app.getAppProperty("filePath")));
	
	// 매개변수 세팅
	var vcDataMap = app.getAppProperty("datamapProp");
	if(vcDataMap instanceof cpr.data.DataMap) {
		vcDataMap.getColumnNames().forEach(function(args){
			var paramValue = vcDataMap.getValue(args);
			if(paramValue) {
				oof.addField(args, paramValue);
			}
		});
	}
	
	// 클립레포트 세팅
	var clip = createOOFReport(msLocHref+"/clip/report_server.jsp", oof.toString(), voContent);
	
	// 레포트 객체 저장
	moReportObj = clip;
	
	/* 레포트 옵션 설정 */
	 setClipOption(clip);
	 
	// 레포트 실행
	clip.view();	
}

/**
 * 레포트를 파기합니다.
 */
function destroy() {
	var voContent = app.lookup("shlClip").getContentNode();
	var childNodes = voContent.childNodes;
	for(var idx = 0; idx < childNodes.length; idx++){
		childNodes.item(0).remove();
	}
	
	moReportObj = null;
}

/**
 * 레포트 옵션 설정
 * @param {ReportView} reportObj
 */
function setClipOption (reportObj) {
	if(!reportObj) return false;
	
	/* 썸네일 미리보기 여부 */ 
	reportObj.setThumbnailUse(app.getAppProperty("setThumbnailUse"));
	
	/* 메뉴 툴바 보이기 여부 */
	reportObj.setVisibleMenu(app.getAppProperty("setVisibleMenu"));
	
	/* 화면 비율 */
	if(app.getAppProperty("defaultRatio") != null) {
		reportObj.setDefaultRatio(app.getAppProperty("defaultRatio"));
	}
	
	/* 커스텀 저장 버튼 사용 여부 (hwp, xls, pdf, doc 순) */ 
	if(app.getAppProperty("customSaveButton") != null){
		var vaUseCustomBtn = app.getAppProperty("customSaveButton").replace(/ /gi, "").split(",");
		var vbUseBtn0 = vaUseCustomBtn[0] == "true" ? true: false;
		var vbUseBtn1 = vaUseCustomBtn[1] == "true" ? true: false;
		var vbUseBtn2 = vaUseCustomBtn[2] == "true" ? true: false;
		var vbUseBtn3 = vaUseCustomBtn[3] == "true" ? true: false;
		reportObj.setCustomSaveButton(vbUseBtn0, vbUseBtn1, vbUseBtn2, vbUseBtn3); 
	}
	
	/* 웹접근성 준수 여부 (설정 시 HTML4로 구성) */
 	reportObj.setAccessibility(app.getAppProperty("useAccessibility"));
	
	/* 헤더버튼 사이즈 */
	if(app.getAppProperty("headerButtonSize") != null) {
		var vsButtonSize = app.getAppProperty("headerButtonSize") + "px";
		reportObj.setHeaderButtonSize(vsButtonSize);
	}
	
	/* 저장버튼 visible 여부 */
	if(app.getAppProperty("setSaveButtonVisible") != null) {
		reportObj.setStyle("save_button", "visibility : " + app.getAppProperty("setSaveButtonVisible"));
	}
	
	/* 프린트버튼 visible 여부 */
	if(app.getAppProperty("setPrintButtonVisible") != null) {
		reportObj.setStyle("print_button", "visibility : " + app.getAppProperty("setSaveButtonVisible"));
	}
	
	/* 화면비율 콤보박스 visible 여부 */
	if(app.getAppProperty("setRatioComboVisible") != null) {
		reportObj.setStyle("zoomIn", "visibility : " + app.getAppProperty("setRatioComboVisible"));
	}
	
	/* info버튼 visible 여부 */
	if(app.getAppProperty("setInfoButtonVisible") != null) {
		reportObj.setStyle("info_box", "visibility : " + app.getAppProperty("setInfoButtonVisible"));
	}
	
	/* 닫기버튼 visible 여부 */
	if(app.getAppProperty("setCloseButtonVisible") != null) {
		reportObj.setStyle("close_button", "visibility : " + app.getAppProperty("setCloseButtonVisible"));
	}
	
	/* 페이징박스 visible 여부 */
	if(app.getAppProperty("setPageBoxVisible") != null) {
		var vbVisible = app.getAppProperty("setPageBoxVisible");
		reportObj.setStyle("firstPage_button", "visibility : " + vbVisible);
		reportObj.setStyle("prev_button", "visibility : " + vbVisible);
		reportObj.setStyle("next_button", "visibility : " + vbVisible);
		reportObj.setStyle("lastPage_button", "visibility : " + vbVisible);
		reportObj.setStyle("count_box", "visibility : " + vbVisible);
	}
	
	/* 화면비율 콤보 아이템 visible 여부 */
	if(app.getAppProperty("setRatioComboNameVisible") != "" && app.getAppProperty("setRatioComboNameVisible") != null) {
		var vaRatioItemVisible = app.getAppProperty("setRatioComboNameVisible").replace(/ /gi, "").split(",");
		if(vaRatioItemVisible.length != 2) {
			alert("형식이 잘못되었습니다.\n예시 : 70%,false");
		} else {
			var vbVisible = vaRatioItemVisible[1] =="true" ? true: false;			
			reportObj.setRatioComboNameVisible(vaRatioItemVisible[0], vbVisible);
		}
	}
}

/************************************************
 * 출판
 ************************************************/
exports.start = start;
exports.destroy = destroy;

/************************************************
 * 이벤트 리스너
 ************************************************/
/*
 * 쉘에서 init 이벤트 발생 시 호출.
 * 쉘 컨트롤의 내용이 그려지기 전 초기화 하는 이벤트.
 */
function onUIControlShellInit(e){
	if(e.content) {
		e.preventDefault();
	}
}

/*
 * 쉘에서 load 이벤트 발생 시 호출.
 * 쉘이 그려진 후 내용을 작성하는 이벤트.
 */
function onUIControlShellLoad(e){
	var shlClip = e.control;
	
	if(shlClip.getComponent("content") == null) {
		shlClip.registerComponent("content", e.content);
	}
	
	var resourceLoader = new cpr.core.ResourceLoader();
	resourceLoader.addCSS(msLocHref+"/clip/css/clipreport5.css");
	resourceLoader.addCSS(msLocHref+"/clip/css/UserConfig5.css");
	resourceLoader.addCSS(msLocHref+"/clip/css/font.css");
	resourceLoader.addScript(msLocHref+"/clip/js/jquery-1.11.1.js");
	resourceLoader.addScript(msLocHref+"/clip/js/clipreport5.js");
	resourceLoader.addScript(msLocHref+"/clip/js/UserConfig5.js");
	resourceLoader.addScript(msLocHref+"/clip/js/oof/OOFDocument.js");
	resourceLoader.load(function(error){
		
		var evt = new cpr.events.CUIEvent("report-load");
		app.dispatchEvent(evt);
		
		var vbStartReport = app.getAppProperty("autoStart");
		if(vbStartReport === true) {
			start();
		}
	});
}
