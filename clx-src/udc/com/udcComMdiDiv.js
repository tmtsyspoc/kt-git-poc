/************************************************
 * udcComMdiDiv.js
 * Created at 2024. 9. 24. 오전 9:07:24.
 *
 * @author suhyun
 ************************************************/

/************************************************
 * 변수 선언
 ************************************************/
var util = createCommonUtil();

var DIVIDE_OPTION = {
	/** @type cpr.controls.MDIFolder */
	CTRL : null, // 분할 mdi폴더
	
	/* 분할 타입*/
	TYPE : {
		DEFAULT: "default", 				// 분할 해제
		HORIZONTAL: "horizontal", 	// 가로분할
		VERTICAL: "vertical", 			// 세로분할
		DIVISION: "division", 			// 바둑형 분할
		CASCADING: "window" 		// 계단형 분할
	},
	
	/* 분할 다이얼로그 */ 
	DIALOG : {
		CONTENTS : [], // 분할 된 탭아이템
		DISTANCE : 32, // 계단형 분할 시, 각 다이얼로그 간 거리
		DIALOG_CLASS : "cl-dialog", // 다이얼로그 스타일 클래스
	},
	
	/* 최소화 */
	MINIMIZE : {
		SHOW : true, // 다이얼로그 최소화 버튼 생성 여부
		MIN_GROUP : null, // 최소화 영역 그룹
		HEIGHT : 30, //  최소화 영역 그룹 높이
		GRP_CLASS : "", // 최소화 영역 그룹 스타일 클래스
		BTN_CLASS : "btn-submit", // 다이얼로그 최소화 시 생성되는 버튼 스타일 클래스
	}
};


/************************************************
 * 사용자 정의 함수
 ************************************************/
/**
 * 
 */
function fn_unfloating_group () {
	var vcGrpDivPop = app.lookup("grpDivPop");
	
	var rootAppIns = app.getRootAppInstance();
	rootAppIns.getFloatingControls().filter(function(each){
		return each.userAttr("float-divide") == "true";
	}).forEach(function(each){
		vcGrpDivPop = each;
	});
	
	app.getContainer().addChild(vcGrpDivPop);
	vcGrpDivPop.visible = false;
	vcGrpDivPop.removeUserAttr("float-divide");
	
	rootAppIns.getContainer().removeEventListener("click", fn_unfloating_group);
}


/**
 * MDI폴더를 분할방식에 따라 분할합니다.<br/>
 * 모든 분할 방식은 다이얼로그 형태로 배치됩니다.
 * @param {cpr.controls.Button} pcButton
 */
function fn_divide (pcButton) {
	var vcBtnMdiDiv = app.lookup("btnMdiDiv");
	
	// divideType 앱속성 설정
	var voDivideTypes = DIVIDE_OPTION["TYPE"];
	var vsDivideType = voDivideTypes["DEFAULT"];
	Object.keys(voDivideTypes).forEach(function(each){
		if(pcButton.style.hasClass(voDivideTypes[each])) {
			vsDivideType = voDivideTypes[each];
		}
	});
	app.setAppProperty("divideType", vsDivideType);
	
	// 타겟 MDI폴더
	var hostAppIns = app.getHostAppInstance();
	if(!hostAppIns) return;
	
	DIVIDE_OPTION["CTRL"] = hostAppIns.lookup(app.getAppProperty("mdiFolder"));
	if(!DIVIDE_OPTION["CTRL"] || !(DIVIDE_OPTION["CTRL"] instanceof cpr.controls.TabFolder)) {
		util.Msg.alertDlg(app, "분할을 하기 위한 MDI폴더가 존재하지 않습니다.", null, {
			msgStateType: "DANGER"
		});
		return;
	}
	
	/* 분할 */
	var vcMdifolder = DIVIDE_OPTION["CTRL"];
	var voDialogContents = DIVIDE_OPTION["DIALOG"]["CONTENTS"];
	var vsDashboard = app.getAppProperty("dashboardNm") || "dashboard";
	if(vsDivideType == voDivideTypes["DEFAULT"]) {
		/* 전체화면 (분할 해제) */
		
		// 분할되있던 TabItem 을 MDI폴더로 복귀
		for (var idx = 0; idx < voDialogContents.length; idx++) {
			if (voDialogContents[idx].disposed) {
				continue;
			}
			
			var voTabItem = new cpr.controls.TabItem();
			voTabItem.content = voDialogContents[idx];
			voTabItem.text = voDialogContents[idx].userAttr("appId");
			voTabItem.closable = voDialogContents[idx].userAttr("closable") == "true" ? true : false;
			voTabItem.name = voDialogContents[idx].userAttr("name");
			// 고정 아이템에 대한 정보 (분할 해제 시에 고정 아이템이 유지되도록)
			voTabItem.checked = ValueUtil.fixBoolean(voDialogContents[idx].userAttr("origin.checked"));
			
			if(voDialogContents[idx].userAttr("name") == vsDashboard) {
				voTabItem.visible = false;
			} else {
				voTabItem.visible = true;
			}
			
			voDialogContents[idx].getUserAttrNames().forEach(function(each) {
				if(each != "appId" && each != "closable" && each != "name" && each != "origin.checked") {
					// 기존 탭아이템이 가지고 있는 userAttr 유지
					voTabItem.userAttr(each, voDialogContents[idx].userAttr(each));
				}
			})
			vcMdifolder.addTabItem(voTabItem);
		}
		
		// 열려있는 Dialog 모두 삭제
		removeAllFloat();
		
		vcMdifolder.setSelectedTabItem(vcMdifolder.getItemByName(vsDashboard));

	} else {
		/* 화면 분할 (horizontal, vertical, division, window) */
		
		// visible=false 인 탭아이템 제외
		var voTabItems = vcMdifolder.getTabItems().filter(function(each){
			return each.visible || each.name == vsDashboard;
		});
		if(voDialogContents.length == 0) {
			voTabItems.forEach(function(each, index) {
				_openDialog(each, voTabItems);
			});
			
			// 탭 아이템 헤더 보이지 않도록 설정
			voTabItems.forEach(function (each) {
				// 고정 아이템에 대한 정보 저장 (분할 해제 시에 고정 아이템이 유지되도록)
				each.content.userAttr("origin.checked", (each.checked+""));
				each.visible = false;
			}); 
		}
		
		// 분할 타입에 따라 다이얼로그 정렬
		_sortDialog(vsDivideType);
	}
}

