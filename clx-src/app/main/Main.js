/************************************************
 * Main.js
 * Created at 2026. 4. 28. 오후 2:28:17.
 *
 * @author chwec
 ************************************************/
var a = ;
/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/
var util = createCommonUtil();

/** 웹 소켓 */
var ws = null;
var msProtocal = window.location.protocol == "https:" ? "wss://" : "ws://";
var WS_URL =  msProtocal + window.location.host + util.getContextPath() + "/my-websocket";

/** 메인 컨텐츠 컨트롤 (MDI폴더 or 임베디드앱) */
/** @type cpr.controls.UIControl */
var mcMainContentCtrl = null;

/** 메뉴/평가시나리오 플로팅 여부 */
var mbMenuFloatType = false;

/** 메인 구조(default, vertical, horizontal) */
var msMainType = null;

/************************************************
 ** 글로벌 함수
 ************************************************/
exports.openPage = openPage;
exports.openAppEditor = openAppEditor;
exports.doOpenMenuToEa = doOpenMenuToEa;
exports.getMenuPath = getMenuPath;
exports.getUserInfo = getUserInfo;
exports.favMnRefresh = favMnRefresh;
exports.removeTabItemFromList = removeTabItemFromList;
exports.setScreenScale = setScreenScale;
exports.logout = function () {
	app.lookup("btnLogout").click();
}
exports.checkRelation = function(paRows,poRow) {
	/** @type String */
	var vsRows = paRows;
	var vaRows = vsRows.split(",");
	if(vaRows.indexOf(poRow) != -1) {
		return true;
	} else {
		return false;
	}
};

/**
 * MDI 헤더 주요 기능 동작
 * @param {"zoom"|"refresh"|"window"|"closeAll"} psFuncName 기능명
 */
exports.doTabHeaderFunction = function(psFuncName) {
	switch(psFuncName){
		case "zoom" :
			app.lookup("btnMdiZoom").click();
			break;
		case "refresh" :
			app.lookup("btnMdiRefresh").click();
			break;
		case "window" :
			app.lookup("btnMdiWinOpen").click();
			break;
		case "closeAll" :
			app.lookup("btnMdiClose").click();
			break;
		default :
			break;
	}
}
exports.getAllMenu = function () {
	return app.lookup("dsAllMenu").getRowDataRanged();
}

exports.setDarkLogo = setDarkLogo;
/**
 * 다크모드 설정
 * @param {Boolean} pbDark? =`true` 다크모드 설정 여부
 * @param {Boolean} isRadioSelect? =`false` 메인에서 직접 선택여부
 */
function setDarkLogo (pbDark, isRadioSelect) {
	var isDark = !ValueUtil.isNull(pbDark) ? ValueUtil.fixBoolean(pbDark) : true;
	var voElBody = document.body;
	
	var vsMainColor = localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-color") || "light";
	var vsMode = isDark ? "high-contrast" : vsMainColor;
	voElBody.setAttribute("data-cl-mode", vsMode);
	if(isRadioSelect === true) {
		if(vsMode != "high-contrast") vsMode = "light";
		localStorage.setItem(AppProperties.PROJECT_NM + "data-xb-theme", vsMode);
	}
	
	var vcRdbTheme = app.lookup("rdbTheme");
	if(isDark) vcRdbTheme.putValue("high-contrast");
	else vcRdbTheme.putValue("light");
}

/**
 * udcComAppHeader 앱 헤더의 즐겨찾기 체크박스 값이 변경 시 불러오는 함수
 */
function favMnRefresh() {
	// 즐겨찾기 사이드메뉴가 열려 있을 경우
	favMenuCheck();
	
	var vcSnavMn = app.lookup("snavMn");
	if(vcSnavMn.getFilter() ==  'MENU_FAV == "Y"') {
		//  즐겨찾기 컬럼 값 변경
		vcSnavMn.redraw();
	}
}

/************************************************
 ** 개인화 처리 관련 함수
 ************************************************/
var CustomizeOpt = {
	elBody : document.body,
	/** @private */
	_getDarkMode : function () {
		var vsXbTheme = localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-theme");
		return (vsXbTheme == "high-contrast");
	},
	
	/** 테마모드 설정 */
	setTheme : function () {
		var vsXbTheme = localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-theme");
		if (!ValueUtil.isNull(vsXbTheme)) {
			app.lookup("rdbTheme").selectItemByValue(vsXbTheme);
		}
	},
	
	/** 메인색상 설정 */
	setColor : function () {
		var isDark = this._getDarkMode();
		if (!isDark && !ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-color"))) {
			this.elBody.setAttribute("data-cl-mode", localStorage.getItem(AppProperties.PROJECT_NM + "data-xb-color"));
		}
	},
	
	/** 메인 레이아웃 설정 */
	setLayout : function () {
		var vsViewType = localStorage.getItem(AppProperties.PROJECT_NM + "viewType");
		if (vsViewType && vsViewType == "single") {
			setMainViewType("single");	
		} else {
			mcMainContentCtrl = app.lookup("mdiCn");
			openSaveMenu();
		}
	},
	
	/** GNB 메뉴 Depth 설정 */
	setGnbDepth : function () {
		if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "gnbDepth"))) {
			var vcNav = app.lookup("ngb");
			vcNav.filterExp = "depth < " + localStorage.getItem(AppProperties.PROJECT_NM + "gnbDepth");
		}
	},
	
	/** 화면 크기(배율) 설정 */
	setScale : function () {
		if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "data-scrScale"))) {
			this.elBody.setAttribute("data-scrScale", localStorage.getItem(AppProperties.PROJECT_NM + "data-scrScale"));
			setScreenScale(localStorage.getItem(AppProperties.PROJECT_NM + "data-scrScale"));
		}
	},
	
	/** 메뉴 플로팅 옵션 설정 */
	setFloatOption : function () {
		// in : 화면 내부 배치
		// float : 플로팅
		var vsFloatType = localStorage.getItem(AppProperties.PROJECT_NM + "floatMenuType");
		var checkFloatType = (vsFloatType == "float");
		if(mbMenuFloatType != checkFloatType) {
			mbMenuFloatType = checkFloatType;
			
			var vcGrpAsd = app.lookup("grpAsd");
			var vcMdiCn = app.lookup("mdiCn");
			if(!mbMenuFloatType) {
				// 메뉴 화면 내부 배치
				app.lookup("grpBody").addChild(vcGrpAsd, {
					top : "0px",
					bottom : "0px",
					left : "0px",
					width : "280px"
				});
				vcMdiCn.getParent().updateConstraint(vcMdiCn, {
					left : "280px"
				});
				
				cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
					expandAsideArea();
				});
			} else {
				// 상단 플로팅
				var vcContainer = app.getContainer();
				vcContainer.floatControl(vcGrpAsd, {
					top : "0px",
					bottom : "0px",
					left : "0px",
					width : "280px",
					zIndex : "1"
				});
				
				cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
					collapseAsideArea();
					cpr.core.DeferredUpdateManager.INSTANCE.update();
				});
			}
		}
	},
	
	/** 글꼴 설정 */
	setFontFamily : function () {
		if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "data-fontFamily"))) {
			this.elBody.setAttribute("data-fontFamily", localStorage.getItem(AppProperties.PROJECT_NM + "data-fontFamily"));
		}
	},
	
	/** 글씨 크기 설정 */
	setFontSize : function () {
		if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "data-fontSize"))) {
			this.elBody.setAttribute("data-fontSize", localStorage.getItem(AppProperties.PROJECT_NM + "data-fontSize"));
		}
	},
	
	/** 로고 설정 */
	setLogo : function (psType) {
		var vcBtnLogo = app.lookup("btnLogo");
		var vcBtnMMenuLogo = app.lookup("btnMMenulogo");
		
		if(!ValueUtil.isNull(psType)) {
			vcBtnLogo.style.setClasses(["logo", psType]);
			vcBtnMMenuLogo.style.setClasses(["logo", psType]);

		} else if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "data-logoImg"))) {
			var vsLogoClass = localStorage.getItem(AppProperties.PROJECT_NM + "data-logoImg");
			vcBtnLogo.style.setClasses(["logo", vsLogoClass]);
			vcBtnMMenuLogo.style.setClasses(["logo", vsLogoClass]);
		}
	},
	
	/** 단축키 설정 설정 */
	setHotkey : function () {
		window.removeEventListener("keydown", getKeydownConfig);
		window.addEventListener("keydown", getKeydownConfig);
	}
}
exports.setLogo = CustomizeOpt.setLogo;

/**
 * 초기 개인화 설정
 */
function setInitConfig() {
	// 테마 모드 처리
	CustomizeOpt.setTheme();
	
	// 메인 색상 처리
	CustomizeOpt.setColor();
	
	// font-family
	CustomizeOpt.setFontFamily();
	
	// font-size
	CustomizeOpt.setFontSize();
	
	// 초기화면크기(배율)
	CustomizeOpt.setScale();
	
	// 로고 이미지 변경
	CustomizeOpt.setLogo();
	
	// 단축키 설정
	CustomizeOpt.setHotkey();
	
	// 메인 레이아웃 처리
	CustomizeOpt.setLayout();
	
	// 메뉴 플로팅 옵션 처리
	CustomizeOpt.setFloatOption();
	
	// 모바일 메뉴 전체 펼침
	var vcSnavMMenu = app.lookup("snavMMenu");
	/* 드롭다운메뉴 클릭 버블링 방지 */
	app.getContainer().getChildren().filter(function(each) {
		return each.style.hasClass("dropdown-menu");
	}).forEach(function(each) {
		each.addEventListener("click", function(e) {
			e.stopPropagation();
		});
	});
}

/************************************************
 ** 파일내 로컬변수 선언  
 ************************************************/

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/
cpr.core.Platform.INSTANCE.tooltipManager.setDefaultTooltip(function( /* cpr.controls.UIControl */ tooltipOwner) {
	var vcOptTxt = new cpr.controls.Output();
	if (tooltipOwner && (tooltipOwner.tooltip || tooltipOwner.fieldLabel)) {
		vcOptTxt.value = tooltipOwner.tooltip || tooltipOwner.fieldLabel;
		return vcOptTxt;
	}
});

