/************************************************
 * K3-1.js
 * @프로그램설명 : 키보드·업무 사용성 - 포커스 원복 시연
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

/** 탭 인덱스별 마지막 포커스 컨트롤 id (탭 이동 후 원복용) */
var voFocusMap = {};
/** 화면 전환 직전 포커스 컨트롤 id */
var vsSwitchFocusId = "";
/** 화면 전환 상태(true: 조회영역 숨김) */
var vbSwitched = false;

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술
 ************************************************/

/**
 * 현재 선택된 탭의 인덱스를 반환한다.
 */
function getTabKey(){
	var vcTab = app.lookup("tabMain");
	return vcTab.getTabItems().indexOf(vcTab.getSelectedTabItem());
}

/**
 * 컨트롤에 포커스를 되돌린다. (렌더링 완료 후 실행하기 위해 지연 호출)
 * @param {String} psCtrlId 포커스를 줄 컨트롤 id
 */
function restoreFocus(psCtrlId){
	if(ValueUtil.isNull(psCtrlId)){
		return;
	}
	setTimeout(function(){
		var vcCtrl = app.lookup(psCtrlId);
		if(vcCtrl && vcCtrl.visible && vcCtrl.enabled !== false){
			vcCtrl.focus();
		}
	}, 50);
}

/**
 * 컨트롤이 포커스를 받을 때 마지막 포커스 위치를 기록한다.
 */
function onCtrlFocus(e){
	var vcCtrl = e.control;
	if(vcCtrl == null || ValueUtil.isNull(vcCtrl.id)){
		return;
	}
	voFocusMap[getTabKey()] = vcCtrl.id;
	app.lookup("optFocusInfo").value = "포커스 기록: " + vcCtrl.id;
}

/**
 * 시연 영역(grpTab2)의 입력 컨트롤에 포커스 기록 리스너를 등록한다.
 */
function bindFocusTracking(){
	var vaChildren = app.lookup("grpTab2").getAllRecursiveChildren();
	vaChildren.forEach(function(vcEach){
		if(vcEach instanceof cpr.controls.Container || vcEach instanceof cpr.controls.Output){
			return;
		}
		if(vcEach.focusable && !ValueUtil.isNull(vcEach.id)){
			vcEach.addEventListener("focus", onCtrlFocus);
		}
	});
}

/**
 * 조회조건에 맞게 목록을 필터링한다.
 */
function doSearch(){
	var vsName = app.lookup("ipbSchName").value;
	var vsType = app.lookup("cmbSchType").value;
	var vsFrom = app.lookup("dtiSchFrom").value;
	var vsTo = app.lookup("dtiSchTo").value;
	var vsUse = app.lookup("rdbSchUse").value;
	var vaCond = [];

	if(!ValueUtil.isNull(vsName)){
		vaCond.push("NAME.indexOf('" + vsName + "') >= 0");
	}
	if(!ValueUtil.isNull(vsType)){
		vaCond.push("TYPE == '" + vsType + "'");
	}
	if(!ValueUtil.isNull(vsFrom)){
		vaCond.push("JOIN_DT >= '" + vsFrom + "'");
	}
	if(!ValueUtil.isNull(vsTo)){
		vaCond.push("JOIN_DT <= '" + vsTo + "'");
	}
	if(!ValueUtil.isNull(vsUse)){
		vaCond.push("USE_YN == '" + vsUse + "'");
	}

	var vcDs = app.lookup("dsList");
	if(vaCond.length > 0){
		vcDs.setFilter(vaCond.join(" && "));
	} else {
		vcDs.clearFilter();
	}
	app.lookup("grdList").redraw();
}

/**
 * 선택된 행을 상세 폼(dmForm)에 복사한다.
 */
function copyRowToForm(pnRowIndex){
	var vcDs = app.lookup("dsList");
	var vcMap = app.lookup("dmForm");
	if(pnRowIndex < 0){
		vcMap.reset();
		return;
	}
	["ID", "NAME", "TEL", "TYPE", "JOIN_DT", "AMT", "USE_YN", "OPTS", "MEMO"].forEach(function(vsCol){
		vcMap.setValue(vsCol, vcDs.getValue(pnRowIndex, vsCol));
	});
}

/**
 * 입력값 검증. 실패 시 메시지와 포커스 대상 컨트롤 id를 반환한다.
 * @return {Object} {msg, ctrl} 또는 null(정상)
 */
function validateForm(){
	if(ValueUtil.isNull(app.lookup("ipbName").value)){
		return {msg: "고객명을 입력하세요.", ctrl: "ipbName"};
	}
	var vsTel = app.lookup("ipbTel").value;
	if(!ValueUtil.isNull(vsTel) && !/^01[0-9]-?\d{3,4}-?\d{4}$/.test(vsTel)){
		return {msg: "연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)", ctrl: "ipbTel"};
	}
	if(ValueUtil.isNull(app.lookup("cmbType").value)){
		return {msg: "요금제를 선택하세요.", ctrl: "cmbType"};
	}
	return null;
}

/**
 * 메시지를 팝업으로 띄우고, 닫힌 뒤 지정한 컨트롤로 포커스를 되돌린다.
 */
function alertAndRestore(psMsg, psState, psFocusId){
	util.Msg.alertDlg(app, psMsg, null, {
		msgStateType: psState,
		confirmCallback: function(){
			restoreFocus(psFocusId);
		},
		cancelCallback: function(){
			restoreFocus(psFocusId);
		}
	});
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시)
 ************************************************/

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit2(e){
	app.focuscyclic = true;
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	bindFocusTracking();
	var vcGrid = app.lookup("grdList");
	if(app.lookup("dsList").getRowCount() > 0){
		vcGrid.selectRows(0);
	}
}