/**
 * 
 */
function removeAllFloat () {
	
	DIVIDE_OPTION["CTRL"].getAppInstance().dialogManager.closeAll();
	
	DIVIDE_OPTION["DIALOG"]["CONTENTS"] = []; // 다이얼로그로 띄웠던 항목 삭제
	
	// 다이얼로그 최소화 영역 삭제
	if(DIVIDE_OPTION["MINIMIZE"]["SHOW"]) {
		DIVIDE_OPTION["MINIMIZE"]["MIN_GROUP"].dispose();
		DIVIDE_OPTION["MINIMIZE"]["MIN_GROUP"] = null;
	}
		
	cpr.core.DeferredUpdateManager.INSTANCE.update();
}

/**
 * 계단형으로 보여줄 때 띄울 다이얼로그 앱 생성
 * @param {Number} pnIndex
 */
function _createDialog(pnIndex) {
	var newApp = new cpr.core.App("ComDialog" + pnIndex, {
		onCreate: function( /* cpr.core.AppInstance */ newApp, exports) {
			var container = newApp.getContainer();
			
			// script start
			newApp.addEventListener("load", function(e) {
				var initValue = newApp.getHostProperty("initValue");
				if (initValue) {
					if(initValue instanceof cpr.controls.EmbeddedApp) {
						newApp.app.title = initValue.app.title;
					}
					container.addChild(initValue, {
						top: "0px",
						left: "0px",
						right: "0px",
						bottom: "0px"
					});
				}
			});
		}
	});
	cpr.core.Platform.INSTANCE.register(newApp);
	
	return newApp;
}

/**
 * 다이얼로그 오픈
 * @param {cpr.controls.TabItem} poTabItem
 * @param {Number} pnIndex
 */
