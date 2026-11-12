/************************************************
 * udcComAppHeader.js
 * Created at 2024. 7. 19. 오후 5:31:50.
 *
 * @author ryu
 ************************************************/
/**************************************************
 * 전역 변수
 **************************************************/
var util = createCommonUtil();

/**************************************************
 * 사용자 정의 함수
 **************************************************/
function viewProcess(){
	
	if (!mcQuickProcess || !mcQuickProcess.visible) {
		floatQuickProcess(true);
	} else {
		floatQuickProcess(false);
	}
}
exports.viewProcess = viewProcess;

/**
 * 앱 컨텐츠를 pdf 내보내기한다.<br>
 * <br>
 * 참고 url
 * https://developer.mozilla.org/ko/docs/Web/HTML/Element/canvas<br>
 * https://github.com/eKoopmans/html2pdf.js/projects/5<br>
 * https://ekoopmans.github.io/html2pdf.js<br>
 * https://rawgit.com/MrRio/jsPDF/master/docs/jspdf.js.html
 * @param {cpr.controls.UIControl} control
 */
function exportPdf(control, isMultiple, isLastIdx){
	var voHostAppIns = app.getHostAppInstance();
	var targetDOM =  document.querySelector("[data-usr-uuid = \""+control.htmlAttr("uuid") + "\"]");
	if(!targetDOM) return;
	
	html2pdf().from(targetDOM).set({
		margin: 10,
		filename: voHostAppIns.app.title + '.pdf',
		image: { type: "jpeg", quality: 1 },
		html2canvas: {
			scale: 3
		},
		jsPDF: {
			orientation: 'landscape',
			unit: 'px',
			format: [1200, 1700],
			compress: true,
		}
	}).save().then(function(){
	});
}

/**************************************************
 * 평가 프로세스 구성
 **************************************************/
/*
 * 평가 프로세스 목록은 docs > POC_PROCESS.xlsx 파일로 구성하여
 * dsPocProcess에 copy&paste로 데이터를 구성합니다. 
 */
var mcQuickProcess = null; // 프로세스 컴포넌트 객체
var mnProcessWidth = 300; // 프로세스 컴포넌트 width

/**
 * 평가 시나리오 가시성을 변경하는 함수.
 * @param {Boolean} pbVisible 토글이 아니라 의도적으로 가시성을 지정하는 파라미터
 */
exports.closeProcess = function(pbVisible) {
	var vbVisible = pbVisible !== undefined ? pbVisible : (!mcQuickProcess || !mcQuickProcess.visible);
	floatQuickProcess(vbVisible);
}

/**
 * 우측 프로세스 컴포넌트 플로팅
 * @param {Boolean} pbIsShow
 */
function floatQuickProcess(pbIsShow) {
	
	//상위 appInstance를 가지고 온다. 
	var hostApp = app.getHostAppInstance();		
	var voLayout = app.getHostAppInstance().getContainer().getLayout();
	var dsProcess = hostApp.lookup(app.getAppProperty("dsProcessId"));	
	
	// 우측 margin 계산
	var vnRightMargin;
	if (voLayout._org_p_rightMargin) {
		vnRightMargin = voLayout._org_p_rightMargin;
	} else {
		var vsRightMargin = String(hostApp.getContainer().getLayout().rightMargin);
		var regex = /[^0-9]/g;
		vnRightMargin = Number(vsRightMargin.replace(regex, ""));
		voLayout._org_p_rightMargin = vnRightMargin;
	}
	
	// 다이얼로그 처리	
	if (util.Dialog.isDialogPopup(hostApp)) {
		var voDialogMng = app.getRootAppInstance().dialogManager;
		var vsDialogNm = voDialogMng.getActiveDialogName();
		var vnDialogConst = voDialogMng.getConstraintByName(vsDialogNm);
		var vcDialog = voDialogMng.getDialogByName(vsDialogNm);
		var vnWidth = Number(vcDialog.userAttr("_originWidth"));
		
		if (pbIsShow) {
			vnWidth = vnWidth + ((vnRightMargin * 2) * 0) + mnProcessWidth;
		}
		
		if (app.targetScreen.name != "EXB-PART") {
			app.getRootAppInstance().dialogManager.replaceConstraintByName(vsDialogNm, {
				"width": vnWidth + "px",
				"height": Number(vcDialog.userAttr("_originHeight")) + "px"
			});
		}
	}
	
	// 프로세스 컴포넌트 생성
	if (!mcQuickProcess) {
		mcQuickProcess = new udc.poc.udcPocViewProcess();
		mcQuickProcess.dataSet = dsProcess;
		mcQuickProcess.exandAll = app.getAppProperty("isExpandAllPocProcess");
		setupRightProcessFix(hostApp, mcQuickProcess, (vnRightMargin * 0));
	}
	
	if (pbIsShow) {
		mcQuickProcess.visible = true;
		vnRightMargin = vnRightMargin + mnProcessWidth; // 프로세스 영역 width
		mcQuickProcess.addHighlight();
	} else {
		mcQuickProcess.visible = false;
		mcQuickProcess.removeHighlight();
	}
	
	var vsSceneFloatType = localStorage.getItem(AppProperties.PROJECT_NM + "floatSceneType");
	var isProcessFloat = (vsSceneFloatType == "float"); // 평가 시나리오 플로팅 여부
	
	if(!isProcessFloat) {
		// 콘텐트 화면 우측 margine 적용	
		hostApp.getContainer().getLayout().rightMargin = vnRightMargin;
	} else {
		// 플로팅
		hostApp.getContainer().getLayout().rightMargin = voLayout._org_p_rightMargin;
	}
}