cpr.core.NotificationCenter.INSTANCE.subscribe(AppProperties.MSG_TOPIC_ID, app, function(poMsgInfo) {
	var vcNotifier = app.lookup("notifier");
	if (poMsgInfo["TYPE"] == "SUCCESS") {
		vcNotifier.success(poMsgInfo["MSG"]);
	} else if (poMsgInfo["TYPE"] == "INFO") {
		vcNotifier.info(poMsgInfo["MSG"]);
	} else if (poMsgInfo["TYPE"] == "WARNING") {
		vcNotifier.warning(poMsgInfo["MSG"]);
	} else if (poMsgInfo["TYPE"] == "DANGER") {
		vcNotifier.danger(poMsgInfo["MSG"]);
	} else {
		vcNotifier.info(poMsgInfo["MSG"]);
	}
	
	var vaKeyVal = app.lookup("dsNotiMsg").getColumnData("KEY");
	var vnKey = 0;
	if(vaKeyVal.length > 0) vnKey = _.max(vaKeyVal)+1;
	
	if (!poMsgInfo["REPLAY"]) {
		if(poMsgInfo["TYPE"] == "APPROVAL_RESPONSIBLE") {
			createNotificationItem(poMsgInfo, poMsgInfo["KEY"]);	
		} else {
			createNotificationItem(poMsgInfo, vnKey);
		}
		updateNotification();
	}
		
	// 알림 메세지 데이터셋에 알림메시지 추가
	var voNoti = app.lookup("dsNotiMsg").findFirstRow("KEY == '" + poMsgInfo["KEY"] + "'");
	if(poMsgInfo["TYPE"] == "APPROVAL_RESPONSIBLE") {
		if(voNoti) {
			var vnKeyIndex = voNoti.getIndex();
			app.lookup("dsNotiMsg").putValue(vnKeyIndex, "APPR_RESULT", poMsgInfo["APPR_RESULT"]);
			app.lookup("dsNotiMsg").putValue(vnKeyIndex, "KEY", poMsgInfo["KEY"]);
			app.lookup("dsNotiMsg").putValue(vnKeyIndex, "ADMIN_MSG", poMsgInfo["adminMsg"]);
		} else {
			util.DataSet.insertRow(app, "dsNotiMsg", 0, false, {"KEY" : poMsgInfo["KEY"], "TYPE" : poMsgInfo["TYPE"], "MSG" : poMsgInfo["MSG"], "REPLAY" : "true"});
			
			// 관리자 승인 화면 관련 추가 - 승인 요청 데이터 적재
			app.lookup("dsNotiMsg").setValue(0, "MSG_TITLE", poMsgInfo["MSG_TITLE"]);
			app.lookup("dsNotiMsg").setValue(0, "SENDER_ID", poMsgInfo["SENDER_ID"]);
			app.lookup("dsNotiMsg").setValue(0, "SENDER_NM", poMsgInfo["SENDER_NM"]);
			app.lookup("dsNotiMsg").setValue(0, "APPR_RESULT", poMsgInfo["APPR_RESULT"]);
			app.lookup("dsNotiMsg").setValue(0, "APPR_KIND", poMsgInfo["APPR_KIND"]);
			app.lookup("dsNotiMsg").setValue(0, "CONTENTS", poMsgInfo["Text"]);
		}
	} else {
		// 알림 메세지 데이터셋에 알림메시지 추가
		util.DataSet.insertRow(app, "dsNotiMsg", 0, false, {"KEY" : vnKey, "TYPE" : poMsgInfo["TYPE"], "MSG" : poMsgInfo["MSG"], "REPLAY" : "true"});
	}
});

/**
 * 재확인이 필요한 메세지의 경우 알림방에 메세지 아이템을 추가
 * @param {
 *   {
 *     "REPLAY" : Boolean <!-- 알림방 추가 여부 -->,
 *     "TYPE" : "" | "info" | "success" | "warning" | "danger" <!-- 메세지 유형 -->,
 *     "MSG" : String <!-- 메세지 내용 -->
 *   }
 * } poMsgInfo,
 * @param {Number} pnKey?
 */
function createNotificationItem(poMsgInfo, pnKey) {
	var vcGrpAlarmWrap = app.lookup("grpAlarmWrap");
	
	/* 아이템 생성 */
	var vcGrpNotiItem = new cpr.controls.Container();
	vcGrpNotiItem.style.setClasses(["item", "new"]);
	
	var voGrpNotiItemLt = new cpr.controls.layouts.VerticalLayout();
	voGrpNotiItemLt.scrollable = false;
	voGrpNotiItemLt.topMargin = "0px";
	voGrpNotiItemLt.rightMargin = "0px";
	voGrpNotiItemLt.bottomMargin = "0px";
	voGrpNotiItemLt.leftMargin = "0px";
	voGrpNotiItemLt.spacing = "0px";
	vcGrpNotiItem.setLayout(voGrpNotiItemLt);
	
	vcGrpAlarmWrap.addChild(vcGrpNotiItem, {
		autoSize: "height"
	});
	
	// 메시지 상태 스타일
	var vsMsgStatus = poMsgInfo["TYPE"];
	if (vsMsgStatus) {
		vcGrpNotiItem.style.addClass(vsMsgStatus.toLowerCase());
	}
	
	// 텍스트
	var vcOptTxt = new cpr.controls.Output();
	vcOptTxt.value = poMsgInfo.MSG;
	vcOptTxt.style.setClasses(["txt"]);
	
	vcGrpNotiItem.addChild(vcOptTxt, {
		autoSize: "height"
	});
	
	var vcOptTime = new cpr.controls.Output();
	var vsNowTime = moment().format("YYYY-MM-DD HH:mm:ss:SSS");
	vcOptTime.value = vsNowTime;
	vcOptTime.style.setClasses(["date"]);
	vcGrpNotiItem.addChild(vcOptTime, {
		autoSize: "height"
	});
	
	poMsgInfo.time = vsNowTime;
	vcGrpNotiItem.addEventListener("click", function(e) {
		// 클릭한 아이템 읽음 처리
		var vnKey = pnKey || 0;
		var dsNotiMsg = app.lookup("dsNotiMsg");
		dsNotiMsg.findFirstRow("KEY == " + vnKey).setValue("READ_YN", "Y");
		vcGrpNotiItem.style.removeClass("new");
		util.Control.redraw(app, ["btnAlarm"]);
		
		// 메시지 확인 편집창
		util.Dialog.open(app, "app/com/comNotiPop", 700, 550, function() {}, poMsgInfo);
		
		e.stopPropagation();
	});
	
	util.Control.redraw(app, ["btnAlarm"]);
}

/**
 * 메세지 개수, 데이터가 없는 경우 등에 대한 업데이트를 진행합니다. 
 */
function updateNotification() {
	var vnNotiCnt = app.lookup("grpAlarmWrap").getChildrenCount() - 1;
	if (vnNotiCnt == 0) {
		util.Control.setVisible(app, true, "btnAlarm");
	}
}

/**
 * 사용자 정보를 반환한다.
 * @param {String} psUserInfoType (Optional) 사용자 정보 변수(ex: USER_ID)
 * @return {String | cpr.data.DataMap} 사용자 정보
 */
function getUserInfo(psUserInfoType) {
	var dmUserInfo = app.lookup("dmUserInfo");
	if (ValueUtil.isNull(psUserInfoType)) {
		return dmUserInfo;
	}
	return dmUserInfo.getValue(psUserInfoType);
}

/**
 * 화면 뷰 타입을 구성합니다.
 * @param {"multi" | "single"} psType
 */
function setMainViewType(psType) {
	var vcGrpBd = app.lookup("grpBody");
	
	if (psType == "single") {
		var vcMdiCn = app.lookup("mdiCn");
		vcMdiCn.dispose();
		
		mcMainContentCtrl = new cpr.controls.EmbeddedApp("mdiCn");
		cpr.core.App.load("app/main/Dashboard", function(app) {
			if (app) {
				mcMainContentCtrl.app = app;
			}
		});
		vcGrpBd.addChild(mcMainContentCtrl, {
			"top": "0px",
			"right": "0px",
			"bottom": "0px",
			"left": "280px"
		});
	}
}

function collapseAsideArea() {
	var vcGrpAside = app.lookup("grpAsd");
	var vcBtnAsdExpder = app.lookup("btnAsdExpder");
	var vcMdiCn = app.lookup("mdiCn");
	
	vcGrpAside.style.addClass("collapsed");

	vcGrpAside.visible = false;
	
	vcMdiCn.getParent().updateConstraint(vcMdiCn, {
		left: "0px"
	});
	
	vcBtnAsdExpder.getParent().updateConstraint(vcBtnAsdExpder, {
		left: "-1px"
	});
	
	vcBtnAsdExpder.style.addClass("on");
	
	app.getContainer().redraw();
}

function expandAsideArea() {
	var vcGrpAside = app.lookup("grpAsd");
	var vcBtnAsdExpder = app.lookup("btnAsdExpder");
	var vcMdiCn = app.lookup("mdiCn");
	
	vcGrpAside.style.removeClass("collapsed");
	
	vcBtnAsdExpder.getParent().updateConstraint(vcBtnAsdExpder, {
		left: "238px"
	});
	
	if(!mbMenuFloatType) {
		vcMdiCn.getParent().updateConstraint(vcMdiCn, {
			left: "240px"
		});
	}
	
	vcGrpAside.visible = true;
	
	vcBtnAsdExpder.style.removeClass("on");
	
	app.getContainer().redraw();
}

/**
 * 화면을 호출하여 MDI 페이지에 추가하는 함수입니다. 외부에서 호출될 수 있습니다.
 * @param {cpr.data.Row} poRow 선택된 데이터 로우 (데이터셋)
 * @param {Object} poInitParam? 오픈될 메뉴에 전달할 파라미터
 * @param {
 *   readyCallback?:(embApp:cpr.controls.EmbeddedApp)=>null,
 *   isSelect?:Boolean,
 *   forceOpen?:Boolean
 * } poOptions? 옵션 파라미터
 */