function _openDialog (poTabItem, poTotalTabItems) {
	
	var vcMdifolder = DIVIDE_OPTION["CTRL"];
	var voMinimizeOpt = DIVIDE_OPTION["MINIMIZE"];
	var voDialogOpt = DIVIDE_OPTION["DIALOG"];
	
	var vnIndex = !ValueUtil.isNumber(poTotalTabItems) ? poTotalTabItems.indexOf(poTabItem) : poTotalTabItems;
	var voDialogApp = _createDialog(vnIndex);
	var voMdiActlRct = vcMdifolder.getActualRect();
	
	/** @type cpr.controls.EmbeddedApp */
	var vcEmb = poTabItem.content;
	var vsEmbTitle = poTabItem.text;
	
	// 최소화 버튼 존재 시, 최소화 영역 생성
	if(voMinimizeOpt["SHOW"] && voMinimizeOpt["MIN_GROUP"] == null) {
		voMinimizeOpt["MIN_GROUP"] = new cpr.controls.Container();
		voMinimizeOpt["MIN_GROUP"].style.addClass(voMinimizeOpt["GRP_CLASS"]);
	
		var flowlayout = new cpr.controls.layouts.FlowLayout();
		flowlayout.bottomMargin = 0;
		flowlayout.topMargin = 0;
		flowlayout.leftMargin = 0;
		flowlayout.rightMargin = 0;
		flowlayout.scrollable = false;
		voMinimizeOpt["MIN_GROUP"].setLayout(flowlayout);
		
		vcMdifolder.getAppInstance().floatControl(voMinimizeOpt["MIN_GROUP"], {
			top : (voMdiActlRct.top +  voMdiActlRct.height - voMinimizeOpt["HEIGHT"]) + "px",
			left : voMdiActlRct.left + "px",
			width : voMdiActlRct.width + "px",
			height : voMinimizeOpt["HEIGHT"] + "px"
		});
	}
	
	var voDialogMngr = vcMdifolder.getAppInstance().dialogManager;
	voDialogMngr.openDialog(voDialogApp, vcEmb.id, {
		modal: false
	}, function(dialog) {
		dialog.ready(function(dialogApp){
			// 필요한 경우, 다이얼로그의 앱이 초기화 된 후, 앱 속성을 전달하십시오.
			dialog.initValue = vcEmb;
			dialog.headerTitle = vsEmbTitle;
			dialog.headerMax = true;
			dialog.headerMin = voMinimizeOpt["SHOW"]; 
			
			var vsDashboard = app.getAppProperty("dashboardNm") || "dashboard";
			dialog.headerClose = (poTabItem.name != vsDashboard);
		
			dialog.style.addClass(voDialogOpt["DIALOG_CLASS"]);

			dialog.addEventListener("load", function(e){
				var vbClosable = poTabItem.closable != null ? poTabItem.closable.toString() : "true";
				
				vcEmb.userAttr("appId", vsEmbTitle);
				vcEmb.userAttr("closable", vbClosable);
				vcEmb.userAttr("name", ValueUtil.fixNull(poTabItem.name));
				poTabItem.getUserAttrNames().forEach(function(each){
					vcEmb.userAttr(each, poTabItem.userAttr(each));
				});
				voDialogOpt["CONTENTS"].push(vcEmb);
				     
				vcMdifolder.removeTabItem(poTabItem);
			});
			
			dialog.addEventListener("minimize", function(e){
				// 최소화 한 경우 위치 변경
				if(voMinimizeOpt["SHOW"] && voMinimizeOpt["MIN_GROUP"] != null) {
					var vcDialogBtn = new cpr.controls.Button();
					vcDialogBtn.value = dialog.headerTitle;
					vcDialogBtn.style.addClass(voMinimizeOpt["BTN_CLASS"]);
					
					vcDialogBtn.addEventListenerOnce("click", function(e){
						// 클릭 시 최소화 되어있던 다이얼로그 복구
						voMinimizeOpt["MIN_GROUP"].removeChild(e.control);
						
						var vsDialogName = voDialogMngr.getDialogName(dialog);
						voDialogMngr.getDialogByName(vsDialogName).restore();
					});

					voMinimizeOpt["MIN_GROUP"].addChild(vcDialogBtn, {
						autoSize : "width",
						height : "100%"
					});
				}				
			});
			
			dialog.addEventListenerOnce("close", function(e){
				var voCloseDlg = e.control;
				
				var vcTargetEmb = voCloseDlg.getEmbeddedAppInstance().getContainer().getFirstChild();
				voDialogOpt["CONTENTS"].splice(voDialogOpt["CONTENTS"].indexOf(vcTargetEmb), 1);

				var rootAppInstance = app.getRootAppInstance();
				if(voCloseDlg.focused && rootAppInstance.hasAppMethod("removeTabItemFromList")) {
					// 직접 close 하는 경우에만 호출(removeAllFloat 에서 호출될 경우 제외)
					rootAppInstance.callAppMethod("removeTabItemFromList", poTabItem);
				}
				
				cpr.core.Platform.INSTANCE.unregister(voCloseDlg.app);
			});
		});
	});
}

/**
 * 분할로 띄워진 다이얼로그를 레이아웃에 맞춰 정렬
 */
