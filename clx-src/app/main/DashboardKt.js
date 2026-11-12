/************************************************
 * DashboardKt.js
 * Created at 2026. 11. 12. 오후 4:00:00.
 * KT 대리점 메인(MainKt)용 대시보드. Dashboard.js 를 기반으로 포틀릿 구성만 바꿨다.
 *
 * @author gpt_06
 ************************************************/
/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/ 

/************************************************
 ** 파일내 로컬변수 선언  
 ************************************************/
var util = createCommonUtil();

var portletUtil = createPortlet();

/************************************************
 * 전역 변수 선언
 ************************************************/
var msStorageKey = "CUSTOM-DASH-KT-";

// 신규 등록 여부
var mbIsInsert = false;

// 매트릭스 위치 정보 배열 구성
var maFormMatrix = [];

// 포틀릿 col, row 배치 카운트
var maxColCnt = 18;
var maxRowCnt = 18;

/** 시도새올일 경우 isSaeol 여부에 따라 필요한 부분 변경  */
var mbIsSaeol = false;

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/ 
exports.createCustomItem = createCustomItem;
exports.deleteCustomItem = deleteCustomItem;
exports.setCustomMode = setCustomMode;
exports.redrawSwiper = function () {
	var vcGrpPortlet = app.lookup("grpPortlet");
	vcGrpPortlet.getAllRecursiveChildren(false).filter(function(each){
		return (each instanceof udc.cmn.dashboard.saeol.udcDashItem7 || each instanceof udc.cmn.dashboard.saeol.udcDashItem6);
	}).forEach(function(udc){
		udc.redrawSwiper();
	});
}


/**
 * 매트릭스 위치 정보를 초기화 합니다.
 */
function setClearFormMatrix() {
	for (var x = 0; x < maxRowCnt; x++) {
		maFormMatrix[x] = [];
		for (var y = 0; y < maxColCnt; y++) {
			maFormMatrix[x][y] = 0;
		}
	}
}


/**
 * 파라미터로 받은 크기에 적용 가능한 비어있는 위치를 찾아 반환
 * @param {Number} pnPositionX
 * @param {Number} pnPositionY
 */
function findEmptyMatrixPosition(pnPositionX, pnPositionY) {
	for (var i = 0; i <= maxRowCnt - pnPositionX; i++) {
		for (var j = 0; j <= maxColCnt - pnPositionY; j++) {
			var isEmpty = true;
			
			// 크기에 따른 영역을 확인하여 비어있는지 검사합니다.
			for (var x = i; x < i + pnPositionX; x++) {
				for (var y = j; y < j + pnPositionY; y++) {
					if (maFormMatrix[x][y] === 1) {
						isEmpty = false;
						break;
					}
				}
				if (!isEmpty) break;
			}
			
			if (isEmpty) {
				return {
					colIndex: j,
					rowIndex: i,
					colSpan: pnPositionX,
					rowSpan: pnPositionY
				}; // 삽입가능한 영역중 비어있는 영역 반환
			}
		}
	}
	
	// 모든 위치가 차있을 경우 null을 반환합니다.
	if (pnPositionX - 1 < 1 || pnPositionY - 1 < 1) {
		return null;
	} else {
		return findEmptyMatrixPosition(pnPositionX - 1, pnPositionY - 1);
	}
}

/**
 * UDC 객체에서 타겟되는 객체를 반환합니다.
 * @param {String} path
 */
function getUdcNestedProperty(path) {
	
	var vaKeys = path.split('.');
	if (vaKeys.length > 0 && vaKeys[0] == "udc") {
		vaKeys.shift();
	}
	
	return vaKeys.reduce(function(acc, key) {
		return acc && acc[key];
	}, udc);
}

/**
 * 포틀릿 그룹내 배치 가능한 영역의 컨스트레인트를 반환합니다.
 * @param {String} psSizeInfo 생성하고자 하는 포지션 크기 Width x Height(ex. "4x4")
 */
