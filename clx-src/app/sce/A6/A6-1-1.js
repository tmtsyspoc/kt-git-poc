/************************************************
 * A6-1-1.js
 * Created at 2025. 2. 18. 오전 11:27:05.
 *
 * @author ryu
 ************************************************/

function resizeIframe(iframe) {
	try {
		// 내부 콘텐츠 높이를 계산
		var contentHeight = iframe.contentWindow.document.body.scrollHeight;
		iframe.style.height = contentHeight + "px";
	} catch (error) {
		console.error("Unable to access iframe content:", error);
	}
}

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

/*
 * 임베디드 페이지에서 load 이벤트 발생 시 호출.
 * 페이지의 Load가 완료되었을 때 호출되는 Event.
 */
function onEpBsLoad(e){
	resizeIframe(e.target);
	watchIframeResize(e.target);
}