function openPage(poRow, poInitParam, poOptions) {
	if(ValueUtil.isNull(poRow)) return;
	
	var voItemRow = poRow;
	var vbSelectOpenApp = poOptions && poOptions.isSelect === false ? false : true;
	var vsCallPage = ValueUtil.fixNull(voItemRow.getValue("CALL_PAGE"));
	if (vsCallPage == "") {
		return;
	}
	
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "mdiSideCollasped"))) {
		var vbMdiSideCollaped = ValueUtil.fixBoolean(localStorage.getItem(AppProperties.PROJECT_NM + "mdiSideCollasped"));
		var vbMobileScreen = (AppProperties.SCREEN_MOBILE_NM.indexOf(app.getRootAppInstance().targetScreen.name) > -1); 
		if(!vbMdiSideCollaped && !vbMobileScreen) { // 모바일이 아니면서 사이드 메뉴 접기 설정인 경우
			// 메뉴 선택 시, 사이드 영역 접기
			collapseAsideArea();
		}
	}
	
	
	var vsAppId = "";
	if (vsCallPage.indexOf(".clx") != -1) {
		vsAppId = vsCallPage.substring(0, vsCallPage.lastIndexOf(".clx"));
	}
	
	/* single viewType */
	if (mcMainContentCtrl instanceof cpr.controls.EmbeddedApp) {
		mcMainContentCtrl.app = null;
		cpr.core.App.load(vsAppId, function(loadedApp){
			mcMainContentCtrl.app = loadedApp;
			
			mcMainContentCtrl.userAttr("__menuInfo", JSON.stringify({"row": voItemRow.getRowData()}));
			mcMainContentCtrl.userAttr("__menuId", voItemRow.getValue("MENU_ID"));
		});
		mcMainContentCtrl.ready(function(ea) {
			if (!ValueUtil.isNull(poInitParam)) {
				ea.setAppProperty("initValue", poInitParam);
			}
			
			if (ValueUtil.fixNull(poOptions) != "" && poOptions["readyCallback"]) {
				poOptions["readyCallback"].call(null, ea);
			}
			
			ea.getEmbeddedAppInstance()["_menuApp"] = true;
		});
		
		return;
	}
	
	/* multi viewType	 */	
	var vcMdiCn = app.lookup("mdiCn");
	if (ValueUtil.fixNull(poOptions) != "" && poOptions["forceOpen"] &&  poOptions["forceOpen"] == true) {
		// option["forceOpen"]=true 이면, 중복된 화면도 오픈
	} else {
		var voOpenedTabItem = vcMdiCn.findItemWithAppID(vsAppId);
		/*이미 열려있는 item일 경우*/
		if (voOpenedTabItem) {
			vcMdiCn.setSelectedTabItem(voOpenedTabItem);
			return;
		}
	}
	
	var vcDmConfig = app.lookup("dmGlobalConfig");
	var vnMaxWindowCnt = ValueUtil.fixNumber(vcDmConfig.getValue("mdiWindowMaxCount"));
	var vbMdiFirstClose = ValueUtil.fixBoolean(vcDmConfig.getValue("mdiFirstClose"));
	
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "mdiWindowMaxCount"))) {
		vnMaxWindowCnt = ValueUtil.fixNumber(localStorage.getItem(AppProperties.PROJECT_NM + "mdiWindowMaxCount"))
	}
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "mdiFirstClose"))) {
		vbMdiFirstClose = ValueUtil.fixBoolean(localStorage.getItem(AppProperties.PROJECT_NM + "mdiFirstClose"))
	}
	if (vnMaxWindowCnt > -1 && vcMdiCn.getTabItems().length > vnMaxWindowCnt - 1) {
		if (vbMdiFirstClose) {
			var vbIsCloseTab = false;
			var tabItems = vcMdiCn.getTabItems();
			var openedMenus = localStorage.getItem(AppProperties.PROJECT_NM + "openedMenus") || ""; // null이면 빈 문자열로 대체		
			for (var i = 0; i < tabItems.length; i++) {
				if (tabItems[i].name != "dashboard" && openedMenus.indexOf(tabItems[i].text) == -1) {
					vcMdiCn.close(tabItems[i]);
					vbIsCloseTab = true;
					break;
				}
			}
			if (!vbIsCloseTab) {
				// 프로그램 탭은 @개를 초과할 수 없습니다. \n열려있는 프로그램을 닫은 후 선택해 주세요.
				util.Msg.alertDlg(app, "INF-M012", [vnMaxWindowCnt]);
				return false;
			}
		} else {
			// 프로그램 탭은 @개를 초과할 수 없습니다. \n열려있는 프로그램을 닫은 후 선택해 주세요.
			util.Msg.alertDlg(app, "INF-M012", [vnMaxWindowCnt]);
			return false;
		}
	}
	
	// 로컬스토리지에 고정한 탭 아이템
	var vsSavedItem = localStorage.getItem(AppProperties.PROJECT_NM + "openedMenus");
	var vaObjectItem = ValueUtil.fixNull(vsSavedItem) == "" ? [] : JSON.parse(vsSavedItem);
	var vaOpenedMenuID = vaObjectItem.map(function(each){
		var voMenuInfo = JSON.parse(each)["row"];
		var vsRowPageId = voMenuInfo["MENU_ID"];
		return vsRowPageId;
	});
	
	vcMdiCn.addItemWithApp(vsAppId, vbSelectOpenApp, function( /* cpr.controls.TabItem */ tabItem) {
		/* 초기 파라미터 설정 */
		var voMenuInfo = {
			"row": voItemRow.getRowData()
		}
		
		/* 아이템 설정 */
		tabItem.text = voItemRow.getValue("MENU_NM");
		tabItem.tooltip = voItemRow.getValue("MENU_NM");
		tabItem.userAttr("__menuInfo", JSON.stringify(voMenuInfo));
		tabItem.userAttr("__menuId", voItemRow.getValue("MENU_ID"));
		if (ValueUtil.fixNull(poInitParam) != "") {
			voMenuInfo["initParam"] = poInitParam;
		}
		
		/* 아이템 리스트 추가 */
		addTabItemToList(tabItem);
		
		// 로컬스토리지에 고정한 탭 아이템 체크
		if(vaOpenedMenuID.indexOf(voItemRow.getValue("MENU_ID")) != -1) {
			tabItem.checked = true;
		}
			
		/* 임베디드 앱이 준비가 되면 처리할 작업 */
		/** @type cpr.controls.EmbeddedApp */
		var vcEaCn = tabItem.content;
		if (vcEaCn.type == "embeddedapp") {
			vcEaCn.ready(function( /* cpr.controls.EmbeddedApp */ ea) {
				// 화면 배율은 플랫폼 줌(setScreenScale)으로 페이지 전체에 적용되어 새 화면에 따로 적용하지 않는다
				if (!ValueUtil.isNull(poInitParam)) {
					vcEaCn.setAppProperty("initValue", poInitParam);
				}
				
				if (ValueUtil.fixNull(poOptions) != "" && poOptions["readyCallback"]) {
					poOptions["readyCallback"].call(null, ea);
				}
				
				ea.getEmbeddedAppInstance()["_menuApp"] = true;
				
			});
		}
	});
}

/**
 * 메뉴 아이디를 통해 화면을 여는 함수입니다. 메인 화면의 메뉴 데이터셋에서 행을 가져올 수 없을 때 활용합니다.
 * @param {String} psMenuId 메뉴ID
 * @param {Object} poParam? 오픈될 메뉴에 전달할 파라미터
 * @param {readyCallback?:(embApp:cpr.controls.EmbeddedApp)=>null} poOptions? 옵션 파라미터
 */
function doOpenMenuToEa(psMenuId, poParam, poOptions, pbAlertMsg) {
	var vcDsAllMenu = app.lookup("dsAllMenu");
	var voDsRow = vcDsAllMenu.findFirstRow("CALL_PAGE == '" + psMenuId + "'");
	if (voDsRow != null) {
		var vsAppId = voDsRow.getValue("CALL_PAGE");
		openPage(voDsRow, poParam, poOptions);
	} else {
		if(ValueUtil.isNull(pbAlertMsg) || pbAlertMsg === true) {
			util.Msg.alertDlg(app, "WRN-M030");
		}
	}
}


/**
 * eXBuilder6 preview Open
 */
function openAppEditor(psAppId) {
	try {
		var req = new XMLHttpRequest();
		// 스튜디오가 실행 중인 호스트
		var hostname = "127.0.0.1";
		// 스튜디오 미리보기 서버 포트, 스튜디오가 하나만 실행 중인 경우 52194.
		var port = 52194;
		var url = "http://" + hostname + ":" + port + "/__eb6__/api";
		req.open("POST", url);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		var data = {
			topic: "openAppEditor",
			location: "http://xxxx.yyy/" + encodeURIComponent("sgi-poc-ui"),
			payload: psAppId
		};
		req.send(JSON.stringify(data));
	} catch (error){
		var input = document.createElement("input");
		input.style.position = "fixed";
		input.value = psAppId;
		document.body.appendChild(input);
		input.focus();
		input.select();
		document.execCommand("copy");
		document.body.removeChild(input);
		util.Msg.notify(app, "앱ID가 복사되었습니다.");
	}
}

/**
 * 현재메뉴의 메뉴 path 리턴
 * @param {String} psMenuId
 * @return {cpr.utils.ObjectMap}
 */
function getMenuPath(psMenuId) {
	/** @type cpr.data.DataSet */
	var vcDsAllMenu = app.lookup("dsAllMenu");
	if (vcDsAllMenu == null) return "";
	
	var vaMenuPathId = [];
	var vaMenuPathNm = [];
	var voMenu = null;
	
	while (true) {
		voMenu = vcDsAllMenu.findFirstRow("MENU_ID == '" + psMenuId + "'");
		if (voMenu == null) break;
		if (voMenu.getValue("parentMenuId") == "") {
			vaMenuPathId.push(voMenu.getValue("MENU_ID"));
			vaMenuPathNm.push(voMenu.getValue("MENU_NM"));
			break;
		}
		
		vaMenuPathId.push(voMenu.getValue("MENU_ID"));
		vaMenuPathNm.push(voMenu.getValue("MENU_NM"));
		psMenuId = voMenu.getValue("UP_MENU_ID");
	}
	
	var lbxMenuBarItem = null;
	
	vaMenuPathId.reverse();
	vaMenuPathNm.reverse();
	
	var vaMenuPathInfo = new cpr.utils.ObjectMap();
	vaMenuPathInfo.put("MENU_PATH_ID", vaMenuPathId);
	vaMenuPathInfo.put("MENU_PATH_NM", vaMenuPathNm);
	
	return vaMenuPathInfo;
}

/**
 * 현재 추가한 탭 아이템을 탭 아이템 목록으로 추가
 * @param {cpr.controls.TabItem} pcTabItem
 */
function addTabItemToList(pcTabItem) {
	var vcLbxTabList = app.lookup("lbxTabList");
	
	/** @type cpr.data.DataRow */
	var voMenuInfo = JSON.parse(pcTabItem.userAttr("__menuInfo"));
	/** @type Object */
	var voRowData = voMenuInfo.row;
	var vcTabListDs = vcLbxTabList.dataSet;
	vcTabListDs.addRowData({
		label: voRowData["MENU_NM"],
		value: vcTabListDs.getRowCount(),
		menuId: voRowData["MENU_ID"],
		id: pcTabItem.id
	});
}

/**
 * 추가된 탭 아이템을 탭 아이템 목록에서 제거
 * @param {voRowData.getValue("MENU_NM")} pcTabItem
 */