function getEmptyMatrixPosition(psSizeInfo) {
	var vcGrpPortlet = app.lookup("grpPortlet");
	var vaSizeInfo = psSizeInfo.split("x");
	
	// 매트릭스 정보 초기화
	setClearFormMatrix();
	
	// 매트릭스 정보 삽입
	var vaChildren = vcGrpPortlet.getChildren();
	vaChildren.forEach(function(childItem) {
		var voItemConst = vcGrpPortlet.getConstraint(childItem);
		var vnColIdx = voItemConst.colIndex;
		var vnRowIdx = voItemConst.rowIndex;
		var vnColSpan = 0;
		var vnRowSpan = 0;
		
		if (voItemConst.colSpan) vnColSpan = voItemConst.colSpan;
		if (voItemConst.rowSpan) vnRowSpan = voItemConst.rowSpan;
		
		for (var x = vnRowIdx; x < vnRowIdx + vnRowSpan; x++) {
			for (var y = vnColIdx; y < vnColIdx + vnColSpan; y++) {
				maFormMatrix[x][y] = 1; // 1은 컨트롤이 배치된 위치를 나타냅니다.
			}
		}
	});
	
	return findEmptyMatrixPosition(Number(vaSizeInfo[0]), Number(vaSizeInfo[1]));
}


/**
 * 폼 레이아웃 내부 셀하나의 크기값을 반환합니다.
 */
function calcCellSize() {
	var vcGrpPortlet = app.lookup("grpPortlet");
	var voGrpLayout = vcGrpPortlet.getLayout();
	
	var voActualRect = vcGrpPortlet.getActualRect();
	
	var vnWidth = voActualRect.width - Number(voGrpLayout.leftMargin.replace("px", "")) - Number(voGrpLayout.rightMargin.replace("px", ""));
	var vnHeight = voActualRect.height - Number(voGrpLayout.topMargin.replace("px", "")) - Number(voGrpLayout.bottomMargin.replace("px", ""));
	
	var vnCellWidth = vnWidth / maxColCnt;
	var vnCellHeight = vnHeight / maxRowCnt;
	
	return {
		"cellWidth": vnCellWidth,
		"cellHeight": vnCellHeight,
	}
}

/**
 * 
 */
function drawOriginData() {
	
	var vsUserId = util.Main.getUserInfo(app, "USER_ID");

	/* 커스텀 대시보드 정보조회 */
	var vsStorageKey = AppProperties.PROJECT_NM + msStorageKey + vsUserId;
	var voUserCustomData = localStorage.getItem(vsStorageKey);
	
	if (!ValueUtil.isNull(voUserCustomData)) {
		
		// 포틀릿에 존재할 경우, constraint 만 변경처리
		app.lookup("grpPortlet").removeAllChildren();
		app.lookup("dsCustomItem").clearData();
			
		/** @type Object */
		var voJsonUserCustomData = JSON.parse(voUserCustomData);
		
		/* 커스텀 저장일시 생성 */
		util.DataMap.setValue(app, "dmUserInfo", "userMenuGrpDate", voJsonUserCustomData["date"]);
		
		/* 커스텀 아이템 생성 */
		/** @type Array */
		var vaJsonUserCustomData = voJsonUserCustomData["data"];
		vaJsonUserCustomData.forEach(function(each) {
			var vsItemId = each["itemId"];
			createCustomItem(vsItemId, each["constraint"], false);
		});
	} else {
		return false;
	}
	
	return true;
}


/**
 * 커스텀 메뉴 아이템을 생성합니다.
 * @param {Object} psItemId 아이템 아이디
 * @param {Object} poPostion 메뉴 위치 정보
 * @param {Boolean} pbBtnVisible? 기능 버튼 표시 여부
 * @param {Boolean} pbWrapVisible? 아이템 커버 표시 여부
 * @param {Boolean} pbAddItem? 아이템 추가로 등록된 아이템 여부
 */
