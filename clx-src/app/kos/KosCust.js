/************************************************
 * KosCust.js
 * @프로그램설명 : 고객 정보 (대리점 메인의 고객 통합검색이 여는 화면, 조회 결과는 목업)
 *
 * @작성일자 :  2026. 11. 12.
 * @작성자 : gpt_06
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/
/** 해지 상품 포함 여부 */
var mbInclTerm = false;

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
 * 메인의 고객 통합검색 조건을 받아 조회한다.
 * @param {{SCH_TYPE:String, SCH_VAL:String, BIRTH:String, TERM_YN:String}} poCond 검색조건
 */
function setCond(poCond) {
	if (ValueUtil.isNull(poCond)) return;

	app.lookup("cmbSchType").value = poCond["SCH_TYPE"];
	app.lookup("ipbSchVal").value = poCond["SCH_VAL"];
	app.lookup("ipbBirth").value = poCond["BIRTH"];
	setInclTerm(poCond["TERM_YN"] == "Y");
	searchCust();
}

/**
 * 해지 상품 포함 여부를 바꾸고 버튼에 표시한다.
 * @param {Boolean} pbInclTerm 해지 상품 포함 여부
 */
function setInclTerm(pbInclTerm) {
	mbInclTerm = pbInclTerm;
	var vcBtnTermToggle = app.lookup("btnTermToggle");
	vcBtnTermToggle.value = mbInclTerm ? "해지포함" : "해지제외";
	vcBtnTermToggle.style.setClasses([mbInclTerm ? "primary" : "secondary"]);
}

/**
 * 이름을 마스킹한다.
 * @param {String} psName 이름
 * @return {String}
 */
function maskName(psName) {
	if (psName.length < 2) return "*";
	return psName.charAt(0) + "*" + (psName.length > 2 ? psName.substring(2) : "");
}

/**
 * 고객을 조회한다. 서버 연동 전이므로 목업 고객을 보여준다.
 */
function searchCust() {
	var vcIpbSchVal = app.lookup("ipbSchVal");
	var vsSchVal = ValueUtil.fixNull(vcIpbSchVal.value).trim();
	if (vsSchVal == "") {
		util.Msg.notify(app, "검색어를 입력하세요.");
		vcIpbSchVal.focus();
		return;
	}

	var vsSchType = app.lookup("cmbSchType").value;
	var voCust = {
		"CUST_NM" : vsSchType == "NM" ? maskName(vsSchVal) : "김유*",
		"CUST_TYPE" : "개인(MASS)",
		"GRADE" : "VIP",
		"ID_NO" : "910328-2******",
		"TEL_NO" : "010-30**-*040",
		"EMAIL" : "yujum***@naver.com",
		"ADDR" : "고객정보보호 (마스킹)",
		"BILL_NO" : "94043739357",
		"PAY_METHOD" : "신용/체크카드",
		"PAY_DAY" : "2회차(매월 21일)",
		"BILL_TYPE" : "이메일",
		"UNPAID" : "294,940원"
	};
	Object.keys(voCust).forEach(function(each) {
		util.DataMap.setValue(app, "dmCust", each, voCust[each]);
	});
	util.Control.redraw(app, "grpCustForm");

	var vcDsProduct = app.lookup("dsProduct");
	vcDsProduct.clear();
	app.lookup("dsProductMock").getRowDataRanged().forEach(function(each) {
		if (mbInclTerm || each["STATUS"] != "해지") vcDsProduct.addRowData(each);
	});
	// 조회 결과이므로 추가 상태(행 상태 표시)를 남기지 않는다
	vcDsProduct.commit();
	app.lookup("grdProduct").redraw();
}

/**
 * 조회된 고객 기준으로 업무 화면을 연다.
 * @param {String} psPage 화면 경로
 */
function openTask(psPage) {
	var vsCustNm = util.DataMap.getValue(app, "dmCust", "CUST_NM");
	if (ValueUtil.isNull(vsCustNm)) {
		util.Msg.notify(app, "고객을 먼저 조회하세요.");
		return;
	}

	var vcGrdProduct = app.lookup("grdProduct");
	var vnRowIdx = vcGrdProduct.getSelectedRowIndex();
	app.getRootAppInstance().callAppMethod("openKosPage", psPage, {
		"CUST_NM" : vsCustNm,
		"SVC_NO" : vnRowIdx > -1 ? app.lookup("dsProduct").getValue(vnRowIdx, "SVC_NO") : ""
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
function onBodyLoad(e) {
	setInclTerm(false);
}

/*
 * "조회" 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e) {
	searchCust();
}

/*
 * 인풋 박스(ipbSchVal)에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onIpbSchValKeydown(e) {
	if (e.keyCode == cpr.events.KeyCode.ENTER) {
		// Enter 시점에는 입력 중인 값이 아직 반영되지 않았을 수 있어 표시 텍스트를 반영한다
		var vcIpbSchVal = app.lookup("ipbSchVal");
		vcIpbSchVal.value = vcIpbSchVal.displayText;
		searchCust();
	}
}

/*
 * "해지포함" 버튼(btnTermToggle)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnTermToggleClick(e) {
	setInclTerm(!mbInclTerm);
	if (!ValueUtil.isNull(util.DataMap.getValue(app, "dmCust", "CUST_NM"))) searchCust();
}

/*
 * "요금수납" 버튼(btnPay)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPayClick(e) {
	openTask("app/kos/KosPay.clx");
}

/*
 * "기기변경" 버튼(btnDevChg)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnDevChgClick(e) {
	openTask("app/kos/KosDevChg.clx");
}

/*
 * "번호이동" 버튼(btnMnp)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnMnpClick(e) {
	openTask("app/kos/KosMnp.clx");
}

/*
 * "신규가입" 버튼(btnJoin)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnJoinClick(e) {
	openTask("app/kos/KosJoin.clx");
}
