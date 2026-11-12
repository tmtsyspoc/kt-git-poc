/************************************************
 * common.module.js
 * @프로그램설명 : 각 화면에 대한 그리드/폼 변경내역체크, 유효성검증, 메뉴정보, 사용자정보 및 필수적인 공통 함수들을 제공
 *
 * @작성일자 : 
 * @작성자 :
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/**
 * 각 화면에 대한 그리드/폼 변경내역체크, 유효성검증, 메뉴정보, 사용자정보 및 필수적인 공통 함수들을 제공<br>
 * 인스턴스: window 전역 팩토리 `createCommonUtil()` 로 취득 (직접 `new AppKit()` 하지 않는다)
 * @constructor
 ************************************************/
function AppKit() {
	var extension = cpr.core.Module.require("module/standard/extension");
	
	this.ComUdcBtn = new extension.ComUdcBtnKit(this);
	this.Control = new extension.ControlKit(this);
	this.DataMap = new extension.DataMapKit(this);
	this.DataSet = new extension.DataSetKit(this);
	this.Dialog = new extension.DialogKit(this);
	this.EmbApp = new extension.EmbeddedAppKit(this);
	this.FreeForm = new extension.FreeFormKit(this);	
	this.Grid = new extension.GridKit(this);
	this.Group = new extension.GroupKit(this);
	this.Main = new MainKit(this);
	this.MDI = new extension.MDIKit(this);
	this.Msg = new extension.MsgKit(this);
	this.SelectCtl = new extension.SelectKit(this);
	this.Submit = new extension.SubmissionKit(this);
	this.Tab = new extension.TabKit(this);
	this.Tree = new extension.TreeKit(this);
	this.File = new extension.FileKit(this);
	this.Validator = new Validator(this);
};

/**
 * 미리보기일 경우 해당 앱을 열고, 미리보기가 아닌경우에는 앱ID를 복사한다.
 * @param {cpr.core.AppInstance} app 앱인스턴스
 */
AppKit.prototype.procEb6Privew = function(app) {
    var vsAppId = app.app.id;
    if (app.isUDCInstance()) {
        vsAppId = app.getHostAppInstance().app.id;
    }
    
    if (window.eb6Preview) {
        window.eb6Preview.openAppEditor(vsAppId);
        
    } else {
    	
    	var voInput = document.createElement("input");
        voInput.style.position = "fixed";
        voInput.value = vsAppId;
        document.body.appendChild(voInput);
        voInput.focus();
        voInput.select();
        document.execCommand("copy");
        document.body.removeChild(voInput);
        this.Msg.notify(app, "앱ID가 복사되었습니다.");
		//운영환경일 경우 제외 로직 필요
		try {
			var voReq = new XMLHttpRequest();
			// 스튜디오가 실행 중인 호스트
			var vsHostName = "127.0.0.1";
			// 스튜디오 미리보기 서버 포트, 스튜디오가 하나만 실행 중인 경우 52194.
			var vnPort = 52194;
			var vsUrl = "http://" + vsHostName + ":" + vnPort + "/__eb6__/api";
			voReq.open("POST", vsUrl);
			voReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			var voData = {
				topic: "openAppEditor",
				location: "http://xxxx.yyy/" + encodeURIComponent("kt-poc"),
				payload: vsAppId
			};
			voReq.send(JSON.stringify(voData));
		} catch (error) {
		}
    }   
}

/**
 * 전역 NotificationCenter를 통해 'setLoadmask' 이벤트를 구독(subscribe)합니다.
 */
cpr.core.NotificationCenter.INSTANCE.subscribe("setLoadmask", this, function (poLoadmask, /* cpr.core.AppInstance */ poApp) { 
	// activeLoadMask 를 NotificationCenter 를 통해 글로벌하게 관리한다.
	if(cpr.core.NotificationCenter.INSTANCE.loadmaskMap == undefined || cpr.core.NotificationCenter.INSTANCE.loadmaskMap == null) {
		cpr.core.NotificationCenter.INSTANCE.loadmaskMap = {};
	}

	/**
	 * 로드마스크가 활성화 되어 있는 상태에서 앱이 unload 되는 경우
	 * NotificationCenter에 등록되어 있는 로드마스크 제거
	 */
	function _fnUnload (e) {
		var vsAppId = e.control.id;
		var voActiveLoadmask = cpr.core.NotificationCenter.INSTANCE.loadmaskMap[vsAppId];
		if(voActiveLoadmask) {
			delete cpr.core.NotificationCenter.INSTANCE.loadmaskMap[vsAppId];
		}
	}
	
	if(poLoadmask != null) {
		/* showLoadMask */ 
		cpr.core.NotificationCenter.INSTANCE.loadmaskMap[poApp.id] = poLoadmask;
		poApp.addEventListener("unload", _fnUnload);
	} else {
		/* hideLoadmask */
		delete cpr.core.NotificationCenter.INSTANCE.loadmaskMap[poApp.id];
		poApp.removeEventListener("unload", _fnUnload);
	}
});

/**
 * 현재 앱 인스턴스 반환.
 * UDC 일 경우 재귀적으로 호스트 앱 인스턴스를 확인한다.
 * @param {cpr.core.AppInstance} poApp
 */
function _getHostAppInstance(poApp) {
	if (poApp.isUDCInstance()) {
		return _getHostAppInstance(poApp.getHostAppInstance());
	} else {
		return poApp;
	}
}

/**
 * 현재 AppInstance에 활성화 되어 있는 Loadmask 객체 리턴
 * @param {cpr.core.AppInstance} poApp 앱인스턴스
 */
AppKit.prototype.getLoadMask = function (poApp) {
	if(cpr.core.NotificationCenter.INSTANCE.loadmaskMap) {
		poApp = _getHostAppInstance(poApp);
	
		return cpr.core.NotificationCenter.INSTANCE.loadmaskMap[poApp.id];
	}
}

/**
 * 화면에 LoadMask 출력
 * 비동기 서브미션 호출시 화면에 로딩 이미지 출력
 * @param {cpr.core.AppInstance} app 앱인스턴스
 * @param {String} psMaskType? 로드 마스크 타입
 */