/**
 * 우측 프로세스 콘텐츠 플로팅 위치를 계산합니다
 * 일반적으로 루트 레이아웃이 버티컬,폼 레이아웃을 활용시 구성됩니다. 
 * @param {cpr.core.AppInstance} poApp
 * @param {cpr.controls.UIControl} pcControl
 * @param {Number} pnRightMargin
 */
function setupRightProcessFix(poApp, pcControl, pnRightMargin) {
	var vcHostRootCont = poApp.getContainer();
	var voHostRootLot = poApp.getContainer().getLayout();
	var vsLotType		= voHostRootLot.type;
	var vsTopMargin		= voHostRootLot.topMargin;
	var vsBottomMargin	= voHostRootLot.bottomMargin;
	
	var voFloatStyle = {
		"right": pnRightMargin + "px",
		"width": mnProcessWidth + "px"
	}		
	
	if(vsLotType == "verticallayout"){ // 루트 레이아웃이 버티컬 레이아웃
		vsTopMargin += "px";		
		var regExp =  /[^0-9]/g;
		
		if(app.getAppProperty("isFillContainer")){		
			pcControl.fillContainer(true);
			//voFloatStyle["height"] = "calc(100% - " + (Number(vsTopMargin.toString().replace(regExp, "")) + Number(vsBottomMargin.toString().replace(regExp, ""))) + "px)";
			voFloatStyle["height"] = "100%";
		}
	} else if(vsLotType == "formlayout") { // 폼 레이아웃일 경우 고정 높이조정
		var regExp =  /[^0-9]/g;		
		pcControl.fillContainer(true);
//		voFloatStyle["height"] = "calc(100% - " + (Number(vsTopMargin.replace(regExp, "")) + Number(vsBottomMargin.replace(regExp, ""))) + "px)";
		voFloatStyle["height"] = "100%";
	}
	
	if(vsTopMargin.indexOf("fr") > -1) vsTopMargin = "16px";	
	voFloatStyle["top"] = "0px"; //vsTopMargin;
	
	// 컨테이너에 플로팅
	poApp.floatControl(pcControl, voFloatStyle);
	
	if(vsLotType == "formlayout"){
		//평가 프로세스가 렌더링 된 후 부모 화면의 height와 부모 화면의 전체 자식 영역의 height 높이가 다를 경우 스크롤이 출력으로 간주하여 다시 floating
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
			if(poApp.targetScreen.name != AppProperties.SCREEN_MOBILE_NM){
				var voContentPaneRect = vcHostRootCont.getContentPaneRect();
				if(vcHostRootCont.getActualRect().height != vcHostRootCont.getContentPaneRect().height){
					poApp.floatControl(pcControl, {
						"top" : vsTopMargin,
						"right": pnRightMargin + "px",
						"width": mnProcessWidth + "px",
						"height": (vcHostRootCont.getContentPaneRect().height - 20) + "px" 
					});
				}	
			}
		});
	}
}

