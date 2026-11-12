/************************************************
 * K2-2.js
 * @프로그램설명 : 
 *
 * @작성일자 :  2026. 11. 5..
 * @작성자 : dyseo
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/
 
/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/ 


/************************************************
 ** 글로벌 함수
 ************************************************/ 


/************************************************
 ** 파일내 로컬변수 선언  
 ************************************************/ 
var util = createCommonUtil();

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/ 

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/* [A6/A6-1.clx] */
function resizeIframe(iframe) {
	try {
		// 내부 콘텐츠 높이를 계산
		var contentHeight = iframe.contentWindow.document.body.scrollHeight;
		iframe.style.height = contentHeight + "px";
	} catch (error) {
		console.error("Unable to access iframe content:", error);
	}
}

/* [A6/A6-1.clx] */
function watchIframeResize(iframe) {
	try {
		var iframeBody = iframe.contentWindow.document.body;
		
		// MutationObserver를 생성
		var observer = new MutationObserver(function() {
			resizeIframe(iframe);
		});
		
		// MutationObserver를 iframe의 body에 연결
		observer.observe(iframeBody, {
			childList: true,
			subtree: true
		});
	} catch (error) {
		console.error("Unable to observe iframe content:", error);
	}
}

/* [A6/A6-1.clx] */
/*
 * 임베디드 페이지에서 load 이벤트 발생 시 호출.
 * 페이지의 Load가 완료되었을 때 호출되는 Event.
 */
function onEmbeddedPageLoad(e){
	resizeIframe(e.target);
	watchIframeResize(e.target);
}

/* [A9/A9-2.clx] */
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