/*
 * 탭 폴더에서 selection-change 이벤트 발생 시 호출.
 * 탭 이동 후 해당 탭에서 마지막으로 작업하던 컨트롤로 포커스를 되돌린다.
 */
function onTabMainSelectionChange(e){
	restoreFocus(voFocusMap[getTabKey()]);
}

/*
 * "조회" 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e){
	var btnSearch = e.control;
	doSearch();
	util.Msg.notify(app, "조회되었습니다. (" + app.lookup("dsList").getRowCount() + "건)");
	restoreFocus("ipbSchName");
}

/*
 * "초기화" 버튼(btnReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnResetClick(e){
	var btnReset = e.control;
	["ipbSchName", "cmbSchType", "dtiSchFrom", "dtiSchTo"].forEach(function(vsId){
		app.lookup(vsId).value = "";
	});
	app.lookup("rdbSchUse").value = "";
	doSearch();
	restoreFocus("ipbSchName");
}

/*
 * 고객명 검색 입력(ipbSchName)에서 keydown 이벤트 발생 시 호출.
 * Enter 입력 시 바로 조회한다.
 */
function onIpbSchNameKeydown(e){
	if(e.keyCode == cpr.events.KeyCode.ENTER){
		doSearch();
	}
}

/*
 * 그리드(grdList)에서 selection-change 이벤트 발생 시 호출.
 * Grid의 Row 선택 이후 발생하는 이벤트.
 */
function onGrdListSelectionChange(e){
	var grdList = e.control;
	copyRowToForm(grdList.getSelectedRowIndex());
}

/*
 * "신규" 버튼(btnNew)에서 click 이벤트 발생 시 호출.
 * 폼을 비우고 첫 입력 항목으로 포커스를 이동한다.
 */
function onBtnNewClick(e){
	var btnNew = e.control;
	app.lookup("dmForm").reset();
	app.lookup("dmForm").setValue("USE_YN", "Y");
	restoreFocus("ipbName");
}

/*
 * "저장" 버튼(btnSave)에서 click 이벤트 발생 시 호출.
 * 검증 실패 시 오류 팝업을 띄우고, 닫으면 오류 항목으로 포커스를 되돌린다.
 */
function onBtnSaveClick(e){
	var btnSave = e.control;
	var voErr = validateForm();
	if(voErr){
		alertAndRestore(voErr.msg, "WARNING", voErr.ctrl);
		return;
	}

	var vcDs = app.lookup("dsList");
	var vcMap = app.lookup("dmForm");
	var voRow = {};
	["ID", "NAME", "TEL", "TYPE", "JOIN_DT", "AMT", "USE_YN", "OPTS", "MEMO"].forEach(function(vsCol){
		voRow[vsCol] = vcMap.getValue(vsCol);
	});

	var vcRow = ValueUtil.isNull(voRow.ID) ? null : vcDs.findFirstRow("ID == '" + voRow.ID + "'");
	if(vcRow){
		vcDs.updateRow(vcRow.getIndex(), voRow);
	} else {
		voRow.ID = String(1000 + vcDs.getRowCount() + 1);
		vcDs.addRowData(voRow);
		vcMap.setValue("ID", voRow.ID);
	}
	util.Msg.notify(app, "저장되었습니다.");
	restoreFocus(voFocusMap[getTabKey()] || "ipbName");
}

/*
 * "팝업 확인" 버튼(btnPopup)에서 click 이벤트 발생 시 호출.
 * 팝업을 닫은 뒤 팝업 호출 직전 포커스 위치로 복귀한다.
 */
function onBtnPopupClick(e){
	var btnPopup = e.control;
	var vsFocusId = voFocusMap[getTabKey()];
	util.Msg.confirmDlg(app, "입력 중인 내용을 유지하고 계속하시겠습니까?", null, {
		confirmCallback: function(){
			restoreFocus(vsFocusId);
		},
		cancelCallback: function(){
			restoreFocus(vsFocusId);
		}
	});
}

/*
 * "오류 발생" 버튼(btnError)에서 click 이벤트 발생 시 호출.
 * 존재하지 않는 경로로 서브미션을 호출해 통신 오류를 발생시키고, 오류 처리 후 포커스를 되돌린다.
 */
function onBtnErrorClick(e){
	var btnError = e.control;
	var vsFocusId = voFocusMap[getTabKey()];
	util.Submit.send(app, "subFail", function(pbSuccess){
		if(!pbSuccess){
			restoreFocus(vsFocusId);
		}
	});
}

/*
 * "화면 전환" 버튼(btnSwitch)에서 click 이벤트 발생 시 호출.
 * 조회영역/목록을 숨겨 입력 전용 화면으로 전환하고, 다시 눌러 복귀하면 전환 직전 포커스로 되돌린다.
 */
function onBtnSwitchClick(e){
	var btnSwitch = e.control;
	if(!vbSwitched){
		vsSwitchFocusId = voFocusMap[getTabKey()] || "btnSwitch";
		vbSwitched = true;
		app.lookup("grpSearch").visible = false;
		app.lookup("grpList").visible = false;
		btnSwitch.value = "목록 화면";
		restoreFocus("btnSwitch");
	} else {
		vbSwitched = false;
		app.lookup("grpSearch").visible = true;
		app.lookup("grpList").visible = true;
		btnSwitch.value = "화면 전환";
		restoreFocus(vsSwitchFocusId);
	}
	app.getContainer().redraw();
}