function removeTabItemFromList(pcTabItem) {
	var vcLbxTabList = app.lookup("lbxTabList");
	
	if (ValueUtil.isNull(pcTabItem.userAttr("__menuInfo"))) return;
	
	var voMenuInfo = JSON.parse(pcTabItem.userAttr("__menuInfo"));
	/** @type cpr.data.DataRow */
	var voRowData = voMenuInfo.row;
	
	var vcTabListDS = vcLbxTabList.dataSet;
	var voDelRow = vcTabListDS.findFirstRow("id == '" + pcTabItem.id + "'");
	if (voDelRow) {
		vcTabListDS.deleteRow(voDelRow.getIndex());
	}
	
	// 마지막 탭 아이템 close 할 때 dashboard 선택
	var vcMdiCn = app.lookup("mdiCn");
	var vaOpenedTabs = vcMdiCn.getTabItems();
	if (vaOpenedTabs.length == 2) {
		vcMdiCn.setSelectedTabItem(vcMdiCn.getItemByName("dashboard"));
	}
}

/**
 * 화면에 팝업을 플로팅하는 함수입니다. 팝업외의 영역을 클릭하면 팝업이 닫힙니다.
 * @param {cpr.controls.UIControl} pcControl
 * @param {{top:String, right:String, bottom:String, left:String, width:String, height:String}} poConstraint
 * @param {closeCallback : Function, modal : Boolean} poOption? 추가옵션
 */
function floating(pcControl, poConstraint, poOption) {
	var vcFloatingTarget = pcControl;

	// 최초 한번만 floating 할 수 있도록 return 처리;
	if(vcFloatingTarget.isFloated()) return;
	
	var vcGrpCont = app.getContainer();
	
	var vcGrpOverlay = new cpr.controls.Container();
	vcGrpOverlay.setLayout(new cpr.controls.layouts.XYLayout());
	
	vcGrpOverlay.userAttr("floated-configuration", "true");
	
	vcGrpOverlay.addEventListenerOnce("click", function(e) {
		unfloating(vcFloatingTarget);
		
		if (hasOption("closeCallback") && _.isFunction(poOption["closeCallback"])) poOption["closeCallback"]();
	});
	
	if (pcControl.getParent()) {
		
		pcControl._originParent = pcControl.getParent();
		pcControl._originIndex = pcControl.getParent().getChildren().indexOf(pcControl);
		pcControl._originConstraint = pcControl.getParent().getConstraint(pcControl);
		pcControl._originVisible = pcControl.visible;
	}
	
	vcGrpCont.addChild(vcGrpOverlay, {
		top: "0px",
		right: "0px",
		bottom: "0px",
		left: "0px"
	});
	
	if (hasOption("modal")) {
		vcGrpOverlay.style.css("background-color", "rgba(0, 0, 0, .28)");
	}
	
	app.lookup(vcFloatingTarget.id).visible = true;
	
	vcGrpCont.floatControl(vcFloatingTarget, poConstraint);
	
	vcFloatingTarget.focus();
	if (!vcFloatingTarget.focusable) {
		var findCtrl = vcFloatingTarget.getAllRecursiveChildren().find(function(each) {
			if (each.focusable) return each;
		});
		if(findCtrl) findCtrl.focus();
	}
	
	/**
	 * poOption 옵션 파라미터가 존재하는지 체크하는 함수입니다. 
	 * @param {String} psParamName
	 */
	function hasOption(psParamName) {
		if (ValueUtil.fixNull(poOption) != "" && poOption[psParamName]) {
			return true;
		} else {
			return false;
		}
	}
}

/**
 * 열렸던 팝업을 닫는 함수입니다. 별도의 호출없이, floating된 팝업이 있을 때 팝업 외의 영역을 클릭하면 수행됩니다.
 * @param {cpr.controls.UIControl} pcControl
 */
function unfloating(pcControl) {
	var vcGrpCont = app.getContainer();
	
	vcGrpCont.getChildren().filter(function(each) {
		return each.userAttr("floated-configuration") == "true";
	}).forEach(function(each) {
		vcGrpCont.removeChild(each, true);
	});
	
	/** @type cpr.controls.Container */
	var vcOriginParent = pcControl._originParent;
	if (vcOriginParent) {
		vcOriginParent.insertChild(pcControl._originIndex, pcControl, pcControl._originConstraint);
		app.lookup(pcControl.id).visible = pcControl._originVisible;
	} else {
		
		var voActualRect = pcControl.getActualRect();
		vcGrpCont.addChild(pcControl, {
			top: "10px",
			bottom: "10px",
			left: -250 + "px",
			width: voActualRect.width + "px"
		});
	}
	if (pcControl.userAttr("prevent-hide") == "true") {
		app.lookup(pcControl.id).visible = true;
	}
}

/**
 * 세션스토리지에 담긴 정보를 가지고 새로고침 전에 열었던 화면을 다시 열어주는 함수입니다.
 * 기존에 열려있던 화면에 대해 init parameter를 정의했었다면, 해당 정보를 가진 상태의 화면을 열게됩니다. 
 */
function openSaveMenu(){
	var openMenus = localStorage.getItem(AppProperties.PROJECT_NM + "openedMenus");
	var dsAllMenu = app.lookup("dsAllMenu");
	
	if(openMenus) {	
		/** @type Array */
		var vaOpenList = JSON.parse(openMenus);
		vaOpenList.forEach(function(each){
			var voMenuInfo = JSON.parse(each);
			var voRowInfo = voMenuInfo["row"];
			var vsRowPageId = voRowInfo["MENU_ID"];
			var vsCallPage = voRowInfo["CALL_PAGE"];
			var voInitParam = null;
			
			if(voRowInfo.hasOwnProperty("initParam")) {
				voInitParam = voMenuInfo["initParam"];
			}
			
			var voRow = dsAllMenu.findFirstRow("MENU_ID == '"+ vsRowPageId +"'");
			if (ValueUtil.fixNull(vsCallPage) != "") {
				openPage(voRow, voInitParam)
			}
		});
	}
}

/**
 * 체크/언체크된 아이템을 로컬스토리지에 저장
 * @param {cpr.controls.TabItem} pcTabItem
 * @param {Boolean} pbChecked
 */
function mdiLockTabItem(pcTabItem, pbChecked) {
	var openMenus = [];
	var vsSavedItem = localStorage.getItem(AppProperties.PROJECT_NM + "openedMenus");
	if (!ValueUtil.isNull(vsSavedItem)) openMenus = openMenus.concat(JSON.parse(vsSavedItem));
	
	var vaObjectItem = ValueUtil.fixNull(vsSavedItem) == "" ? [] : JSON.parse(vsSavedItem);
	var vaOpenedMenuID = vaObjectItem.map(function(each) {
		var voMenuInfo = JSON.parse(each)["row"];
		var vsRowPageId = voMenuInfo["MENU_ID"];
		return vsRowPageId;
	});
	
	if (pbChecked) {
		// 체크한 탭 아이템 로컬스토리지 저장
		if (vaOpenedMenuID.indexOf(JSON.parse(pcTabItem.userAttr(AppProperties.MAIN_MENU_INFO))["row"]["MENU_ID"]) == -1) {
			openMenus.push(pcTabItem.userAttr(AppProperties.MAIN_MENU_INFO));
		}
	} else {
		// 체크한 탭 아이템 로컬스토리지 제거
		if (vaOpenedMenuID.indexOf(JSON.parse(pcTabItem.userAttr(AppProperties.MAIN_MENU_INFO))["row"]["MENU_ID"]) != -1) {
			openMenus.splice(vaOpenedMenuID.indexOf(JSON.parse(pcTabItem.userAttr(AppProperties.MAIN_MENU_INFO))["row"]["MENU_ID"]), 1);
		}
	}
	
	localStorage.setItem(AppProperties.PROJECT_NM + "openedMenus", JSON.stringify(openMenus));
}

/**
 * 화면 배율 조정
 * eXBuilder6 플랫폼 줌(cpr.core.Platform#setZoom)으로 페이지 전체를 확대/축소한다.
 * 플랫폼 줌은 런타임이 좌표·스크롤·팝업(fixed) 위치를 보정하므로 화면별 CSS scale 보정이 필요 없다.
 * @param {Number|String} pnZoomRate 배율(%) — 80~120 (setZoom 허용 범위 0.8~1.5)
 */
function setScreenScale(pnZoomRate) {
	// 로컬스토리지·설정 콤보에서 오는 값은 문자열이고, setZoom 은 숫자만 받는다
	var vnZoomRate = Number(pnZoomRate) || 100;

	cpr.core.Platform.INSTANCE.setZoom(vnZoomRate / 100);

	app.setAppProperty("_scaleRate", vnZoomRate);
	util.Control.setValue(app, "nbeZmRatio", vnZoomRate);
	util.Control.redraw(app, "mdiCn")
}


function getKeydownConfig(peEvent) {
	var vaHotkeyList = "";
	if (!ValueUtil.isNull(localStorage.getItem(AppProperties.PROJECT_NM + "hotKey"))) {
		vaHotkeyList = JSON.parse(localStorage.getItem(AppProperties.PROJECT_NM + "hotKey"));
	}
	// HOTKEY가 있는 항목만 파싱해서 저장
	var vaParsedHotkeys = [];
	for (var i = 0; i < vaHotkeyList.length; i++) {
		var voItem = vaHotkeyList[i];
		if (voItem.HOTKEY) {
			vaParsedHotkeys.push({
				uniqueKey: voItem["KEY"],
				keyInfo: parseHotkey(voItem["HOTKEY"]),
				actionName: voItem["FUNCTION"]
			});
		}
	}
	for (var i = 0; i < vaParsedHotkeys.length; i++) {
		var voHk = vaParsedHotkeys[i];
		var voKeyInfo = voHk.keyInfo;
		
		if (voKeyInfo.ctrl === peEvent.ctrlKey &&
			voKeyInfo.shift === peEvent.shiftKey &&
			voKeyInfo.alt === peEvent.altKey &&
			voKeyInfo.key === peEvent.key.toUpperCase()) {
			peEvent.preventDefault();
			// 실제 동작 실행
			if (voHk.uniqueKey === "custom") {
				app.lookup("btnCustom").click();
			} else if (voHk.uniqueKey === 'windowpop') {
				app.lookup("btnMdiWinOpen").click();
			} else if (voHk.uniqueKey === 'logout') {
				app.lookup("btnLogout").click();
			} else if (voHk.uniqueKey === 'search' || voHk.uniqueKey === 'grdDelete' || voHk.uniqueKey === 'gridInsert') {
				var vcMdiCn = app.lookup("mdiCn");
				var vcSelectedTabItem = vcMdiCn.getSelectedTabItem();
				var vcItemCn = vcSelectedTabItem.content;
						
				if (vcItemCn instanceof cpr.controls.EmbeddedApp) {
					var vaAllControls = util.Control.getAllUiControl(app, vcItemCn);
					// 1. 조회버튼의 경우 autoKeydownSearch "Y" 지정 필요
					// 2. 그리드 삭제/수정의 경우 exceptGridHotKey "N" 인 경우 제외
					if(voHk.uniqueKey === 'search') {
						for(var i = 0; i < vaAllControls.length; i++) {
							if(vaAllControls[i] instanceof cpr.controls.Button) {
								if(vaAllControls[i].userAttr("autoKeydownSearch") == "Y") {
									vaAllControls[i].click();
								}
							}
						}
					} else if(voHk.uniqueKey === 'grdDelete') {
						for(var i = 0; i < vaAllControls.length; i++) {
							if(vaAllControls[i] instanceof cpr.controls.Grid) {
								if(vaAllControls[i].userAttr("exceptGridHotKey") != "Y") {
									/** @type cpr.controls.Grid */
									var vcGrid = vaAllControls[i]; 
									var vnSelectedIdx = vcGrid.getSelectedRowIndex();
									if(vnSelectedIdx != -1) vcGrid.dataSet.realDeleteRow(vnSelectedIdx);
								}
							}
						}
					} else if(voHk.uniqueKey === 'gridInsert') {
						for(var i = 0; i < vaAllControls.length; i++) {
							if(vaAllControls[i] instanceof cpr.controls.Grid) {
								if(vaAllControls[i].userAttr("exceptGridHotKey") != "Y") {
									/** @type cpr.controls.Grid */
									var vcGrid = vaAllControls[i]; 
									vcGrid.insertRow(0, false);
								}
							}
						}
					} 
				}
			}
			break;
		}
	}
}