function createCustomItem(psItemId, poPostion, pbBtnVisible, pbWrapVisible, pbAddItem) {
	pbBtnVisible = pbBtnVisible ? pbBtnVisible : false;
	pbWrapVisible = pbWrapVisible ? pbWrapVisible : false;
	var voDsAllItem = app.lookup("dsAllItem");
	var voDsCustomItem = app.lookup("dsCustomItem");
	
	var vbHasAuth = false;
	
	// 삭제된 아이템 또는 권한 처리를 위한 아이템 조회
	var voFindRow = voDsAllItem.findFirstRow("itemId == '" + psItemId + "'");
	if (!voFindRow) {
		pbWrapVisible = true;
	} else {
		vbHasAuth = true;
	}
	
	var voMatrixPosition;
	if (!poPostion) { // 신규 생성되는 Item
		// 포틀릿에 위치시킬 포지션을 반환합니다.(초기 크기 4x4)
		voMatrixPosition = getEmptyMatrixPosition("4x4");
		if (!voMatrixPosition) {
			util.Msg.alertDlg(app, "배치 가능한 영역이 존재하지 않습니다.");
			return false;
		}
	} else { // 기존 구성된 Item
		voMatrixPosition = poPostion;
	}
	
	// 아이템 생성	
	var vcGrpItem = new cpr.controls.Container();
	var voFormLyt = new cpr.controls.layouts.FormLayout();
	voFormLyt.setColumns(["1fr"]);
	voFormLyt.setRows(["1fr"]);
	vcGrpItem.clipContent = true;
	voFormLyt.scrollable = false;
	
	vcGrpItem.style.addClass("custom-item");
	vcGrpItem.userData("itemId", psItemId);
	if (voFindRow) vcGrpItem.userData("itemInfo", voFindRow.getRowData());
	
	vcGrpItem.userAttr({
		"mobile-min-height": String(voFindRow.getValue("minHeight")),
		"tablet-min-height": String(voFindRow.getValue("minHeight")),
		"needs-auto-height" : "true"
	});
	vcGrpItem.setLayout(voFormLyt);
	
	(function(container) {
		// 권한 및 화면 존재여부에 따라 구성
		if (vbHasAuth) {
			var vsItemType = voFindRow.getValue("itemType");
			
			var vcObjItem = getUdcNestedProperty(vsItemType);
			/** @type udc.cmn.dashboard.udcDashItem */
			var vcUdcItem = new vcObjItem;
			if(vcUdcItem instanceof udc.cmn.dashboard.udcDashItem8) {
				vcUdcItem.name = util.DataMap.getValue(app, "dmUserInfo", "userNm");
			}
			container.userAttr(vcUdcItem.getEmbeddedAppInstance().getContainer().userAttr())
			container.addChild(vcUdcItem, {
				width : "100%",
				height : "100%"
			});
		} else {
		}
		
		var vcOptWrap = new cpr.controls.Output("optWrap");
		vcOptWrap.visible = pbWrapVisible;
		vcOptWrap.style.addClass("item-wrap");
		container.addChild(vcOptWrap, {
			rowIndex : 0,
			colIndex : 0
		});
		
		var vcBtnClose = new cpr.controls.Button("btnClose");
		vcBtnClose.tooltip = "닫기";
		vcBtnClose.visible = pbBtnVisible;
		vcBtnClose.style.setClasses(["btn-close"]);
		if (typeof onBtnCloseClick == "function") {
			vcBtnClose.addEventListener("click", onBtnCloseClick);
		}
		if (vsItemType != "udc.cmn.dashboard.udcDashItem8") {
			container.floatControl(vcBtnClose, {
				"top": "12px",
				"right": "12px",
				"width": "20px",
				"height": "20px"
			});
		}
		
		// 상하좌우 모두 있어야됨.
		var vcLeftBar = new cpr.controls.Output("optLeftBar");
		vcLeftBar.userAttr("_direction", "left");
		vcLeftBar.tooltip = "왼쪽 늘리기";
		vcLeftBar.style.setClasses(["portlet-bar", "col"]);		
		if (typeof onBtnResizeMousedown == "function") {
			vcLeftBar.addEventListener("mousedown", onBtnResizeMousedown);
		}
		container.floatControl(vcLeftBar, {
			"top": "0px",
			"left": "0px",
			"width": "12px",
			"height": "calc(100%)"
		});
		
		var vcRightBar = new cpr.controls.Output("optRightBar");
		vcRightBar.userAttr("_direction", "right");
		vcRightBar.tooltip = "오른쪽 늘리기";
		vcRightBar.style.setClasses(["portlet-bar", "col"]);		
		if (typeof onBtnResizeMousedown == "function") {
			vcRightBar.addEventListener("mousedown", onBtnResizeMousedown);
		}
		container.floatControl(vcRightBar, {
			"top": "0px",
			"right": "0px",
			"width": "12px",
			"height": "calc(100%)"
		});
		
		var vcTopBar = new cpr.controls.Output("optTopBar");
		vcTopBar.userAttr("_direction", "top");
		vcTopBar.tooltip = "위로 늘리기";
		vcTopBar.style.setClasses(["portlet-bar", "row"]);			
		if (typeof onBtnResizeMousedown == "function") {
			vcTopBar.addEventListener("mousedown", onBtnResizeMousedown);
		}
		container.floatControl(vcTopBar, {
			"top": "0px",
			"left": "0px",
			"width": "calc(100%)",
			"height": "12px"
		});
		
		var vcBottomBar = new cpr.controls.Output("optBottomBar");
		vcBottomBar.userAttr("_direction", "bottom");
		vcBottomBar.tooltip = "아래로 늘리기";
		vcBottomBar.style.setClasses(["portlet-bar", "row"]);			
		if (typeof onBtnResizeMousedown == "function") {
			vcBottomBar.addEventListener("mousedown", onBtnResizeMousedown);
		}
		container.floatControl(vcBottomBar, {
			"bottom": "0px",
			"left": "0px",
			"width": "calc(100%)",
			"height": "12px"
		});
		
		/******************************
		 * 꼭짓점 크기 변경
		 ******************************/
		var vcBtnResizBR = new cpr.controls.Button("btnResizeBR");
		vcBtnResizBR.tooltip = "크기변경(우측 하단)";
		vcBtnResizBR.visible = pbBtnVisible;
		vcBtnResizBR.userAttr("_direction", "bottom-right");
//		vcBtnResizBR.style.setClasses("btn-se-resize");
		vcBtnResizBR.style.setClasses("btn-resize");
		if (typeof onBtnResizeMousedown == "function") {
			vcBtnResizBR.addEventListener("mousedown", onBtnResizeMousedown);
		}
		container.floatControl(vcBtnResizBR, {
			"right": "12px",
			"bottom": "12px",
			"width": "20px",
			"height": "20px"
		});
		
		var vcBtnResizeBL = new cpr.controls.Button("btnResizeBL");
		vcBtnResizeBL.tooltip = "크기변경(좌측 하단)";
		vcBtnResizeBL.visible = pbBtnVisible;
		vcBtnResizeBL.userAttr("_direction", "bottom-left");
		vcBtnResizeBL.style.setClasses("btn-ne-resize");
		if (typeof onBtnResizeMousedown == "function") {
			vcBtnResizeBL.addEventListener("mousedown", onBtnResizeMousedown);
		}
		container.floatControl(vcBtnResizeBL, {
			"left": "0px",
			"bottom": "0px",
			"width": "20px",
			"height": "20px"
		});
		
		var vcBtnResizeTR = new cpr.controls.Button("btnResizeTR");
		vcBtnResizeTR.tooltip = "크기변경(우측 상단)";
		vcBtnResizeTR.visible = pbBtnVisible;
		vcBtnResizeTR.userAttr("_direction", "top-right");
		vcBtnResizeTR.style.setClasses("btn-ne-resize");
		if (typeof onBtnResizeMousedown == "function") {
			vcBtnResizeTR.addEventListener("mousedown", onBtnResizeMousedown);
		}
		container.floatControl(vcBtnResizeTR, {
			"right": "0px",
			"top": "0px",
			"width": "20px",
			"height": "20px"
		});
		
		var vcBtnResizeTL = new cpr.controls.Button("btnResizeTL");
		vcBtnResizeTL.tooltip = "크기변경(좌측 상단)";
		vcBtnResizeTL.visible = pbBtnVisible;
		vcBtnResizeTL.userAttr("_direction", "top-left");
		vcBtnResizeTL.style.setClasses("btn-se-resize");
		if (typeof onBtnResizeMousedown == "function") {
			vcBtnResizeTL.addEventListener("mousedown", onBtnResizeMousedown);
		}
		container.floatControl(vcBtnResizeTL, {
			"left": "0px",
			"top": "0px",
			"width": "20px",
			"height": "20px"
		});
	})(vcGrpItem);
	
	var voPosition = {
		"colIndex": voMatrixPosition["colIndex"],
		"rowIndex": voMatrixPosition["rowIndex"],
		"colSpan": voMatrixPosition["colSpan"],
		"rowSpan": voMatrixPosition["rowSpan"]
	}
	app.lookup("grpPortlet").addChild(vcGrpItem, voPosition);
	
	// 커스텀 메뉴 목록에 구성
	var voTargetRow = voDsAllItem.findFirstRow("itemId == '" + psItemId + "'");
	var voTargetRowData = voTargetRow.getRowData();
	voTargetRowData["constraint"] = JSON.stringify(voPosition);
	
	voDsCustomItem.addRowData(voTargetRowData);
	
	if (pbAddItem) {
		updateEmptyItemList();
		// 포틀릿 모드 활성화
		portletUtil.createDragManager(app, true);
	}
	
	return true;
}

