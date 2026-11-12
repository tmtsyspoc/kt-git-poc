/************************************************
 * KosDevChg.js
 * @프로그램설명 : 기기변경 (대리점 빠른 업무, 조회·저장은 목업)
 *
 * @작성일자 :  2026. 11. 12.
 * @작성자 : gpt_06
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/
/** 저장 필수 항목 [컨트롤 ID, 항목명] */
var REQUIRED = [["cmbChgType", "기변 종류"], ["cmbModel", "새 단말 모델"]];

/************************************************
 ** 글로벌 함수
 ************************************************/
exports.setCond = setCond;

/************************************************
 ** 파일내 로컬변수 선언
 ************************************************/
var util = createCommonUtil();

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술
 ************************************************/
/**
 * 고객 화면에서 넘긴 고객·서비스번호로 현재 가입 정보를 조회한다.
 * @param {{CUST_NM:String, SVC_NO:String}} poParam 고객 정보
 */
function setCond(poParam) {
	if (ValueUtil.isNull(poParam)) return;
	app.lookup("ipbCustNm").value = poParam["CUST_NM"];
	// 고객 화면의 서비스번호는 마스킹된 값이므로 그대로 표시한다
	app.lookup("ipbSvcNo").value = ValueUtil.fixNull(poParam["SVC_NO"]);
	if (!ValueUtil.isNull(app.lookup("ipbSvcNo").value)) searchCur();
}

/**
 * 현재 가입 정보를 조회한다. 서버 연동 전이므로 목업 결과를 보여준다.
 */
function searchCur() {
	var vcIpbSvcNo = app.lookup("ipbSvcNo");
	if (ValueUtil.isNull(vcIpbSvcNo.value)) {
		util.Msg.notify(app, "서비스번호를 입력하세요.", null, "WARNING");
		vcIpbSvcNo.focus();
		return;
	}

	var voCur = {
		"SVC_NO" : vcIpbSvcNo.value,
		"CUST_NM" : ValueUtil.fixNull(app.lookup("ipbCustNm").value) || "김유*",
		"PLAN" : "5G 디즈니+ 초이스 베이직",
		"DEVICE" : "iPhone 15 Pro 256GB",
		"INST_REMAIN" : "184,800원 (6회 남음)",
		"CONTRACT_END" : "2027-01-27"
	};
	Object.keys(voCur).forEach(function(each) {
		util.DataMap.setValue(app, "dmCur", each, voCur[each]);
	});
	util.Control.redraw(app, "grpCurForm");
	app.lookup("cmbModel").focus();
}

/**
 * 조회 여부와 필수 항목을 확인한다.
 * @return {Boolean} 통과 여부
 */
function validate() {
	if (ValueUtil.isNull(util.DataMap.getValue(app, "dmCur", "SVC_NO"))) {
		util.Msg.notify(app, "현재 가입 정보를 먼저 조회하세요.", null, "WARNING");
		app.lookup("ipbSvcNo").focus();
		return false;
	}
	for (var i = 0; i < REQUIRED.length; i++) {
		var vcCtrl = app.lookup(REQUIRED[i][0]);
		if (ValueUtil.isNull(vcCtrl.value)) {
			util.Msg.notify(app, "[" + REQUIRED[i][1] + "] 항목을 입력하세요.", null, "WARNING");
			vcCtrl.focus();
			return false;
		}
	}
	return true;
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시)
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	app.lookup("ipbSvcNo").focus();
}

/*
 * "조회" 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e) {
	searchCur();
}

/*
 * 인풋 박스(ipbSvcNo)에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onIpbSvcNoKeydown(e) {
	if (e.keyCode == cpr.events.KeyCode.ENTER) {
		// Enter 시점에는 입력 중인 값이 아직 반영되지 않았을 수 있어 표시 텍스트를 반영한다
		var vcIpbSvcNo = app.lookup("ipbSvcNo");
		vcIpbSvcNo.value = vcIpbSvcNo.displayText;
		searchCur();
	}
}

/*
 * "초기화" 버튼(btnReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnResetClick(e) {
	["ipbSvcNo", "ipbCustNm", "cmbModel", "ipbSerial", "cmbPlan"].forEach(function(each) {
		app.lookup(each).value = "";
	});
	app.lookup("dmCur").reset();
	util.Control.redraw(app, "grpCurForm");
	app.lookup("ipbSvcNo").focus();
}

/*
 * "사전체크" 버튼(btnPreCheck)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPreCheckClick(e) {
	if (validate()) util.Msg.notify(app, "사전체크를 통과했습니다.", null, "SUCCESS");
}

/*
 * "저장" 버튼(btnSave)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSaveClick(e) {
	if (!validate()) return;

	util.Msg.confirmDlg(app, "기기변경을 접수하시겠습니까?", null, {
		confirmCallback: function() {
			util.Msg.notify(app, "기기변경이 접수되었습니다. (목업: 서버에 저장되지 않습니다)", null, "SUCCESS");
		}
	});
}