// 문자열 → 키 정보 파싱
function parseHotkey(hotkeyString) {
	var vaKeys = hotkeyString.split('+');
	var voResult = {
		ctrl: false,
		shift: false,
		alt: false,
		key: null
	};
	
	for (var i = 0; i < vaKeys.length; i++) {
		var vsKey = vaKeys[i].replace(/\s+/g, '').toLowerCase();
		if (vsKey === 'ctrl') {
			voResult.ctrl = true;
		} else if (vsKey === 'shift') {
			voResult.shift = true;
		} else if (vsKey === 'alt') {
			voResult.alt = true;
		} else {
			voResult.key = vsKey.toUpperCase();
		}
	}
	return voResult;
}

/**
 * 로컬스토리지에 저장되어 있는 메뉴ID를 가져와서 즐겨찾기 컬럼 값 변경 메서드
 * @param {Boolean} pbFavCheck? 앱헤더 체크 여부
 */
function favMenuCheck() {
	var vsFavMenus = localStorage.getItem(AppProperties.PROJECT_NM + "favMenus");
	
	util.DataSet.findAllRow(app, "dsAllMenu", "MENU_FAV == 'Y'").forEach(function(each){
		each.setValue("MENU_FAV", "");
	});
		
	if (!ValueUtil.isNull(JSON.parse(vsFavMenus))) {
		JSON.parse(vsFavMenus).forEach(function(each, idx){
			util.DataSet.findRow(app, "dsAllMenu", "MENU_ID == '" + each + "'").setValue("MENU_FAV","Y");	
		});
	}
}

/**
 * URL 의 쿼리스트링으로 전달한 앱ID 를 찾아 화면으로 띄운다.
 */
function openPageQuery() {
	var voUrlSearch = new URLSearchParams(location.search);
	var vsCallPage = voUrlSearch.get("page");
	if(!ValueUtil.isNull(vsCallPage)) {
		vsCallPage.split(",").forEach(function(psAppId){
			var vsAppId = psAppId.trim();
			if(!ValueUtil.isNull(vsAppId)) {
				if(vsAppId.indexOf(".clx") == -1) vsAppId += ".clx";
				doOpenMenuToEa(vsAppId, null, null, false);
			}
		});
	}
}


function createWebSocket() {
	WS_URL += "?userId=" + app.lookup("dmUserInfo").getValue("USER_ID");
	
	ws = new WebSocket(WS_URL);
	ws.onopen = function(evt) {
		console.log("onopen : " + evt);
		setSocket(ws);
	}
	ws.onmessage = function(evt) {
		var vsPushMsg = evt.data;
		try {
			var voMsgInfo = {};
			
			var voSocketMsg = JSON.parse(vsPushMsg);
			if (voSocketMsg.msgType != undefined) {
				
				voMsgInfo.TYPE = voSocketMsg.msgType //"INFO";				
				if (voMsgInfo.TYPE == "login") {
					var vaMsgKeys = Object.keys(voSocketMsg);
					if (vaMsgKeys.indexOf("duplicateLogin") != -1) {
						util.Msg.alertDlg(app, "중복 로그인이 확인되었습니다.\n다른 장치에서 로그인 되었으므로 이 세션은 종료됩니다.", null, {
							confirmCallback: function() {
								app.lookup("btnLogout").click();
							}
						});
					} else if (vaMsgKeys.indexOf("duplicateLoginAllowed") != -1) {
						AppProperties.MAIN_DUPL_LOGIN_ALLOWED = voSocketMsg.duplicateLoginAllowed;
					}
					
				} else if (voMsgInfo.TYPE == "DANGER") {
					voMsgInfo.MSG = "긴급 메시지가 왔습니다.";
				} else if(voMsgInfo.TYPE == "APPROVAL_RESPONSIBLE"){
					var vsMsg = "승인 요청 메시지가 왔습니다.";
					if(voSocketMsg.reqStatus == "APR" || voSocketMsg.reqStatus == "REJ") vsMsg = "승인 요청 결과 메시지가 왔습니다.";
					voMsgInfo.MSG = vsMsg;
					voMsgInfo.KEY = voSocketMsg.key;
					voMsgInfo.SENDER_NM = voSocketMsg.senderName;
					voMsgInfo.SENDER_ID = voSocketMsg.senderId;
					voMsgInfo.APPR_KIND = voSocketMsg.apprKind;
					voMsgInfo.APPR_RESULT = voSocketMsg.reqStatus;
					voMsgInfo.MSG_TITLE = voSocketMsg.msgTitle;
					voMsgInfo.adminMsg = voSocketMsg.adminMsg;
				} else {
					voMsgInfo.MSG = "공지 메시지가 왔습니다.";
				}
				voMsgInfo.Text = voSocketMsg.message || "";
				/** @type String */
				var receiver = voSocketMsg.receiver || "";
				if (receiver.indexOf(util.Main.getUserInfo(app, "USER_TYPE")) > -1) {
					cpr.core.NotificationCenter.INSTANCE.post(AppProperties.MSG_TOPIC_ID, voMsgInfo);
					//알림 on class 추가
					var vcBtnAlarm = app.lookup("btnAlarm");
					if (!vcBtnAlarm.style.hasClass("active")) {
						vcBtnAlarm.style.addClass("active");
					}
				}
			} else {
				//화면 접근 통제, 권한처리소스
				/** @type Array */
				var msg = voSocketMsg.message;
				/** @type String */
				var receiverType = voSocketMsg.receiverType || "";
				if (receiverType.indexOf(util.Main.getUserInfo(app, "USER_TYPE")) > -1) {
					authData = msg;
					var vcMdi = app.lookup("mdiCn");
					var vaTabItems = vcMdi.getTabItems();
					var vaApps = cpr.core.Platform.INSTANCE.getAllRunningAppInstances();
					if (msg && msg.length > 0) {
						msg.forEach(function(each) {
							var vsMenuId = each["MENU_ID"];
							var voTargetItem = vaTabItems.find(function(ele) {
								var tempUserAttr = ele.userAttr("__menuId");
								
								return tempUserAttr == vsMenuId;
							});
							if (each["USR_ACCESS_YN"] == "N") {
								if (voTargetItem) {
									/** @type cpr.controls.EmbeddedApp */
									var vcEmb = voTargetItem.content;
									util.Msg.alertDlg(vcEmb.getEmbeddedAppInstance(), "해당 메뉴에 대한 권한정보가 사라져 페이지가 닫힙니다.", null, {
										confirmCallback: function() {
											vcMdi.removeTabItem(voTargetItem);
											vcMdi.setSelectedTabItem(vaTabItems[0]);
										}
									});
									if (vcMdi.getSelectedTabItem() != voTargetItem) {
										vcMdi.setSelectedTabItem(voTargetItem);
									}
								}
								
							} else if (each["USR_TRANS_YN"] == "N") {
								if (voTargetItem) {
									/** @type cpr.controls.EmbeddedApp */
									var vcEmb = voTargetItem.content;
									var setTransaction = function() {
										vcEmb.getEmbeddedAppInstance().getContainer().getAllRecursiveChildren().forEach(function(each) {
											if (each.userAttr("transCtrl") != "") {
												Object.defineProperty(each, "enabled", {
													value: false,
													configurable: false,
													writable: false
												});
												each.redraw();
											}
										});
									}
									if (vcEmb && vcEmb.getEmbeddedAppInstance()) {
										setTransaction();
									} else {
										vcEmb.ready(function() {
											setTransaction();
										})
									}
								}
							}
						});
						setAuthHandling(msg);
					}
				} else {
					if (voSocketMsg.reqStatus == "LOGOUT") { // 강제 로그아웃
						var newWs = getSocket();
						util.Msg.alertDlg(app, "관리자에 의해 강제로그아웃 되었습니다.", null, {
							confirmCallback: function() {
								// 확인 버튼 클릭시 접속현황 리스트 재조회를 위한 웹소켓 통신
								var msWsMsg = {
									receiver : voSocketMsg.SENDER_ID,
									reqStatus: "LOGOUT_AGR"
								}
								newWs.send(JSON.stringify(msWsMsg));
										
								// 로그아웃처리
								app.lookup("btnLogout").click();
							},
//							cancelCallback: function(){
////								window.location.reload();
//								// 취소 버튼 클릭시 거절했다고 알림창 띄움
//								var msWsMsg = {
//									receiver : voSocketMsg.SENDER_ID,
//									reqStatus: "LOGOUT_RJT"
//								}
//								newWs.send(JSON.stringify(msWsMsg));
//							}
						});
						
						
					} else if (voSocketMsg.reqStatus == "COLT") { // 사용자별 로그 수집
						stackLog();
					} else if (voSocketMsg.reqStatus == "LOGOUT_AGR" || voSocketMsg.reqStatus == "LOGOUT_RJT") { // 시용자가 로그아웃 동의 or 거절
						var vcMdi = app.lookup("mdiCn");
						var vaTabItems = vcMdi.getTabItems();
						var voTargetItem = vaTabItems.find(function(ele) {
							var tempUserAttr = ele.userAttr("__menuId");
							return tempUserAttr == "A10-11"; // [모니터링] 화면의 menuId (app/sce/A10/A10-10)
						});
						if (voTargetItem) {
							/** @type cpr.controls.EmbeddedApp */
							var vcEmb = voTargetItem.content;
							var vsSendMsg = "";
							if (voSocketMsg.reqStatus == "LOGOUT_RJT") {
								vsSendMsg = "사용자가 로그아웃 요청을 거절했습니다.";
							} else {
								vsSendMsg = "사용자의 로그아웃 처리가 완료되었습니다.";
							}
							
							util.Msg.alertDlg(app, vsSendMsg, null, {
								confirmCallback: function(){
									// 관리자메뉴의 접속현황 리스트 조회
									util.Submit.send(vcEmb.getEmbeddedAppInstance().lookup("embAdmin").getEmbeddedAppInstance(), "subOnLoad", function(pbSuccess, sub) {
										if (pbSuccess) {
											vcEmb.getEmbeddedAppInstance().lookup("embAdmin").getEmbeddedAppInstance().lookup("grd1").sort("date desc");
										}
									});
								}
							});
						}
					}
				}
			}
		} catch (err) {
			console.log(err);
		}
	}
	ws.onclose = function(evt) {
		console.log("onclose : " + evt);
	}
	ws.onerror = function(evt) {
		console.log("onerror : " + evt);
	}
}