/**
 * 대시보드 정보를 저장합니다.
 */
function saveCustomItem(pbSave) {
	var vcGrpPortlet = app.lookup("grpPortlet");
	var voDmUserInfo = app.lookup("dmUserInfo");
	var voUserMenuGrpData = {};
	var vaUserMenuGrpData = [];
	
	var vaChildren = vcGrpPortlet.getChildren();
	vaChildren.forEach(function( /*cpr.controls.Container*/ childItem) {
		var voUserMenuGrpData = {
			itemId: childItem.userData("itemId"),
			constraint: vcGrpPortlet.getConstraint(childItem)
		};
		vaUserMenuGrpData.push(voUserMenuGrpData);
	});
	
	voUserMenuGrpData["userId"] = voDmUserInfo.getValue("userId");
	voUserMenuGrpData["data"] = vaUserMenuGrpData;
	if (pbSave) {
		var vsDate = moment().format("YYYYMMDDHHmmss");
		voUserMenuGrpData["date"] = vsDate;
		voDmUserInfo.setValue("userMenuGrpDate", vsDate);
	}
	
	/* 스토리지 저장*/
	var vsStorageKey = AppProperties.PROJECT_NM + msStorageKey + voDmUserInfo.getValue("userId");
	
	localStorage.setItem(vsStorageKey, JSON.stringify(voUserMenuGrpData));

	setCustomMode("READ");
}