AppKit.prototype.showLoadMask = function(app, psMaskType) {
	
	app = _getHostAppInstance(app);
	
	var voActiveLoadmask = this.getLoadMask(app);
	if (voActiveLoadmask) return;

	var voShowConstraint = {
		"top" : "0",
		"bottom" : "0",
		"left" : "0",
		"right" : "0"
	};
	voShowConstraint = this.wrapConstraints(app, voShowConstraint);
	
	var voContainer = app.getContainer();
	var voLayout = voContainer.getLayout();
	
	var voLoadMask = voContainer.getAppInstance().lookup("__loadmask__");
	
	if (psMaskType == "pro") {
		voLoadMask = voContainer.getAppInstance().lookup("__loadmask_pro__");
		if (voLoadMask) {
			voContainer.replaceConstraint(voLoadMask, voShowConstraint);
		} else {
			voLoadMask = new udc.com.udcComLoadmaskpgs("__loadmask_pro__");
			if (voLayout instanceof cpr.controls.layouts.FormLayout ||
				voLayout instanceof cpr.controls.layouts.VerticalLayout) {
				app.floatControl(voLoadMask, voShowConstraint);
			}else{
				voContainer.addChild(voLoadMask, voShowConstraint);
			}
			voContainer.getAppInstance().register(voLoadMask);
		}
		voLoadMask.module.start();
	} else {
		voLoadMask = voContainer.getAppInstance().lookup("__loadmask__");
		
		try {
			if (voLoadMask) {
				if (voLayout instanceof cpr.controls.layouts.FormLayout ||
					voLayout instanceof cpr.controls.layouts.VerticalLayout) {
					app.floatControl(voLoadMask, voShowConstraint);
				} else {
					voContainer.replaceConstraint(voLoadMask, voShowConstraint);
				}
			} else {
				voLoadMask = new udc.com.udcComLoadmask("__loadmask__");
				
				if (voLayout instanceof cpr.controls.layouts.FormLayout ||
					voLayout instanceof cpr.controls.layouts.VerticalLayout) {
					app.floatControl(voLoadMask, voShowConstraint);
				} else {
					voContainer.addChild(voLoadMask, voShowConstraint);
				}
				voContainer.getAppInstance().register(voLoadMask);
			}
			
			// 성공적으로 로드마스크가 띄워졌을 경우 setLoadmask 호출
			cpr.core.NotificationCenter.INSTANCE.post("setLoadmask", voLoadMask, app);
			
		} catch (ex) { voShowConstraint = null;}
	}
};

/**
 * LoadMask를 감춤
 * @param {cpr.core.AppInstance} app 앱인스턴스
 */
AppKit.prototype.hideLoadMask = function(app) {
	//앱 객체가 사라진 경우... ROOT앱을 기본으로 하여 처리
	if (app == null || app.getRootAppInstance() == null) {
		app = this.getMainApp(app);
	}else{
		app = _getHostAppInstance(app);
	}
	
	var voLoadMask = this.getLoadMask(app);
	if (voLoadMask) {
		if (voLoadMask.module && voLoadMask.module.end) {
			voLoadMask.module.end();
		}
		var voHideConstraint = {
				"position" : "absolute",
				"top" : "-1px",
				"left" : "-1px",
				"width" : "1px",
				"height" : "1px"
		};

		var voContainer = app.getContainer();
		try{
			var voLayout = voContainer.getLayout();
			if (voLayout instanceof cpr.controls.layouts.FormLayout ||
				voLayout instanceof cpr.controls.layouts.VerticalLayout) {
				app.removeFloatingControl(voLoadMask);
			} else {
				voHideConstraint = this.wrapConstraints(app, voHideConstraint);
				voContainer.replaceConstraint(voLoadMask, voHideConstraint);
			}
			if (voLoadMask) {
				voLoadMask.module.count(0);
				voLoadMask.module.hide();
			}
			cpr.core.NotificationCenter.INSTANCE.post("setLoadmask", null, app);
			
		} catch (ex) { voHideConstraint = null; }
	}
};


/**
 * App 화면의 Layout에 맞게 컨트롤 배치 조건 래핑
 * @param {cpr.core.AppInstance} app 앱인스턴스
 * @param {cpr.controls.layouts.Constraint} poConstraint 래핑할 배치조건
 * @param {cpr.core.AppInstance} poApp 앱인스턴스
 * @return 래핑된 배치조건
 */
AppKit.prototype.wrapConstraints = function(app, poConstraint, poApp) {
	var vbIsPopup = false;
	if (app.getHost() && app.getHost().modal === true) {
		vbIsPopup = true;
	}
	
	var voLayout;
	var voContainer = null;
	if (poApp == null) {
		voContainer = vbIsPopup ? app.getContainer() : app.getRootAppInstance().getContainer();
		poApp = vbIsPopup ? app : app.getRootAppInstance();
	}else{
		voContainer = poApp.getContainer();
	}
	voLayout = voContainer.getLayout();
	
	if (voLayout instanceof cpr.controls.layouts.ResponsiveXYLayout) {
		var vaPositionConstraints = [];
		var vaAllMedia = poApp.allSupportedMedias;
		vaAllMedia.forEach(function(psMedia) {
			var voNewConst = _.clone(poConstraint);
			voNewConst["media"] = psMedia;
			vaPositionConstraints[vaPositionConstraints.length] = voNewConst;
		});
		return {
			"positions" : vaPositionConstraints
		};
	}
	
	return poConstraint;
};

/**
 * 메인(루트) 앱에 대한 인스턴스를 반환한다.
 * @param {cpr.core.AppInstance} app 앱인스턴스
 * @return {cpr.core.AppInstance}
 */
AppKit.prototype.getMainApp = function(app) {
	if (app.isRootAppInstance()) {
		return app;
	}else{
		if (app.getHostAppInstance().isRootAppInstance()) return app.getHostAppInstance();
		else return this.getMainApp(app.getHostAppInstance());
	}
};

/**
 * 
 * @param {cpr.core.AppInstance} app
 */
AppKit.prototype.getMenuApp = function(app){
	var bools = true;
	var target = null;
	while(bools) {
		if(app["_menuApp"] === true || app.isRootAppInstance()){
			target = app;
			bools = false;
		} else {
			app = app.getHostAppInstance();
		}
	}
	return target;
}

/**
 * 해당 오브젝트가 함수 타입인지 여부를 반환한다.
 * @param {any} poCallBackFunc 확인할 대상 값.
 * @return {Boolean} 인자가 함수일 경우 true, 그렇지 않으면 false.
 */
AppKit.prototype.isFunc = function(poCallBackFunc) {
	if (typeof (poCallBackFunc) == "function") return true;
	return false;
};

