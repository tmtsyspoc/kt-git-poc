/************************************************
 * K3-2.js
 * @프로그램설명 : 유효성 검증 시연 (오른쪽 패널에 검증 결과 표시)
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

/**
 * 검증 규칙 정의. check 는 오류 메시지를 반환하고, 정상이면 빈 문자열을 반환한다.
 */
var vaRules = [
	{id: "ipbName", label: "이름", check: function(v){
		if(ValueUtil.isNull(v)){ return "필수 입력 항목입니다."; }
		if(!/^[가-힣]{2,10}$/.test(v)){ return "한글 2~10자로 입력하세요."; }
		return "";
	}},
	{id: "ipbEmail", label: "이메일", check: function(v){
		if(ValueUtil.isNull(v)){ return "필수 입력 항목입니다."; }
		if(!TypeUtil.isEmail(v)){ return "이메일 형식이 올바르지 않습니다."; }
		return "";
	}},
	{id: "ipbMobile", label: "휴대폰 번호", check: function(v){
		if(ValueUtil.isNull(v)){ return ""; }
		if(!/^01[016789]-?\d{3,4}-?\d{4}$/.test(v)){ return "휴대폰 번호 형식이 올바르지 않습니다."; }
		return "";
	}},
	{id: "ipbBizNo", label: "사업자등록번호", check: function(v){
		if(ValueUtil.isNull(v)){ return ""; }
		if(!TypeUtil.isBizCSN(v)){ return "유효하지 않은 사업자등록번호입니다."; }
		return "";
	}},
	{id: "ipbZip", label: "우편번호", check: function(v){
		if(ValueUtil.isNull(v)){ return ""; }
		if(!/^\d{5}$/.test(v)){ return "5자리 숫자로 입력하세요."; }
		return "";
	}},
	{id: "dtiBirth", label: "생년월일", check: function(v){
		if(ValueUtil.isNull(v)){ return ""; }
		if(String(v) > moment().format("YYYYMMDD")){ return "미래 날짜는 입력할 수 없습니다."; }
		return "";
	}},
	{id: "nbeAge", label: "나이", check: function(v){
		if(ValueUtil.isNull(v)){ return ""; }
		if(v < 1 || v > 120){ return "1~120 사이 값을 입력하세요."; }
		return "";
	}},
	{id: "ipbPwd", label: "비밀번호", check: function(v){
		if(ValueUtil.isNull(v)){ return "필수 입력 항목입니다."; }
		if(v.length < 8 || !/[A-Za-z]/.test(v) || !/\d/.test(v)){ return "8자 이상, 영문과 숫자를 포함하세요."; }
		return "";
	}},
	{id: "ipbPwd2", label: "비밀번호 확인", check: function(v){
		if(ValueUtil.isNull(v)){ return "필수 입력 항목입니다."; }
		if(v !== app.lookup("ipbPwd").value){ return "비밀번호가 일치하지 않습니다."; }
		return "";
	}},
	{id: "cbxAgree", label: "약관 동의", check: function(v){
		return app.lookup("cbxAgree").checked ? "" : "약관 동의는 필수입니다.";
	}}
];

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술
 ************************************************/

/**
 * 규칙 정의를 id 로 찾는다.
 */
function findRule(psId){
	for(var i = 0; i < vaRules.length; i++){
		if(vaRules[i].id == psId){
			return vaRules[i];
		}
	}
	return null;
}

/**
 * 컨트롤의 현재 입력값을 반환한다.
 */
function getCtrlValue(psId){
	var vcCtrl = app.lookup(psId);
	return psId == "cbxAgree" ? vcCtrl.checked : vcCtrl.value;
}

/**
 * 한 항목을 검증하고 결과(dsResult)와 컨트롤 표시를 갱신한다.
 * @return {Boolean} 정상 여부
 */
function validateField(psId){
	var voRule = findRule(psId);
	var vsMsg = voRule.check(getCtrlValue(psId));
	var vbOk = ValueUtil.isNull(vsMsg);
	var vcCtrl = app.lookup(psId);

	// 오류 표시 (테두리 색)
	if(vbOk){
		vcCtrl.style.css("border-color", "");
	} else {
		vcCtrl.style.css("border-color", "#e53935");
	}

	var voRow = {ID: psId, LABEL: voRule.label, RESULT: vbOk ? "OK" : "오류", MSG: vbOk ? "정상" : vsMsg};
	var vcDs = app.lookup("dsResult");
	var vcFound = vcDs.findFirstRow("ID == '" + psId + "'");
	if(vcFound){
		vcDs.updateRow(vcFound.getIndex(), voRow);
	} else {
		vcDs.addRowData(voRow);
	}
	return vbOk;
}

/**
 * 결과 요약 문구를 갱신한다.
 */
function refreshSummary(){
	var vcDs = app.lookup("dsResult");
	var vnErr = vcDs.findAllRow("RESULT == '오류'").length;
	var vsText = "검증 항목 " + vcDs.getRowCount() + "건 / 오류 " + vnErr + "건";
	app.lookup("optSummary").value = vsText;
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시)
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 입력 컨트롤의 값 변경 시 해당 항목을 즉시 검증하도록 리스너를 등록한다.
 */
function onBodyLoad(e){
	vaRules.forEach(function(voRule){
		var vcCtrl = app.lookup(voRule.id);
		vcCtrl.addEventListener("value-change", function(){
			validateField(voRule.id);
			if(voRule.id == "ipbPwd" && !ValueUtil.isNull(app.lookup("ipbPwd2").value)){
				validateField("ipbPwd2");
			}
			refreshSummary();
		});
	});
}

/*
 * "전체 검증" 버튼(btnValidate)에서 click 이벤트 발생 시 호출.
 * 모든 항목을 검증하고, 첫 오류 항목으로 포커스를 이동한다.
 */
function onBtnValidateClick(e){
	var btnValidate = e.control;
	var vsFirstErr = "";
	vaRules.forEach(function(voRule){
		if(!validateField(voRule.id) && vsFirstErr == ""){
			vsFirstErr = voRule.id;
		}
	});
	refreshSummary();
	if(vsFirstErr != ""){
		util.Msg.notify(app, "입력 오류가 있습니다. 결과 패널을 확인하세요.", null, "WARNING");
		app.lookup(vsFirstErr).focus();
	} else {
		util.Msg.notify(app, "모든 항목이 유효합니다.", null, "INFO");
	}
}

/*
 * "초기화" 버튼(btnReset)에서 click 이벤트 발생 시 호출.
 * 입력값과 검증 결과를 모두 지운다.
 */
function onBtnResetClick(e){
	var btnReset = e.control;
	vaRules.forEach(function(voRule){
		var vcCtrl = app.lookup(voRule.id);
		vcCtrl.style.css("border-color", "");
		if(voRule.id == "cbxAgree"){
			vcCtrl.checked = false;
		} else {
			vcCtrl.value = "";
		}
	});
	app.lookup("dsResult").clear();
	app.lookup("optSummary").value = "검증 전입니다.";
	app.lookup("ipbName").focus();
}

/*
 * 결과 그리드(grdResult)에서 selection-change 이벤트 발생 시 호출.
 * 선택한 결과 항목의 입력 컨트롤로 포커스를 이동한다.
 */
function onGrdResultSelectionChange(e){
	var grdResult = e.control;
	var vnIdx = grdResult.getSelectedRowIndex();
	if(vnIdx >= 0){
		var vcCtrl = app.lookup(app.lookup("dsResult").getValue(vnIdx, "ID"));
		if(vcCtrl){
			vcCtrl.focus();
		}
	}
}
