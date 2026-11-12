/************************************************
 * KosPay.js
 * @프로그램설명 : 요금수납 (대리점 빠른 업무, 조회·수납은 목업)
 *
 * @작성일자 :  2026. 11. 12.
 * @작성자 : gpt_06
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/


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
 * 고객 화면에서 넘긴 고객·서비스번호로 청구 내역을 조회한다.
 * @param {{CUST_NM:String, SVC_NO:String}} poParam 고객 정보
 */
function setCond(poParam) {
	if (ValueUtil.isNull(poParam)) return;
	app.lookup("ipbCustNm").value = poParam["CUST_NM"];
	// 고객 화면의 서비스번호는 마스킹된 값이므로 그대로 표시한다
	app.lookup("ipbSvcNo").value = ValueUtil.fixNull(poParam["SVC_NO"]);
	searchBill();
}

/**
 * 청구 내역을 조회한다. 서버 연동 전이므로 목업 내역을 보여준다.
 */
function searchBill() {
	if (ValueUtil.isNull(app.lookup("ipbSvcNo").value) && ValueUtil.isNull(app.lookup("ipbCustNm").value)) {
		util.Msg.notify(app, "서비스번호 또는 고객명을 입력하세요.", null, "WARNING");
		app.lookup("ipbSvcNo").focus();
		return;
	}

	var vcDsBill = app.lookup("dsBill");
	vcDsBill.clear();
	app.lookup("dsBillMock").getRowDataRanged().forEach(function(each) {
		vcDsBill.addRowData(each);
	});
	// 조회 결과이므로 추가 상태(행 상태 표시)를 남기지 않는다
	vcDsBill.commit();

	var vcGrdBill = app.lookup("grdBill");
	vcGrdBill.redraw();
	vcGrdBill.selectRows(0);
}

/**
 * 선택한 청구월을 수납 처리 폼에 채운다.
 */
function fillPayForm() {
	var vnRowIdx = app.lookup("grdBill").getSelectedRowIndex();
	var vcDsBill = app.lookup("dsBill");

	app.lookup("ipbPayYm").value = vnRowIdx > -1 ? vcDsBill.getValue(vnRowIdx, "BILL_YM") : "";
	app.lookup("nbePayAmt").value = vnRowIdx > -1 ? vcDsBill.getValue(vnRowIdx, "UNPAID_AMT") : 0;
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
	searchBill();
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
		searchBill();
	}
}

/*
 * 그리드(grdBill)에서 selection-change 이벤트 발생 시 호출.
 * detail의 cell 클릭하여 설정된 selectionunit에 해당되는 단위가 선택될 때 발생하는 이벤트.
 */
function onGrdBillSelectionChange(e) {
	fillPayForm();
}

/*
 * "초기화" 버튼(btnReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnResetClick(e) {
	app.lookup("ipbSvcNo").value = "";
	app.lookup("ipbCustNm").value = "";
	app.lookup("dsBill").clear();
	app.lookup("grdBill").redraw();
	fillPayForm();
	app.lookup("ipbSvcNo").focus();
}

/*
 * "수납" 버튼(btnPaySave)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPaySaveClick(e) {
	var vcGrdBill = app.lookup("grdBill");
	var vcDsBill = app.lookup("dsBill");
	var vnRowIdx = vcGrdBill.getSelectedRowIndex();
	if (vnRowIdx < 0) {
		util.Msg.notify(app, "수납할 청구월을 선택하세요.", null, "WARNING");
		return;
	}

	var vnUnpaid = Number(vcDsBill.getValue(vnRowIdx, "UNPAID_AMT"));
	var vnPayAmt = Number(app.lookup("nbePayAmt").value);
	if (vnUnpaid <= 0) {
		util.Msg.notify(app, "이미 완납된 청구월입니다.", null, "WARNING");
		return;
	}
	if (!(vnPayAmt > 0) || vnPayAmt > vnUnpaid) {
		util.Msg.notify(app, "수납 금액은 1원 이상, 미납금액(" + vnUnpaid.toLocaleString() + "원) 이하로 입력하세요.", null, "WARNING");
		app.lookup("nbePayAmt").focus();
		return;
	}

	util.Msg.confirmDlg(app, vcDsBill.getValue(vnRowIdx, "BILL_YM") + " 청구분 " + vnPayAmt.toLocaleString() + "원을 수납하시겠습니까?", null, {
		confirmCallback: function() {
			vcDsBill.setValue(vnRowIdx, "UNPAID_AMT", vnUnpaid - vnPayAmt);
			if (vnUnpaid - vnPayAmt == 0) vcDsBill.setValue(vnRowIdx, "STATUS", "완납");
			vcDsBill.commit();
			vcGrdBill.redraw();
			fillPayForm();
			util.Msg.notify(app, "수납 처리되었습니다. (목업: 서버에 저장되지 않습니다)", null, "SUCCESS");
		}
	});
}