/**
 * 메인 화면에 데이터 변경사항이 있는지 여부를 체크한다.<br>
 * 그리드, 폼레이아웃(프리폼) 대상(UDC, EMB 포함)<br>
 * 그리드 ignoreModify 사용자속성 "Y" 지정시 continue
 * @param {cpr.core.AppInstance} app 앱인스턴스
 * @param {String} psAftMsg? 메시지구분
 * @param {cpr.controls.Container} poContainer? 컨테이너
 * @param {"confirmCallback" : Function <!-- "CRM" confirm창 사용시 확인에 대한 콜백 -->
 *         ,"cancelCallback" : Function <!-- "CRM" confirm창 사용시 취소(닫기)에 대한 콜백 -->
 *         ,"bWindowConfirm" : boolean  <!--  windowConfirm호출 여부 -->} poOption? "CRM" confirm 창에 대한 콜백 함수
 * @return {Boolean} 데이터 변경여부
 */
AppKit.prototype.isAppModified = function(app, psAftMsg, poContainer, poOption) {
	var voContainer;

	if (poContainer != null) {
		voContainer = poContainer;
	}else{
		var voMainApp = this.getMainApp(app);
		if (voMainApp == null) return false;
		voContainer = voMainApp.getContainer();
	}
	
	var vaDataCtrls = new Array();
	
	var _this = this;
	function getChildRecursive(poContainer) {
	    var vaChildCtrls = poContainer.getAllRecursiveChildren();
	    for (var i = 0, len = vaChildCtrls.length; i < len; i++) {
	        if (vaChildCtrls[i].type == "grid") {
	        	vaDataCtrls.push(vaChildCtrls[i]);
			// 컨테이너에 바인드 컨텍스트가 설정되어 있을 경우
			}else if (vaChildCtrls[i] instanceof cpr.controls.Container && !ValueUtil.isNull(vaChildCtrls[i].getBindContext())) {
	        	vaDataCtrls.push(vaChildCtrls[i]);
	        }else if (vaChildCtrls[i] instanceof cpr.controls.UDCBase) {
	        	var voUdcApp = vaChildCtrls[i].getEmbeddedAppInstance();
	        	if (voUdcApp) getChildRecursive(voUdcApp.getContainer());
	        }else if (vaChildCtrls[i] instanceof cpr.controls.EmbeddedApp) {
	        	var voEmbApp = vaChildCtrls[i].getEmbeddedAppInstance();
	        	if (voEmbApp) getChildRecursive(voEmbApp.getContainer());
	        }
	    }
	}	
	getChildRecursive(voContainer);
	
	var vbModify = false;
	var vcCtrl = null;
	var vsFieldLabel = "";
	for (var i = 0, len = vaDataCtrls.length; i < len; i++) {
		vcCtrl = vaDataCtrls[i];
		if (vcCtrl.type == "grid") {
			//그리드 수정 내역 체크 무시 attr
			if (vcCtrl.userAttr("ignoreModify") === "Y" || vcCtrl.dataSet == null) continue;
			if (vcCtrl.dataSet.isModified()) {
				vbModify = true;
				vsFieldLabel = vcCtrl.fieldLabel;
				break;
			}
		}else{
			var vcDataset = this.Group.getBindDataSet(vcCtrl.getAppInstance(), vcCtrl);
			if (vcCtrl.userAttr("bindDataFormId") == '' && vcCtrl.userAttr("ignoreModify") === "Y") continue;
			if (vcDataset != null && vcDataset.isModified()) {
				vbModify = true;
				vsFieldLabel = vcCtrl.fieldLabel;
				break;
			}
		}
	}
	//변경사항이 반영되지 않았습니다. 계속 하시겠습니까? confirm
	if (vbModify && psAftMsg != null && psAftMsg.toUpperCase() == "CRM") {
        if (ValueUtil.fixNull(poOption) != "" && poOption["bWindowConfirm"]) {
            if (!this.Msg.confirm("CRM-M003", [vsFieldLabel])) return true;
            else return false;
        } else {
            this.Msg.confirmDlg(app, "CRM-M003", [vsFieldLabel], poOption);
            return true;
        }
	}
	return vbModify;
};

/**
 * 메인 화면에 데이터 변경사항이 있는지 여부를 체크한다.
 * @param {cpr.core.AppInstance} app 앱인스턴스
 * @param {cpr.controls.Container} poContainer? 컨테이너
 * @return {Object Array} 변경된 데이터셋 객체 배열
 */
AppKit.prototype.getAllAppModifiedDataSet = function(app, poContainer) {
	var voContainer;
	
	if (poContainer != null) {
		voContainer = poContainer;
	}else{
		var voMainApp = this.getMainApp(app);
		if (voMainApp == null) return false;
		voContainer = voMainApp.getContainer();
	}
	
	var vaDataCtrls = new Array();
	var vaDataSets = new Array();

	function getChildRecursive(poContainer) {
	    var vaChildCtrls = poContainer.getAllRecursiveChildren();
	    for (var i = 0, len = vaChildCtrls.length; i < len; i++) {
	        if (vaChildCtrls[i].type == "grid") {
	        	vaDataCtrls.push(vaChildCtrls[i]);
			}else if (vaChildCtrls[i] instanceof cpr.controls.Container && !ValueUtil.isNull(vaChildCtrls[i].getBindContext())) {
	        	vaDataCtrls.push(vaChildCtrls[i]);
	        }else if (vaChildCtrls[i] instanceof cpr.controls.UDCBase) {
	        	var voUdcApp = vaChildCtrls[i].getEmbeddedAppInstance();
	        	if (voUdcApp) getChildRecursive(voUdcApp.getContainer());
	        }else if (vaChildCtrls[i] instanceof cpr.controls.EmbeddedApp) {
	        	var voEmbApp = vaChildCtrls[i].getEmbeddedAppInstance();
	        	if (voEmbApp) getChildRecursive(voEmbApp.getContainer());
	        }
	    }
	}
	getChildRecursive(voContainer);
	
	var vcCtrl = null;
	for (var i = 0, len = vaDataCtrls.length; i < len; i++) {
		vcCtrl = vaDataCtrls[i];
		if (vcCtrl.type == "grid") {
			vaDataSets.push(vcCtrl.dataSet);
		}else{
			var vcDataset = this.Group.getBindDataSet(vcCtrl.getAppInstance(), vcCtrl);
			if (vcDataset == null) continue;
			vaDataSets.push(vcDataset);
		}
	}
	
	return vaDataSets;
};

/**
 * 화면에 막(Cover)를 씌운다.
 * @param {cpr.core.AppInstance} app 앱인스턴스
 */
