/************************************************
 * udcPocViewProcess.js
 * Created at 2023. 3. 13. 오전 9:55:15.
 *
 * @author tomatosystem 
 ************************************************/

/**************************************************
 * 전역 변수 선언
 **************************************************/
var util = createCommonUtil();

var msKeyCodeClass = "text-red fw-bold";  // KeyCode 텍스트 스타일 Class
var msSubCodeClass = "text-blue fw-bold"; // SubCode 텍스트 스타일 Class

var mbExpandQuickPro = false;
var mcQuickProcess = null;
var maPrevCtrl = [];

/**************************************************
 * 사용자 정의 함수
 **************************************************/

/**
 * 표현식 내용을 구성합니다.
 * @param {cpr.data.DataSet} psDataSet
 */
function replaceDisplayCont(psDataSet) {
	
	var dsProcess = app.lookup("dsProcess");
	psDataSet.copyToDataSet(dsProcess);
	
	psDataSet.getRowDataRanged().forEach(function(rowData, idx) {
		var displayCont = rowData.CONT;
		var keyCode = rowData.KEY_CODE;
		var subCode = rowData.SUB_CODE;		
		
		displayCont = displayCont.replace(/\/n/gi, "\\n"); // 개행문자 적용		
		
		if (!keyCode && !subCode) {
			dsProcess.setValue(idx, "DISPLAY_CONT", "'" + displayCont + "'");
			return;
		}
		
		if (keyCode) {
			keyCode = keyCode.split(",");
			keyCode.forEach(function(keyText) {
				var strIdx = displayCont.indexOf(keyText);				
				if (strIdx == 0) {
					displayCont = displayCont.replace(keyText, "sstr('" + keyText + "', ['" + msKeyCodeClass + "'])+'");
				} else if (strIdx == displayCont.length) {
					displayCont = displayCont.replace(keyText, "'+sstr('" + keyText + "', ['" + msKeyCodeClass + "'])");
				} else {
					displayCont = displayCont.replace(keyText, "'+sstr('" + keyText + "', ['" + msKeyCodeClass + "'])+'");
				}
			});
		}
		
		if (subCode) {
			subCode = subCode.split(",");
			subCode.forEach(function(keyText) {
				var strIdx = displayCont.indexOf(keyText);
				if (strIdx == 0) {
					displayCont = displayCont.replace(keyText, "sstr('" + keyText + "', ['" + msSubCodeClass + "'])+'");
				} else if (strIdx == displayCont.length) {
					displayCont = displayCont.replace(keyText, "'+sstr('" + keyText + "', ['" + msSubCodeClass + "'])");
				} else {
					displayCont = displayCont.replace(keyText, "'+sstr('" + keyText + "', ['" + msSubCodeClass + "'])+'");
				}
				
			});
		}
		
		if (displayCont.indexOf("sstr") == 0 && displayCont.indexOf("])") == displayCont.length) {
			displayCont = displayCont;
		} else if (displayCont.indexOf("sstr") == 0) {
			displayCont = displayCont + "'";
		} else if (displayCont.indexOf("])") == displayCont.length) {
			displayCont = "'" + displayCont;
		} else {
			displayCont = "'" + displayCont + "'";
		}		
		
		dsProcess.setValue(idx, "DISPLAY_CONT", displayCont);
	});
	dsProcess.setRowStateAll(cpr.data.tabledata.RowState.UNCHANGED);	
}

/**
 * 연계 컨트롤에 하이라이트를 적용합니다.
 * @param {Number} pnRowIdx
 */
function setHighLight(pnRowIdx) {
	var grdProcess = app.lookup("_grdProcess");
	
	var dataSet = grdProcess.dataSet;
	var targetCtrlId = dataSet.getValue(pnRowIdx, "TARGET_CTRL");
	
	var hostAppIns = app.getHostAppInstance();
	var targetEmbId = dataSet.getValue(pnRowIdx, "TARGET_EMB"); // 존재할 경우, 해당 emb의 getEmbeddedAppInstance를 타겟팅
	if(!ValueUtil.isNull(targetEmbId)) {
		var vcTargetEmb = hostAppIns.lookup(targetEmbId);
		if(!vcTargetEmb) {
			// emb ID가 아닌 AppID를 받아온 경우
			var loaddedApp = cpr.core.Platform.INSTANCE.lookup(targetEmbId);
			if(loaddedApp) {
				hostAppIns = loaddedApp.getInstances()[0];
			}
		} else {
			hostAppIns = hostAppIns.lookup(targetEmbId).getEmbeddedAppInstance();
		}
		
		if(hostAppIns == null) return;
	}
	
	var vsGridKey = hostAppIns.id + grdProcess.id;
	localStorage.setItem(vsGridKey, pnRowIdx);
	
	maPrevCtrl.forEach(function(ctrl) {
		if (ctrl && ctrl.style.hasClass("highlight")) {
			ctrl.style.removeClass("highlight");
		}
	});
	
	if (!targetCtrlId) return;
	
	var vaTargetCtrlsId = targetCtrlId.split(",");
	
	maPrevCtrl = [];
	
	for (var i = 0; i < vaTargetCtrlsId.length; i++) {
		var targetCtrl = null;
		if(vaTargetCtrlsId[i] == "btnClx"){
			var vcUdcComAppHeader = null;
			//targetCtrl이 CLX바로가기 인 경우
			var vcHostBodyGroup = hostAppIns.getContainer();
			//부모 body Group에서 자식 컨트롤 중 앱 헤더를 반환 받는다.
			vcHostBodyGroup.getAllRecursiveChildren().every(function(each){
				if(each instanceof udc.com.udcComAppHeader){
					//앱 헤더 UDC를 발견 한 경우 순회를 멈춘다.
					vcUdcComAppHeader = each;
					return false;
				}
				return true;
			});
			
			if(vcUdcComAppHeader){
				//앱 헤더 UDC가 존재 하는 경우
				var voAppHeaderApp = vcUdcComAppHeader.getEmbeddedAppInstance();
				targetCtrl = voAppHeaderApp.lookup("btnClx");
			}else{
				//앱 헤더 UDC가 존재 하지 않는 경우 넘어간다.
				continue;
			}
		}else{
			targetCtrl = hostAppIns.lookup(vaTargetCtrlsId[i]);
		}
		if (targetCtrl && !targetCtrl.style.hasClass("highlight")) {
			targetCtrl.style.addClass("highlight");
		}
		
		maPrevCtrl.push(targetCtrl);
	}
}

