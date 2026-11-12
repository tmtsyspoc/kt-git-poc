/************************************************
 * K5-2.js
 * @프로그램설명 : [DEV-06]정적분석 예제 - 컨트롤 ID 명명규칙 점검
 *
 * @작성일자 :  2026. 11. 10..
 * @작성자 : dyseo
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/
/** 컨트롤 유형별 표준 ID 접두어 */
var NAMING_RULES = [
	{type: "InputBox", prefix: "ipb"},
	{type: "ComboBox", prefix: "cmb"},
	{type: "DateInput", prefix: "dti"},
	{type: "NumberEditor", prefix: "nbe"},
	{type: "CheckBox", prefix: "cbx"},
	{type: "RadioButton", prefix: "rdb"},
	{type: "TextArea", prefix: "txa"},
	{type: "Button", prefix: "btn"},
	{type: "Grid", prefix: "grd"},
	{type: "Output", prefix: "opt"}
];

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
 * 컨트롤 인스턴스에 해당하는 명명규칙을 찾는다.
 */
function findRule(poCtrl){
	for(var i = 0; i < NAMING_RULES.length; i++){
		if(poCtrl.constructor === cpr.controls[NAMING_RULES[i].type]){
			return NAMING_RULES[i];
		}
	}
	return null;
}

/**
 * 점검 대상 영역(grpTargetForm)의 컨트롤 ID를 점검한다.
 * @return {Array} 점검 결과 행 배열
 */
function analyzeControls(){
	var vaResult = [];
	var vaChildren = app.lookup("grpTargetForm").getAllRecursiveChildren();
	vaChildren.forEach(function(vcEach){
		var voRule = findRule(vcEach);
		if(voRule == null || ValueUtil.isNull(vcEach.id)){
			return;
		}
		// 라벨용 Output 은 점검 대상에서 제외
		if(voRule.type == "Output"){
			return;
		}
		var vbOk = vcEach.id.indexOf(voRule.prefix) == 0;
		vaResult.push({
			NO: String(vaResult.length + 1),
			CTRL_ID: vcEach.id,
			CTRL_TYPE: voRule.type,
			RESULT: vbOk ? "정상" : "위반",
			GUIDE: vbOk ? "-" : "ID 접두어를 '" + voRule.prefix + "'로 시작하도록 변경하세요. (예: " + voRule.prefix + vcEach.id.charAt(0).toUpperCase() + vcEach.id.substring(1) + ")"
		});
	});
	return vaResult;
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
	app.lookup("btnAnalyze").focus();
}

/*
 * "정적분석 실행" 버튼(btnAnalyze)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnAnalyzeClick(e){
	var btnAnalyze = e.control;
	var vaResult = analyzeControls();
	var vcDs = app.lookup("dsResult");
	vcDs.clear();
	vcDs.build(vaResult);

	var vnFail = vaResult.filter(function(voRow){
		return voRow.RESULT == "위반";
	}).length;
	app.lookup("optSummary").value = "점검 " + vaResult.length + "건 / 위반 " + vnFail + "건";
	if(vnFail > 0){
		util.Msg.notify(app, "규칙 위반 " + vnFail + "건이 발견되었습니다.", null, "WARNING");
	} else {
		util.Msg.notify(app, "규칙 위반이 없습니다.", null, "INFO");
	}
}