AppKit.prototype.coverPage = function(app) {
	var voCoverCtl = new cpr.controls.Container("comPageCover");
	voCoverCtl.style.css({"background-color":"#ededed", "opacity":"0.5"});
	voCoverCtl.setLayout(new cpr.controls.layouts.XYLayout());
	
	/* TODO: (커스텀 옵션) cover를 최상위 레이아웃(메인)에 구성할 경우*/
	// var voMainApp = this.getMainApp(app);
	// var voContainer = voMainApp.getContainer();
	var voContainer = app.getContainer();
	var voLayout = voContainer.getLayout();
	if (voLayout instanceof cpr.controls.layouts.FormLayout || voLayout instanceof cpr.controls.layouts.VerticalLayout) {
		app.floatControl(voCoverCtl, {
			"top": "0px",
			"right": "0px",
			"bottom": "0px",
			"left": "0px"
		});
	}else{
		voContainer.addChild(voCoverCtl, {
			"top": "0px",
			"right": "0px",
			"bottom": "0px",
			"left": "0px"
		});
	}
};

/**
 * 화면에 막(Cover)를 제거한다.
 * @param {cpr.core.AppInstance} app 앱인스턴스
 */
AppKit.prototype.removeCover = function(app) {
	/* TODO: (커스텀 옵션) cover를 최상위 레이아웃(메인)에 구성할 경우*/
	//	var voMainApp = this.getMainApp(app);
	//	var voContainer = voMainApp.getContainer();
	
	var voContainer = app.getContainer();
	var vaFloatCtrls = app.getFloatingControls();
	vaFloatCtrls.filter(function(pcCtrl) {
		return pcCtrl instanceof cpr.controls.Container && pcCtrl.id == "comPageCover";
	}).forEach(function(pcCtrl) {
		var voLayout = voContainer.getLayout();
		if (voLayout instanceof cpr.controls.layouts.FormLayout || voLayout instanceof cpr.controls.layouts.VerticalLayout) {
			app.removeFloatingControl(pcCtrl);
		}else{
			voContainer.removeChild(pcCtrl);
		}
	});
};

/**
 * 컨트롤(그룹) 또는 Grid의 내의 입력 값에 대한 유효성 체크를 수행한다.
 * @param {cpr.core.AppInstance} app 앱인스턴스
 * @param {#uicontrol | Array} paCtlId 컨트롤 ID
 * @param {"all" | "modify"} psDataScope? (all:그리드의 전체 데이터, modify:변경된 전체 Row)
 * @param {Boolean} pbIsMsgAlert validation 메시지 출력 여부
 * @return {Boolean} Valid true, Invalid false. <br>
 *  	참고 : 1. 그리드에 연결된 데이터셋의 info는 PK컬럼으로 인식<br>
 *              그리드 초기화시 (Grid.init) info에 설정된 PK컬럼은 필수값으로 지정되고 해당 컬럼에 ignorePk="Y" 사용자속성 부여시 필수여부 체크를 무시한다.<br>
 *           2. 그리드 + 폼레이아웃(입력폼) 구성이고 그리드 사용자 속성에 bindDataFormId(폼레이아웃ID) 지정시 유효성체크 부적합 셀은  bindDataFormId에 지정된 폼레이아웃의 컨트롤에 포커싱이 간다. 
 *           
 */
AppKit.prototype.validate = function(app, paCtlId, psDataScope, pbIsMsgAlert) {
	psDataScope = psDataScope != null ? psDataScope : "modify";
	if (!(paCtlId instanceof Array)) {
		paCtlId = [paCtlId];
	}
	
	var vbValid = true;
	for (var i = 0, len = paCtlId.length; i < len; i++) {
		var vcCtrl = app.lookup(paCtlId[i]);
		if (vcCtrl instanceof cpr.controls.Grid) { // 그리드 컨트롤
			vbValid = this._validateGrid(vcCtrl, psDataScope, pbIsMsgAlert);
			
		}else if (vcCtrl instanceof cpr.controls.Container) { // Group, tab 등 (컨트롤들의 집합을 만들 수 있는 컨트롤)
			var vbIsHideOnGrid = vcCtrl.userAttr("_hideOnGrid_") == "true" && vcCtrl.userAttr("_originVisible_") == "true";
			if (!vbIsHideOnGrid) {
				// 그룹이 visible=false 인 경우 (내부 컨트롤은 visible=true 인 상태 ) 유효성 검사 SKIP
				if (vcCtrl.visible == false && vcCtrl.userAttr("mustValidate") != "Y") continue;
			}
			/** @type cpr.bind.BindContext */
			var voBindContext = this.Group.getBindContext(app, vcCtrl);
			if (voBindContext && (voBindContext instanceof cpr.bind.DataRowContext)) {
				/**@type cpr.data.DataSet */
				var vcDataset = this.Group.getBindDataSet(app, vcCtrl, voBindContext);
				var vnRowIndex = this.Group.getBindCtlRowIndex(app, voBindContext);
				// 프리폼에 바인딩된 데이터 셋 로우의 상태가 삭제 상태이면 유효성 체크 예외처리
				if (vcDataset.getRowState(vnRowIndex) == cpr.data.tabledata.RowState.DELETED) continue;

				var vcBindCtl = this.Group.getBindControl(app, vcCtrl, voBindContext);
				if (vcBindCtl instanceof cpr.controls.Grid) { // 그리드 선택행 컨텍스트
					vbValid = this._validateFreeForm(vcCtrl, pbIsMsgAlert);
				}else{
					vbValid = this._validateControl(vcCtrl, null, pbIsMsgAlert, psDataScope, vcCtrl);
				}
			}else{
				vbValid = this._validateControl(vcCtrl, null, pbIsMsgAlert, psDataScope, vcCtrl);
			}
		}else{ // 기본 컨트롤
			vbValid = this._validateControl(vcCtrl, null, pbIsMsgAlert, psDataScope, vcCtrl);
		}
		
		if (vbValid == false) {
			return false;
		}
	}
	
	return true;
};

/**
 * 일반 컨트롤에 대한 Validation 체크
 * @param {cpr.controls.UIControl} pcCtrl 컨트롤
 * @param {cpr.controls.UIControl} poParentCtl 부모컨트롤
 * @param {Boolean} pbIsMsgAlert validation 메시지 출력 여부
 * @param {"all" | "modify"} psDataScope 그리드 내 컨트롤 유효성 검사 시, 그리드 유효성 검증으로 전환
 * @param {cpr.controls.UIControl} pcMainCtrl
 * @private
 */
