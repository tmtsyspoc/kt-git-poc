/************************************************
 * KosMnp.js
 * @프로그램설명 : 번호이동 (대리점 빠른 업무, 인증·저장은 목업)
 *
 * @작성일자 :  2026. 11. 12.
 * @작성자 : gpt_06
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/
/** 인증 필수 항목 [컨트롤 ID, 항목명] */
var REQUIRED_AUTH = [["ipbMnpTel", "이동 전화번호"], ["ipbBirth", "생년월일"], ["cmbCarrier", "변경 전 사업자"]];
/** 저장 필수 항목 [컨트롤 ID, 항목명] */
var REQUIRED_SAVE = [["cmbPlan", "요금제"], ["cmbModel", "단말 모델"], ["cmbPayMethod", "납부방법"]];

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
 * 고객 화면에서 넘긴 고객 정보를 받는다. 번호이동은 타사 번호를 새로 입력하므로 고객명만 인증 결과에 미리 표시한다.
 * @param {{CUST_NM:String, SVC_NO:String}} poParam 고객 정보
 */
function setCond(poParam) {
	if (ValueUtil.isNull(poParam)) return;
	util.DataMap.setValue(app, "dmMnp", "CUST_NM", poParam["CUST_NM"]);
	util.Control.redraw(app, "grpAuthForm");
}

/**
 * 필수 항목을 확인한다.
 * @param {Array} paRequired [컨트롤 ID, 항목명] 목록
 * @return {Boolean} 통과 여부
 */
function checkRequired(paRequired) {
	for (var i = 0; i < paRequired.length; i++) {
		var vcCtrl = app.lookup(paRequired[i][0]);
		if (ValueUtil.isNull(vcCtrl.value)) {
			util.Msg.notify(app, "[" + paRequired[i][1] + "] 항목을 입력하세요.", null, "WARNING");
			vcCtrl.focus();
			return false;
		}
	}
	return true;
}

/**
 * 번호이동 인증을 요청한다. 서버 연동 전이므로 목업 결과를 보여준다.
 */
function requestAuth() {
	if (!checkRequired(REQUIRED_AUTH)) return;

	var voAuth = {
		"AUTH_STATUS" : "인증완료",
		"CUST_NM" : ValueUtil.fixNull(util.DataMap.getValue(app, "dmMnp", "CUST_NM")) || "김유*",
		"PRE_CONTRACT" : "후불(" + app.lookup("cmbCarrier").text + ")",
		"UNPAID" : "32,400원",
		"DEV_INST" : "0원",
		"REQ_DT" : moment().format("YYYY-MM-DD HH:mm")
	};
	Object.keys(voAuth).forEach(function(each) {
		util.DataMap.setValue(app, "dmMnp", each, voAuth[each]);
	});
	util.Control.redraw(app, "grpAuthForm");
	util.Msg.notify(app, "번호이동 인증이 완료되었습니다.", null, "SUCCESS");
	app.lookup("cmbPlan").focus();
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
	app.lookup("ipbMnpTel").focus();
}

/*
 * "조회" 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e) {
	requestAuth();
}

/*
 * "인증요청" 버튼(btnAuth)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnAuthClick(e) {
	requestAuth();
}

/*
 * "초기화" 버튼(btnReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnResetClick(e) {
	["ipbMnpTel", "ipbBirth", "cmbCarrier", "cmbPlan", "cmbModel", "cmbPayMethod"].forEach(function(each) {
		app.lookup(each).value = "";
	});
	app.lookup("cbxOffset").value = "N";
	app.lookup("dmMnp").reset();
	util.Control.redraw(app, "grpAuthForm");
	app.lookup("ipbMnpTel").focus();
}

/*
 * "저장" 버튼(btnSave)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSaveClick(e) {
	if (util.DataMap.getValue(app, "dmMnp", "AUTH_STATUS") != "인증완료") {
		util.Msg.notify(app, "번호이동 인증을 먼저 완료하세요.", null, "WARNING");
		app.lookup("ipbMnpTel").focus();
		return;
	}
	if (!checkRequired(REQUIRED_SAVE)) return;

	util.Msg.confirmDlg(app, "번호이동 가입을 접수하시겠습니까?", null, {
		confirmCallback: function() {
			util.Msg.notify(app, "번호이동 가입이 접수되었습니다. (목업: 서버에 저장되지 않습니다)", null, "SUCCESS");
		}
	});
}