/**
 * 대시보드를 기본구성으로 변경합니다.
 */
function resetCustomItem(pbSave) {
	
	var vcGrpPortlet = app.lookup("grpPortlet");
	var voDsAllItem = app.lookup("dsAllItem");
	var voDsCustomItem = app.lookup("dsCustomItem");
	
	// 포틀릿에 존재할 경우, constraint 만 변경처리
	vcGrpPortlet.removeAllChildren();
	voDsCustomItem.clearData();
	
	voDsAllItem.getRowDataRanged().forEach(function(rowData) {
		var vsItemId = rowData["itemId"];
		createCustomItem(vsItemId, JSON.parse(rowData["constraint"]), false);
	});
	
	portletUtil.createDragManager(app, true);
	
	saveCustomItem(pbSave);
}


/**
 * 포틀릿 아이템을 삭제합니다.
 * @param {cpr.controls.Container} pcGrpItem 그룹 아이템
 * @param {Boolean} pbAlert? 메세지 표시여부
 */
function deleteCustomItem(pcGrpItem, pbAlert) {
	var voDsCustomMenu = app.lookup("dsCustomItem");
	var vcGrpPortlet = app.lookup("grpPortlet");
	var vsItemId = pcGrpItem.userData("itemId");
	
	var voTargetRow = voDsCustomMenu.findFirstRow("itemId == '" + vsItemId + "'");
	
	if (pbAlert) {
		// {0}을(를) 삭제하시겠습니까?
		util.Msg.confirmDlg(app, "CRM-M016", voTargetRow.getValue("itemNm"), {
			confirmCallback: function() {
				if (voTargetRow) {
					voDsCustomMenu.realDeleteRow(voTargetRow.getIndex());
				}
				vcGrpPortlet.removeChild(pcGrpItem);
				updateEmptyItemList();
			}
		});
	} else {
		if (voTargetRow) {
			voDsCustomMenu.realDeleteRow(voTargetRow.getIndex());
		}
		vcGrpPortlet.removeChild(pcGrpItem);
		updateEmptyItemList();
	}
}