/**************************************************
 * 이벤트 리스너 함수
 **************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var hostApp = app.getHostAppInstance();
	if(!hostApp) return;
	
	if (!util.Dialog.isDialogPopup(hostApp) && app.getRootAppInstance().hasAppMethod("getMenuPath")) {
		
		//어플리케이션 메뉴 정보
		var voMenuInfo = util.Main.getMenuInfo(app);
		var vsCallPage = voMenuInfo.get("CALL_PAGE");
		var vsMenuId = voMenuInfo.get("MENU_ID");
		var vsMenuNm = voMenuInfo.get("MENU_NM");
		
		var vsAppPropTitle = app.getAppProperty("title");
		
		if (!ValueUtil.isNull(vsMenuNm) && vsAppPropTitle == "타이틀을 입력하세요") {
			app.lookup("optTit").value = vsMenuNm;
		}

		// 로컬스토리지에 저장된 즐겨찾기 메뉴일 경우
		var vsFavMenus = localStorage.getItem(AppProperties.PROJECT_NM + "favMenus");
		// 로컬스토리지에 즐겨찾기 메뉴ID 저장
		if (!ValueUtil.isNull(vsFavMenus)) {
			JSON.parse(vsFavMenus).filter(function(each){
				if (vsMenuId == each) app.lookup("cbxFav").checked = true;
				return;
			});
		}
		
		app.setAppProperty("menuType", voMenuInfo.get("MENU_TYPE"));
	} else {
		var vsAppPropTitle = app.getAppProperty("title");
		if (vsAppPropTitle == "타이틀을 입력하세요") {
			app.lookup("optTit").value = hostApp.app.title;
		}
	}
	
	// 조회조건 그룹 ID
	var vsSearchBoxId  = app.getAppProperty("searchBoxId") != null ? app.getAppProperty("searchBoxId") : "grpSearch";
	// 데이터 그룹 ID
	var vsDisableBoxId = app.getAppProperty("groupBoxIds");
	var vaDisableBoxIds = vsDisableBoxId != null ? ValueUtil.split(vsDisableBoxId, ",") : ["grpData"];
	
	//조회조건 그룹 		
	if (!ValueUtil.isNull(vsSearchBoxId)) {
		var pbExist = false;
		for (var i = 0, len = vaDisableBoxIds.length; i < len; i++) {
			if (hostApp.lookup(vaDisableBoxIds[i]) != null) {
				pbExist = true;
				break;
			}
		}
		
		if (pbExist) {
			var vsInitializeYn = app.getAppProperty("isGrpDataDisable");			
						
			// 화면 조회시 grpData 그룹 비활 예외 처리				
			util.Group.initSearchBox(hostApp, vsSearchBoxId, vaDisableBoxIds, null, vsInitializeYn);
		}
	}
	
	//그리드 초기화
	//그리드ID가 지정된 경우가 아니면... 화면 내의 모든 그리드를 대상으로 초기화 작업을 수행한다.
	if(app.getAppProperty("isGridInit")) {
		var vaIgnoreGridIds = ValueUtil.split(app.getAppProperty("ignoreGridIds"), ",");
		var vaGridIds = util.Group.getAllChildrenByType(hostApp, "grid").filter(function(/* cpr.controls.Grid */ grid){
			return (vaIgnoreGridIds.indexOf(grid.id) == -1) ;
		});
		util.Grid.init(hostApp, vaGridIds);
	}
	
	//프리폼 초기화
	if(app.getAppProperty("isFreeformInit")) {
		var vaSearchBoxIds = ValueUtil.split(vsSearchBoxId, ",");
		var vaIgnoreFreeformIds = ValueUtil.split(app.getAppProperty("ignoreFreeFormIds"), ",");
		var vaFreeformIds = [];
		util.Group.getAllChildrenByType(hostApp, "container", null, true).forEach(function(/* cpr.controls.Container */ form){
			if (vaIgnoreFreeformIds.indexOf(form.id) == -1 && vaSearchBoxIds.indexOf(form.id) == -1 && form.getLayout() instanceof cpr.controls.layouts.FormLayout) {
				if (util.Group.getBindDataSet(app, form) != null) {
					vaFreeformIds.push(form.id);
				}
			}
		});
		util.FreeForm.init(hostApp, vaFreeformIds);
	}
	
	// 트리 초기화
	if(app.getAppProperty("isTreeInit")) {
		var vaIgnoreTreeIds = ValueUtil.split(app.getAppProperty("ignoreTreeIds"), ",");
		var vaTrees = util.Group.getAllChildrenByType(hostApp, "tree", null, true).filter(function(/* cpr.controls.Tree */ tree){
			return (vaIgnoreTreeIds.indexOf(tree.id) == -1) ;
		});
		util.Tree.init(hostApp, vaTrees);
	}
	
	// 평가 프로세스 구성
	if (app.targetScreen.name != "EXB-PART" && app.targetScreen.name != "EXB-POP") {		
		var dsProcessId = app.getAppProperty("dsProcessId");		
		if (!app.getAppProperty("isViewPocProcess") || ValueUtil.isNull(dsProcessId) || !hostApp.lookup(dsProcessId)) return;
		if (hostApp.lookup(dsProcessId).getRowCount() == 0) return;
		
		app.getContainer().getLayout().setColumnVisible(3, true);
		floatQuickProcess(true);
	}
}

/*
 * 아웃풋에서 dblclick 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 더블 클릭할 때 발생하는 이벤트.
 */
function onOutputDblclick(e){
	util.procEb6Privew(app);
}

/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 전파되는 이벤트.
 */
