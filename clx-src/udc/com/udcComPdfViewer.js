/************************************************
 * udcCmnPdfViewer.js
 * Created at 2023. 9. 22. 오전 10:06:04.
 *
 * @author You Minsang
 ************************************************/

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
    // TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
    return "";
};

function closeViewer(){
	app.getRootAppInstance().lookup("udcPdfViewer").dispose();
}

/*
 * 루트 컨테이너에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBodyClick(e) {
    var group = e.control;
    
    if (group.type == "container" && group.style.hasClass("viewer-overlay")) {
         closeViewer();
    }
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
    
    var fileUrl = app.getAppProperty("fileUrl");
    var pageNo = app.getAppProperty("pageNo");
    
    if(ValueUtil.isNull(fileUrl)){
       fileUrl = "../ui/app/eXBuilder6.pdf#toolbar=0"; 
    }
    
    if(ValueUtil.isNull(pageNo)){
    	pageNo = 1;
    }
    
    fileUrl += "#view=Fit&zoom=page-width";
    
    setPdfFile(fileUrl, true);
}

/**
 * 임베디드 페이지에 pdf를 오픈합니다.
 * @param {String} psFileUrl pdf 파일 경로
 * @param {Boolean} pbIsFloting? 플로팅 여부(default : false, 화면 구성이 다릅니다.)
 */
function setPdfFile(psFileUrl, pbIsFloting){
    
    pbIsFloting = ValueUtil.isNull(pbIsFloting) ? false : pbIsFloting;
    var vcEmpPdfViewer = app.lookup("empPdfViewer");
    
    if(!pbIsFloting){
        app.getContainer().updateConstraint(vcEmpPdfViewer, {
            top : "0px",
            bottom : "0px",
            left : "0px",
            right : "0px"
        });
        app.lookup("toolbar").visible = false;  
    } else {
        app.lookup("toolbar").visible = true;  
    }
    
    vcEmpPdfViewer.src = psFileUrl;
//    var postMethod = vcEmpPdfViewer.getPostMethod(psFileUrl);
//    postMethod.submit();
}
exports.setPdfFile = setPdfFile;

/*
 * 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
    var btn1 = e.control;
  	closeViewer();
}

/*
 * 루트 컨테이너에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onBodyKeydown(e){
    var group = e.control;
    
    if (e.key == 'Escape') {
        closeViewer();
    }
}