function _sortDialog(psLayout) {
	
	var vcMdifolder = DIVIDE_OPTION["CTRL"];
	var voMinimizeOpt = DIVIDE_OPTION["MINIMIZE"];
	var voDialogOpt = DIVIDE_OPTION["DIALOG"];
	
	var voMdiActlRct = vcMdifolder.getActualRect();
	var vnMdiHdrHeight = vcMdifolder.getHeaderControls()[0].getActualRect().height + 24;
	
	var voDialogMngr = vcMdifolder.getAppInstance().dialogManager;
	var voTotalDialogNames = voDialogMngr.getDialogNames();
	
	// 최소화한 영역 원복
	voDialogMngr.restoreAll();
	
	var vnMinGrpHeight = 0;
	if(voMinimizeOpt["SHOW"]) {
		if (voMinimizeOpt["MIN_GROUP"]) voMinimizeOpt["MIN_GROUP"].removeAllChildren();
		vnMinGrpHeight = voMinimizeOpt["HEIGHT"];
	}
	
	// 분할 시 다이얼로그 소팅 (위치설정)
	switch (psLayout) {
		case DIVIDE_OPTION["TYPE"]["CASCADING"]: // 계단형
			voDialogMngr.sortInCascade({
				horizontalMargin: voMdiActlRct.left,
				verticalMargin: voMdiActlRct.top + vnMdiHdrHeight,
				horizontalSpacing: voDialogOpt["DISTANCE"],
				verticalSpacing: voDialogOpt["DISTANCE"]
			});
			break;
		case DIVIDE_OPTION["TYPE"]["DIVISION"]: // 바둑형
			voDialogMngr.sortInTile({
				horizontalMargin: voMdiActlRct.left,
				verticalMargin: voMdiActlRct.top
			});
			voTotalDialogNames.forEach(function(each) {
				var eachConstraint = voDialogMngr.getConstraintByName(each);
				var eachTop = parseInt(eachConstraint.top);
				var eachHeight = parseInt(eachConstraint.height);
				
				if (eachTop == parseInt(voMdiActlRct.top)) {
					voDialogMngr.updateConstraintByName(each, {
						top: eachTop + vnMdiHdrHeight,
						height: eachHeight - vnMdiHdrHeight - vnMinGrpHeight
					});
				} else {
					voDialogMngr.updateConstraintByName(each, {
						top: eachTop - vnMinGrpHeight
					});
				}
			});
			break;
			
		default:
			voTotalDialogNames.forEach(function(each, idx) {
				var dialog = voDialogMngr.getDialogByName(each);
				
				var vsDlgName = voDialogMngr.getDialogName(dialog);
				var vnDlgCount = voDialogOpt["CONTENTS"].length;
				
				switch (psLayout) {
					case DIVIDE_OPTION["TYPE"]["HORIZONTAL"]: // 가로형
						var vnHeight = (voMdiActlRct.height - vnMdiHdrHeight - vnMinGrpHeight) / voTotalDialogNames.length;
						voDialogMngr.updateConstraintByName(vsDlgName, {
							top: (voMdiActlRct.top + vnMdiHdrHeight) + (vnHeight * idx),
							left: voMdiActlRct.left,
							width: voMdiActlRct.width,
							height: vnHeight
						});
						break;
					case DIVIDE_OPTION["TYPE"]["VERTICAL"]: // 세로형
						var vnWidth = voMdiActlRct.width / voTotalDialogNames.length;
						voDialogMngr.updateConstraintByName(vsDlgName, {
							top: (voMdiActlRct.top + vnMdiHdrHeight),
							left: voMdiActlRct.left + (vnWidth * idx),
							width: vnWidth,
							height: voMdiActlRct.height - vnMdiHdrHeight - vnMinGrpHeight
						});
						break;
				}
			});
			break;
	}
}


/************************************************
 * 이벤트 리스너
 ************************************************/
/*
 * 버튼(btnMdiDiv)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnMdiDivClick(e){
	var btnMdiDiv = e.control;
	
	e.stopPropagation();
	
	var rootAppIns = app.getRootAppInstance();
	var vcGrpDivPop = app.lookup("grpDivPop");
	if(!vcGrpDivPop || vcGrpDivPop.isFloated()) return;
	
	vcGrpDivPop.userAttr("float-divide", "true");
	
	var vcBtnMdiDiv = app.lookup("btnMdiDiv");
	var voBtnMdiDivActrlRct = vcBtnMdiDiv.getActualRect();
	vcGrpDivPop.visible = true;
	
	var showConstraint = {
		top: voBtnMdiDivActrlRct.bottom + 1 + "px",
		left : voBtnMdiDivActrlRct.left + "px",
		width: "24px",
		"height" : "auto"
	};
	
	rootAppIns.floatControl(vcGrpDivPop, showConstraint);
	
	rootAppIns.getContainer().addEventListener("click", fn_unfloating_group);
}

/*
 * 버튼(btnMdiDivN)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnMdiDivNClick(e){
	fn_divide(e.control);
}

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e){
	// 분할 방식에 따른 버튼 스타일 변경
	var vcBtnMdiDiv = app.lookup("btnMdiDiv");
	var vsDivideType = app.getAppProperty("divideType");
	vcBtnMdiDiv.style.setClasses(["btn-tab-div", vsDivideType]);
	
	// 이벤트 출판
	var event = new cpr.events.CUIEvent("changeDivideType");
	app.dispatchEvent(event);
}
