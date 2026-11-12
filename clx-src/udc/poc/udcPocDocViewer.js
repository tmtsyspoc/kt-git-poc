/************************************************
 * udcPocDocViewer.js
 * Created at 2025. 2. 13. 오전 10:06:04.
 *
 * @author You Minsang
 ************************************************/

/**
 * pdf 기본 너비
 */
var mnPdfWidth = 1040;
var mnBfPdfWidth = 0;
/**
 * pdf 기본 높이
 */
var mnPdfHeight = 725;

var msVeiwType = "pdf";
var mbScreenChange = false;
var mbStart = true;

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	app.setAppProperty("_originFileUrl", app.getAppProperty("fileUrl"));
	app.lookup("imgViewer").visible = false;	
	
	setViewer();
}

function getFileUrl() {
	/* 동일한 폴더 경로에 .pdf, .png 파일이 존재한다는 가정으로 구성합니다.*/
	var vsFileUrl = app.getAppProperty("_originFileUrl");
	var vsViewType = app.getAppProperty("viewType");
	
	if(ValueUtil.isNull(vsFileUrl)) return false;
	
	if (AppProperties.DOCS_VIEW_TYPE == "pdf") {
		vsViewType = "pdf";
	} else {
		vsViewType = "image";
	}
	
	if (AppProperties.SCREEN_DEFAULT_NM.indexOf(app.targetScreen.name) == -1 || cpr.utils.Util.detectBrowser().name == "ie") {
		vsViewType = "image";
	}
		
	msVeiwType = vsViewType;
	
	if (vsViewType == "image") {
		vsViewType = "png";
	}
		
	var vaFilePath = vsFileUrl.split(".");
	
	var vsLastDot = vsFileUrl.lastIndexOf(".");
	var vsFilePath = vsFileUrl.substring(0, vsLastDot);
	var vsFileExt = vsFileUrl.substring(vsLastDot + 1, vsFileUrl.length);
		
	return {
		type: vsViewType,
		url: vsFilePath + "." + vsViewType,
		id: vaFilePath[0]
	}
}

function setViewer() {
	
	var vsFileUrl = app.getAppProperty("_originFileUrl");	
	if(ValueUtil.isNull(vsFileUrl)) return false;
	
	var vcEmpPdfViewer = app.lookup("empPdfViewer");
	var vcImgViewer = app.lookup("imgViewer");
	
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		
		var voViewInfo = getFileUrl();
				
		var vsFileType = voViewInfo["type"];
		var vsFileUrl = voViewInfo["url"];		
		
		if (vsFileType == "pdf") {
			vcImgViewer.visible = false;
			
			var vnZoom = calcScreenZoom();
			vsFileUrl += "#zoom=" + vnZoom;
			
			if (!app.getAppProperty("viewPdfToolbar")) {
				vsFileUrl += "&toolbar=0"
			}
			
			vcEmpPdfViewer.visible = true;			
			vcEmpPdfViewer.src = vsFileUrl;
		} else {
			vcEmpPdfViewer.visible = false;
			vcImgViewer.visible = true;
			
			if (!app.getAppProperty("viewImageRate")) {
				vcImgViewer.style.removeClass("m-rate");
			} else {
				vcImgViewer.style.setClasses("m-rate");
			}
			
			vcImgViewer.src = vsFileUrl;
		}
	});
	
	app.getContainer().redraw();
}
exports.setViewer = setViewer;
var maxCount = 30;
var syncCount = 0;
function calcScreenZoom() {
	if(app.disposed) return false;
	syncCount++;
	
	if(!app.lookup("empPdfViewer").isShowing() && syncCount < maxCount) {
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
			calcScreenZoom();
		});
		return;
	}
	
	syncCount = 0;
	
	var voViewerRect = app.lookup("empPdfViewer").getActualRect();
	
	var vnViewerWidth = voViewerRect.width;
	var vnViewerHeight = voViewerRect.height;
	
	mnBfPdfWidth = vnViewerWidth;
	
	if (app.getAppProperty("viewPdfToolbar")) {
		vnViewerHeight -= 60;
	}
	
	var screenWidth = screen.width;
	var viewportWidth = window.innerWidth;
	
	var browserRate = screenWidth / viewportWidth;
	var browserRateRounded = Number(browserRate.toFixed(3)); // 브라우저 배율
	
	var vnRatioWidth = mnPdfWidth * browserRateRounded;
	var vnRatioHeight = mnPdfHeight * browserRateRounded;
	var scale = vnViewerHeight / vnRatioHeight * browserRateRounded;
	var zoomRate = scale * 100 - 1.5;
	
	var finalZoom = Number((zoomRate * browserRateRounded).toFixed(0));
	if (vnViewerWidth < mnPdfWidth * finalZoom / 100) { // 실제로 화면에 그려질 width
		scale = vnViewerWidth / vnRatioWidth * browserRateRounded;
		zoomRate = scale * 100 - 1.5;
	}
	
	// 디스플레이 배율에 맞춰 보정
	return zoomRate; // 최적화된 배율 계산	
}

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e) {	
	if (e.property == "viewType") {
		setViewer();
	} else if(e.property == "isCover"){
		if(e.newValue){
			app.getContainer().addChild(new cpr.controls.Output(), {
				top : "0px",
				left: "0px",
				right: "0px",
				bottom: "0px"				
			});
		}
	}
}

/*
 * 루트 컨테이너에서 before-draw 이벤트 발생 시 호출.
 * 그룹 컨텐츠가 그려지기 직전에 호출되는 이벤트 입니다. 내부 컨텐츠를 동적으로 구성하기위한 용도로만 사용됩니다.
 */
function onBodyBeforeDraw(e) {
	var group = e.control;
		
	if(!mbScreenChange){
		
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
			var vcEmpPdfViewer = app.lookup("empPdfViewer");
			var vnActurlWidth = vcEmpPdfViewer.getActualRect().width;
			if(vnActurlWidth > 0 && mnBfPdfWidth > 0 && mnBfPdfWidth != vnActurlWidth){
				redrawViewer();
			}	
		});		
	}
	
	mbScreenChange = false;
}

/*
 * 임베디드 페이지에서 load 이벤트 발생 시 호출.
 * 페이지의 Load가 완료되었을 때 호출되는 Event.
 */
function onEmpPdfViewerLoad(e) {
	var empPdfViewer = e.control;
	
	if(mbStart) mbStart = false;
	if(ValueUtil.isNull(empPdfViewer.src)){
		setViewer();
	}
		
//	var vaPdfIframe = document.getElementsByName("empPdfViewer");
//	if(vaPdfIframe.length > 0){
//		var voPdfIframe = vaPdfIframe[0];		
//	}
}


/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 전파되는 이벤트.
 */
function onBodyScreenChange(e) {
	var vcEmpPdfViewer = app.lookup("empPdfViewer");
	var vcImgViewer = app.lookup("imgViewer");
	
	mbScreenChange = true;
	if(AppProperties.SCREEN_DEFAULT_NM.indexOf(e.screen.name) > -1){		
		if(ValueUtil.isNull(vcEmpPdfViewer.src)){
			setViewer();
		}
		vcEmpPdfViewer.visible = true;
		vcImgViewer.visible = false;
	} else {
		vcEmpPdfViewer.visible = false;
		vcImgViewer.visible = true;
	}
}

function redrawViewer(){
	var vcEmpPdfViewer = app.lookup("empPdfViewer");
	var vsViewType = app.getAppProperty("viewType");	
	if (vcEmpPdfViewer.src && !mbStart) {
		vcEmpPdfViewer.src = ""; // 임베디드 페이지 zoom 변경 reload
	}
}