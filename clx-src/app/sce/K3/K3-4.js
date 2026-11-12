/************************************************
 * K3-4.js
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

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/* ==== [app/sce/A12/A12-1.clx] 12.1 키보드 내비게이션 ==== */
/*
 * "Button" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	util.Msg.confirmDlg(app, "버튼 Click 이벤트가 발생했습니다.")
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit2(e){
	app.focuscyclic = true;
}

/* ==== [app/sce/A12/A12-2.clx] 12.2 고대비 및 색약 모드 ==== */
/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbColorSelectionChange(e){
	var voElBody = document.body;
	
	var vcItem = e.newSelection;
	var vsItemColor = vcItem.value;
	if (vsItemColor == "default") {
		var vsDefault = localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-theme") || "light";
		voElBody.setAttribute("data-cl-mode", vsDefault);
	} else {
		voElBody.setAttribute("data-cl-mode", vcItem.value);
	}
	
	localStorage.setItem(AppProperties.PROJECT_NM + "data-xb-color", vcItem.value);
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	app.lookup("rdbColor").value = localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-color") || "default";
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCbx1ValueChange(e){
	var cbx1 = e.control;
	
	var rootAppIns = app.getRootAppInstance();
	var rootContainer = rootAppIns.getContainer();
	
	if(rootContainer.style.hasClass("invert")) {
		rootContainer.style.removeClass("invert");
	} else {
		rootContainer.style.addClass("invert");
	}
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCbx3ValueChange(e){
	var cbx = e.control;
	
	var voRootAppIns = app.getRootAppInstance();
	var voElBody = document.body;
	if(cbx.checked) {
		voElBody.setAttribute("class", "dark-mode");
	} else {
		voElBody.removeAttribute("class", "dark-mode");
	}
	
	if(voRootAppIns.hasAppMethod("setDarkLogo")) {
		voRootAppIns.callAppMethod("setDarkLogo", voElBody.classList.contains("dark-mode"));
	}
}
/* ==== 원그리드 예제 ==== */
/*
 * "조회" 버튼(btnOneSearch)에서 click 이벤트 발생 시 호출.
 * 품목명/구분 조건으로 원그리드(grdOne)를 필터링한다.
 */
function onBtnOneSearchClick(e){
	var btnOneSearch = e.control;
	doOneSearch();
}

/*
 * 품목명 입력(ipbOneSchName)에서 keydown 이벤트 발생 시 호출.
 */
function onIpbOneSchNameKeydown(e){
	if(e.keyCode == cpr.events.KeyCode.ENTER){
		doOneSearch();
	}
}

/**
 * 조회조건으로 dsOne 을 필터링한다.
 */
function doOneSearch(){
	var vsName = app.lookup("ipbOneSchName").value;
	var vsType = app.lookup("cmbOneSchType").value;
	var vaCond = [];
	if(!ValueUtil.isNull(vsName)){
		vaCond.push("ITEM_NM.indexOf('" + vsName + "') >= 0");
	}
	if(!ValueUtil.isNull(vsType)){
		vaCond.push("ITEM_TYPE == '" + vsType + "'");
	}
	var vcDs = app.lookup("dsOne");
	if(vaCond.length > 0){
		vcDs.setFilter(vaCond.join(" && "));
	} else {
		vcDs.clearFilter();
	}
	app.lookup("grdOne").redraw();
}

/*
 * 그리드 CUD 버튼(udcComGridCudBtnsOne)에서 save 이벤트 발생 시 호출.
 * 필수값(품목명, 구분)을 검증한 뒤 변경 내용을 확정한다.
 */
function onUdcComGridCudBtnsOneSave(e){
	var vcDs = app.lookup("dsOne");
	for(var i = 0; i < vcDs.getRowCount(); i++){
		if(ValueUtil.isNull(vcDs.getValue(i, "ITEM_NM")) || ValueUtil.isNull(vcDs.getValue(i, "ITEM_TYPE"))){
			util.Msg.alertDlg(app, (i + 1) + "번째 행의 품목명과 구분은 필수 입력입니다.");
			app.lookup("grdOne").selectRows(i);
			return;
		}
	}
	vcDs.commit();
	util.Msg.notify(app, "저장되었습니다.");
}
