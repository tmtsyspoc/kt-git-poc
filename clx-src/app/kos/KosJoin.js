/************************************************
 * KosJoin.js
 * @프로그램설명 : 신규가입 (대리점 빠른 업무, 저장은 목업)
 *
 * @작성일자 :  2026. 11. 12.
 * @작성자 : gpt_06
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/
/** 필수 입력 항목 [컨트롤 ID, 항목명] */
var REQUIRED = [["ipbCustNm", "고객명"], ["ipbTelNo", "연락처"], ["cmbPlan", "요금제"], ["ipbNewTel", "개통 전화번호"],
	["cmbModel", "단말 모델"], ["cmbPayMethod", "납부방법"]];

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
 * 고객 화면에서 넘긴 고객 정보를 채운다.
 * @param {{CUST_NM:String, SVC_NO:String}} poParam 고객 정보
 */
function setCond(poParam) {
	if (ValueUtil.isNull(poParam)) return;
	app.lookup("ipbCustNm").value = poParam["CUST_NM"];
}

/**
 * 필수 항목과 동의 여부를 확인한다.
 * @return {Boolean} 통과 여부
 */
function validate() {
	for (var i = 0; i < REQUIRED.length; i++) {
		var vcCtrl = app.lookup(REQUIRED[i][0]);
		if (ValueUtil.isNull(vcCtrl.value)) {
			util.Msg.notify(app, "[" + REQUIRED[i][1] + "] 항목을 입력하세요.", null, "WARNING");
			vcCtrl.focus();
			return false;
		}
	}
	if (app.lookup("cbxAgree").value != "Y") {
		util.Msg.notify(app, "개인정보 활용 필수 동의를 확인하세요.", null, "WARNING");
		app.lookup("cbxAgree").focus();
		return false;
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
	app.lookup("ipbCustNm").focus();
}

/*
 * "조회" 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e) {
	if (ValueUtil.isNull(app.lookup("ipbCustNm").value)) {
		util.Msg.notify(app, "고객명을 입력하세요.", null, "WARNING");
		app.lookup("ipbCustNm").focus();
		return;
	}
	util.Msg.notify(app, "신규 고객입니다. 가입 정보를 입력하세요.");
	app.lookup("cmbPlan").focus();
}

/*
 * "번호선택" 버튼(btnPickTel)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPickTelClick(e) {
	// 번호 선택 팝업이 없어 사용 가능 번호를 임의로 부여한다(목업)
	var vsMid = String(1000 + Math.floor(Math.random() * 9000));
	var vsEnd = String(1000 + Math.floor(Math.random() * 9000));
	app.lookup("ipbNewTel").value = "010-" + vsMid + "-" + vsEnd;
}

/*
 * "초기화" 버튼(btnReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnResetClick(e) {
	["ipbCustNm", "ipbTelNo", "cmbPlan", "ipbNewTel", "cmbModel", "ipbSerial", "ipbUsim", "cmbPayMethod", "ipbBillEmail"].forEach(function(each) {
		app.lookup(each).value = "";
	});
	app.lookup("cbxAddSvc").value = "N";
	app.lookup("cbxAgree").value = "N";
	app.lookup("ipbCustNm").focus();
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

	util.Msg.confirmDlg(app, "신규가입을 접수하시겠습니까?", null, {
		confirmCallback: function() {
			util.Msg.notify(app, "신규가입이 접수되었습니다. (목업: 서버에 저장되지 않습니다)", null, "SUCCESS");
		}
	});
}