function stackLog() {
	var dsAllMenu = app.lookup("dsAllMenu");
	
	var vsUserId = util.Main.getUserInfo(app, "USER_ID");
	var vsUserNm = util.Main.getUserInfo(app, "USER_NM");
	
	var vsParam = "";
	var vaGetLogs = getLog();

	// 임베딩 화면 하드 코딩으로 데이터 넣음
	dsAllMenu.pushRowData({
		"MENU_NM": "화면디자인 편집기",
		"MENU_ID": "A5-9-1",
		"CALL_PAGE": "app/sce/A5/A5-9-1.clx",
		"USE_YN" : "N"
	});

	vaGetLogs.forEach(function(each) {
		var evt = each;
		var vsAppId, vsFileNm = "";
		
		if (!ValueUtil.isNull(evt.targetControl.app)) {
			vsAppId = dsAllMenu.findFirstRow("CALL_PAGE == '" + evt.targetControl.app.id + ".clx'").getValue('MENU_ID');
			vsFileNm = dsAllMenu.findFirstRow("CALL_PAGE == '" + evt.targetControl.app.id + ".clx'").getValue('MENU_NM');
		} else {
			// 새로고침할 때
			function _getTargetAppInstance (poApp) {
				if(poApp.isUDCInstance()) {
					return _getTargetAppInstance(poApp.getHostAppInstance());
				} else if (poApp.isEmbeddedAppInstance() && !poApp.getHostAppInstance().isRootAppInstance()) {
					return _getTargetAppInstance(poApp.getHostAppInstance());
				} else {
					return poApp;
				}
			}
			var voTargetAppIns = _getTargetAppInstance(evt.targetControl.getAppInstance());
			if (ValueUtil.isNull(voTargetAppIns)) {
				vsAppId = "N-ADMIN";
				vsFileNm = "관리자 메뉴";
				return;
			} else if (ValueUtil.isNull(dsAllMenu.findFirstRow("CALL_PAGE == '" + voTargetAppIns.app.id + ".clx'"))) {
				vsAppId = voTargetAppIns.app.id;
				vsFileNm = voTargetAppIns.app.title;
			} else {
				vsAppId = dsAllMenu.findFirstRow("CALL_PAGE == '" + voTargetAppIns.app.id + ".clx'").getValue('MENU_ID');
				vsFileNm = dsAllMenu.findFirstRow("CALL_PAGE == '" + voTargetAppIns.app.id + ".clx'").getValue('MENU_NM');
			}
		}
		
		vsParam += "date = " + moment(new Date(evt.timeStamp)).format("YYYY-MM-DD HH:mm:ss") +
			", eventType = " + evt.type +
			", appId = " + vsAppId +
			", userId = " + vsUserId +
			", userNm = " + vsUserNm +
			", fileNm = " + vsFileNm +
			", controlType = " + evt.targetControl.type + "\n";
	});
	
	// 로그 텍스트 파일 생성
	fetch("/websocket/setLogs.do", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			message: vsParam
		})
	}).then(res => {
		clearLog();
	}).then(result => console.log("서버 응답:", result))
	.catch(err => console.error("에러:", err));
	
}
/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/
/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e) {
	util.Submit.send(app, "subOnLoad", function(pbSuccess) {
		if (pbSuccess) {
			util.Control.redraw(app, ["snavMn", "ngb","snavMMenu"]);
			var userType = cpr.core.Platform.INSTANCE.getParameter("userType");
			var userId = cpr.core.Platform.INSTANCE.getParameter("userId");
			var userNm = cpr.core.Platform.INSTANCE.getParameter("userNm");
			
			if(userType) util.DataMap.setValue(app, "dmUserInfo", "USER_TYPE", userType);
			if(userId) util.DataMap.setValue(app, "dmUserInfo", "USER_ID", userId);
			if(userNm) util.DataMap.setValue(app, "dmUserInfo", "USER_NM", userNm);
			
			// 대시보드 화면 로드
			var vcEaHome = app.lookup("eaHome");
//			vcEaHome.app = null;
//			cpr.core.App.load("app/main/Dashboard", function(loadedApp) {
//				vcEaHome.app = loadedApp;
//				vcEaHome.redraw();
//			});
			vcEaHome.ready(function(ea){
				ea.getEmbeddedAppInstance()["_menuApp"] = true;
			});
			
			setInitConfig();
			
			if (!window.eb6Preview){
				createWebSocket();
			}
			/* 아이템 리스트 추가 */
			app.lookup("lbxTabList").addItem(new cpr.controls.Item("대시보드", "dashboard"));
			
			openPageQuery();
			
		}
	});
}

/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 전파되는 이벤트.
 */
function onBodyScreenChange(e) {
	var vsScrnNm = e.screen.name;
	
	/*
	 * [메인 구조 처리]
	 * default : 세로형
	 * vertical: 세로형, GNB 미표시
	 * horizontal : 가로형
	 */
	var vsMainType = localStorage.getItem(AppProperties.PROJECT_NM + "mainType");
	if(!msMainType) msMainType = vsMainType || "vertical";
	var vcNav = app.lookup("ngb");
	
	if(vsMainType == "horizontal") {
		// 가로형 (Side 메뉴 제거)
		util.Control.setVisible(app, false, ["grpAsd", "btnAsdExpder"]);
		app.lookup("grpBody").updateConstraint(mcMainContentCtrl, {
			left : "0px"
		});
		
		vcNav.clearFilter();
	} else {
		// Gnb Depth
		CustomizeOpt.setGnbDepth();
	}
	
	var vcGrpAsd = app.lookup("grpAsd");
	var vcBtnAsdExp = app.lookup("btnAsdExpder");
	var vcMdiCn = app.lookup("mdiCn");
	var vcGrpHeader = app.lookup("grpHeader");
	var vcMdiBtnUtils = app.lookup("mdiBtnUtils");
	var vcBtnHeaderMenu = app.lookup("btnHeaderMenu");
	
	// PC
	if (AppProperties.SCREEN_DEFAULT_NM.indexOf(vsScrnNm) != -1) {
		if(msMainType == "vertical") {
			vcGrpAsd.visible = true;
			vcBtnAsdExp.visible = true;
		}
		if(vcMdiBtnUtils) vcMdiBtnUtils.visible = true;
		if(vcBtnHeaderMenu) vcBtnHeaderMenu.visible = false;
		
		vcGrpHeader.getLayout().setColumnVisible(1, true);
		vcGrpHeader.getLayout().setColumnVisible(2, true);
		
		var vcGrpHeaderColDiv = vcGrpHeader.getLayout().getColumnDivisions();
		vcGrpHeaderColDiv[0].lengthExpression = "242px";
		vcGrpHeader.getLayout().setColumnDivisions(vcGrpHeaderColDiv);
		
		if(!mbMenuFloatType && msMainType == "vertical") {
			vcMdiCn.getParent().updateConstraint(vcMdiCn, {
				left: "240px"
			});
			
			expandAsideArea();
		}
		unfloating(app.lookup("grpMMenu"));
		
	} else { 
		// Tabelt & Mobile
		vcBtnAsdExp.visible = false;
		vcGrpAsd.visible = false;
		if(vcMdiBtnUtils) vcMdiBtnUtils.visible = false;
		if(vcBtnHeaderMenu) vcBtnHeaderMenu.visible = true;
		
		vcGrpHeader.getLayout().setColumnVisible(1, false);
		vcGrpHeader.getLayout().setColumnVisible(2, false);
		
		var vcGrpHeaderColDiv = vcGrpHeader.getLayout().getColumnDivisions();
		vcGrpHeaderColDiv[0].lengthExpression = "1fr";
		vcGrpHeader.getLayout().setColumnDivisions(vcGrpHeaderColDiv);
		
		vcMdiCn.getParent().updateConstraint(vcMdiCn, {
			left: "0px"
		});
		
		vcMdiCn.redraw();
	}
}

/*
 * 내비게이션 바에서 item-click 이벤트 발생 시 호출.
 * 아이템 클릭시 발생하는 이벤트.
 */
function onNgbItemClick(e) {
	var ngb = e.control;
	
	var item = e.item;
	var vcSideNavigation = app.lookup("snavMn");
	var vsSideTit = app.lookup("sideTit");
	
	function findRootItem (poItem) {
		if(poItem.parentItem) {
			return findRootItem(poItem.parentItem);
		} else {
			return poItem;
		}
	}
	var vsFilter = "hasAncestor('" + item.value + "')";
	vcSideNavigation.filterExp = vsFilter;
	vsSideTit.value = item.label;
	
	var vsCallPage = item.row.getValue("CALL_PAGE");
	if(!ValueUtil.isNull(vsCallPage)) {
		openPage(item.row);
	}
}

/*
 * 사이드 내비게이션에서 item-click 이벤트 발생 시 호출.
 * 아이템 클릭시 발생하는 이벤트.
 */
function onSnavMnItemClick(e) {
	var voItemRow = e.item.row;
	var vsCallPage = voItemRow.getValue("CALL_PAGE");
	
	if (ValueUtil.fixNull(vsCallPage) != "") {
		openPage(voItemRow, true);
		
		// 모바일일 때 어사이드 메뉴 닫기
		app.getFloatingControls().filter(function(each) {
			return each.style.hasClass("cl-overlay");
		}).forEach(function(each) {
			each.dispatchEvent(new cpr.events.CMouseEvent("click"));
		});
		
		if (app.lookup("grpMMenu").isFloated()) unfloating(app.lookup("grpMMenu"));
	}
}


