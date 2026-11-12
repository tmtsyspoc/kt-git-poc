/************************************************
 * A10-2.js
 * Created at 2025. 2. 14. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/

/************************************************
 * 전역변수
 ************************************************/
var util = createCommonUtil();

/************************************************
 * 사용자정의함수
 ************************************************/

/**
 * XSS 공격방지 서브미션 send 함수
 * @param {cpr.protocols.Submission} pcSubmissoin
 */
function submitSendXSS(pcSubmissoin) {
	var vcSub = pcSubmissoin;
	vcSub.setRequestEncoder(function(submission, data) {
		console.log(data);
		data = JSON.stringify(data);
		var str = data.replace(/[&<>';/]/g, function(match) {
			return {
				"&": "%amp",
				'<': '&lt;',
				'>': '&gt;',
				"'": '&#39;',
				'/': '&#x2F;'
			} [match];
		});
		alert(str);
		var result = JSON.parse(str);
		return {
			content: result
		}
	});
	util.Submit.send(app,vcSub.id, function(pbSuccess){
		if(pbSuccess){
			util.Control.redraw(app, "grp2");
		}
	});
}

/**
 * 
 * @param {cpr.protocols.Submission} pcSubmissoin
 */
function submitSendCSRF(pcSubmissoin) {
	var vcSub = pcSubmissoin;
	vcSub.setHeader("X-CSRF-TOKEN", getCSRFToken());
	util.Submit.send(app, vcSub.id, function(pbSuccess,pcSub){
		
	});
}
/**
 * 
 * @param {cpr.protocols.Submission} pcSubmission
 */
function submitSendWrongCSRF(pcSubmission) {
	var vcSub = pcSubmission;
	vcSub.setHeader("X-CSRF-TOKEN", "HackedWrongTokenInfo");
	util.Submit.send(app, vcSub.id, function(pbSuccess,pcSub){
		if(!pbSuccess) {
			util.removeCover(app);
		}
	});
}

/************************************************
 * 컨트롤 이벤트
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){	
//	var metaTag = document.createElement("meta");
}

/*
 * "XSS공격이 삽입된 통신 요청" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	submitSendXSS(app.lookup("subXSS"));
}


/*
 * "타 사이트의 악의적인 요청" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	submitSendCSRF(app.lookup("subCSRF"));
	
}

/*
 * "서비스 요청" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
	submitSendWrongCSRF(app.lookup("subCSRF"));
}