/**
 * 포틀릿 모드를 변경합니다.
 * @param {"READ" | "UPDATE"} psMode  
 */
function setCustomMode(psMode) {
	var vcGrpPortlet = app.lookup("grpPortlet");
	var vaChildItems = vcGrpPortlet.getChildren();
	var vcGrpItemListWrap = app.lookup("grpItemListWrap");
	if (psMode == "UPDATE") {

		/* 대시보드 아이템 리스트 구성*/
		vcGrpItemListWrap.visible = true;
		updateEmptyItemList();
		
		vcGrpPortlet.getLayout().horizontalSeparatorWidth = 1;
		vcGrpPortlet.getLayout().verticalSeparatorWidth = 1;
		
		// 컨텐츠내 기능 아이템 표시
		vaChildItems.forEach(function( /* cpr.controls.Container*/ grpItem) {
			if (grpItem instanceof cpr.controls.Container) {
				grpItem.getAllRecursiveChildren().forEach(function(ctrl) {
					if (ctrl instanceof cpr.controls.Button) {
						ctrl.visible = true;
					} else if (ctrl instanceof cpr.controls.Output) {
						ctrl.visible = true;
					}
				});
			}
		});
		
		// 포틀릿 모드 활성화
		portletUtil.setUseDragManager(true);
	} else {
		util.Control.setVisible(app, false, ["grpHd","grpDashSetBtns", "grpItemListWrap"]);
		
		vcGrpPortlet.getLayout().horizontalSeparatorWidth = 0;
		vcGrpPortlet.getLayout().verticalSeparatorWidth = 0;
		
		// 컨텐츠내 기능 아이템 숨김
		vaChildItems.forEach(function(grpItem) {
			if (grpItem instanceof cpr.controls.Container) {
				grpItem.getAllRecursiveChildren().forEach(function(ctrl) {
					if (ctrl instanceof cpr.controls.Button) {
						ctrl.visible = false;
					} else if (ctrl instanceof cpr.controls.Output) {
						ctrl.visible = false;
					}
				});
			}
		});
		
		// 포틀릿 모드 비활성화
		portletUtil.setUseDragManager(false);
	}
}

/**
 * 아이템 리사이즈 버튼 mousedown 이벤트
 * @param {cpr.events.CMouseEvent} e
 */
function onBtnCloseClick(e) {
	/** @type cpr.controls.Button */
	var button = e.control;
	
	deleteCustomItem(button.getParent(), true);
}

/**
 * 아이템 리사이즈 버튼 mousedown 이벤트
 * @param {cpr.events.CMouseEvent} e
 */
function onBtnResizeMousedown(e) {
	/** @type cpr.controls.Button | cpr.controls.Output */
	var button = e.control;
	
	portletUtil.setResizePortlet(true, button);
	
	button.addEventListenerOnce("mouseup", function(e) {
		portletUtil.setResizePortlet(false, null);
	});
}

function updateEmptyItemList() {
	var vcGrpDashSetZone = app.lookup("grpDashSetZone");
	var voDsAllItem = app.lookup("dsAllItem");
	var voDsCustomItem = app.lookup("dsCustomItem");
	
	vcGrpDashSetZone.removeAllChildren();
	
	for (var i = 0; i < voDsAllItem.getRowCount(); i++) {
		var vsItemId = voDsAllItem.getValue(i, "itemId");
		var voTargetRow = voDsCustomItem.findFirstRow("itemId == '" + vsItemId + "'");
		
		if (!voTargetRow) {
			var vcBtnItem = new cpr.controls.Button();
			vcBtnItem.value = voDsAllItem.getValue(i, "itemNm");
			vcBtnItem.userData("itemInfo", voDsAllItem.getRowData(i));
			
			vcGrpDashSetZone.addChild(vcBtnItem, {
				"autoSize": "width",
				"width": "20px",
				"height": "28px"
			});
			
			setUpDragSource(vcBtnItem);
		}
	}
}