AppKit.prototype._validateControl = function(pcCtrl, poParentCtl, pbIsMsgAlert, psDataScope, pcMainCtrl) {
	if (!pcCtrl || pcCtrl.enabled == false || this._isMustValidate(pcCtrl, pcMainCtrl) ) return true; 
	
	var vbValid = true;
	var _this = this;
	if (pcCtrl instanceof cpr.controls.Container) { // Group, tab 등 (컨트롤들의 집합을 만들 수 있는 컨트롤)
		var vaChildren = _this._getChildren(pcCtrl);
		var vcChild;
		for (var i = 0, len = vaChildren.length; i < len; i++) {
			vcChild = vaChildren[i];
			
			if (vcChild.enabled == false || (vcChild.visible == false && vcChild.userAttr("mustValidate") != "Y")) continue;
			
			// 그룹 내에 배치된 그리드 셀 컨트롤에 대한 유효성 검사 시, 그리드 검사로 전환 
			if (vcChild.getParent() instanceof cpr.controls.Grid) {
				if (this._validateGrid(vcChild.getParent(), psDataScope, pbIsMsgAlert) == false) {
					vbValid = false;
					break;
				}
			} else {
				// 컨트롤별 Validation Check
				if (this._validateControl(vcChild, pcCtrl, pbIsMsgAlert, psDataScope) == false) {
					vbValid = false;
					break;
				}
			}
		}
		return vbValid;
	} else if (pcCtrl instanceof cpr.controls.UDCBase) { // UDC 인 경우
		var voEmbApp = pcCtrl.getEmbeddedAppInstance();
		var vaChildren = voEmbApp.getContainer().getAllRecursiveChildren();
		var vcChild;
		for (var i = 0, len = vaChildren.length; i < len; i++) {
			vcChild = vaChildren[i];
			
			if (vcChild.enabled == false || this._isMustValidate(vcChild, pcMainCtrl) ) continue;
			
			// 컨트롤별 Validation Check
			if (_this._validateControl(vcChild, pcCtrl, pbIsMsgAlert, psDataScope, pcMainCtrl) == false) {
				vbValid = false;
				break;
			}
		}
		return vbValid;
	} else {
		if (pcCtrl.enabled == false || this._isMustValidate(pcCtrl, pcMainCtrl) ) return false;
		
		vbValid = _this.Validator.validate(pcCtrl, pcCtrl.value, poParentCtl, null, null, null, pbIsMsgAlert);
		if (vbValid == false) {
			/* TODO: (커스텀 옵션) 탭내에 컨트롤이 존재하는 경우 해당 탭페이지 포커싱*/
			 _this._focusToTabItem(pcCtrl);
		}
		return vbValid;
	}
};

/**
 * 현재 컨트롤이 visible=false 인 경우에는 true를 리턴한다. (유효성 검사 미진행)<br/><br/>
 * 
 * 단, 다음의 경우에는 false를 리턴한다.(유효성 검사 진행)<br/>
 * - 해당 컨트롤이 mustValidate=Y 가 적용되어 있는 경우 <br/>
 * - 현재 컨트롤을 포함하는 모든 그룹에서, 처음 validate 가 수행되는 상위 그룹까지를 대상으로 확인했을 때, 
 * mustValidate=Y가 적용되어 있는 컨트롤이 존재하는 경우
 * 
 * @param {cpr.controls.UIControl} pcControl 유효성 검사 진행 여부를 확인하기 위한 현재 컨트롤(컨테이너)
 * @param {cpr.controls.Container} pcMainContainer 현재 컨트롤을 포함하는 상위 컨테이너
 * @return {boolean}  true - 유효성 검사에서 제외, false - 유효성 검사에 포함
 */
AppKit.prototype._isMustValidate = function(pcControl, pcMainContainer) {
	if (pcControl == pcMainContainer || (pcMainContainer instanceof cpr.controls.Container)) return false;
	
	/** @type cpr.controls.Container */
	var vcContainer = pcControl;
	
	var vbIsVisible = true; // visible 처리 확인
	var vbIsMustValidate = false; // mustValidate가 있는지 확인
	
	// 현재 container 가 main container 일 경우 더이상 mustValidate 체크를 하지 않기 위해 변수 선언
	var vbCheckMustValidate = true;
	
	// while 문 중 container 가 없는 경우 정지한다. vcContainer는 while문 최하단에서 vcContainer.getParent() 로 세팅중
	while (vcContainer) {
		
		if (vbIsVisible) {
			// vcContainer.visible=false 인 경우 while문 중단하도록 isVisible 설정
			if (!vcContainer.visible) {
				vbIsVisible = vcContainer.visible;
			}
		}
		
		// mustValidate 체크
		if (vbCheckMustValidate) {
			if (vcContainer.userAttr("mustValidate") == "Y") {
				vbIsMustValidate = true;
				vbCheckMustValidate = false;
			}
			
			// 현재 container 가 main container 일 경우 더이상 mustValidate 체크를 하지 않는다.
			if (vcContainer == pcMainContainer) {
				vbCheckMustValidate = false;
			}
		}
		
		// 상위 그룹을 체크하기 위해 vcParent 를 parent 로 변경한다.
		vcContainer = vcContainer.getParent();
		
		// mustValidate 이 false 이며 와 visible이 true 인 경우 정지한다. 을 모두 찾은 경우 정지한다.
		if (vbIsMustValidate && !vbIsVisible) {
			vcContainer = null;
		}
	}
	
	if (vbIsMustValidate) return false;
	if (!vbIsVisible) return true;
	return false;
};


/**
 * 그리드와 Selection바인딩된 프리폼의 변경된 전체 데이터에 대한 Validation 체크
 * @param {cpr.controls.Container} poForm 체크할 프리폼 컨트롤객체
 * @param {Boolean} pbIsMsgAlert validation 메시지 출력 여부
 * @return {Boolean}
 * @private
 */