/*
 * MDI 폴더에서 close 이벤트 발생 시 호출.
 * 탭 아이템을 닫을 때 발생하는 이벤트이며, 사용자가 취소할 수 있습니다.
 */
function onMdiCnClose(e) {
	var mdiCn = e.control;
	removeTabItemFromList(e.content);
	
	// 체크한 탭 아이템 해제
	if (e.content.checked) {
		e.content.checked = false;
	}
	
	/* 첫 아이템을 제외한 나머지 탭 아이템이 닫혔을 때 첫 아이템 선택 */
	var vaLastTabItems = _.reject(mdiCn.getTabItems(), function(each) {
		return each == e.content;
	});
	
	if (vaLastTabItems.length > 1) {
		return;
	}
	mdiCn.setSelectedTabItem(vaLastTabItems[0]);
	util.Control.redraw(app, "eaHome");
}


/*
 * "로그아웃" 버튼(btnLogout)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnLogoutClick(e){
	if(window.eb6Preview) {
		cpr.core.App.load("app/main/Login", function(loadedApp) {
			app.getRootAppInstance().dispose();
			loadedApp.createNewInstance().run();
			cpr.core.Platform.INSTANCE.setDocumentTitle(loadedApp.title);
		});
	} else {
		util.Submit.send(app, "subLogOut", function(pbSuccess) {
			if (pbSuccess) {
				top.location.href = top.location.href;
			}
		});
	}	
}

/*
 * 버튼(btnHome)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnHomeClick(e) {
	var btnHome = e.control;
	
	var vcMDIFolder = app.lookup("mdiCn");
	vcMDIFolder.setSelectedTabItem(vcMDIFolder.getItemByName("dashboard"));
	util.Control.redraw(app, "eaHome");
}

/*
 * "목록" 버튼(btnList)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnListClick(e) {
	var btnList = e.control;
	
	var btnRct = btnList.getActualRect();
	floating(app.lookup("grpMnListPop"), {
		right: "189px",
		top: btnRct.bottom + "px",
		width: "220px",
		height: "250px"
	});
}

/*
 * "새로고침" 버튼(btnReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnResetClick(e) {
	var btnReset = e.control;
	
	// 현재 선택되어 있는 화면을 새로고침
	var vcMdiCn = app.lookup("mdiCn");
	
	var vcSelectedTabItem = vcMdiCn.getSelectedTabItem();
	var vcItemCn = vcSelectedTabItem.content;
	
	if (vcItemCn instanceof cpr.controls.EmbeddedApp) {
		var vsAppId = vcItemCn.app.id;
		vcItemCn.app = null;
		cpr.core.App.load(vsAppId, function(loadedApp) {
			vcItemCn.app = loadedApp;
			vcItemCn.ready(function(ea) {
				ea.getEmbeddedAppInstance()["_menuApp"] = true;
			});
			vcItemCn.redraw();
		});
	}
}

/*
 * "모두 닫기" 버튼(btnClose)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCloseClick(e) {
	var btnClose = e.control;
	// 대시보드를 제외한 나머지 탭 삭제
	var vcMdiCn = app.lookup("mdiCn");
	
	util.Msg.confirmDlg(app, "전체 메뉴를 닫으시겠습니까?", null, {
		confirmCallback: function() {
			var vcAliveTabItem = vcMdiCn.getItemByName("dashboard");
			if (vcAliveTabItem != null) {
				vcAliveTabItem.checked = true;
			}
			var vaOpenedTabs = vcMdiCn.getTabItems();
			vaOpenedTabs.forEach(function(each) {
				if (!each.checked) {
					each.close();
				}
			});
			
			// 고정 탭이 존재하여도 대시보드 화면을 선택
			if (vcAliveTabItem != null) {
				vcMdiCn.setSelectedTabItem(vcAliveTabItem);
			}
		},
		subMsg: "잠긴 탭은 닫히지 않습니다."
	});
}

/*
 * 버튼(btnAsdExpder)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnAsdExpderClick(e) {
	var btnAsdExpder = e.control;
	
	var vcGrpAsd = app.lookup("grpAsd");
	if (vcGrpAsd.style.hasClass("collapsed") == true) {
		expandAsideArea();
	} else {
		collapseAsideArea();
	}
}

/*
 * 버튼(btnHeaderMenu)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnHeaderMenuClick(e) {
	var btnHeaderMenu = e.control;
	
	floating(app.lookup("grpMMenu"), {
		top: "0px",
		bottom: "0px",
		left: "0px",
		width: "290px",
		zIndex: "1",
	}, {
		modal: true
	});
}

/*
 * 버튼(btnMMenuClose)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnMMenuCloseClick(e) {
	var btnMMenuClose = e.control;
	
	unfloating(app.lookup("grpMMenu"));
}

/*
 * "정보변경" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick5(e){
	util.Dialog.open(app, "app/main/Setting", 480, -1, function(dialog) {
		
		// 플로팅 옵션 변경 사항 즉시 적용
		CustomizeOpt.setFloatOption();
		
		// Gnb 메뉴 Depth 즉시 적용
		CustomizeOpt.setGnbDepth();
	});
}

/*
 * "새창보기" 버튼(btnNewWindow)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnNewWindowClick(e) {
	var btnNewWindow = e.control;
	
	var vcMdiCn = app.lookup("mdiCn");
	var voTabItem = vcMdiCn.getSelectedTabItem();
	if (!voTabItem.content.app) return;
	var vsAppId = voTabItem.content.app.id;
	
	// 대시보드 화면 제외
	if (voTabItem == vcMdiCn.getItemByName("dashboard")) return;
	
	//미리보기 서버일 경우
	if (typeof eb6Preview != "undefined") {
		vsAppId = vsAppId + ".clx.html"
	} else {
		vsAppId = vsAppId + ".clx"
	}
	window.open(vsAppId, "_blank");
}

/*
 * "화면전체크기" 버튼(btnFullWindow)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnFullWindowClick(e) {
	var btnFullWindow = e.control;
	
	var vcBtnFullWindow = app.lookup("btnFullWindow");
	var vcBtnFitWindow = app.lookup("btnFitWindow");
	
	vcBtnFullWindow.visible = false;
	vcBtnFitWindow.visible = true;
	vcBtnFitWindow.focus();
	
	var vcBtnAsdExpder = app.lookup("btnAsdExpder");
	var tempCollapedVal = "" + (vcBtnAsdExpder.style.hasClass("on") || !vcBtnAsdExpder.isShowing());
	vcBtnAsdExpder.userAttr("--collapsed", tempCollapedVal);
	collapseAsideArea();
	
	util.Control.setVisible(app, false, ["grpHeader"]);
	var voConstOption= {
		top : "0px",
		left : "0px"
	}
	util.Control.updateConstraint(app, "grpBody", null, voConstOption);
}

/*
 * "화면기본크기" 버튼(btnFitWindow)에서 click 이벤트 발생 시 호출., 
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnFitWindowClick(e) {
	var btnFitWindow = e.control;
	
	var vcBtnFullWindow = app.lookup("btnFullWindow");
	var vcBtnFitWindow = app.lookup("btnFitWindow");
	
	vcBtnFullWindow.visible = true;
	vcBtnFitWindow.visible = false;
	vcBtnFullWindow.focus();
	
	var vcBtnAsdExpder = app.lookup("btnAsdExpder");
	if(vcBtnAsdExpder.userAttr("--collapsed") == "true") {
		collapseAsideArea();
	} else {
		util.Control.setVisible(app, true, ["grpAsd", "btnAsdExpder"]);
		expandAsideArea();
	}
	
	util.Control.setVisible(app, true, "grpHeader");
	
	var vsTargetScrnNm = app.targetScreen.name;

	var voConstOption = {top : "48px"};
	util.Control.setVisible(app, true, "grpHeader");
	
	util.Control.updateConstraint(app, "grpBody", null, voConstOption);
}

/*
 * MDI 폴더에서 tabheader-click 이벤트 발생 시 호출.
 * 탭 아이템의 헤더 영역을 클릭하였을 때 발생하는 이벤트입니다.
 */
function onMdiCnTabheaderClick(e) {
	var mdiCn = e.control;
	
	if (e.button == 2) {
		var item = e.item;
		var vcSelectedTabItem = mdiCn.getSelectedTabItem();
		
		e.preventDefault();
		var vcRootContainer = app.getRootAppInstance().getContainer();
		
		var vcMenu = new cpr.controls.Menu("mdiTabmenu");
		vcMenu.style.css("z-index", "1");
		vcMenu.addItem(new cpr.controls.MenuItem("모든 탭 닫기", "closeAll", "root"));
		vcMenu.addItem(new cpr.controls.MenuItem("다른 탭 닫기", "closeOthers", "root"));
		vcMenu.addItem(new cpr.controls.MenuItem("앱ID 복사", "clipBoardAppId", "root"));
		vcMenu.addItem(new cpr.controls.MenuItem("새창 열기", "tabPopup", "root"));
		
		vcMenu.addEventListener("selection-change", function( /**@type cpr.events.CSelectionEvent */ e) {
			var vaNewSelection = e.newSelection;
			switch (vaNewSelection[0].value) {
				case "closeAll":
					/* 대시보드 탭과 잠김 탭 이외의 모든 탭 아이템을 닫음 */
					var lockItems = mdiCn.getCheckedTabItems();
					var vcAliveTabItem = mdiCn.getItemByName("dashboard");
					if (lockItems.length == 0) {
						mdiCn.closeOthers(vcAliveTabItem);
					} else {
						var items = mdiCn.getTabItems();
						for (var i = 1; i < items.length; i++) {
							if (lockItems.indexOf(items[i]) < 0) {
								mdiCn.close(items[i]);
							}
						}
					}
					
					// 대시보드 화면을 선택
					if (vcAliveTabItem != null) {
						mdiCn.setSelectedTabItem(mdiCn.getItemByName("dashboard"));
					}
					break;
				case "closeOthers":
					/* 대시보드 탭과 잠김 탭과 현재 선택된 탭 이외의 모든 탭 아이템을 닫음 */
					var vaItems = mdiCn.getTabItems();
					
					var vcAliveTabItem = mdiCn.getItemByName("dashboard");
					
					vaItems.some(function(each) {
						// 동일한 AppId에 대해 다중으로 열릴 경우에 대해 닫을 수 있도록 수정
						if (vcAliveTabItem.content.app.id == each.content.app.id || each.id == item.id || each.checked) {
//							if(vcAliveTabItem.content.app.id == each.content.app.id || each.content.app.id == item.content.app.id || each.checked){
							return false;
						}
						mdiCn.close(each);
						removeTabItemFromList(each);
					});
					mdiCn.setSelectedTabItem(item, false);
					break;
				case "clipBoardAppId":
					var input = document.createElement("input");
					input.style.position = "fixed";
					input.value = item.content.app.id;
					document.body.appendChild(input);
					input.focus();
					input.select();
					document.execCommand("copy");
					document.body.removeChild(input);
					util.Msg.notify(app, "앱 ID가 복사되었습니다.");
					break;
				case "tabPopup":
					var voTabItem = mdiCn.getSelectedTabItem();
					var vsAppId = voTabItem.content.app.id;
					
					//미리보기 서버일 경우
					if (typeof eb6Preview != "undefined") {
						vsAppId = vsAppId + ".clx.html"
					} else {
						vsAppId = vsAppId + ".clx"
					}
					window.open(vsAppId, "_blank");
					break;
			}
			vcMenu.hide();
			vcMenu.dispose();
		});
		
		vcMenu.addEventListener("blur", function( /**@type cpr.events.CFocusEvent*/ e) {
			vcMenu.hide();
			vcMenu.dispose();
		});
		var zoom = cpr.core.Platform.INSTANCE.getZoom();
		var showConstraint = {
			"position": "absolute",
			"top": (e.clientY / zoom) + "px",
			"left": (e.clientX  / zoom)+ "px",
			"width": "150px",
			"height": "auto"
		};
		if (vcRootContainer.getLayout() instanceof cpr.controls.layouts.FormLayout) {
			app.floatControl(vcMenu, showConstraint);
		} else {
			vcRootContainer.addChild(vcMenu, showConstraint);
		}
		vcMenu.focus();
	}
}