/***************************************************************
 * 대시보드 아이템 드래그 소스 구성, 드랍 소스는 indvPortletManager 모듈 활용
 ***************************************************************/

/**
 * 포틀릿 그룹 컨트롤에 드래그&드랍 소스를 구성합니다.
 * @param {cpr.controls.Button} pcButton 아이템 버튼
 */
function setUpDragSource(pcButton) {
	/** @type udc.sr.udcSrDragFeedBack */
	var dragFeedback;
	/** @type cpr.geometry.Rectangle */
	var feedbackLocation = null;
	var vcGrpPortlet = app.lookup("grpPortlet");
	
	var dragSource = new cpr.controls.DragSource(pcButton, {
		options: {
			dataType: vcGrpPortlet.userAttr("dataType"), // indvPortletManager 모듈 _createDropTarget 메서드에서 처리
			threadhold: 5
		},
		onDragStart: function(context) {
			var voDragData = pcButton.userData("itemInfo");
			context.cursor = "grabbing";
			
			dragFeedback = createDragSourceFeedback(voDragData);
			
			/* 해상도에 따른 이슈를 개선하기 위해 고정 span으로 구성*/
			var voCellSize = calcCellSize();
			
			var vnRowSpan = voDragData["rowSpan"];
			var vnColSpan = voDragData["colSpan"];
			
			var vnCalcItemWidth = vnColSpan * voCellSize["cellWidth"] - 30;
			var vnCalcItemHeight = vnRowSpan * voCellSize["cellHeight"] - 30;

			context.data = {
				dragFeedback: dragFeedback,
				data: voDragData,
				rowSpan: voDragData["rowSpan"],
				colSpan: voDragData["colSpan"],
				ctrl: pcButton
			};
			
			// 드래그된 feedback을 위치시킬 좌표 구성
			var startLocation = context.dragStartLocation;
			var voHostAppIns = app.getHostAppInstance();
			
			if (!voHostAppIns.isRootAppInstance()) { // 메인화면 내부 업무화면에 렌더링된 경우 
				startLocation["x"] = startLocation.x - voHostAppIns.getActualRect().x;
				startLocation["y"] = startLocation.y - voHostAppIns.getActualRect().y;
			}
			
			feedbackLocation = new cpr.geometry.Rectangle(startLocation.x - (vnCalcItemWidth / 2), startLocation.y - (vnCalcItemHeight / 2), vnCalcItemWidth, vnCalcItemHeight);
			app.getHostAppInstance().floatControl(dragFeedback, cpr.controls.layouts.XYLayout.createConstraintWithRect(feedbackLocation));
		},
		onDragMove: function(context) {
			var newRect = feedbackLocation.getTranslated(context.dragDelta);
			app.getHostAppInstance().floatControl(dragFeedback, cpr.controls.layouts.XYLayout.createConstraintWithRect(newRect));
		},
		onDragEnd: function(context) {
			if (dragFeedback) {
				dragFeedback.dispose();
				dragFeedback = null;
			}
		},
		onDragCancel: function(context) {
			if (dragFeedback) {
				dragFeedback.style.animateTo({
					"left": feedbackLocation.left + "px",
					"top": feedbackLocation.top + "px",
					"opacity": "0"
				}, 0.3);
				dragFeedback.addEventListener("transitionend", function(e) {
					dragFeedback.dispose();
					dragFeedback = null;
				});
			}
		}
	});
}

/**
 * 드래그 피드백 컨트롤을 생성합니다.
 * @param {Object} poData
 * @return {udc.sr.udcSrDragFeedBack} 드래드 피드백 UDC
 */