AppKit.prototype._validateFreeForm = function(poForm, pbIsMsgAlert) {
	/** @type cpr.controls.Container */
	var voForm = poForm;
	if (!voForm) return false;
	
	var _app = voForm.getAppInstance();
	
	var voBindContext = this.Group.getBindContext(_app, voForm);
	var voBindCtl = this.Group.getBindControl(_app, voForm, voBindContext);
	var vcDataSet = this.Group.getBindDataSet(_app, voForm, voBindContext);
	
	var _this = this;
	
	var vaAllChildControls = new Array();
	var getChildRecursive = function(poContainer) {
	    var vaChildCtrls = poContainer.getAllRecursiveChildren();
	    for (var i = 0, len = vaChildCtrls.length; i < len; i++) {
	        if (vaChildCtrls[i] instanceof cpr.controls.Container) {
	        	getChildRecursive(vaChildCtrls[i]);
	        }else if (vaChildCtrls[i] instanceof cpr.controls.UDCBase) {
	        	var voUdcApp = vaChildCtrls[i].getEmbeddedAppInstance();
	        	if (voUdcApp) getChildRecursive(voUdcApp.getContainer());
	        }else if (vaChildCtrls[i] instanceof cpr.controls.EmbeddedApp) {
	        	var voEmbApp = vaChildCtrls[i].getEmbeddedAppInstance();
	        	if (voEmbApp) getChildRecursive(voEmbApp.getContainer());
	        }else {
	        	vaAllChildControls.push(vaChildCtrls[i]);
	        }
	    }
	}
	getChildRecursive(voForm);
	var vbIsHideOnGrid = voForm.userAttr("_hideOnGrid_") == "true" && voForm.userAttr("_originVisible_") == "true";
	
	var vaAllTargetControls = vaAllChildControls.filter(function(poCtrl) {
		//컬럼 유형이 output이면... SKIP
		if (poCtrl == null || poCtrl.type == "output" || poCtrl.type == "button" || poCtrl.type == "img") return false;
		if (vbIsHideOnGrid) {
			if (poCtrl.visible == false && poCtrl.userAttr("mustValidate") != "Y") return false;
		} else {
			if (poCtrl.isShowing() == false && poCtrl.userAttr("mustValidate") != "Y") return false;
		}
		//컨트롤에 Bind된 컬럼이 없으면...SKIP
		var voBind = poCtrl.getBindInfo("value");
		
		if (voBind != null && voBind.type == "appproperty") return true;		
		if (voBind == null || voBind.type != "datacolumn" || voBind.columnName == null) return false;
		
		return true;
	});
	
	var vaRowIndexs = vcDataSet.getRowStatedIndices(cpr.data.tabledata.RowState.INSERTED | cpr.data.tabledata.RowState.UPDATED);
	var _this = this;
	var vbIsValid = vaRowIndexs.some(function(idx) {
		var voRow = vcDataSet.getRow(idx);
		/**@type cpr.controls.UIControl */
		var vcCtrl = null;
		
		for (var i = 0, len = vaAllTargetControls.length; i < len; i++) {
			vcCtrl = vaAllTargetControls[i];
			//컨트롤에 Bind된 컬럼이 없으면...SKIP
			var voBind = vcCtrl.getBindInfo("value");
			var vsCtrlValue;
			
			if (voBind.type == "appproperty") {
				vsCtrlValue = voRow.getValue(vcCtrl.getAppInstance().getAppPropertyBindInfo("value").columnName);
			} else {
				vsCtrlValue = voRow.getValue(voBind.columnName);
			}
			//신규행  PK 체크 무시... SKIP
			if (voRow.getState() == cpr.data.tabledata.RowState.INSERTED && (vcCtrl.userAttr("ignorePk") == "Y")) continue;
			
			// 컨트롤별 Validation Check
			if (_this.Validator.validate(vcCtrl, vsCtrlValue, voForm, null, null, null, pbIsMsgAlert) == false) {
				_this._focusToTabItem(voForm);
				//유효성 체크로 인해 selection-change 발생여부 셋팅 
				if (voBindCtl instanceof cpr.controls.Grid) {
					voBindCtl.userAttr("selectionChangeByValidation", "true");
					//탭내에 컨트롤이 존재하는 경우... 해당 탭페이지 포커싱
					voBindCtl.selectRows(idx);
				}
				_app.focus(vcCtrl);
				
				return true;
			}
		}
		return false;
	});
	if (vbIsValid == true) {
		return false;
	}
	
	return true;
};

/**
 * <b>사이트별 Customizing 필요</b> <br><br>
 * Grid의 변경된 전체 데이터에 대한 Validation 체크<br>
 * 가능한 한 Validation 체크시 validate 메소드를 사용
 * @param {cpr.controls.Grid} pcGrid 체크할 Grid
 * @param {"all" | "modify" | "current"} psDataScope all:그리드의 전체 데이터, modify:변경된 전체 Row, current:현재  Row
 * @param {Boolean} pbIsMsgAlert validation 메시지 출력 여부
 * @return {Boolean}
 * @private
 */
AppKit.prototype._validateGrid = function(pcGrid, psDataScope, pbIsMsgAlert) {
	/** @type cpr.controls.Grid */
	var vcGrid = pcGrid;
	if (!vcGrid) return false;
	
	psDataScope = psDataScope != null ? psDataScope : "modify";
	
	/** @type cpr.data.DataSet*/
	var vcDataSet = vcGrid.dataSet;
	var vaRowIndexs = null;
	if (psDataScope == "all") {
		vaRowIndexs = vcDataSet.getRowStatedIndices(cpr.data.tabledata.RowState.INSERTED | cpr.data.tabledata.RowState.UPDATED | cpr.data.tabledata.RowState.DELETED | cpr.data.tabledata.RowState.UNCHANGED);
	}else{
		vaRowIndexs = vcDataSet.getRowStatedIndices(cpr.data.tabledata.RowState.INSERTED | cpr.data.tabledata.RowState.UPDATED);
	}
	
    return this._validateGridFromRowIdex(vcGrid, vaRowIndexs, pbIsMsgAlert);
};

/**
 * <b>사이트별 Customizing 필요</b> <br><br>
 * Grid의 변경된 전체 데이터에 대한 Validation 체크
 * @param {cpr.controls.Grid} pcGrid 체크할 Grid
 * @param {Number[]} paRowIndexs 대상의 rowindex array 
 * @param {Boolean} pbIsMsgAlert validation 메시지 출력 여부
 * @return {Boolean}
 * @private
 */