/*
 * MDI 폴더에서 tabheader-check 이벤트 발생 시 호출.
 * 탭아이템의 체크박스를 체크시 발생하는 이벤트이며, 사용자가 취소할 수 있습니다.
 */
function onMdiCnTabheaderCheck(e){
	if (e.item.itemIndex != 0) mdiLockTabItem(e.item, true);
}

/*
 * MDI 폴더에서 tabheader-uncheck 이벤트 발생 시 호출.
 * 탭아이템의 체크박스를 체크를 해제시 발생하는 이벤트이며, 사용자가 취소할 수 있습니다.
 */
function onMdiCnTabheaderUncheck(e){
	mdiLockTabItem(e.item, false);
}

/*
 * MDI 폴더에서 selection-change 이벤트 발생 시 호출.
 * 선택된 탭의 메뉴를 사이드 내비게이션에서도 선택한다. 대시보드 탭이면 선택을 지운다.
 * 새로 여는 탭은 메뉴 ID(__menuId)를 붙이기 전에 이 이벤트가 오므로, 메뉴 ID가 없으면 그대로 둔다(메뉴 클릭으로 이미 선택됨).
 */
function onMdiCnSelectionChange(e) {
	var vcSideNavigation = app.lookup("snavMn");
	var vcTabItem = e.newSelection;
	if (!vcTabItem) return;
	var vsMenuId = vcTabItem.userAttr("__menuId");
	if (vsMenuId) {
		vcSideNavigation.selectItemByValue(vsMenuId, false);
	} else if (vcTabItem.name == "dashboard") {
		vcSideNavigation.clearSelection(false);
	}
}

/*
 * 버튼(btnAlarm)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnAlarmClick(e) {
	var btnAlarm = e.control;
	
	var voBtnAlarmRect = btnAlarm.getActualRect();
	
	floating(app.lookup("grpAlarm"), {
		right: "calc(100% - " + voBtnAlarmRect.left + "px)",
		top: "56px",
		width: "280px",
		height: "260px"
	});
}

/*
 * 서치 인풋에서 search 이벤트 발생 시 호출.
 * Searchinput의 enter키 또는 검색버튼을 클릭하여 인풋의 값이 Search될때 발생하는 이벤트
 */
function onSi1Search(e) {
	var si1 = e.control;
	
	var vcSideNavigation = app.lookup("snavMn");
	var vsSchValue = si1.displayingText;
	if(!ValueUtil.isNull(vsSchValue)) {
		vcSideNavigation.filterExp = "MENU_NM *= '" + vsSchValue + "'"; //최하위 메뉴
	} else {
		vcSideNavigation.clearFilter();
	}
}

/*
 * 리스트 박스에서 item-click 이벤트 발생 시 호출.
 * 아이템 클릭시 발생하는 이벤트.
 */
function onLbxTabListItemClick(e) {
	var lbxTabList = e.control;
	
	if(e.item.value == "dashboard") {
		app.lookup("btnHome").click();
		lbxTabList.clearSelection(false);
		unfloating(app.lookup("grpMnListPop"));
		return;	
	}
	
	// 활성 탭 아이템 변경
	var vcMdiCn = app.lookup("mdiCn");
	// 클릭한 아이템 value
	var vsItemVal = e.item.row.getValue("menuId");
	
	var vsAppId = util.DataSet.findRow(app, "dsAllMenu", "MENU_ID == '" + vsItemVal + "'").getValue("CALL_PAGE");
	if (vsAppId.indexOf(".clx") != -1) {
		/* CLX 화면인 경우 */
		vsAppId = vsAppId.substring(0, vsAppId.lastIndexOf(".clx"));
	}
	
	var voOpenedTabItem = vcMdiCn.findItemWithAppID(vsAppId);
	if (voOpenedTabItem) {
		vcMdiCn.setSelectedTabItem(voOpenedTabItem);
		lbxTabList.clearSelection(false);
		
		// 언플로팅
		unfloating(app.lookup("grpMnListPop"));
		return;
	} else {
		// clx 화면이 없는 경우 탭 아이템 선택
		vcMdiCn.getTabItems().filter(function(each) {
			if (each.text == e.item.label) {
				vcMdiCn.setSelectedTabItem(each);
				return;
			}
		});
	}
}

/*
 * "즐겨찾는메뉴" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e) {
	var button = e.control;
	
	var vcSideNavigation = app.lookup("snavMn");
	
	vcSideNavigation.filterExp = 'MENU_FAV == "Y"';
}

/*
 * "Menu" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick2(e) {
	var button = e.control;
	
	var vcSideNavigation = app.lookup("snavMn");
	vcSideNavigation.filterExp = '';
	
	app.lookup("sideTit").value = "메뉴 검색";
}

/*
 * "내업무" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick4(e) {
	var button = e.control;
	
	var vcSideNavigation = app.lookup("snavMn");
	
	vcSideNavigation.filterExp = 'MENU_WORK == "Y"';
}

/*
 * "확대" 버튼(btnZoom)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnZoomClick(e) {
	var btnZoom = e.control;
	
	if (cpr.core.Platform.INSTANCE.getZoom() != 1) {
		util.Control.setValue(app, "nbeZmRatio", cpr.core.Platform.INSTANCE.getZoom() * 100)
	}
	
	var btnRct = btnZoom.getActualRect();
	floating(app.lookup("grpZoom"), {
		right: "54px",
		top: (btnRct.bottom + 3)+ "px",
		width: "136px", // 배율 숫자(100, 120)가 잘리지 않도록 숫자 칸 56px 확보 (여백 24 + 버튼 40 + 간격 16)
		height: "36px"
	});
	
	
}

/*
 * 버튼(btnZoomMinus)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnZoomMinusClick(e) {
	var btnZoomMinus = e.control;
	var vnScaleVal = Number(util.Control.getValue(app, "nbeZmRatio"));
	if (vnScaleVal <= app.lookup("nbeZmRatio").min) {
		return;
	}
	setScreenScale(vnScaleVal - 10);
}

/*
 * 버튼(btnZoomPlus)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnZoomPlusClick(e) {
	var btnZoomPlus = e.control;
	var vnScaleVal = Number(util.Control.getValue(app, "nbeZmRatio"));
	if (vnScaleVal >= app.lookup("nbeZmRatio").max) {
		return;
	}
	
	setScreenScale(vnScaleVal + 10);
}

/*
 * 버튼(btnLogo)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnLogoClick(e) {
	var btnLogo = e.control;
	location.reload();
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbThemeSelectionChange(e) {
	var vsItemColor = e.newSelection.value;
	var isDark = vsItemColor != "light";
	setDarkLogo(isDark, true);
}

/*
 * "모두읽기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick3(e){
	app.lookup("dsNotiMsg").findAllRow("READ_YN != 'Y'").forEach(function(each){
		each.setValue("READ_YN", "Y");		
	});
	app.lookup("grpAlarmWrap").getChildren().forEach(function(item){
		if(item.style.hasClass("new")) {
			item.style.removeClass("new");
		}
	});
	util.Control.redraw(app, "btnAlarm");
}

/*
 * "전체삭제" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick6(e){
	app.lookup("dsNotiMsg").clear();
	app.lookup("grpAlarmWrap").removeAllChildren();
	util.Control.redraw(app, "btnAlarm");
}

/*
 * "닫기" 버튼(btnAlarmClose)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnAlarmCloseClick(e){
	unfloating(app.lookup("grpAlarm"));
}

/*
 * "로그아웃" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick7(e){
	app.lookup("btnLogout").click();
}

/*
 * "관리메뉴" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick8(e){
	app.lookup("btnCustom").click();
}


/*
 * "즐겨찾는메뉴" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick9(e) {
	var button = e.control;
	var vcSideNavigation = app.lookup("snavMMenu");
	
	vcSideNavigation.filterExp = 'MENU_FAV == "Y"';
}

/*
 * "내업무" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick10(e) {
	var button = e.control;
	var vcSideNavigation = app.lookup("snavMMenu");
	
	vcSideNavigation.filterExp = 'MENU_WORK == "Y"';
}


/*
 * "Menu" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick11(e) {
	var button = e.control;
	var vcSideNavigation = app.lookup("snavMMenu");
	vcSideNavigation.filterExp = '';
}

/*
 * 서치 인풋에서 search 이벤트 발생 시 호출.
 * Searchinput의 enter키 또는 검색버튼을 클릭하여 인풋의 값이 Search될때 발생하는 이벤트
 */
function onSi3Search(e) {
	var si3 = e.control;
	var vcSideNavigation = app.lookup("snavMMenu");
	var vsSchValue = si3.displayingText;
	if (!ValueUtil.isNull(vsSchValue)) {
		vcSideNavigation.filterExp = "MENU_NM *= '" + vsSchValue + "'"; //최하위 메뉴
	} else {
		vcSideNavigation.clearFilter();
	}
}