function createDragSourceFeedback(poData) {
	
	/* 드래그 피드백을 UDC로 구성합니다. */
	var vcObjItem = getUdcNestedProperty(poData["itemType"]);
	var vcUdcItem = new vcObjItem;
	
	var vcDragSourceFeedback = new vcObjItem;
	
	return vcDragSourceFeedback;
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	var voContainer = app.getContainer();
	
	// 포틀릿 초기 정보를 데이터셋->디자인 편집기로 변경
	/* 최초 포틀릿 구성 - 원본 데이터셋에 정보 저장 */
	var vcGrpPortlet = app.lookup("grpPortlet");
	var dsAllItem = app.lookup("dsAllItem");
	vcGrpPortlet.getChildren().forEach(function(/* cpr.controls.UDCBase */ each, idx){
		var voEmb = each.getEmbeddedAppInstance();
		var voConstraint = vcGrpPortlet.getConstraint(each);
		var vsType = each.type;
		dsAllItem.pushRowData({
			"itemId" : vsType.slice(vsType.lastIndexOf(".")+1),
			"itemNm" : voEmb.app.title,
			"itemType" : vsType,
			"minHeight" : voConstraint.height || 0,
			"sortNo" : Number(idx),
			"constraint" : JSON.stringify(voConstraint),
			"rowSpan" : voConstraint.rowSpan || 1,
			"colSpan" : voConstraint.colSpan || 1
		});
	});
	dsAllItem.commit();
	
	/* 사용자 정보 구성*/
	/** @type cpr.data.DataMap */
	var voDmUserInfo = util.Main.getUserInfo(app);
	var vsUserId = voDmUserInfo.getValue("USER_ID");

	util.DataMap.setValue(app, "dmUserInfo", "userId", vsUserId);
	util.DataMap.setValue(app, "dmUserInfo", "userNm", voDmUserInfo.getValue("USER_NM"));

	var vbHasOrigin = drawOriginData();
	if (!vbHasOrigin) {
		resetCustomItem(false);
	}
	
	portletUtil.createDragManager(app, true);
	
	setCustomMode("READ");
	
	voContainer.visible = true; // 테블릿, 모바일 대시보드 레이아웃 구성 완료 후 표시
	voContainer.redraw();
	
	/* 반응형 모듈 재구성*/
	var vcGrpPortlet = app.lookup("grpPortlet");
	if (vcGrpPortlet["_RForm"]) {
		var voRfrom = vcGrpPortlet["_RForm"];
		voRfrom._backup();
	}
	
	applyResponsive(app, app.lookup("grpPortlet").getChildren())
}


/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 전파되는 이벤트.
 */
function onBodyScreenChange(e){
	setCustomMode("READ");
	var vbMobileScreen = (AppProperties.SCREEN_MOBILE_NM.indexOf(app.getRootAppInstance().targetScreen.name) > -1); 
	if (vbMobileScreen) {
		app.getContainer().getLayout().bottomMargin = "8px";
		app.getContainer().getLayout().topMargin = "8px";
	}
}

/*
 * "취소" 버튼(btnCancle)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCancleClick(e) {
	var btnCancle = e.control;
	
	drawOriginData();
	portletUtil.createDragManager(app, true);

	setCustomMode("READ");
}

/*
 * "초기화" 버튼(btnCustomReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCustomResetClick(e) {
	var btnCustomReset = e.control;
	util.Msg.confirmDlg(app, "대시보드를 기본 구성으로 변경하시겠습니까?", null, {
		confirmCallback: function() {
			resetCustomItem(true);
		}
	});
}

/*
 * "전체삭제" 버튼(btnAllDel)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnAllDelClick(e) {
	var btnAllDel = e.control;
	util.Msg.confirmDlg(app, "모든 아이템을 제거하시겠습니까?", null, {
		confirmCallback: function() {
			var vcGrpPortlet = app.lookup("grpPortlet");
			
			vcGrpPortlet.getChildren().forEach(function(ctrl) {
				var vbMainItem = ctrl.getChildren().some(function(child) {return child instanceof (udc.cmn.dashboard.udcDashItem8 && udc.cmn.dashboard.saeol.udcDashItem8)});
				if(!vbMainItem) {
					// 삭제불가 아이템 제외 삭제					
					deleteCustomItem(ctrl);
				}
			});
		}
	});
}

/*
 * "저장" 버튼(btnCustomSave)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCustomSaveClick(e) {
	var btnCustomSave = e.control;
	saveCustomItem(true);
}
