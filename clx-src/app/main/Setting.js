/************************************************
 * Setting.js
 * Created at 2025. 4. 1. 오후 6:46:56.
 *
 * @author ryu
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
var msHotkey = "";

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/ 


/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	/* 각 카테고리 별 초기값 설정 */
	
	var vcRdbTheme = app.lookup("rdbTheme");
	var vcRdbPrimary = app.lookup("rdbPrimary");
	var vcRdbLayout = app.lookup("rdbLayout");
	var vcCmbMdiCnt = app.lookup("cmbMdiCnt");
	var vcCmbMdiFirstClose = app.lookup("cmbMdiFirstClose");
	var vcCmbSnavSetting = app.lookup("cmbSnavSetting");
	var vcRdbStruct = app.lookup("rdbStruct");
	var vcCmbDepth = app.lookup("cmbDepth");
	var vcCmbScale = app.lookup("cmbScale");
	var vcCmbFloat = app.lookup("cmbFloat");
	var vcCmbFontFamliy = app.lookup("cmbFontFamliy");
	var vcCmbFontSize = app.lookup("cmbFontSize");
	var vcRdbLogoImg = app.lookup("rdbLogoImg");
	
	// 테마 모드
	vcRdbTheme.value = localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-theme") || "system";
	
	// 메인 색상
	vcRdbPrimary.value = localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-color") || "white-theme";
	
	// 메인 레이아웃
	vcRdbLayout.value = localStorage.getItem(AppProperties.PROJECT_NM + "viewType") || "multi";
	vcCmbMdiCnt.enabled = (vcRdbLayout.value == "multi");
	vcCmbMdiFirstClose.enabled = (vcRdbLayout.value == "multi");
	
	// GNB 메뉴 Depth
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "gnbDepth"))) {
		vcCmbDepth.value = localStorage.getItem(AppProperties.PROJECT_NM + "gnbDepth");
	}
	
	// MDI 탭 오픈 개수
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "mdiWindowMaxCount"))) {
		vcCmbMdiCnt.value = localStorage.getItem(AppProperties.PROJECT_NM + "mdiWindowMaxCount");
	}
	
	// MDI 탭 초과시 닫기 옵션
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "mdiFirstClose"))) {
		vcCmbMdiFirstClose.value = localStorage.getItem(AppProperties.PROJECT_NM + "mdiFirstClose");
	}
	
	// 화면 선택 시 사이드 메뉴 접기 여부
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "mdiSideCollasped"))) {
		vcCmbSnavSetting.value = localStorage.getItem(AppProperties.PROJECT_NM + "mdiSideCollasped");
	}
	
	// 메인 구조
	vcRdbStruct.value = localStorage.getItem(AppProperties.PROJECT_NM + "mainType") || "vertical";
	if(vcRdbStruct.value == "horizontal") {
		app.lookup("grpGnbDepth").visible = false;
	}
	
	// 메뉴 플로팅 옵션
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "floatMenuType"))) {
		vcCmbFloat.value = localStorage.getItem(AppProperties.PROJECT_NM + "floatMenuType");
	}
	
	// font-family
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "data-fontFamily"))) {
		vcCmbFontFamliy.value = localStorage.getItem(AppProperties.PROJECT_NM + "data-fontFamily");
	}
	
	// font-size
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "data-fontSize"))) {
		vcCmbFontSize.value = localStorage.getItem(AppProperties.PROJECT_NM + "data-fontSize");
	}
	
	// 초기화면 크기
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "data-scrScale"))) {
		vcCmbScale.value = localStorage.getItem(AppProperties.PROJECT_NM + "data-scrScale");
	}
	
	// 로고 이미지 변경
	vcRdbLogoImg.value = localStorage.getItem(AppProperties.PROJECT_NM + "data-logoImg") || "ori";
	
	// 단축키
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "hotKey"))) {
		var vaHotKey = JSON.parse(localStorage.getItem(AppProperties.PROJECT_NM + "hotKey"));
		app.lookup("dsHotKey").build(vaHotKey);
		app.lookup("dsHotKeyGrid").build(vaHotKey);
	}
	
	app.lookup("cmbFunction").selectItem(0);
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbThemeSelectionChange(e){
	var voElBody = document.body;
	var voRootAppIns = app.getRootAppInstance();
	
	var vcGrpRdbPrimary = app.lookup("grpRdbPrimary");
	var vcItem = e.newSelection;
	var vsItemColor = vcItem.value;
	
	switch(vsItemColor){
		case "system" :
			var isSysDark = getSystemTheme();
			if(isSysDark) {
				voElBody.classList.add("dark-mode");
				vcGrpRdbPrimary.visible = false;
			} else {
				voElBody.classList.remove("dark-mode");
				vcGrpRdbPrimary.visible = true;
			}
			break;
		case "high-contrast" :
			voElBody.classList.add("dark-mode");
			vcGrpRdbPrimary.visible = false;
			break;
		case "light" :
			voElBody.classList.remove("dark-mode");
			vcGrpRdbPrimary.visible = true;
			break;
	}
	
	if(voRootAppIns.hasAppMethod("setDarkLogo")) {
		voRootAppIns.callAppMethod("setDarkLogo", voElBody.classList.contains("dark-mode"));
	}
	
	localStorage.setItem(AppProperties.PROJECT_NM + "data-xb-theme", vcItem.value);
	app.lookup("rdbPrimary").selectItem(localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-color"), false);
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbPrimarySelectionChange(e){
	var voElBody = document.body;
	
	var vcItem = e.newSelection;
	var vsItemColor = vcItem.value;
	voElBody.setAttribute("data-cl-mode", vsItemColor);
	localStorage.setItem(AppProperties.PROJECT_NM + "data-xb-color", vsItemColor);
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbLayoutSelectionChange(e){
	var rdbLayout = e.control;
	var vsVal = rdbLayout.value;
	
	var vcCmbMdiCnt = app.lookup("cmbMdiCnt");
	var vcCmbMdiFirstClose = app.lookup("cmbMdiFirstClose");
	
	if(vsVal == "multi"){
		// multi
		vcCmbMdiCnt.enabled = true;
		vcCmbMdiFirstClose.enabled = true;
	} else {
		// single
		vcCmbMdiCnt.enabled = false;
		vcCmbMdiFirstClose.enabled = false;
	}
	
	util.Msg.confirmDlg(app, e.newSelection.label + " 뷰 타입으로 변경되었습니다.\n화면 새로고침 후 적용됩니다.\n화면을 갱신하시겠습니까?", null, {
		confirmCallback: function(){
			localStorage.setItem(AppProperties.PROJECT_NM + "viewType", vsVal);
			window.location.reload();
		},
		cancelCallback: function(){
			rdbLayout.selectItem(e.oldSelection, false);
			cpr.core.DeferredUpdateManager.INSTANCE.update();
			
			vcCmbMdiCnt.enabled = (e.oldSelection.value == "multi");
			vcCmbMdiFirstClose.enabled = (e.oldSelection.value == "multi");
		}
	});	
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbMdiCntSelectionChange(e){
	localStorage.setItem(AppProperties.PROJECT_NM +  "mdiWindowMaxCount", e.newSelection[0].value);
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbMdiFirstCloseSelectionChange(e){
	localStorage.setItem(AppProperties.PROJECT_NM + "mdiFirstClose", e.newSelection[0].value);
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbSnavSettingSelectionChange(e){
	localStorage.setItem(AppProperties.PROJECT_NM + "mdiSideCollasped", e.newSelection[0].value);
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbStructSelectionChange(e){
	var rdbStruct = e.control;
	
	util.Msg.confirmDlg(app, "메인 구조가 "+e.newSelection.label + " (으)로 변경되었습니다.\n화면 새로고침 후 적용됩니다.\n화면을 갱신하시겠습니까?", null, {
		confirmCallback: function(){
			localStorage.setItem(AppProperties.PROJECT_NM + "mainType", e.newSelection.value);
			window.location.reload();
		},
		cancelCallback: function(){
			rdbStruct.selectItem(e.oldSelection, false);
			cpr.core.DeferredUpdateManager.INSTANCE.update();
		}
	});
	
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbFloatSelectionChange(e){
	localStorage.setItem(AppProperties.PROJECT_NM + "floatMenuType", e.newSelection[0].value);
}


/*
 * "초기화" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	
	util.Msg.confirmDlg(app, "개인화 설정 정보를 초기화 합니다.\n화면 새로고침 후 적용됩니다.\n화면을 갱신하시겠습니까?", null, {
		confirmCallback: function(){
			// 테마 모드
			localStorage.removeItem(AppProperties.PROJECT_NM + "data-xb-theme");
			
			// 메인 색상
			localStorage.removeItem(AppProperties.PROJECT_NM + "data-xb-color");
			
			// 메인 레이아웃
			localStorage.removeItem(AppProperties.PROJECT_NM + "viewType");
			
			// GNB 메뉴 Depth
			localStorage.removeItem(AppProperties.PROJECT_NM + "gnbDepth");
			
			// MDI 탭 오픈 개수
			localStorage.removeItem(AppProperties.PROJECT_NM + "mdiWindowMaxCount");
			
			// MDI 탭 초과시 닫기 옵션
			localStorage.removeItem(AppProperties.PROJECT_NM + "mdiFirstClose");
			
			// 화면 선택 시 사이드 메뉴 접기 여부
			localStorage.removeItem(AppProperties.PROJECT_NM + "mdiSideCollasped");
			
			// 메인 구조
			localStorage.removeItem(AppProperties.PROJECT_NM + "mainType");
			
			// 메뉴 플로팅 옵션
			localStorage.removeItem(AppProperties.PROJECT_NM + "floatMenuType");
			
			// 평가 시나리오 플로팅 옵션
			localStorage.removeItem(AppProperties.PROJECT_NM + "floatSceneType");
			
			// font-family
			localStorage.removeItem(AppProperties.PROJECT_NM + "data-fontFamily");
			
			// font-family
			localStorage.removeItem(AppProperties.PROJECT_NM + "data-fontSize");
			
			// 화면 배율
			localStorage.removeItem(AppProperties.PROJECT_NM + "data-scrScale");
			
			// 로고 이미지 초기화
			localStorage.removeItem(AppProperties.PROJECT_NM + "data-logoImg");
			
			// 사용자별 단축키 삭제
			localStorage.removeItem(AppProperties.PROJECT_NM + "hotKey");
			
			window.location.reload();
		},
	});
}

/*
 * "닫기" 버튼(btn4)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn4Click(e){
	app.close();
}

/*
 * 루트 컨테이너에서 before-unload 이벤트 발생 시 호출.
 * 앱이 언로드되기 전에 발생하는 이벤트 입니다. 취소할 수 있습니다.
 */
function onBodyBeforeUnload(e){
	localStorage.setItem(AppProperties.PROJECT_NM + "hotKey", JSON.stringify(app.lookup("dsHotKey").getRowDataRanged()));
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbFontFamliySelectionChange(e){
	var voElBody = document.body;
	
	var vcItem = e.newSelection;
	var vsItemValue = vcItem[0].value;
	if (vsItemValue == "PretendardGOV") {
		voElBody.removeAttribute("data-fontFamily");
	} else {
		voElBody.setAttribute("data-fontFamily", vsItemValue);
	}
	
	localStorage.setItem(AppProperties.PROJECT_NM + "data-fontFamily", vsItemValue);
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbFontSizeSelectionChange(e){
	var voElBody = document.body;
	var vcItem = e.newSelection;
	var vsItemValue = vcItem[0].value;
	if (vsItemValue == "14") {
		voElBody.removeAttribute("data-fontSize");
	} else {
		voElBody.setAttribute("data-fontSize", vsItemValue);
	}
	
	localStorage.setItem(AppProperties.PROJECT_NM + "data-fontSize", vsItemValue);
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbScaleSelectionChange(e){
	var voElBody = document.body;
	var vcItem = e.newSelection;
	var vsItemValue = vcItem[0].value;
	if (vsItemValue == "100") {
		voElBody.removeAttribute("data-scrScale");
	} else {
		voElBody.setAttribute("data-scrScale", vsItemValue);
	}
	
	localStorage.setItem(AppProperties.PROJECT_NM + "data-scrScale", vsItemValue);
	if(app.getRootAppInstance().hasAppMethod("setScreenScale")) {
		app.getRootAppInstance().callAppMethod("setScreenScale", vsItemValue);
	}	
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbDashboardSelectionChange(e){
	var rdbStruct = e.control;

	localStorage.setItem(AppProperties.PROJECT_NM + "data-logoImg", e.newSelection.value);
	
	var rootAppInstance = app.getRootAppInstance();
	if(rootAppInstance.hasAppMethod("setLogo")) {
		rootAppInstance.callAppMethod("setLogo", e.newSelection.value);
	}
}

/*
 * 인풋 박스에서 keyup 이벤트 발생 시 호출.
 * 사용자가 키에서 손을 뗄 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onIpbHotKeyKeyup(e){
	var ipbHotKey = e.control;
	var vsDisplayText = ipbHotKey.displayingText;
	var vsTrimmed = vsDisplayText.trim();
	  
	if(vsTrimmed.match(/\+\s*$/)) {
	  	ipbHotKey.clear();
	}
}

/*
 * "등록" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	if(ValueUtil.isNull(app.lookup("ipbHotKey").value)) {
		util.Msg.alertDlg(app, "단축키를 입력해주세요.");
		return;
	}
	
	var vsFunction = app.lookup("cmbFunction").value;
	var dsHotKeyGrid = app.lookup("dsHotKeyGrid");
	var voFirstRow = dsHotKeyGrid.findFirstRow("KEY == \"" + vsFunction + "\"");
	
	if(voFirstRow) {
		voFirstRow.putValue("HOTKEY", app.lookup("ipbHotKey").value);
	} else {
		dsHotKeyGrid.addRowData({
			KEY: vsFunction,
			FUNCTION: app.lookup("cmbFunction").displayingText,
			HOTKEY: app.lookup("ipbHotKey").value
		})
	}
	
	var dsHotKey = app.lookup("dsHotKey");
	var voFirstRowOri = dsHotKey.findFirstRow("KEY == \"" + vsFunction + "\"");
	if(voFirstRowOri) {
		voFirstRowOri.putValue("HOTKEY", app.lookup("ipbHotKey").value);
	}
	
	app.lookup("grd1").redraw();
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbFunctionSelectionChange(e){
	if(ValueUtil.isNull(app.lookup("cmbFunction").value)) {
		app.lookup("ipbHotKey").putValue("");
	} else {
		app.lookup("ipbHotKey").value = e.newSelection[0].row.getValue("HOTKEY");
	}
}

/*
 * 인풋 박스에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onIpbHotKeyKeydown(e){
	e.preventDefault();
	var vcCtrl = e.control;
	if(ValueUtil.isNull(app.lookup("cmbFunction").value)) return;
	var vaKeys = [];
	if(e.ctrlKey) vaKeys.push("Ctrl");
	if(e.altKey) vaKeys.push("Alt");
	if(e.shiftKey) vaKeys.push("Shift");
	
	var vsKey = e.key;
	if ((["Control", "Shift", "Alt", "Meta"]).indexOf(vsKey) == -1) {
		vaKeys.push(vsKey.toUpperCase());
	}
    if(vaKeys.length == 1) vaKeys.push(""); 
	msHotkey = vaKeys.join(" + ");
	vcCtrl.putValue(msHotkey);
}

/*
 * 그리드에서 cell-click 이벤트 발생 시 호출.
 * Grid의 Cell 클릭시 발생하는 이벤트.
 */
function onGrd1CellClick(e){
	var grd1 = e.control;
	var dsHotKey = app.lookup("dsHotKey");
	if(e.cellIndex == 2) {
		var vsKey = grd1.getSelectedRow().getValue("KEY");
		var voFirstRow = dsHotKey.findFirstRow("KEY == \"" + vsKey + "\"");
		if(voFirstRow) {
			dsHotKey.putValue(voFirstRow.getIndex(), "HOTKEY", "");
		}
		grd1.dataSet.realDeleteRow(grd1.getSelectedRowIndex());
		grd1.redraw();	
	}
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onNbeDepthSelectionChange(e) {
	localStorage.setItem(AppProperties.PROJECT_NM +  "gnbDepth", e.newSelection[0].value);	
}