/**
 * 현재 선택된 로우에 해당하는 컨트롤 하이라이트 처리.
 */
function addHighlight() {
	var grdProcess = app.lookup("_grdProcess");
	var vnRowIdx = grdProcess.getSelectedRowIndex();
	
	if (vnRowIdx != -1) setHighLight(vnRowIdx);
}
exports.addHighlight = addHighlight;

/**
 * 컨트롤 하이라이트 처리를 제거합니다.
 */
function removeHighlight() {
	maPrevCtrl.forEach(function(ctrl) {
		if (ctrl && ctrl.style.hasClass("highlight")) {
			ctrl.style.removeClass("highlight");
			maPrevCtrl.shift();
		}
	});
}
exports.removeHighlight = removeHighlight;

/**
 * 컨트롤 하이라이트 처리를 제거합니다.
 */
function fillContainer(pbFill) {
	
	var vcContainer = app.getContainer();
	if(pbFill){
		if(!vcContainer.style.hasClass("fill-container")){
			vcContainer.style.addClass("fill-container");
		}		
	} else {
		if(vcContainer.style.hasClass("fill-container")){
			vcContainer.style.removeClass("fill-container");
		}	
	}
}
exports.fillContainer = fillContainer;

/**************************************************
 * 이벤트 리스너 함수
 **************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	var title = app.getAppProperty("title");
	var dataSet = app.getAppProperty("dataSet");
	var grdProcess = app.lookup("_grdProcess");
	
	if (!ValueUtil.isNull(title)) {
		app.lookup("optProcessTitle").value = title;
	}
	
	if (!dataSet) return;
	
	// 표시될 데이터 내용을 구성합니다.
	replaceDisplayCont(dataSet);
	
	if(!app.getAppProperty("exandAll")){
		grdProcess.collapseAll(false);	
	}	
	
	if (grdProcess.getRowCount() > 0) {
		var vsGridKey = app.getHostAppInstance().id + grdProcess.id;
		var locStgRowIdx = localStorage.getItem(vsGridKey);
		
		
		if (locStgRowIdx) {
			grdProcess.getGridRowGroup(Number(locStgRowIdx)).parent.expand();
			grdProcess.selectRows(Number(locStgRowIdx));
		} else {
			grdProcess.getGridRowGroup(0).parent.expand();
		}
	}
}

/*
 * 그리드에서 selection-change 이벤트 발생 시 호출.
 * Grid의 RowGroup 클릭시 발생하는 이벤트.
 */
function onGrdProcessSelectionChange(e) {
	/**@type cpr.controls.Grid*/
	var grdProcess = e.control;
	
	if (e.newSelection.length == 0) return;
	
	var rowIdx = e.newSelection[0];
	setHighLight(rowIdx);
}

/*
 * 그리드에서 rowgroup-click 이벤트 발생 시 호출.
 * Grid의 RowGroup 클릭시 발생하는 이벤트.
 */
function onGrdProcessRowgroupClick(e) {
	var grdProcess = e.control;
	
	/**@type cpr.controls.*/
	var rowGroup = e.rowgroup;
	if (rowGroup.groupCondition != "TITLE") return;
	
	if (rowGroup.expanded) {
		rowGroup.collapse();
	} else {
		rowGroup.expand();
	}
}

/*
 * 버튼(btnClose)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCloseClick(e) {
	var voHostApp = app.getHostAppInstance();
	var voRootApp = app.getRootAppInstance();
	
	if(voHostApp.isRootAppInstance() || util.Dialog.isDialogPopup(voHostApp)){
		var vaAppHeader = voHostApp.getContainer().getChildren().filter(function(each){
			return each instanceof udc.com.udcComAppHeader;
		});
		
		if(vaAppHeader.length > 0){
			/** @type udc.com.udcComAppHeader */
			var vcAppHeader = vaAppHeader[0];
			vcAppHeader.viewProcess();
		}
		
	} else {
		if(voRootApp.hasAppMethod("toggleScenario")) {
			voRootApp.callAppMethod("toggleScenario", true);
		}
	}
}