function onBodyScreenChange(e){
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		var hostApp = app.getHostAppInstance();
		if(!hostApp) return;
		
		var vaCtrls = hostApp.getContainer().getAllRecursiveChildren(true);
		var vsScreenNm = e.screen.name;
		vaCtrls.filter(function(each) {
			return each.style.hasClass("subpage") || each.style.hasClass("content-box") || each.style.hasClass("card");
		}).forEach(function( /*cpr.controls.Container*/ each) {
			var voLayout = each.getLayout();
			if (voLayout instanceof cpr.controls.layouts.VerticalLayout || voLayout instanceof cpr.controls.layouts.FormLayout) {
				if (vsScreenNm == "EXB-PART") {
					voLayout._org_topMargin = voLayout.topMargin;
					voLayout._org_rightMargin = voLayout.rightMargin;
					voLayout._org_bottomMargin = voLayout.bottomMargin;
					voLayout._org_leftMargin = voLayout.leftMargin;
					voLayout.topMargin = 5;
					voLayout.bottomMargin = 5;
					voLayout.leftMargin = 10;
					voLayout.rightMargin = 5;
				} else {
					var vnOrgTopMargin = voLayout._org_topMargin;
					if (vnOrgTopMargin != undefined) {
						voLayout.topMargin = voLayout._org_topMargin;
						voLayout.rightMargin = voLayout._org_rightMargin;
						voLayout.bottomMargin = voLayout._org_bottomMargin;
						voLayout.leftMargin = voLayout._org_leftMargin;
					}
				}				
			}
		});
	});
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCheckBoxValueChange(e){
	var checkBox = e.control;
	
	//어플리케이션 메뉴 정보
	var voMenuInfo = util.Main.getMenuInfo(app);
	var vsMenuId = voMenuInfo.get("MENU_ID");
	var favMenus = [];
	var vsFavMenus = localStorage.getItem(AppProperties.PROJECT_NM + "favMenus");
		
	if (checkBox.checked) {
		// 로컬스토리지에 즐겨찾기 메뉴ID 저장
		if (!ValueUtil.isNull(JSON.parse(vsFavMenus))) {
			JSON.parse(vsFavMenus).filter(function(each){
				if (vsMenuId != each) favMenus.push(each);
				return;
			});
		}
		
		favMenus.push(vsMenuId);
	} else {
		// 로컬스토리지에 즐겨찾기 메뉴ID 삭제
		if (!ValueUtil.isNull(JSON.parse(vsFavMenus))) {
			JSON.parse(vsFavMenus).forEach(function(each, idx){
				if (vsMenuId == each) favMenus.splice(idx, 1);
				else favMenus.push(each);
			});
		}
		
	}
	
	localStorage.setItem(AppProperties.PROJECT_NM + "favMenus", JSON.stringify(favMenus));
	
	var rootAppIns = app.getRootAppInstance();
	if(rootAppIns.hasAppMethod("favMnRefresh")) {
		rootAppIns.callAppMethod("favMnRefresh");
	}
}

/*
 * 버튼(btnPdf)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPdfClick(e){
	cpr.core.ResourceLoader.loadScript("thirdparty/html2pdf/dist/html2pdf.bundle.min.js").then(function(input){
		var voHostAppInstance = app.getHostAppInstance();
		var vsExportPdfGrpIds = app.getAppProperty("exportPdfGrpIds");
		
		if(ValueUtil.isNull(vsExportPdfGrpIds)){
			voHostAppInstance.getContainer().htmlAttr("uuid", voHostAppInstance.getContainer().uuid);
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
				exportPdf(voHostAppInstance.getContainer());
			});
			
		} else {
			var vaGrpIds = vsExportPdfGrpIds.split(",");
			vaGrpIds.forEach(function(each, idx){
				if(vaGrpIds.length-1 == idx){
					var pbLastIdx = true;
				}
				voHostAppInstance.lookup(each.trim()).htmlAttr("uuid", voHostAppInstance.lookup(each.trim()).uuid);
				cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
					exportPdf(voHostAppInstance.lookup(each.trim()), true, pbLastIdx);
				});
			});
		}	
	});	
}

/*
 * 버튼(btnClx)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnClxClick(e){
	util.procEb6Privew(app);
}

/*
 * 버튼(btnProcess)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnProcessClick(e){
	viewProcess();
}

/*
 * 버튼(btnImgPop)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnImgPopClick(e) {
	var btnImgPop = e.control;
	
	var vcImage = new cpr.controls.Image();
	vcImage.src = app.getAppProperty("asisImgSrc");
	util.Dialog.open(app, "app/com/comPopoutView", 980, 770, function(evt){
		/** @type cpr.controls.Dialog */
		var dialog = evt.control;
	}, {
		control : vcImage
	}, {
		headerTitle: "AS-IS 화면"
	});
}