AppKit.prototype._validateGridFromRowIdex = function(pcGrid , paRowIndexs , pbIsMsgAlert) {
	/** @type cpr.controls.Grid */
    var vcGrid = pcGrid;
    if (!vcGrid) return false;
    
	var _this = this;
	
	/** @type cpr.controls.gridpart.GridDetailBand */
	var voDetailBand = vcGrid.detail;
	var voColumnList = vcGrid.getColumnLayout(true);
	var vnCellCnt = voColumnList.detail.length;
    
    var vsDataBindCtxId = vcGrid.userAttr("bindDataFormId");
	//반응형그리드 모듈에 의하여 프리폼이 숨겨졌을때 대상 프리폼의 반응형 처리 전 visible상태 체크를 포함한 프리폼 유효값 검증 구분 변수
	var vbValidateMust = false;
	//그리드에 bind-form-id(bindDataFormId)로 디테일 프리폼이 있음에도 불구하고 그리드 내에
	//required 같은 유효값 검증을 해야하는 속성값을 가진 컨트롤이 있을 경우 그리드에서 값검증을 체크하도록 하는 변수
	//혹은 그리드에 폼이 연결 되어있으나, 그리드를 검증할 때 그리드에 유효 검증 대상이 없고 폼에 있는 경우 폼이 가시 상태일 때 폼을 체크하도록 하는 변수
	var vbValidatableOnGrid = false;
	
	if (!ValueUtil.isNull(vsDataBindCtxId)) {
		var vcApp = vcGrid.getAppInstance();
		var vcForm = vcApp.lookup(vsDataBindCtxId);
		//responsiveGrid 모듈에 의해 컨테이너가 숨겨질때 지정하는 사용자 속성
		if (vcForm.userAttr("_hideOnGrid_") == "true" && vcForm.userAttr("_originVisible_") == "true") {
			vbValidateMust = true;
		}
		
		vbValidatableOnGrid = vcGrid.detail.getCellIndices().some(function(each) {
			var vcCtrl = vcGrid.detail.getControl(each);
			if (vcCtrl) {
				return vcCtrl.userAttr("required") == "Y";
			}
		});
	}
    /** @type cpr.data.DataSet*/
	var vcDataSet = vcGrid.dataSet;
	var vbIsValid = paRowIndexs.some(function(idx) {
		var voRow = vcDataSet.getRow(idx);
		/** @type cpr.controls.gridpart.GridColumn */
		var voCol = null;
		for (var i = 0; i < vnCellCnt; i++) {
			var voDetailLayout = voColumnList.detail[i];
			
			voCol = voDetailBand.getColumn(voDetailLayout.cellIndex);
			
			if (ValueUtil.isNull(vsDataBindCtxId) || vbValidatableOnGrid) {
					
					//컬럼 매핑노드가 없으면... SKIP
					if (voCol == null) continue;
					if (voCol.columnName == null || voCol.columnName == "") continue;
					if (voCol.columnType == "checkbox" || voCol.columnType == "rowindex") continue;
					//컬럼 유형이 output이면... SKIP
					if (voCol.controlType == null || voCol.controlType == "output" || voCol.controlType == "button" || voCol.controlType == "img") continue;
					//신규행  PK 체크 무시... SKIP
					if (voRow.getState() == cpr.data.tabledata.RowState.INSERTED && (voCol.control && voCol.control.userAttr("ignorePk") == "Y")) continue;
					
					// header 컬럼이 visible=false 인 경우
					var vbInvisibleCol = !voColumnList.columnLayout[voDetailLayout.colIndex].visible;
					
					// 디테일 셀에 배치된 컨트롤이 visible=false 인 경우
					var vbInvisibleCtrl = false;
					if (!ValueUtil.isNull(voCol.control)) {
						var voCtrlVisibleBindInfo = voCol.control.getBindInfo("visible");
						if (voCtrlVisibleBindInfo && voCtrlVisibleBindInfo.type == "expression") {
							var voExpr = new cpr.expression.Expression(voCtrlVisibleBindInfo.expression);
							var vcGridRow = vcGrid.getRow(idx);
							var voResult = voExpr.evaluate(vcGridRow);
							vbInvisibleCtrl = !voResult;
						} else {
							vbInvisibleCtrl = !voCol.control.visible;
						}
					}
					
					// 보이지 않는 컬럼 or 컨트롤인 경우... SKIP
					if (vbInvisibleCol || vbInvisibleCtrl) continue;
			} else {
				if (vbValidateMust || vbValidatableOnGrid === false) {
					vcGrid.selectRows([idx]);
					var vbBools = _this._validateFreeForm(vcGrid.getAppInstance().lookup(vsDataBindCtxId),pbIsMsgAlert,true);
					return !vbBools;
				}
			}
			// 컨트롤별 Validation Check
			if (_this.Validator.validate(voCol.control, voRow.getValue(voCol.columnName), vcGrid, idx, i, null, pbIsMsgAlert) == false) {
				//유효성 체크로 인해 selection-change 발생여부 셋팅 
				vcGrid.userAttr("selectionChangeByValidation", "true");
				//탭내에 컨트롤이 존재하는 경우... 해당 탭페이지 포커싱
				_this._focusToTabItem(vcGrid);
				if (ValueUtil.isNull(vsDataBindCtxId)) {
					vcGrid.setEditRowIndex(idx, true);
					vcGrid.focusCell(idx, i);
					//포커싱할 컬럼이 UDC인 경우에...
					var vcUdcCtrl = vcGrid.detail.getColumn(i).control;
					if (vcUdcCtrl instanceof cpr.controls.UDCBase) {
						var voEmbApp = vcUdcCtrl.getEmbeddedAppInstance();
						vcUdcCtrl = AppUtil.getUDCBindValueControl(vcUdcCtrl);
						if (vcUdcCtrl) voEmbApp.focus(vcUdcCtrl.id);
					}
				}else{
					vcGrid.selectRows(idx);
					var vcCtrl = _this.Group.getDataBindedControl(vcDataSet.getAppInstance(), vsDataBindCtxId, voCol.columnName);
					if (vcCtrl) _this.Control.setFocus(vcCtrl.getAppInstance(), vcCtrl.id);
				}				
				return true;
			}
		}
		return false;
	});
	if (vbIsValid == true) {
		return false;
	}
	
	return true;
}

/**
 * Device의 모바일 접속여부를 반환합니다.(mobile, tablet)
 * Device/Browser 정책에 따라 구분될 수 있습니다.
 * @return {Boolean} 모바일 접속 여부
 */
AppKit.prototype.isMobile = function() {	
	var voDetBrowser = cpr.utils.Util.detectBrowser();
	var vsUserAgent  = navigator.userAgent.toLowerCase();
	
	if (voDetBrowser.mobile || voDetBrowser.isAndroid || voDetBrowser.isIOS || vsUserAgent.indexOf("mobile")>-1) {
		return true;
	}
	return false;
}

/**
 * Validation 체크시 컨트롤이 속한 탭폴더 선택용
 * @param {cpr.controls.UIControl} pcCtrl 컨트롤 객체
 * @private
 */
AppKit.prototype._focusToTabItem = function(pcCtrl) {
	/**@type cpr.controls.TabFolder */
	var vcTab = null;
	pcCtrl.findParent(function(pctrl) {
		if (pctrl instanceof cpr.controls.TabFolder) {
			vcTab = pctrl;
			return true;
		}
		return false;
	});
	if (vcTab) {
		var voTabItem = null;
		var vaTabItems = vcTab.getTabItems();
		pcCtrl.findParent(function(pctrl) {
			vaTabItems.some(function(each) {
				if (each.content == pctrl) {
					voTabItem = each;
					return true;
				}
				return false;
			});
			return voTabItem != null;
		});
		if (voTabItem && voTabItem != vcTab.getSelectedTabItem()) {
			vcTab.setSelectedTabItem(voTabItem);
		}
	}
};

/**
 * 그룹 컨트롤내의 자식 컨트롤 목록을 반환한다.
 * @param {cpr.controls.Container} pcGroup 그룹컨트롤
 * @private
 */
