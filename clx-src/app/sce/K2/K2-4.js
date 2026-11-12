/************************************************
 * K2-4.js
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

/*
 * 선택한 화면 템플릿의 원본 경로를 표시하고, 미리보기 앱을 임베디드앱에 로드한다.
 * 템플릿이 늘어나도 dsTplList 에 행만 추가하면 되므로 이 함수는 수정하지 않는다.
 * @param {Number} pnRowIndex dsTplList 의 행 인덱스
 */
function showTemplatePreview(pnRowIndex) {
	if (pnRowIndex < 0) {
		return;
	}
	
	var vcEmb = app.lookup("embUdcTpl");
	var vcDsTpl = app.lookup("dsTplList");
	
	cpr.core.App.load(vcDsTpl.getValue(pnRowIndex, "SRC"), function(voLoadedApp) {
		if (voLoadedApp) {
			vcEmb.app = voLoadedApp;
		}
	});
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/


/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	// 최초 미리보기(그리드 템플릿)에 맞춰 목록의 선택 행을 표시한다.
	app.lookup("grdUdcTpl").selectRows(1);
}

/*
 * 그리드에서 selection-change 이벤트 발생 시 호출.
 * Grid의 Row 선택하고 있는 경우 발생하는 이벤트.
 */
function onGrdUdcTplSelectionChange(e){
	var grdUdcTpl = e.control;
	showTemplatePreview(grdUdcTpl.getSelectedRowIndex());
}
