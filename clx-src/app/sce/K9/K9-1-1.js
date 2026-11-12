/************************************************
 * K9-1-1.js
 * @프로그램설명 : 
 *
 * @작성일자 :  2026. 11. 9..
 * @작성자 : suhyu
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

/**
 * 서브미션 통신 오류를 콘솔 로그 형식으로 텍스트 에리어에 추가한다.
 * @param {cpr.protocols.Submission} poSubmission
 */
function appendSubmissionError(poSubmission) {
	/** @type cpr.controls.Output */
	var vcOpt = app.getHostAppInstance().lookup("opt1")
	var voXhr = poSubmission.xhr;
	var vnStatus = voXhr ? voXhr.status : 0;
	var vsUrl = (voXhr && voXhr.responseURL) || poSubmission.action;
	var vsStatusText = vnStatus === 0 ? "네트워크 오류 또는 Timeout" : (voXhr.statusText || "응답 처리 오류");

	vcOpt.value = vcOpt.value + "ERROR context:submission=> 서브미션 통신 오류가 발생했습니다.\n";
	vcOpt.value = vcOpt.value + moment().format("MM-DD HH:mm:ss,SSS") + " ERROR " + vsUrl + " " + vnStatus + " (" + vsStatusText + ")\n";
//	txa.value = txa.value + "\n\n";
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/*
 * "전송" 버튼(btnCreateCode)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCreateCodeClick(e) {
	var btnCreateCode = e.control;
	util.Submit.send(app, "sms1", function(pbSuccess, poSubmission){
		// 공통 모듈은 Timeout을 실패로 표시하지 않으므로 HTTP 상태도 함께 확인한다.
		var voXhr = poSubmission.xhr;
		var vnStatus = voXhr ? voXhr.status : 0;
		if (pbSuccess !== true || vnStatus === 0 || vnStatus >= 400) {
			appendSubmissionError(poSubmission);
		}
	});

}