AppKit.prototype._getChildren = function(pcGroup) {
	var vaChildren = pcGroup.getAllRecursiveChildren();
	function getNextControls(pcEach, paChildren) {
		var vaOrder = [pcEach];
		var vcNext = pcEach;
		while(vcNext != null) {
			vcNext = vcNext.getNextControl();
			if (vcNext != null && paChildren.indexOf(vcNext) > -1 && vaOrder.indexOf(vcNext) == -1) vaOrder.push(vcNext);
			else vcNext = null;
		}
		return vaOrder;
	} 
	
	var vaOrderCtrls = [];
	vaChildren.forEach(function(each) {
		if (vaChildren.indexOf(each.getPrevControl()) ==-1 && each.getNextControl() != null) {
			vaOrderCtrls = getNextControls(each, vaChildren);
		}
	});
	
	var vaEtcCtrls = [];
	vaChildren.forEach(function(each) {
		if (vaOrderCtrls.indexOf(each) == -1) {
			vaEtcCtrls.push(each);
		}
	});
	
	return vaOrderCtrls.concat(vaEtcCtrls);
};

/**
 * 현재 웹 페이지의 <b>Context Path(컨텍스트 경로)</b>를 반환
 * @return {string} 현재 도메인의 컨텍스트 패스 리턴
 */
AppKit.prototype.getContextPath = function() {
	return top.location.pathname.substring(0, top.location.pathname.indexOf("/", 2));
}

/**
 * 권한 유틸<br>
 * 인스턴스: `createCommonUtil().Main`
 * @constructor
 * @param {AppKit} appKit 공통 AppKit 객체
 */
function MainKit(appKit) {
	this._appKit = appKit;
};

/**
 * 메인 페이지의 탭 헤더 그룹에 배치된 버튼 기능을 호출하는 함수입니다.
 * 함수에서 파라미터를 필요로 하는 경우 세 번째 파라미터부터 순차적으로 파라미터 값을 입력할 수 있습니다.
 * @param {cpr.core.AppInstance} app 앱인스턴스
 * @param {"zoom"|"refresh"|"window"|"closeAll"} psFuncName 기능명
 * @param {any} poArguments? (optional)(미적용)arguments 파라미터로 보내고싶은 모든 것
 */
MainKit.prototype.doTabHeaderFunction = function(app,psFuncName,poArguments) {
	/** @type cpr.core.AppInstance */
	var voMainApp = this._appKit.getMainApp(app);
	try {
		
	if(voMainApp.hasAppMethod("doTabHeaderFunction")) {
		voMainApp.callAppMethod("doTabHeaderFunction",psFuncName,poArguments);
	} else {
		throw new Error("doTabHeaderFunction 함수가 존재하지 않습니다.");
	}
	} catch(err){
		console.error(err);
	}
}

/**
 * <b>사이트별 Customizing 필요</b> <br><br>
 * 메뉴 정보 취득
 * @param {cpr.core.AppInstance} app 앱인스턴스
 * @param {String} psMenuType?  메뉴 정보 TYPE(생략시 메뉴 정보 MAP 리턴)
 * @return {cpr.utils.ObjectMap} psMenuType 생략시 <br>
			getMenuInfo.get("MENU_ID");			//메뉴ID<br>
			getMenuInfo.get("PGM_ID");			//프로그램ID<br>
			getMenuInfo.get("MENU_NM");			//메뉴명<br>
 */
MainKit.prototype.getMenuInfo = function(app, psMenuType) {
	var voMap = new cpr.utils.ObjectMap();
	/** @type cpr.core.AppInstance */ 
	var voMainApp = this._appKit.getMainApp(app);
	var voMainCont = voMainApp.getContainer();
	var vsData = null;
	var vcMainCont = voMainApp.lookup(AppProperties.MAIN_EMB_CONTROL_ID);
	if (vcMainCont) {
		if (vcMainCont instanceof cpr.controls.MDIFolder) {
			var vcTabItem = vcMainCont.getSelectedTabItem();
			if (vcTabItem != null) {
				vsData = vcTabItem.userAttr(AppProperties.MAIN_MENU_INFO);
				voMainCont.userAttr(AppProperties.MAIN_MENU_INFO, vsData);
			} else {
				if (app.getHost() && app.getHost() instanceof cpr.controls.EmbeddedApp) {
					vsData = app.getHost().userAttr(AppProperties.MAIN_MENU_INFO);
					voMainCont.userAttr(AppProperties.MAIN_MENU_INFO, vsData);
				}
			}
		} else if (vcMainCont instanceof cpr.controls.EmbeddedApp) {
			if (vcMainCont.app) {
				vsData = vcMainCont.userAttr(AppProperties.MAIN_MENU_INFO);
				voMainCont.userAttr(AppProperties.MAIN_MENU_INFO, vsData);
			}
		}
	} 
	if (!ValueUtil.isNull(vsData)) {
		var voData = JSON.parse(vsData)["row"];
		if (psMenuType != null) {
			return ValueUtil.fixNull(voData[psMenuType]);
		} else {
			for (var vsKey in voData) {
				voMap.put(vsKey, ValueUtil.fixNull(voData[vsKey]));
			}
			return voMap;
		}
	} else {
		return voMap;
	}
};

/**
 * <b>사이트별 Customizing 필요</b> <br>
 * - Root App에 getUserInfo 생성 필요.<br><br>
 * 사용자의 정보를 취득<br>
 * @param {cpr.core.AppInstance} app 앱인스턴스
 * @param {String} psUserInfoType? 사용자정보 TYPE 세션정보 참고   또는 <br>
 * 					   			   var mapUserInfo = util.getUserInfo();<br>
 * 					   			   mapUserInfo.get("USER_ID");<br>
 * @return {String | cpr.data.DataMap} psUserInfoType 미지정시 Map 형태의 사용자 정보 리턴 
 */
MainKit.prototype.getUserInfo = function(app, psUserInfoType) {
	var voMainApp = this._appKit.getMainApp(app);
	if (voMainApp.hasAppMethod("getUserInfo")) {
		if (ValueUtil.isNull(psUserInfoType)) {
			return voMainApp.callAppMethod("getUserInfo");
		} else {
			return voMainApp.callAppMethod("getUserInfo", [psUserInfoType]);
		}
	}
};

/**
 * 공통 모듈 생성
 * @return {AppKit} AppKit 인스턴스
 */
globals.createCommonUtil = function() {
	return new AppKit();
};

// 다른 모듈에서 AppKit 타입 인식할 수 있도록 출판
globals.AppKit = AppKit;