/************************************************
 * K3-3P.js
 * @프로그램설명 : 오류내용 확인 팝업 (K3-3에서 호출)
 *
 * @작성일자 :  2026. 11. 10..
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

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 호출 화면에서 넘긴 오류 로그를 표시한다.
 */
function onBodyLoad(e){
	var voInit = app.getHostProperty("initValue") || {};
	var vsLog = voInit.log;
	app.lookup("txaError").value = ValueUtil.isNull(vsLog) ? "기록된 오류가 없습니다." : vsLog;
}

/*
 * "로그 저장" 버튼(btnLogDown)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnLogDownClick(e){
	var btnLogDown = e.control;
	var vsLog = app.lookup("txaError").value;
	var voBlob = new Blob([vsLog], {type: "text/plain"});
	var vsUrl = URL.createObjectURL(voBlob);
	var voAtag = document.createElement("a");
	voAtag.href = vsUrl;
	voAtag.download = moment().format("YYYYMMDD_HHmmss") + "_error_log.txt";
	voAtag.click();
	URL.revokeObjectURL(vsUrl);
}

/*
 * "닫기" 버튼(btnClose)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCloseClick(e){
	var btnClose = e.control;
	app.close();
}
