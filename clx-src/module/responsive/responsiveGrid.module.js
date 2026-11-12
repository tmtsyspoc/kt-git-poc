/************************************************
 * responsiveGrid.module.js
 * @프로그램설명 : 반응형 그리드 모듈
 *
 * @작성일자 : 
 * @작성자 :
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 * 			2025-04-09 : 
 * 				1. 동일 유형 그리드 다중 배치 시 복원 오류 수정
 * 				  (반응형 처리를 수행한 후 원래 레이아웃으로 복원할 때, 동일한 타입의 그리드가 여러 개 존재하면 항상 마지막(가장 뒤에 선언된) 그리드로 전체 복원됨))
 * 				2. 행(row)이 2개이고 열(column)이 1개인 폼 형태의 그리드에서 반응형 동작 오류 수정
 ************************************************/

/*************************************************************************
 * [확인 사항 - 반응형 그리드 모듈 적용 가이드]
 *
 * 1. RGrid.prototype.ATTR_NM에 정의된 속성 중 필요한 기능을 확인한 뒤,
 *    프로젝트 표준 사용자 속성으로 동일한 이름을 정의하고 그리드 컨트롤에 적용합니다.
 *    (위치: eXBuilder6 > 프로젝트 표준 > 사용자 속성 정의)
 *
 * 2. 반응형 모듈 적용 여부는 event.module.js 내 init EventBus에서 
 *    사용자 속성 "transform-on-mobile"의 존재 여부로 판단합니다.
 *
 * 3. 모바일 환경에서 표시할 셀 인덱스는 사용자 속성 "view-column-indicies"에 정의합니다.
 *    해당 인덱스 셀만 화면에 표시되며, 나머지 셀은 다음 네 방식 중 하나로 표현할 수 있습니다:
 *    - accordionType: 폼 레이아웃 형태로 구성하여, 행(row) 클릭 시 상세 데이터를 접고 펼치는 방식
 *    - dialogType: 상세 버튼 클릭 시 팝업 다이얼로그로 상세 데이터 표시
 *      (팝업 경로: app/com/comPGridCellView)
 *	  - list: 삭제된 행을 제외한 모든 행에 대해서 리스트 형태로 데이터를  표현 (폼 레이아웃으로 구성)
 * 	  - massiveList: 삭제된 행을 제외한 모든 행에 대해서 리스트 형태로 데이터를 표현 (그리드로 구성)
 * 
 *    ※ "transform-on-mobile" 값에 따라 두 방식 중 하나가 자동 적용됩니다.
 *    ※ 예제는 두 타입 모두 제공됩니다.
 *   	 - 참고: RGrid.prototype.start
 *    ※ 스타일은 theme > custom > responsive.part.less에서 정의됩니다.
 *
 * 4. 반응형 그리드의 기본 높이는 "needs-auto-height": true로 설정됩니다.
 *    PC 환경과 동일한 높이로 지정하려면 사용자 속성 "needs-auto-height"를 false로 설정하십시오.
 *************************************************************************/


/************************************************
 * 반응형 그리드 모듈 공통 옵션
 ************************************************/
/**
 * accordionType 설정 가능 옵션
 */
var maAccordionOption = {
	/** 행 높이 자동조절 */
	autoRowHeight : false,
	/** 독점적 아코디언 사용 여부<br>(다른 행을 클릭하면 이미 열렸던 행을 접는 기능) */
	exclusive : false,
	/** 디테일 영역을 접거나 펼칠 수 있는 영역을 추가합니다.<br>(해당 값이 false 면 행을 클릭했을 때 접거나 펼쳐집니다.) */
	showExpandButton : false,
	layout : {
		/** 아코디언 영역 내 여백 */
		margin : 10	
	},
	style : {
		/**
		 * 전체 그룹 클래스명
		 * @type #css-class[] 
		 */
		containerClass : ["table", "form"],
		/**
		 * 헤더 영역 클래스명
		 * @type #css-class[] 
		 */
		headerClass : ["table-header"],
		/**
		 * 헤더 그룹 내 헤더셀(아웃풋) 클래스명
		 * @type #css-class[] 
		 */
		headerCellClass : ["table-header-cell", "label"],
		/**
		 * 디테일 영역 클래스명
		 * @type #css-class[] 
		 */
		rowClass : ["table-row"],
		/**
		 * 디테일 행 내에 숨겨진 아코디언 영역 클래스명
		 * @type #css-class[] 
		 */
		accordionRowClass : ["table-accordion-row"],
		/** 
		 * 디테일행 확장 버튼 클래스명 (showExpandButton=true 적용 시 추가되는 버튼)
		 * @type #css-class[] 
		 */
		expanderClass : ["btn-expander"]
	}
};

/**
 * dialogType 설정 가능 옵션
 */
var maDialogTypeOption = {
	/** 상세 버튼 헤더 컬럼 텍스트 */
	detailHeaderText : "상세",
	style : {
		/**
		 * 상세 버튼 클래스명
		 * @type #css-class[]
		 */
		detailBtnClass : ["btn-modile-detail"]
	}
};


/**
 * list 설정 가능 옵션
 */
var maListTypeOption = {
	/** 각 카드의 첫번째 컬럼영역에 대한 columnShade 적용 여부 */
	useColumnShade : true,
	layout: {
		horizontalSeparatorWidth : 0,
		verticalSeparatorWidth : 0,
		horizontalSpacing : 0,
		verticalSpacing: 0	
	},
	style: {
		/**
		 * 전체 그룹 클래스명
		 * @type #css-class[] 
		 */
		containerClass : ["form"],
		/**
		 * 전체 그룹 클래스명
		 * @type #css-class[] 
		 */
		rowClass : [""],
		/**
		 * 헤더 그룹 내 헤더셀(아웃풋) 클래스명
		 * @type #css-class[] 
		 */
		headerCellClass : ["label"],
		/**
		 * 그룹 내 디테일 셀 클래스명
		 * @type #css-class[] 
		 */
		detailCellClass : ["card-detail"],
	}
};

/**
 * massiveList 설정 가능 옵션
 */
var maMassiveListTypeOption = {
	style: {
		/**
		 * 그리드 행 스타일 클래스명
		 * @type #css-class[] 
		 */
		rowClass : ["cl-grid-listType"]
	}
};

/** 
 * CUD 기능 동작을 위한 다이얼로그 설정 가능 옵션
 */
var maDetailPopupOption = {
	root : {
		style : {
			/** @type #css-class[] */
			containerClass : [""]
		},
		// 다이얼로그 루트 레이아웃 옵션
		layout : {
			spacing : 5,
			topMargin : 5,
			leftMargin : 10,
			rightMargin : 10,
			bottomMargin : 5
		}
	},
	content : {
		style : {
			/** @type #css-class[] */
			containerClass : ["form"],  // 컨텐츠 영역을 감싸는 그룹 스타일 클래스
			/** @type #css-class[] */
			labelClass : ["label"], // 컨텐츠 영역 내 라벨 스타일 클래스
		},
		// 컨텐츠 영역 레이아웃 옵션
		layout : {
			topMargin : 5,
			leftMargin : 5,
			rightMargin : 5,
			bottomMargin : 5,
			horisontalSpacing : 20,
			verticalSpacing : 10,
			horizontalSeparatorWidth : 1,
			useLabelShade : true,  // 라벨 영역 음영처리 여부
		}
	},
	footer : {
		style : {
			/** @type #css-class[] */
			containerClass : ["footer"], // 하단 푸터영역 컨테이너 스타일 클래스 (닫기, 삭제, 저장 버튼 포함),
			/** @type #css-class[] */
			closeButtonClass : ["btn-close"], // 푸터영역의 닫기 버튼 스타일 클래스
			/** @type #css-class[] */
			saveButtonClass : ["btn-save"] // 푸터영역의 저장버튼 클래스
		},
		// 푸터 영역 레이아웃 옵션
		layout : {
			topMargin : 0,
			leftMargin : 0,
			rightMargin : 0,
			bottomMargin : 0,
			horizontalSpacing : 5,
			verticalSpacing : 5,
			horizontalAlign : "right"
		}
	},
}

var msCallbackFunctionName = "callbackResponsiveGrid";


/************************************************
 * 반응형 그리드(RGrid)
 ************************************************/
/**
 * 반응형 그리드 유틸리티.
 * @constructor
 * @param {cpr.controls.Grid} pcGrid 대상 그리드 컨트롤
 * @param {AppKit} util AppKit
 */ 
function RGrid(pcGrid, util) {
	/** @type cpr.controls.Grid */
	this._grid = pcGrid;
	/** @type cpr.core.AppInstance */
	this._app = pcGrid.getAppInstance();
	/** @type cpr.controls.Container */
	this._parentContainer = this._grid.getParent();

	this.callbackFunctionName = msCallbackFunctionName;
	this._originInvisible = [];
    pcGrid.getColumnLayout(true).columnLayout.forEach((function(each, idx){
        if(!each.visible) {
            this._originInvisible.push(idx);
        }
    }).bind(this));
    this._popup = null; // _createDetailPopup에서 생성하는 팝업객체 
    
	this._appKit = util;
	
	this._container = null;
	this._innerContainer = null;
	this._innerHeaderContainer = null; // 그리드 헤더 영역 처리(accordionType)
	this._columnSettings = [];
	this._started = false;
	this._hideCellIdxs = [];	
	this._visibleColumns = []; // visible = true 컬럼

	this._screenNms = this._setScreenNm();
	
	/** 그리드 초기 정보 */
	this._gridInitInfo = this._getGridInitInfo();
	
	/** 그리드 초기 showDeleteRow 정보 */
	this._gridShowDeleteRow = this._grid.showDeletedRow;
	
	/* 초기값 세팅, 해당 정보는 start() 에서 재정의 됨 */
	/** @type {"accordionType" | "dialogType" | "list" | "massiveList"} */
	this._gridType = "accordionType";
	this._gridAuto = true;
	
	this._ctrlCopy = createCtrlCopyModule();
	
	pcGrid.addEventListener("dispose", this._handleDispose.bind(this));
	
	// 모바일 화면에서 데이터셋 값이 변경됨을 적용하기 위한 이벤트 핸들러(load, filter)
	function _datasetEventHandler(e) {
		this._started = false;
		this.restore();
		this._revert();
		
		this._app.dispatchEvent(new cpr.events.CScreenChangeEvent({
			name: this._app.targetScreen.name
		}));
	}
	var vcBindDataset = pcGrid.dataSet;
	vcBindDataset.addEventListener("load", _datasetEventHandler.bind(this));
	vcBindDataset.addEventListener("filter", _datasetEventHandler.bind(this));
	vcBindDataset.addEventListener("update", (function (e){
		// container 가 dispose 되면서 그리드 내 컨트롤 이벤트가 발생하지 않는 문제 수정
		if(this._container) {
			this._container.redraw();
		}
	}).bind(this));
	
	/*
	 * TODO 데이터셋의 insert, delete 이벤트 발생 시, 반응형 폼에 변경사항을 적용하기 위해서 아래 주석을 해제하십시오.
	 */
//	vcBindDataset.addEventListener("insert", _datasetEventHandler.bind(this));
//	vcBindDataset.addEventListener("delete", _datasetEventHandler.bind(this));
}


/************************************************
 * RGrid 공통
 ************************************************/

/**
 * 반응형 그리드 사용자 속성 정의 목록<br>
 * (사용자 속성값의 기본타입은 String이며 valueType은 데이터 입력형식 확인을 위해 작성되었습니다.)
 * @type {Object}
 */
RGrid.prototype.ATTR_NM = {
	/** <필수>모바일 : 모바일 환경에서 반응형 그리드 적용 여부<br>(valueType : String, ex. accordionType)*/
	ATTR_TRANSFORM_ON_MOBILE : "transform-on-mobile",
	/** 모바일 : 반응형 그리드 적용시 표시할 컬럼 인덱스(colIndex) <br>(valueType : Number[], ex. 1,3,4)*/
	ATTR_VIEW_COLUMN_INDICES : "view-column-indicies",
	/** 모바일 : 반응형 그리드 자동높이 설정 */
	ATTR_NEEDS_AUTO_HEIGHT : "needs-auto-height",
	/** 선택행 컨텍스트 연결된 그룹 ID<br>(valueType : String, ex. grpForm)*/
	ATTR_BIND_FORM_ID : "bindDataFormId",
	
	/** 모바일 : 각 행 별 spacing<br>transform-on-mobile: list 일 경우에만 적용<br>(valueType : Number, ex.10)*/
	ATTR_LIST_SPACING : "grid-list-spacing",
	/** 모바일 : 각 행 별 top margin<br>transform-on-mobile: list 일 경우에만 적용<br>(valueType : Number, ex.10)*/
	ATTR_LIST_TOP_MARGIN : "grid-list-top-margin",
	/** 모바일 : 각 행 별 left margin<br>transform-on-mobile: list 일 경우에만 적용<br>(valueType : Number, ex.10)*/
	ATTR_LIST_LEFT_MARGIN : "grid-list-left-margin",
	/** 모바일 : 각 행 별 right margin<br>transform-on-mobile: list 일 경우에만 적용<br>(valueType : Number, ex.10)*/
	ATTR_LIST_RIGHT_MARGIN : "grid-list-right-margin",
	/** 모바일 : 각 행 별 bottom margin<br>transform-on-mobile: list 일 경우에만 적용<br>(valueType : Number, ex.10)*/
	ATTR_LIST_BOTTOM_MARGIN : "grid-list-bottom-margin",
	/** 모바일 : 폼 내 각 Row의 높이<br>transform-on-mobile: list 일 경우에만 적용<br>(valueType : Number, ex.30)*/
	ATTR_LIST_ROW_HEIGHT : "grid-list-row-height",
	
	/** 모바일 : 헤더 로우 개수만큼 헤더 셀 생성 여부<br>true : 헤더 행 개수만큼 헤더 셀 생성<br>false : 하나의 셀에 헤더 텍스트 연결<br>(valueType : Boolean, ex.true)*/
	ATTR_MAINTAIN_MULTI_HEADER : "maintain-multi-header",
	
	/** 모바일 : CUD 기능을 적용할 수 있는지 여부<br>(valueType : Boolean, ex. true) */
	ATTR_DIALOG_CUD : "grid-dialog-cud",
	/** 모바일 : 편집이 불가능한 조회용으로 동작할 지 여부<br>(valueType : Boolean, ex. true) */
	ATTR_MOBILE_LIST_VIEW : "mobile-grid-list-view"
}

/**
 * 화면 타입별 스크린 이름 정의
 * @private
 * @return {
* 	  default : String[],
* 	  tablet : String[],
* 	  mobile : String[]
* 	} 
 */
RGrid.prototype._setScreenNm = function(){
	var voScreenNms = {
		"default" : ["default"],
		"tablet" : ["tablet"],
		"mobile" : ["mobile"]
	};
	
	if (typeof AppProperties !== 'undefined') {
		if(!ValueUtil.isNull(AppProperties.SCREEN_DEFAULT_NM)) {
			voScreenNms["default"] = AppProperties.SCREEN_DEFAULT_NM;
		}
		if(!ValueUtil.isNull(AppProperties.SCREEN_TABLET_NM)) {
			voScreenNms["tablet"] = AppProperties.SCREEN_TABLET_NM;
		}
		if(!ValueUtil.isNull(AppProperties.SCREEN_MOBILE_NM)) {
			voScreenNms["mobile"] = AppProperties.SCREEN_MOBILE_NM;
		}
	}
				
	return voScreenNms;
}

/**
 * 반응형 그리드 적용 시작<br>
 * 사용자 속성에 따라 그리드를 반응형으로 변환
 * @returns {void}
 */
RGrid.prototype.start = function() {
	if (this._started) return;
	
	this._gridType = this._grid.userAttr(this.ATTR_NM.ATTR_TRANSFORM_ON_MOBILE);
	this._gridAuto = ValueUtil.isNull(this._grid.userAttr(this.ATTR_NM.ATTR_NEEDS_AUTO_HEIGHT)) ? true : ValueUtil.fixBoolean(this._grid.userAttr(this.ATTR_NM.ATTR_NEEDS_AUTO_HEIGHT));
	var vsViewColIndexs = this._grid.userAttr(this.ATTR_NM.ATTR_VIEW_COLUMN_INDICES);
	if (vsViewColIndexs != null && vsViewColIndexs != '') {
		this._hide();
	}
	
	this._gridInitInfo = this._getGridInitInfo();
	this._gridShowDeleteRow = this._grid.showDeletedRow;
	
	if (this._gridType == "dialogType") {
		this._setViewBtnColumn();
	} else if(this._gridType == "accordionType"){
		this._setColumnSettings();
		this._collapse();
	} else if(this._gridType == "list") {
		this._setColumnSettings();
		this._setListForm();
	} else if(this._gridType == "massiveList") {
		this._setColumnSettings();
		this._setMassiveForm();
	}
	
	// origin Grid 를 변경하는 경우에 모두 펼치기 위해 autoHeight 적용
	this._grid.userAttr("autoSize", (this._parentContainer.getConstraint(this._grid).autoSize || "none"));
	this._parentContainer.updateConstraint(this._grid, {
		"autoSize": "height"
	});
	
	var vcGrpBindForm = this._app.lookup(this._grid.userAttr(this.ATTR_NM.ATTR_BIND_FORM_ID));
	if (vcGrpBindForm){
		vcGrpBindForm.userAttr("_originVisible_", vcGrpBindForm.visible.toString());
	  	vcGrpBindForm.userAttr("_hideOnGrid_","true");
		vcGrpBindForm.visible = false;
	}
	
	// CUD가 가능하면 팝업에서만 수정하도록 container 는 readonly 처리
	if(ValueUtil.fixBoolean(this._grid.userAttr(this.ATTR_NM.ATTR_MOBILE_LIST_VIEW))) {
		this._grid.userAttr("__origin_readonly__", this._grid.readOnly.toString());
		if(this._container) this._container.readOnly = true;
		this._grid.readOnly = true;
	}
	
	this._started = true;
}

/**
 * 반응형 그리드 해제 및 원복 처리
 * @param {Object} poInitGridInfo 초기 그리드 설정 정보
 * @param {Boolean} pbGridShowDeleteRow 삭제 행 표시 여부
 * @returns {void}
 */
RGrid.prototype.stop = function(poInitGridInfo, pbGridShowDeleteRow) {
	if (!this._started) {
		return;
	}

	var that = this;
	var vsViewColIndexs = this._grid.userAttr(this.ATTR_NM.ATTR_VIEW_COLUMN_INDICES);
	
	// 반응형 그리드 해제 시 원래 그리드 상태로 되돌리기
	if (poInitGridInfo != undefined) this._grid.init(poInitGridInfo); 
	if (pbGridShowDeleteRow != undefined) this._grid.showDeletedRow = pbGridShowDeleteRow; 
	if (_hasArrayValue(this._grid.style.getClasses(), maMassiveListTypeOption.style.rowClass)) {
		// massiveList 적용한 경우, 관련 스타일클래스 제거
		maMassiveListTypeOption.style.rowClass.forEach(function(style){
			that._grid.style.row.removeClass(style);
		});
	}
	
	if (vsViewColIndexs != null && vsViewColIndexs != '') {
		this.restore();
		this._revert();
	} else if (this._gridType == "dialogType") {
		this.restore();
	} else {
		this.restore();
		this._revert();
	}
	
	// 자동높이 이전 설정 정보로 원복
	this._parentContainer.updateConstraint(this._grid, {
		"autoSize": this._grid.userAttr("autoSize")
	});
	this._grid.removeUserAttr("autoSize");
	
	var vcGrpBindForm = this._app.lookup(this._grid.userAttr(this.ATTR_NM.ATTR_BIND_FORM_ID));
	if (vcGrpBindForm){
	  	vcGrpBindForm.removeUserAttr("_hideOnGrid_");
		vcGrpBindForm.visible = true;
	}
	
	if(ValueUtil.fixBoolean(this._grid.userAttr(this.ATTR_NM.ATTR_MOBILE_LIST_VIEW))) {
		this._grid.readOnly = ValueUtil.fixBoolean(this._grid.userAttr("__origin_readonly__"));
		this._grid.removeUserAttr("__origin_readonly__");
	}
	
	this._started = false;
}

/**
 * 화면 크기 변경 시 이벤트 핸들러
 * 모바일/태블릿/PC에 따라 그리드 타입 전환 처리
 * @private
 * @param {cpr.events.CScreenChangeEvent} e
 * @returns {void}
 */
RGrid.prototype._onScreenChange = function(e) {
	var vsScrnName = e.screen.name;
	
	var that = this;
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		if(that._appKit) {
			that._appKit.Grid.init(that._app, that._grid.id);
		}
	});
	
	if(that._screenNms["mobile"].indexOf(vsScrnName) != -1) {
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
			// Grid.init 호출 후 동작할 수 있도록 asyncExec 추가
			that.start();
		});
	} else if(that._screenNms["tablet"].indexOf(vsScrnName) != -1) {
		that.stop(that._gridInitInfo, that._gridShowDeleteRow);
	} else {
		that.stop(that._gridInitInfo, that._gridShowDeleteRow);
	} 
}

/**
 * 그리드 dispose 시 처리
 * 등록된 이벤트 제거
 * @private
 * @param {cpr.events.CEvent} e
 * @returns {void}
 */
RGrid.prototype._handleDispose = function(e) {
}

/**
 * 사용자 속성 view-column-indicies 기준으로 숨김 처리할 컬럼 설정
 * @private
 * @returns {void}
 */
RGrid.prototype._hide = function() {
	var vaIndexs = this._grid.userAttr(this.ATTR_NM.ATTR_VIEW_COLUMN_INDICES).split(/[\s,]+/g).map(function( /* String */ each) {
		return parseInt(each); 
	});
	
	var vcGrid = this._grid;
	var vaHideColIndexs = [];
	
	var vaColIndicesByVisible = vcGrid.getColIndicesByVisible(true);
	for(var idx = 0; idx < vcGrid.columnCount; idx++){
		if(vaIndexs.indexOf(idx) == -1) {
			if(vaColIndicesByVisible.indexOf(idx) != -1) {
				vaHideColIndexs.push(idx);
				vcGrid.columnVisible(idx, false, "column-index");
			}
		}
	}
	
	this._hideCellIdxs = vaHideColIndexs;
}

/**
 * 숨김 처리된 컬럼을 다시 표시
 * @private
 * @returns {void}
 */
RGrid.prototype._revert = function() {
	var vcGrid = this._grid;
	var vaHideCellIndexs = this._hideCellIdxs;
	if(vaHideCellIndexs){
		vaHideCellIndexs.forEach(function( /* Number */ each) {
			vcGrid.columnVisible(each, true, "column-index");
		});
	}
}

/**
 * 반응형 그리드 상태를 원복
 * (컨테이너 dispose, 컬럼 설정 초기화 등)
 * @returns {void}
 */
RGrid.prototype.restore = function() {
	this._columnSettings = [];
	var vcGrid = this._grid;
	var vaHedaerCol = vcGrid.header.getColumnByColIndex(0, 1);
	
	if (vaHedaerCol.length > 0 && vaHedaerCol[0].text == maDialogTypeOption.detailHeaderText) {
		var vnCellIndex = vaHedaerCol[0].cellIndex;
		vcGrid.deleteColumn(vnCellIndex);
	} else {
		this._columnSettings = [];
		this._grid.visible = true;
		if (this._container) {
			this._container.dispose();
		}
	}
}

RGrid.prototype._columnSettings = [];
/**
 * 현재 화면 구성을 기반으로 디테일 영역 그리드 컬럼 정보 저장(그리드 -> 폼)
 * @private
 * @returns {void}
 */
RGrid.prototype._setColumnSettings = function() {
	var vcGrid = this._grid;
	
	var voHeader = vcGrid.header;
	var voDetail = vcGrid.detail;
	var vsAutoFit = vcGrid.autoFit.replace(/\s/g, "");
	var vaAutoFitCols = vsAutoFit == "all" ? [] : vsAutoFit.split(",");
	
	var voHdrColLot = vcGrid.getColumnLayout().header;
	var vaMergeHdrCols = voHdrColLot.filter(function(each) {
		return each.colSpan > 1;
	});

	var vaDisplayCols = [];
	var vbIsBeforeDpCol = false;
	var voBeforeDpColInfo = {};
	for (var idx = 0; idx < voDetail.cellCount; idx++) {
		var vnColSpan = 1;
		var vnHdrColIdx = idx;
		var vsDisplayText = "";
		var vsDisplayLoca = "";
		
		if (vaDisplayCols.indexOf(idx) != -1) continue;
		if (vaMergeHdrCols.length > 0) {
			vaMergeHdrCols.forEach(function(each){
				if (each.colIndex == idx) {
					vnColSpan = each.colSpan;
					for (var j = idx; j < idx + vnColSpan; j++) {
						var voDtrlCol = voDetail.getColumnByColIndex(j, vnColSpan)[0];
						if(!voDtrlCol) continue;

						if (!voDtrlCol.columnName){
							vaDisplayCols.push(j);
							if (voDtrlCol.control instanceof cpr.controls.Output) {
								vsDisplayText = voDtrlCol.control.value;
								if (idx < j) {
									vsDisplayLoca = "after";
								} else {
									voBeforeDpColInfo["text"] = vsDisplayText;
									voBeforeDpColInfo["loca"] = "before";
									voBeforeDpColInfo["colIdx"] = j + 1;
									voBeforeDpColInfo["colSpan"] = vnColSpan;
									vbIsBeforeDpCol = true;
								}
							}
						}
					}
				}
			});
		}
		
		if (vbIsBeforeDpCol) {
			vbIsBeforeDpCol = false;
			continue;
		}
		
		if (voBeforeDpColInfo["colIdx"] == idx) {
			vnHdrColIdx = idx - 1;
			vnColSpan = voBeforeDpColInfo["colSpan"];
			vsDisplayText = voBeforeDpColInfo["text"];
			vsDisplayLoca = voBeforeDpColInfo["loca"];
			voBeforeDpColInfo = {};
		}
		
		var voHeaderColumn = voHeader.getColumn(vcGrid.getHeaderCellIndices(idx)[0]);
		var voDetailColumn = voDetail.getColumn(idx);

		if(!voHeaderColumn || !voDetailColumn) return;
		
		if (!voDetailColumn || voDetailColumn.columnType == "checkbox" || voDetailColumn.columnType == "radio") continue;
		var vsSubText = null;
		
		if (voHeaderColumn.rowIndex > 0) {
			var vaHeaderCellIndexs = vcGrid.getHeaderCellIndices(voDetailColumn.cellIndex);
			var vaHeaderTexts = [];
			for (var cell = 0; cell < vaHeaderCellIndexs.length; cell++) {
				var vsText = vcGrid.header.getColumn(vaHeaderCellIndexs[cell]).text;
				vaHeaderTexts.push(vsText);
			}
			vsSubText = vaHeaderTexts.join("-");
		}
		
		// AutoFit이 해제된 컬럼인 경우 고정 값으로 생성
		var vsWidth = "1fr";
		if (vaAutoFitCols.length  && vaAutoFitCols.indexOf(voDetailColumn.colIndex.toString()) == -1) {
			vsWidth = vcGrid.getColumnWidths()[voDetailColumn.colIndex];
		}
		
		var voColumn = {
			text: voHeaderColumn.text,
			visible: (vcGrid.getColIndicesByVisible(true).indexOf(voDetailColumn.colIndex) > -1),
			columnName: voDetailColumn.columnName,
			columnType: voDetailColumn.columnType,
			control: voDetailColumn.control,
			cellConstraint: voDetailColumn.cellProp.constraint, // detail 의 cellConstraint
			subText: vsSubText,
			displayText: vsDisplayText,
			displayLoca: vsDisplayLoca,
			width: vsWidth,
			headerCellClass: voHeaderColumn.style.getClasses(),
			detailCellClass: voDetailColumn.style.getClasses()
		};
		this._columnSettings.push(voColumn);
	}
}

/**
 * 현재 그리드 설정 초기 정보 반환
 * @private
 * @return {cpr.controls.gridpart.GridConfig} 그리드 초기 설정 정보
 */
RGrid.prototype._getGridInitInfo = function() {
	var vcGrid = this._grid;
	
	return vcGrid.getInitConfig();
}

/**
 * 
 * @param {cpr.controls.Grid} pcGrid
 * @param {Number} pnIndex 디테일 셀 인덱스
 */
function _getColumnText(pcGrid, pnIndex) {
	var headerCell = pcGrid.getHeaderCellIndices(pnIndex);
	var vsResult = [];
	if (headerCell.length > 0) {
		headerCell.forEach(function(each) {
			var colNm = pcGrid.header.getColumn(each);
			vsResult.push(colNm.text || "");
		});
	}
	
	return vsResult.join("/");
}
 
 function _hasArrayValue (sourceArr, targetArr) {
 	var hasValue = sourceArr.some(function(each) {
 		return targetArr.indexOf(each) !== -1;
 	});
 	return hasValue;
 }
 
 
 /**
 * CUD 기능을 위한 상세 팝업을 생성합니다.
 */
RGrid.prototype._createDetailPopup = function () {
	var that = this;
	var vcGrid = that._grid;
	
	// 팝업은 Grid 당 최초 한번만 생성되며, 이후 기존에 생성된 팝업을 활용함
	if(that._popup) return;
	
	// ATTR_VIEW_COLUMN_INDICES 과는 무관하게 신규 데이터는 무조건 모든 컬럼 보이도록 처리
	if (that._gridType == "massiveList") {
		var tmpGrid = new cpr.controls.Grid();
		tmpGrid.init(that._gridInitInfo);
		// FIXME (massiveList)현재 보여지는 컬럼만 신규팝업에 표시하고자 할 경우에는 아래 주석을 해제하십시오.
		//		vcGrid.getRowHeight().forEach(function(row, idx){
		//			if(row == 0)  tmpGrid.columnVisible(idx, false, "column-index");
		//		});
		vcGrid = tmpGrid;
	} else {
		// FIXME (accordionType,dialogType,list) 현재 보여지는 컬럼만 신규팝업에 표시하고자 할 경우에는 아래 주석을 해제하십시오.
		vcGrid.getColIndicesByVisible(false).forEach(function(index){
			if(that._originInvisible.indexOf(index) == -1) {
        		vcGrid.columnVisible(index, true, "column-index");
			}
		});
	}
	
	// 최초 팝업화면 생성
	var columnInfos = vcGrid.getColumnLayout(true).columnLayout;
	var voApp = new cpr.core.App("responsiveGrid_ListPopup", {
		onCreate: function(app, exports){
			// Start - User Script
			function onBodyLoad (e) {
				var initValue = app.getHostProperty("initValue");
				if(initValue) {
					var dmData = app.lookup("dmData");
					dmData.build(initValue["data"]);
					dmData.setValue("rowindex", initValue["rowIndex"]);
					app.lookup("grpForm").redraw();
				}
			}
			
			function onBtnCloseClick (e) {
				app.close();
			}
			
			function onBtnSaveClick (e) {
				app.close(app.lookup("dmData").getDatas());
			}
			// End - User Script
			
			// Header
			var dmData = new cpr.data.DataMap("dmData");
			dmData.parseData({columns: [{dataType: "number", name: "rowindex"}]});
			dmData.alterColumnLayout = "merge";
			app.register(dmData);
			
			// Configure root container
			var container = app.getContainer();
			container.style.setClasses(maDetailPopupOption.root.style.containerClass);
			
			// Layout
			var verticalLayout = new cpr.controls.layouts.VerticalLayout();
			verticalLayout.topMargin = maDetailPopupOption.root.layout.topMargin;
			verticalLayout.leftMargin = maDetailPopupOption.root.layout.leftMargin;
			verticalLayout.rightMargin = maDetailPopupOption.root.layout.rightMargin;
			verticalLayout.bottomMargin = maDetailPopupOption.root.layout.bottomMargin;
			verticalLayout.spacing = maDetailPopupOption.root.layout.spacing;
			container.setLayout(verticalLayout);
			
			// UI Configuration
			var grpForm = new cpr.controls.Container("grpForm");
			grpForm.style.setClasses(maDetailPopupOption.content.style.containerClass);
			var formlayout = new cpr.controls.layouts.FormLayout();
			formlayout.setRows((function(){
				var result = [];
				columnInfos.forEach(function(each) {
					if(each.visible) result.push("28px");
				});
				return result;
			})());
			formlayout.setColumns(["0px", "1fr"]);
			formlayout.setColumnAutoSizing(0, true);
			formlayout.horizontalSpacing = maDetailPopupOption.content.layout.horisontalSpacing;
			formlayout.verticalSpacing = maDetailPopupOption.content.layout.verticalSpacing;
			formlayout.topMargin = maDetailPopupOption.content.layout.topMargin;
			formlayout.leftMargin = maDetailPopupOption.content.layout.leftMargin;
			formlayout.rightMargin = maDetailPopupOption.content.layout.rightMargin;
			formlayout.bottomMargin = maDetailPopupOption.content.layout.bottomMargin;
			if(maDetailPopupOption.content.layout.useLabelShade) formlayout.setUseColumnShade(0, true);
			formlayout.horizontalSeparatorWidth = maDetailPopupOption.content.layout.horizontalSeparatorWidth;
			grpForm.setLayout(formlayout);
			grpForm.setBindContext(new cpr.bind.DataMapContext(app.lookup("dmData")));
			
			var headerBand = vcGrid.header;
			var detailBand = vcGrid.detail;
			var row = 0;
			var vnBefHeaderCellIndex = -1;
			columnInfos.forEach(function(info, idx){
				if(info.visible) {
					var voDColumn = detailBand.getColumn(idx);
					var voDCtrl = detailBand.getControl(idx);
					if(voDColumn) {
						var vaHeaderCelIndicies = vcGrid.getHeaderCellIndices(idx);
						vaHeaderCelIndicies = vaHeaderCelIndicies.filter(function(each) {
							// 헤더가 다중 행일 경우, 가장 마지막 행에 배치된 헤더 cellIndex 만 타겟으로 한다.
							var targetColumn = vcGrid.header.getColumn(each);
							var vnHeaderLen = vcGrid.header.getRowHeights().length;
							return (targetColumn.rowIndex == vnHeaderLen - 1) || (targetColumn.rowSpan == vnHeaderLen);
						});
						
						if (vaHeaderCelIndicies.length > 0 && vnBefHeaderCellIndex == vaHeaderCelIndicies[0]) {
							var befCtrl = grpForm.getLastChild();
							if(befCtrl instanceof cpr.controls.Container) {
								var childLyt = befCtrl.getLayout();
								var columns = childLyt.getColumns();
								
								var voTargetColumnLayout = vcGrid.getColumnLayout().columnLayout[voDColumn.colIndex];
								if (voTargetColumnLayout.autoFit) {
									columns.push("1fr");
								} else {
									columns.push(voTargetColumnLayout.width + "px");
								}
								childLyt.setColumns(columns);
								
								var child = null;
								if(voDCtrl) {
									child = that._ctrlCopy.copy(voDCtrl);
								} else {
									child = this._copyDefaultCell(voDColumn);
								}
								
								child.readOnly = false;
								befCtrl.addChild(child, {
									rowIndex : 0,
									colIndex : columns.length-1
								});
							} else {
								var tmpContainer = new cpr.controls.Container();
								var formLyt = new cpr.controls.layouts.FormLayout();
								formLyt.setRows(["1fr"]);
								
								var cols = ["1fr"];
								var voTargetColumnLayout = vcGrid.getColumnLayout().columnLayout[voDColumn.colIndex];
								if (voTargetColumnLayout.autoFit) {
									cols.push("1fr");
								} else {
									cols.push(voTargetColumnLayout.width + "px");
								}
								
								formLyt.setColumns(cols);
								tmpContainer.setLayout(formLyt);
								
								// 기존 컨트롤 추가
								var voOriginConstraint = grpForm.getConstraint(befCtrl);
								tmpContainer.addChild(befCtrl, {
									rowIndex : 0,
									colIndex : 0
								});
								
								var child = null;
								if(voDCtrl) {
									child = that._ctrlCopy.copy(voDCtrl);
								} else {
									child = new cpr.controls.Output();
									if (voDColumn.columnName != "" && voDColumn.columnName != null && voDColumn.columnName != undefined) {
										child.bind("value").toDataColumn(voDColumn.columnName);
									} else {
										if(voDColumn.columnType == "rowindex") {
											child.bind("value").toDataColumn("rowindex");
										}
									}
								}
								
								// 병합된 셀의 자식 컬럼(or 컨트롤) 추가
								child.readOnly = false;
								tmpContainer.addChild(child, {
									rowIndex : 0,
									colIndex : 1
								});
								
								grpForm.addChild(tmpContainer, voOriginConstraint);
							}
							
							// 이전 rowIndex 에 합치면서 현재 비어있는 row는 숨김처리
							grpForm.getLayout().setRowVisible(row++, false);
							return;	
						}
						
						// 라벨
						var label = new cpr.controls.Output();
						label.style.setClasses(maDetailPopupOption.content.style.labelClass);
						label.value = _getColumnText(vcGrid, voDColumn.cellIndex, " - ");
						grpForm.addChild(label, {
							rowIndex : row,
							colIndex : 0
						});
						
						// 컨트롤
						var ctrl = null;
						if(voDCtrl) {
							ctrl = that._ctrlCopy.copy(voDCtrl);
						} else {
							ctrl = new cpr.controls.Output();
							if (voDColumn.columnName != "" && voDColumn.columnName != null && voDColumn.columnName != undefined) {
								ctrl.bind("value").toDataColumn(voDColumn.columnName);
							} else {
								if (voDColumn.columnType == "rowindex") {
									ctrl.bind("value").toDataColumn("rowindex");
								}
							}
						}
						
						// dialogType 의 상세버튼이 포함되어 있는 경우 제거
						if(ctrl.userAttr("__responseButton__") == "true") {
							formlayout.setRowVisible(row, false);
						}
						
						ctrl.readOnly = false;
						grpForm.addChild(ctrl, {
							rowIndex : row++,
							colIndex : 1
						});
						
						vnBefHeaderCellIndex = vaHeaderCelIndicies[0];
					}
				}
			});
			
			container.addChild(grpForm, {
				autoSize : "height"
			});
			
			var grpFooter = new cpr.controls.Container();
			grpFooter.style.setClasses(maDetailPopupOption.footer.style.containerClass);

			var flowlayout = new cpr.controls.layouts.FlowLayout();
			flowlayout.horizontalAlign = maDetailPopupOption.footer.layout.horizontalAlign;
			flowlayout.horizontalSpacing = maDetailPopupOption.footer.layout.horizontalSpacing;
			flowlayout.verticalSpacing = maDetailPopupOption.footer.layout.verticalSpacing;
			flowlayout.topMargin = maDetailPopupOption.footer.layout.topMargin;
			flowlayout.leftMargin = maDetailPopupOption.footer.layout.leftMargin;
			flowlayout.rightMargin = maDetailPopupOption.footer.layout.rightMargin;
			flowlayout.bottomMargin = maDetailPopupOption.footer.layout.bottomMargin;
			grpFooter.setLayout(flowlayout);

			var btnClose = new cpr.controls.Button("btnClose");
			btnClose.style.setClasses(maDetailPopupOption.footer.style.closeButtonClass);
			btnClose.value = "닫기";
			if (typeof onBtnCloseClick == "function") {
				btnClose.addEventListener("click", onBtnCloseClick);
			}
			grpFooter.addChild(btnClose, {
				height : "28px",
				autoSize : "width"
			});
			
			var btnSave = new cpr.controls.Button("btnSave");
			btnSave.style.setClasses(maDetailPopupOption.footer.style.saveButtonClass);
			btnSave.value = "저장";
			if (typeof onBtnSaveClick == "function") {
				btnSave.addEventListener("click", onBtnSaveClick);
			}
			grpFooter.addChild(btnSave, {
				height : "28px",
				autoSize : "width"
			});
			
			container.addChild(grpFooter, {
				autoSize : "height"
			});
			
			if(typeof onBodyLoad == "function"){
				app.addEventListener("load", onBodyLoad);
			}
		}
	});
	cpr.core.Platform.INSTANCE.register(voApp);
	
	// 기존 객체 return 제거하고, RGrid 객체 당 팝업 객체 할당
	that._popup = voApp;
}

/**
 * 반응형 그리드를 대상으로 데이터를 추가하기 위한 팝업을 호출합니다.
 * @param {any} pfCallback
 */
RGrid.prototype.insertDetailPopup = function (pfCallback) {
	var that = this;
	var grid = this._grid;
	
	that._createDetailPopup();
    var voPopup = that._popup;
	that._app.openDialog(voPopup, {width : 400, height : -1}, function(dialog){
		dialog.ready(function(dialogApp){
			var data = {};
			grid.dataSet.getColumnNames().forEach(function(each){data[each] = "";})
			dialogApp.initValue = {
				data : data,
				type : "INSERT"
			}
			
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
				// 팝업 호출 후, 화면 중앙에 재배치
				if (dialogApp.disposed) return;
				
				var vnRootHeight = dialog.getAppInstance().getActualRect().height;
				var vnDlgHeight = dialog.getActualRect().height;
				
				 // 팝업의 height 가 최대 설정 높이보다 길 경우, 최대 높이로 값 변경 (2025.07.30)
                // FIXME 현재 화면의 높이를 최대 높이로 설정하였으며, 특정 높이로 설정하고자 할 경우에는 maxHeight 을 수정하십시오.
                var maxHeight = vnRootHeight; 
                if(vnDlgHeight > maxHeight) {
                	vnDlgHeight = maxHeight;
                }
                            
				var voDialogMngr = dialog.getAppInstance().dialogManager;
				var vsDialogNm = voDialogMngr.getDialogName(dialog);
				
				voDialogMngr.updateConstraintByName(vsDialogNm, {
					"top": (vnRootHeight / 2) - (vnDlgHeight / 2),
                    "height" : vnDlgHeight
				});
				
				// updateConstraintByName 즉시 적용
				cpr.core.DeferredUpdateManager.INSTANCE.update();
			});
		});
	}).then(function(returnValue){
		if(returnValue) {
			// 마지막 행에 데이터 추가
			var rowCount = grid.getRowCount();
			grid.insertRowData(rowCount, true, returnValue);
			
			// 콜백함수 호출
			if (pfCallback && typeof pfCallback == "function") {
				pfCallback(returnValue);
			}
		}
	});
}

/**
 * 헤더셀이 병합되어 함께 배치되는 디테일 컬럼인지 확인
 * 병합되어 있는 경우에는 targetContainer 에 함께배치될 수 있도록 Constraint 를 조정합니다.
 * @param {cpr.controls.Container} targetContainer 
 * @param {Number} cellIndex
 * @param {Number} rowIndex
 * @param {Number} pnBefHeaderCellidx
 */
RGrid.prototype._checkSuppressibleDetailColumn = function(targetContainer, cellIndex, rowIndex, pnBefHeaderCellidx) {
	var grid = this._grid;
	var voDtlBand = grid.detail;
	var voDColumn = voDtlBand.getColumn(cellIndex);
	
	var vaHdrCellIndices = grid.getHeaderCellIndices(cellIndex);
	vaHdrCellIndices = vaHdrCellIndices.filter(function(each) {
		// 헤더가 다중 행일 경우, 가장 마지막 행에 배치된 헤더 cellIndex 만 타겟으로 한다.
		var targetColumn = grid.header.getColumn(each);
		var vnHeaderLen = grid.header.getRowHeights().length;
		return (targetColumn.rowIndex == vnHeaderLen - 1) || (targetColumn.rowSpan == vnHeaderLen);
	});
	
	
	if (vaHdrCellIndices.length > 0 && pnBefHeaderCellidx == vaHdrCellIndices[0]) {
		var childCtrl = targetContainer.getLastChild();
		if (!(childCtrl instanceof cpr.controls.Container)) {
			var tmpContainer = new cpr.controls.Container();
			var formLyt = new cpr.controls.layouts.FormLayout();
			formLyt.setRows(["1fr"]);
			
			var cols = ["1fr"];
			var voTargetColumnLayout = grid.getColumnLayout().columnLayout[voDColumn.colIndex];
			if (voTargetColumnLayout.autoFit) {
				cols.push("1fr");
			} else {
				cols.push(voTargetColumnLayout.width + "px");
			}
			
			formLyt.setColumns(cols);
			tmpContainer.setLayout(formLyt);
			
			// 기존 컨트롤 추가
			var voOriginConstraint = targetContainer.getConstraint(childCtrl);
			tmpContainer.addChild(childCtrl, {
				rowIndex: 0,
				colIndex: 0
			});
			
			var child = null;
			if (voDColumn.control) {
				child = this._ctrlCopy.copy(voDColumn.control);
			} else {
				child = this._copyDefaultCell(voDColumn);
			}
			
			// 병합된 셀의 자식 컬럼(or 컨트롤) 추가
			tmpContainer.addChild(child, {
				rowIndex: 0,
				colIndex: 1
			});
			
			targetContainer.addChild(tmpContainer, voOriginConstraint);
		} else {
			var childLyt = childCtrl.getLayout();
			var columns = childLyt.getColumns();
			
			var voTargetColumnLayout = grid.getColumnLayout().columnLayout[voDColumn.colIndex];
			if (voTargetColumnLayout.autoFit) {
				columns.push("1fr");
			} else {
				columns.push(voTargetColumnLayout.width + "px");
			}
			childLyt.setColumns(columns);
			
			var child = null;
			if (voDColumn.control) {
				child = this._ctrlCopy.copy(voDColumn.control);
			} else {
				child = this._copyDefaultCell(voDColumn);
			}
			
			childCtrl.addChild(child, {
				rowIndex: 0,
				colIndex: columns.length - 1
			});
		}
		
		// 이전 rowIndex 에 합치면서 현재 비어있는 row는 숨김처리
		targetContainer.getLayout().setRowVisible(rowIndex, false);
		
		return {headerCellIndex : vaHdrCellIndices[0], isSuppressible: true};
	}
	
	return {headerCellIndex : vaHdrCellIndices[0], isSuppressible: false};
}

/**
 * 그리드 내 디테일 셀에 컨트롤이 배치되지 않은 경우, 추가할 아웃풋 컨트롤을 생성합니다.
 * @param {cpr.controls.gridpart.GridDetailColumn} poColumn 디테일 셀
 */
RGrid.prototype._copyDefaultCell = function(poColumn) {
	var vcCopyControl = new cpr.controls.Output();
	
	if (poColumn.columnName != "" && poColumn.columnName != null && poColumn.columnName != undefined) {
		vcCopyControl.bind("value").toDataColumn(poColumn.columnName);
	} else {
		if (poColumn.columnType == "rowindex") {
			vcCopyControl.bind("value").toExpression("rowIndex + 1");
		}
	}
	
	return vcCopyControl;
}

 
/************************************************
 * AccrodionType
 ************************************************/
/**
 * 그리드 일부 컬럼을 숨기고 그리드를 폼 형태로 동적 생성합니다.
 */
RGrid.prototype._collapse = function() {
	var vcGrid = this._grid;
	vcGrid.visible = false;
	
	this._container = new cpr.controls.Container();
	var vaLayout = new cpr.controls.layouts.FormLayout();
	this._container.setLayout(vaLayout);
	
	var vnHeight = vcGrid.header.getRowHeight(0);
	vaLayout.setRows([vnHeight + "px", "1fr"]);
	
	var vaAllColumns = []; // 모든 colIndex 컬럼
	var voAllColMap = {};
	
	var vaHideColumn = []; // visible = false 컬럼 (accordion 내 모든 layout 을 그린 후 setColumnVisible 하기 위함)
	var vaVisibleColumns = []; // visible = true 컬럼
	for(var j = 0; j < this._columnSettings.length; j++) {
		var voItem = this._columnSettings[j];
		var vnColIndex = voItem.cellConstraint.colIndex;
		
		if(!voAllColMap[vnColIndex]) {
			voAllColMap[vnColIndex] = true;
			vaAllColumns.push(voItem);
		}
		
		if(voItem.visible == true) {
			vaVisibleColumns.push(voItem);
		} else {
			vaHideColumn.push(voItem); 
		}
	}
	this._visibleColumns = vaVisibleColumns;
	
	var vaAllColIndexColumns = vaAllColumns.map(function(each) {
		return each.width;
	});
	
	if (maAccordionOption.showExpandButton) {
		vaAllColIndexColumns.splice(0, 0, "30px");
	}
	vaLayout.setColumns(["1fr"]);
	
	vaLayout.setRowAutoSizing(0, true);
	
	vaLayout.horizontalSpacing = "0px";
	vaLayout.verticalSpacing = "0px";
	vaLayout.horizontalSeparatorWidth = 1;
	vaLayout.verticalSeparatorWidth = 1;
	vaLayout.setUseRowShade(0, true);
	vaLayout.columnShadeClass = maAccordionOption.style.headerClass;
	this._container.style.setClasses(maAccordionOption.style.containerClass);
	
	// 1. 헤더 영역 추가
	this._innerHeaderContainer = new cpr.controls.Container();
	this._innerHeaderContainer.htmlAttr("uuid", this._innerHeaderContainer.uuid);
	this._setHeaderCells(vaAllColIndexColumns, vaHideColumn);
	this._container.addChild(this._innerHeaderContainer, {
		colIndex: 0,
		rowIndex: 0
	});
	
	// 2. 디테일 영역 추가
	this._innerContainer = new cpr.controls.Container();
	this._innerContainer.htmlAttr("uuid", this._innerContainer.uuid);
	this._setDetailCells(vaAllColIndexColumns, vaHideColumn); // 디테일 내부 동적 생성
	this._container.addChild(this._innerContainer, {
		colIndex: 0,
		rowIndex: vaLayout.getRowDivisions().length-1
	});
	
	// grid cell-click 이벤트 전파
	this._container.addEventListener("click", function(e){
		/** @type cpr.controls.UIControl */
		var vcTargetCtrl = e.targetControl;
		
		var hasStyleClass = _hasArrayValue(vcTargetCtrl.style.getClasses(), maAccordionOption.style.expanderClass);
		
		if(vcTargetCtrl.style.hasClass("label") 
		|| (vcTargetCtrl instanceof cpr.controls.Container)
		|| (vcTargetCtrl instanceof cpr.controls.Button && hasStyleClass)) return; // 헤더 셀 리턴
		if(ValueUtil.isNull(vcTargetCtrl.getBindContext())) return;
		
		var vnTargetRowIndex = vcTargetCtrl.getBindContext().rowIndex;
		var vsTargetColumnName = vcTargetCtrl.getBindInfo("value") ? vcTargetCtrl.getBindInfo("value").columnName : "";
		var vsTargetCellIndex = vcGrid.detail.getColumnByName(vsTargetColumnName)[0] ? vcGrid.detail.getColumnByName(vsTargetColumnName)[0].cellIndex : "";
		
		var voOption = {
			relativeTargetName: "detail",
			row: vcGrid.getRow(vnTargetRowIndex),
			rowIndex: vnTargetRowIndex,
			cellIndex: vsTargetCellIndex,
			columnName: vsTargetColumnName,
			cellBoundingRect: vcGrid.getCellBounds("detail", vnTargetRowIndex, vsTargetCellIndex)
		};
		var vfCellClickEvt = new cpr.events.CGridMouseEvent(cpr.events.GridEventType.CELL_CLICK, voOption);
		vcGrid.dispatchEvent(vfCellClickEvt);
	});
	
	var vnTargetIndex = this._parentContainer.getChildren().indexOf(vcGrid);
	var vaAllChild = this._parentContainer.getChildren();
	var voCalc = "calc(100%)";
	for (var i = 0; i < vaAllChild.length; i++) {
		if(vaAllChild[i].id != vcGrid.id) {
			var voParentContainer = this._parentContainer;
			if(!voParentContainer.getParent()) continue;
			
			var voConstraint = voParentContainer.getConstraint(vaAllChild[i]);
			if(voConstraint.height) {
				var vnHeight = Number(voConstraint.height.split("px")[0]);
				var vnSpacing = voParentContainer.getLayout().spacing; // 빼기
				var vnTopM = voParentContainer.getLayout().topMargin;
				var vnBottomM = voParentContainer.getLayout().bottomMargin;
				vnHeight = vnHeight + (vnSpacing * (vaAllChild.length-1)) + vnTopM + vnBottomM;
				
				var voParentCons = voParentContainer.getParent().getConstraint(voParentContainer);
				if(voParentCons && voParentCons.autoSize == "height") {
					voCalc = voParentContainer.getConstraint(vcGrid).height;
				} else {
					voCalc = "calc(100% - " + vnHeight + "px)";					
				}
			}
		}
	}
	
	// 디테일 스크롤 여부에 따라 헤더의 우측 spacing 조정
	var voContainer = this._container;
	var voInnerHeaderContainer = this._innerHeaderContainer; // 헤더 영역
	var voInnerContainer = this._innerContainer; // 디테일 영역
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		var voScrollDetailContent = document.querySelector("div[data-usr-uuid = '" + voInnerContainer.htmlAttr("uuid") + "']").getElementsByClassName("cl-scrollbar")[0];
		if(voScrollDetailContent.offsetWidth - voScrollDetailContent.scrollWidth > 0) {
			voContainer.updateConstraint(voInnerHeaderContainer, {
				rightSpacing: voScrollDetailContent.offsetWidth - voScrollDetailContent.scrollWidth
			});
		}
	});
	
	var psAutoSize = "height";
	if(!this._gridAuto) psAutoSize = "none";
	this._parentContainer.insertChild(vnTargetIndex, this._container, {
		autoSize: psAutoSize,
		rowIndex: vnTargetIndex,
		height: voCalc
	});
}

/**
 * 그리드 헤더 영역을 생성합니다.
 * @private
 */
RGrid.prototype._setHeaderCells = function(paColCount, paHideCols) {
	var vcGrid = this._grid;
	var voLayout = new cpr.controls.layouts.FormLayout();
	this._innerHeaderContainer.setLayout(voLayout);
	voLayout.horizontalSpacing = 0;
	voLayout.verticalSpacing = 0;
	var vaHeights = vcGrid.header.getRowHeights();
	var vaLayoutRows = [];
	vaHeights.forEach(function(each){
		vaLayoutRows.push(each.height + "px");
	});
	voLayout.setRows(vaLayoutRows);
	voLayout.setColumns(paColCount);
	
	voLayout.horizontalSeparatorWidth = 1;
	voLayout.verticalSeparatorWidth = 1;
	
	if (maAccordionOption.autoRowHeight) {
		voLayout.setRowAutoSizing(0, true);
	}
	
	for(var idx = 0; idx < vcGrid.header.cellCount; idx++){
		var voHeaderColumn = vcGrid.header.getColumn(idx);
		var vsHeaderText = voHeaderColumn.text;

		var voHeaderCell = new cpr.controls.Output();
		voHeaderCell.value = vsHeaderText;
		voHeaderCell.style.setClasses(voHeaderColumn.style.getClasses().concat(maAccordionOption.style.headerCellClass));
		
		this._innerHeaderContainer.addChild(voHeaderCell, {
			rowSpan : voHeaderColumn.rowSpan,
			colIndex: voHeaderColumn.colIndex + (maAccordionOption.showExpandButton ? 1 : 0),
			rowIndex : voHeaderColumn.rowIndex,
			colSpan : voHeaderColumn.colSpan
		});
	}
	
	paHideCols.forEach(function(each) {
		voLayout.setColumnVisible(each.cellConstraint.colIndex + (maAccordionOption.showExpandButton ? 1 : 0), false);
	});
}


/**
 * 그리드 디테일 영역을 생성합니다.
 * @param {Number} paColCount 컬럼 개수
 * @param {Array} paHideCols
 * @private
 */
RGrid.prototype._setDetailCells = function(paColCount, paHideCols) {
	var that = this;
	
	var vcGrid = this._grid;
	var voLayout = new cpr.controls.layouts.VerticalLayout();
	this._innerContainer.setLayout(voLayout);
	
	voLayout.spacing = 0;
	var vaVisibleColumn = this._columnSettings.filter(function(each) {
		return each.visible == true;
	});
	
	// 1. 디테일 영역 구성
	var vnHeight = this._container.getLayout().getRows()[0];
	var vaRows = this._container.getLayout().getRows();
	var vaHeights =  vcGrid.detail.getRowHeights();	
	var vaLayoutRows = [];
	vaHeights.forEach(function(each){
		vaLayoutRows.push(each.height + "px");
	});
	var vnRowCount = this._grid.getRowCount();
	for (var vnRow = 0; vnRow < vnRowCount; vnRow++) {
		var voTableRow = new cpr.controls.Container();
		var voTableRowLayout = new cpr.controls.layouts.FormLayout();
		voTableRow.setLayout(voTableRowLayout);
		
		voTableRowLayout.setColumns(paColCount);
		voTableRowLayout.setRows(vaLayoutRows);
		voTableRowLayout.verticalSeparatorWidth = 1;
		voTableRowLayout.horizontalSeparatorWidth = 1;
		voTableRowLayout.horizontalSpacing = "0px";
		voTableRowLayout.verticalSpacing = "0px";
		
		voTableRow.style.addClass(maAccordionOption.style.rowClass);
		voTableRow.setBindContext(new cpr.bind.DataRowContext(this._grid.dataSet, vnRow));
		
		var vnDetailColCnt = voTableRowLayout.getColumns().length;
		var vnDetailRowCnt = voTableRowLayout.getRows().length;
		
		var vnDetailCellCnt = vnDetailColCnt * vnDetailRowCnt;
		
		if (!maAccordionOption.showExpandButton) {
			voTableRow.addEventListener("click", this._onClick);
		} else {
			vnDetailCellCnt -= 1;
			
			var vcExpander = new cpr.controls.Button();
			vcExpander.bind("tooltip").toExpression("this.getParent().style.hasClass(\"selected\") ? \"상세 접기\" : \"상세 펼치기\"");
			vcExpander.style.setClasses(maAccordionOption.style.expanderClass);
			vcExpander.addEventListener("click", this._onClick);
			voTableRow.addChild(vcExpander, {
				colIndex: 0,
				rowIndex: 0
			});
		}
		
		if (maAccordionOption.autoRowHeight) {
			voTableRowLayout.setRowAutoSizing(vnRow, true);
		}
		
		// 2. 디테일 셀 컨트롤 추가
		var voColIndexMap = {}; // rowIndex별 colIndex 추적용
		for (var vnCol = 0; vnCol < vcGrid.detail.cellCount; vnCol++) {
			var voColumn = vcGrid.detail.getColumn(vnCol);
			
			var voChild = null;
			if(!ValueUtil.isNull(voColumn.control)) {
				voChild = this._ctrlCopy.copy(voColumn.control);
				voChild.style.setClasses(voColumn.style.getClasses());
			} else {
				voChild =  this._copyDefaultCell(voColumn);
				voChild.style.setClasses(voColumn.style.getClasses());
			}
			
			voTableRow.addChild(voChild, {
				rowSpan : voColumn.rowSpan,
				colIndex: voColumn.colIndex + (maAccordionOption.showExpandButton ? 1 : 0),
				rowIndex : voColumn.rowIndex,
				colSpan : voColumn.colSpan
			});
		}
		
		paHideCols.forEach(function(each) {
			voTableRowLayout.setColumnVisible(each.cellConstraint.colIndex + (maAccordionOption.showExpandButton ? 1 : 0), false);
		});
	
		this._innerContainer.addChild(voTableRow, {
			autoSize: "height"
		});
	}
	
	// 3. 디테일 아코디언 행 추가
	var vaHideCellIdxs = this._hideCellIdxs;
	var vaHideColumns = this._columnSettings.filter(function(each) {
		// 반응형 동작을 위해 구성된 표시항목 외 visible = false 인컬럼 숨김
		var vnTargetColIndex = each.cellConstraint.colIndex;
		return !each.visible && vaHideCellIdxs.indexOf(vnTargetColIndex) != -1;
	}).sort(function(a,b){
		var vnAfterColIndex = a.cellConstraint.colIndex;
		var vnBefColIndex = b.cellConstraint.colIndex;
		return (vnAfterColIndex -vnBefColIndex);
	});
	
	var vaAccordionCols = [];
	for (var idx = 0; idx < vaHideColumns.length; idx++) {
		vaAccordionCols.push(vnHeight);
	}
	
	var vnChildCount = this._innerContainer.getChildrenCount();
	for (var vnARow = 0; vnARow < vnChildCount; vnARow++) {
		var voAccordion = new cpr.controls.Container();
		var voAccordionLayout = new cpr.controls.layouts.FormLayout();
		voAccordion.setLayout(voAccordionLayout);
		
		voAccordionLayout.topMargin = maAccordionOption.layout.margin;
		voAccordionLayout.rightMargin = maAccordionOption.layout.margin;
		voAccordionLayout.bottomMargin = maAccordionOption.layout.margin;
		voAccordionLayout.leftMargin = maAccordionOption.layout.margin;
		
		voAccordionLayout.setRows(vaAccordionCols);
		voAccordionLayout.setColumns(["1px", "1fr"]);
		voAccordionLayout.setColumnAutoSizing(0, true);
		voAccordion.style.setClasses(maAccordionOption.style.accordionRowClass);
		voAccordion.visible = false;
		
		voAccordion.setBindContext(new cpr.bind.DataRowContext(this._grid.dataSet, vnARow));
		
		if (maAccordionOption.autoRowHeight) {
			for (var vnIdx = 0; vnIdx < voAccordionLayout.getRows().length; vnIdx++) {
				voAccordionLayout.setRowAutoSizing(vnIdx, true);
			}
		}
		
		var vnAccordionBefHeaderCellIndex = -1; // 이전 헤더 cellIndex, 헤더셀 병합 여부 확인을 위함
		for (var vnInnrRow = 0; vnInnrRow < vaHideColumns.length; vnInnrRow++) {
			var voInnrColumn = vaHideColumns[vnInnrRow];
			
			// 헤더가 병합되어 있는 경우에는 이전 rowIndex 에 추가
			var checkSup = this._checkSuppressibleDetailColumn(voAccordion, voInnrColumn.cellConstraint.cellIndex, vnInnrRow, vnAccordionBefHeaderCellIndex);
			if(checkSup.isSuppressible) continue;
			
			var vsInnerText = _getColumnText(vcGrid, vaHideColumns[vnInnrRow].cellConstraint.cellIndex);
			
			// 인덱스 컬럼의 경우 헤더컬럼명 치환동작 추가
			if(voInnrColumn.columnType == "rowindex"){
				if(AppProperties && vsInnerText != AppProperties.GRID_INDEX_COL_HEADER_TEXT){
					vsInnerText = AppProperties.GRID_INDEX_COL_HEADER_TEXT;
				}
			}
			
			var vcLabel = new cpr.controls.Output();
			vcLabel.value = vsInnerText;
			vcLabel.style.addClass("label");
			vcLabel.style.css("text-align", "right");
			voAccordion.addChild(vcLabel, {
				colIndex: 0,
				rowIndex: vnInnrRow
			});
			
			var voAccordionChild = null;
			if(!ValueUtil.isNull(voInnrColumn.control)) {
				voAccordionChild = this._ctrlCopy.copy(voInnrColumn.control);
			} else {
				voAccordionChild =  this._copyDefaultCell(voInnrColumn);
				voAccordionChild.style.css("text-align", "right");
			}
			voAccordion.addChild(voAccordionChild, {
				colIndex: 1,
				rowIndex: vnInnrRow
			});
			
			// 이전 헤더셀과 병합되어 있는지 여부를 확인하기 위한 header cellIndex 저장
			vnAccordionBefHeaderCellIndex = checkSup.headerCellIndex;
		}
		
		this._innerContainer.insertChild((vnARow * 2) + 1, voAccordion, {
			autoSize: "height"
		});
	}
}

/**
 * 디테일행을 접거나 펼칩니다.
 * @param {cpr.events.CMouseEvent} e
 */
RGrid.prototype._onClick = function(e) {
	/** @type cpr.controls.UIControl */
	var vcControl = e.control;
	
	var voParent = vcControl.getParent();
	if (maAccordionOption.showExpandButton) {
		vcControl = voParent;
		voParent = voParent.getParent();
	}
	/** @type cpr.controls.Container */
	var vcNextControl = voParent.getChildren()[voParent.getChildren().indexOf(vcControl) + 1];
	vcNextControl.visible = !vcNextControl.visible;
	
	if (maAccordionOption.exclusive) {
		voParent.getChildren().filter(function(each) {
			return each.style.hasClass("selected");
		}).forEach(function(each) {
			var voEachParent = each.getParent();
			var vcNextCtrl = voEachParent.getChildren()[voEachParent.getChildren().indexOf(each) + 1];
			vcNextCtrl.visible = false;
			each.style.removeClass("selected");
		});
	}
	
	if (vcNextControl.visible) {
		vcControl.style.addClass("selected");
	} else {
		vcControl.style.removeClass("selected");
	}
	vcControl.redraw();
}


/************************************************
 * DialogType
 ************************************************/
function _fnGridCellClick(e) {
	if(e.columnName == "상세") {
		/** @type cpr.controls.Grid */
		var vcGrid = e.control;
		
		var that = vcGrid["_RGrid"];
		var vsAttrBindFormId = that.ATTR_NM.ATTR_BIND_FORM_ID;
		var vsDialogCud = that.ATTR_NM.ATTR_DIALOG_CUD;
		
		var vnRowIndex = e.rowIndex;
		var _app = vcGrid.getAppInstance();
		var vcGrpBindForm = _app.lookup(vcGrid.userAttr(vsAttrBindFormId));
		
		_app.getRootAppInstance().openDialog("app/com/comPGridCellView", {
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
			headerMovable: false
		}, function(poDialog) {
			poDialog.userAttr({
				"_originWidth": 500,
				"_originHeight": 600
			});
			poDialog.headerTitle = vcGrid.fieldLabel;
			poDialog.initValue = {
				"grid": vcGrid,
				"grpBindForm": vcGrpBindForm,
				"rowIdx": vnRowIndex,
				"editable": vcGrid.userAttr(vsDialogCud)
			};
			
			poDialog.addEventListenerOnce("close", function(evt) {
				var voRowData = evt.control.returnValue;
				
				if (voRowData) {
					if (voRowData == "delete") {
						vcGrid.deleteRow(vnRowIndex);
					} else {
						vcGrid.getRow(vnRowIndex).setRowData(voRowData);
					}
					if (vcGrpBindForm) vcGrpBindForm.redraw();
					
					// 콜백함수 호출
					if (vcGrid.getAppInstance().hasAppMethod(msCallbackFunctionName)) {
						var vsType = (voRowData == "delete") ? "DELETE" : "SAVE";
						var voRtnValRow = vcGrid.getRow(vnRowIndex).getRowData();
						vcGrid.getAppInstance().callAppMethod(msCallbackFunctionName, vsType, voRtnValRow);
					}
				}
			});
		});
	}
}

/**
 * dialogType 사용 시 상세 버튼 컬럼 삽입 및 팝업 연결 처리
 * @private
 * @returns {void}
 */
RGrid.prototype._setViewBtnColumn = function() {
	var vcGrid = this._grid;
	
	var vaColLot = vcGrid.getColumnLayout().header;
	var vnHdrRowCnt = vcGrid.header.getRowHeights().length;
	var vaHedaerCol = vcGrid.header.getColumnByColIndex(0, 1);
	
	if (vaHedaerCol.length > 0 && vaHedaerCol[0].text == maDialogTypeOption.detailHeaderText) return;
	
	vcGrid.addEventListener("cell-click", _fnGridCellClick);
	vcGrid.insertColumn({
		columnLayout: [{
			width: "30px"
		}],
		header: [{
			constraint: {
				rowIndex: 0,
				colIndex: 0,
				colSpan: 1,
				rowSpan: vnHdrRowCnt
			},
			configurator: function(configurator) {
				configurator.text = maDialogTypeOption.detailHeaderText;
			}
		}],
		detail: [{
			constraint: {
				rowIndex: 0,
				colIndex: 0,
				colSpan: 1,
				rowSpan: vcGrid.detail.getRowHeights().length
			},
			configurator: function(cell) {
				cell.control = (function() {
					var vcBtnDetail = new cpr.controls.Button();
					vcBtnDetail.tooltip = "상세 데이터 팝업 버튼";
					vcBtnDetail.fieldLabel = "상세 데이터 팝업 버튼";
					vcBtnDetail.style.setClasses(["icon"]);
//					vcBtnDetail.style.icon.setClasses(["icon", "ico-popup"]);
					vcBtnDetail.icon = "0";
					vcBtnDetail.style.setClasses(maDialogTypeOption.style.detailBtnClass);
					vcBtnDetail.userAttr("__responseButton__", "true");
					return vcBtnDetail;
				})();
				cell.columnName = "상세"
				cell.controlConstraint = {};
			}
		}]
	}, 0, false);
	
	var vsAutoFit = vcGrid.autoFit.replace(/\s/g, "");
	if(vsAutoFit == "all"){
		var vaAutoFit = [];
		for(var i=1; i < vcGrid.columnCount; i++){
			vaAutoFit.push(i);
		}
		vsAutoFit = vaAutoFit.join(",");	
		vcGrid.autoFit = vsAutoFit;
	}	
}


/************************************************
 * List
 ************************************************/
/**
 * list 타입에 맞게 그리드 각 행을 폼 형태로 전환
 * @private
 * @returns {void}
 */
RGrid.prototype._setListForm = function() {
	var that = this;
	var vcGrid = this._grid;
	vcGrid.visible = false;
	
	/*
	 * 헤더 행 개수만큼 헤더 셀을 생성할지 여부를 결정합니다. (vbMaintainMultiHeader)
	 * true : 헤더 행 개수만큼 헤더 셀 생성
	 * false : 하나의 셀에 헤더 텍스트 연결
	 */
	var vbMaintainMultiHeader = false;
	if(this._grid.header.getRowHeights().length == 1) {
		vbMaintainMultiHeader = true;
	}
	
	if(ValueUtil.isNull(this._grid.userAttr(this.ATTR_NM.ATTR_MAINTAIN_MULTI_HEADER))) {
		this._grid.userAttr(this.ATTR_NM.ATTR_MAINTAIN_MULTI_HEADER, vbMaintainMultiHeader.toString()); 
	} else {
		vbMaintainMultiHeader = ValueUtil.fixBoolean(this._grid.userAttr(this.ATTR_NM.ATTR_MAINTAIN_MULTI_HEADER));
	}
	
	this._container = new cpr.controls.Container();
	var voLayout = new cpr.controls.layouts.VerticalLayout();
	voLayout.spacing = parseInt(vcGrid.userAttr(this.ATTR_NM.ATTR_LIST_SPACING)) || 0;
	this._container.setLayout(voLayout);
	this._container.style.setClasses(maListTypeOption.style.containerClass);
	var vnRowHeight = parseInt(vcGrid.userAttr(this.ATTR_NM.ATTR_LIST_ROW_HEIGHT) || vcGrid.detail.getRowHeight(0));

	var vnRowCount = vcGrid.getRowCount();
	for(var vnRIdx = 0; vnRIdx < vnRowCount; vnRIdx++){
		var voRow = vcGrid.getRow(vnRIdx);
		var vsRowStatus = voRow.getStateString();
		if(vsRowStatus == "D" || vsRowStatus == "ID") continue;
		
		that._innerContainer = that._ctrlCopy.convertGridToForm(vcGrid, "detail", vnRowHeight, {
			rowIndex: vnRIdx
		});
		
		// that._ctrlCopy.convertGridToForm 에서 적용된 클래스 제거
//		that._innerContainer.style.removeClass("cl-grid");
//		that._innerContainer.getChildren().forEach(function(child) {
//			child.style.removeClass("cl-grid-cell");
//			child.style.removeClass("border-right");
//		});
		
//		that._innerContainer.style.setClasses(maListTypeOption.style.rowClass);
		
		/** @type cpr.controls.layouts.FormLayout */
		var voInnerLayout = that._innerContainer.getLayout();
		if(maListTypeOption.useColumnShade) {
			if(vbMaintainMultiHeader) {
				this._grid.header.getRowHeights().forEach(function(each, idx){
					voInnerLayout.setUseColumnShade(idx, true);
				});			
			} else {
				voInnerLayout.setUseColumnShade(0, true);
			}
		}
		
		voInnerLayout.topMargin = parseInt(vcGrid.userAttr(that.ATTR_NM.ATTR_LIST_TOP_MARGIN)) || 0;
		voInnerLayout.leftMargin = parseInt(vcGrid.userAttr(that.ATTR_NM.ATTR_LIST_LEFT_MARGIN)) || 0;
		voInnerLayout.rightMargin = parseInt(vcGrid.userAttr(that.ATTR_NM.ATTR_LIST_RIGHT_MARGIN)) || 0;
		voInnerLayout.bottomMargin = parseInt(vcGrid.userAttr(that.ATTR_NM.ATTR_LIST_BOTTOM_MARGIN)) || 0;
	
		voInnerLayout.horizontalSeparatorWidth = maListTypeOption.layout.horizontalSeparatorWidth;
		voInnerLayout.verticalSeparatorWidth = maListTypeOption.layout.verticalSeparatorWidth;
		voInnerLayout.horizontalSpacing = maListTypeOption.layout.horizontalSpacing;
		voInnerLayout.verticalSpacing = maListTypeOption.layout.verticalSpacing;
		
		(function (poContainer) {
			poContainer.getAllRecursiveChildren(false).forEach(function(each){
				if(!(each instanceof cpr.controls.Container)) {
					// cl-grid-cell 내부에 header, detail 영역
					var vsRelativeTarget = "";
					if(each.style.hasClass("cl-grid-header")) {
						each.style.removeClass("cl-grid-header");
						vsRelativeTarget = "header";
						// TODO 헤더셀 스타일 적용
						maListTypeOption.style.headerCellClass.forEach(function(style){
							each.style.addClass(style);
						});
						
					} else {
						vsRelativeTarget = "detail";
						maListTypeOption.style.detailCellClass.forEach(function(style){
							each.style.addClass(style);
						});
					}
					
					// cell-click 이벤트 전파
					var voConstraint = poContainer.getConstraint(each.getParent());
					var voOption = {
						relativeTargetName: vsRelativeTarget,
						row: voRow,
						rowIndex: vnRIdx,
						cellIndex: voConstraint.rowIndex,
						cellBoundingRect: vcGrid.getCellBounds(vsRelativeTarget, vnRIdx, voConstraint.rowIndex),
	//					_mblRowForm: container
					};
					var dColumn = vcGrid.detail.getColumn(voConstraint.rowIndex);
					if(dColumn) {
						voOption["columnName"] = dColumn.columnName
					}
					each.addEventListener("click", function(e){
						var cellClickEvt = new cpr.events.CGridMouseEvent(cpr.events.GridEventType.CELL_CLICK, voOption);
						vcGrid.dispatchEvent(cellClickEvt);
					});
				} else {
					// TODO cl-grid-cell 영역에 스타일 적용을 위해서 아래 주석을 해제하십시오.
	//				each.style.addClass(className);
				}
			});
		})(that._innerContainer);
		
		that._container.addChild(that._innerContainer, {
			autoSize: "height"
		});
	}
	
	var vnTargetIndex = this._parentContainer.getChildren().indexOf(vcGrid) + 1;
	
	if(this._parentContainer.getLayout().type == "formlayout") {
		var voConstraint = this._parentContainer.getConstraint(this._grid);
		this._parentContainer.insertChild(vnTargetIndex, this._container, voConstraint);
	} else {
		this._parentContainer.insertChild(vnTargetIndex, this._container, {
			autoSize: "height"
		});	
	}
}


/************************************************
 * MassiveList
 ************************************************/
/**
 * massiveList 타입에 맞게 그리드 폼 레이아웃 구성
 * @private
 * @returns {void}
 */
RGrid.prototype._setMassiveForm = function() {
	var vcGrid = this._grid;
	var voGridInitConfig = this._gridInitInfo;
	
	// 그리드 init 정보를 새로 정의 할 변수
	var voInitConfig = {
		"dataSet": vcGrid.dataSet,
		"columns": [],
		"detail": {
			"rows": [],
			"cells": []
		}
	};
	
	var voGridHdrBand = vcGrid.header;
	var voGridDtlBand = vcGrid.detail;
	var voGridColumnLayout = vcGrid.getColumnLayout(true);
	
	var vnRowHeaderHeights = voGridHdrBand.getRowHeights(); // 헤더 로우
	var vnRowDetailHeights = voGridDtlBand.getRowHeights(); // 디테일 로우

	/*
	 * 헤더 로우 개수만큼 헤더 셀을 생성할지 여부를 결정합니다. (vbMaintainMultiHeader)
	 * true : 헤더 행 개수만큼 헤더 셀 생성
	 * false : 하나의 셀에 헤더 텍스트 연결
	 */
	var vbMaintainMultiHeader = false;
	if(vnRowHeaderHeights.length == 1) {
		vbMaintainMultiHeader = true;
	}
	
	// 멀티헤더 적용 여부 사용자 속성
	if(!ValueUtil.isNull(this._grid.userAttr(this.ATTR_NM.ATTR_MAINTAIN_MULTI_HEADER))) {
		vbMaintainMultiHeader = ValueUtil.fixBoolean(this._grid.userAttr(this.ATTR_NM.ATTR_MAINTAIN_MULTI_HEADER));
	} 
	
	vcGrid.showDeletedRow = false; // 삭제행 제외
	
	var vaColumnWidths = []; // 그리드의 모든 column
	var vaColVisible = []; // 각 column 의 visible 여부
	
	// setColumns
	voGridColumnLayout.columnLayout.forEach(function(each) {
		vaColumnWidths.push(each.width);
		vaColVisible.push(each.visible);
	}); 
		
	if (vbMaintainMultiHeader) {
		// 헤더 로우 수에 맞게 컬럼 생성
		vnRowHeaderHeights.forEach(function(each) {
			voInitConfig.columns.push({"width": "100px"});
		});
	} else {
		voInitConfig.columns.push({"width": "100px"});
	}
	
	// 디테일 로우 수에 맞게 컬럼 생성
	vnRowDetailHeights.forEach(function(each){
		voInitConfig.columns.push({"width": "100px"});
	});
	
	// setRows
	vaColumnWidths.forEach(function(each, idx) {
		/*
		 * 모든 컬럼을 그리나,
		 * 기존 숨겨진 컬럼이나, view-column-indices 로 설정으로 숨김처리되는 컬럼의 높이는 0px 로 처리
		 */
		var vnHeight = voGridInitConfig.detail.rows[0].height; 
		if(vaColVisible[idx] === false) vnHeight = 0; 
		
		 voInitConfig.detail.rows.push({
		 	height: vnHeight
		 });
	});

	var that = this;	
	voGridHdrBand.getCellIndices().forEach(function(hCellIndex){
		var voHColumn = voGridHdrBand.getColumn(hCellIndex);
		if(voHColumn) {
			var vsHdrText = !vbMaintainMultiHeader ? _getColumnText(vcGrid, voHColumn.colIndex) : voHColumn.text;
			var voHCellInfo = {
				"constraint": {},
				"configurator": function(cell) {
					cell.style.setClasses(["cl-grid-header"]);
					cell.control = (function() {
						var output = new cpr.controls.Output();
						output.value = vsHdrText;
						output.style.css("text-align", "center");
						return output;
					})();
				}
			};
			if(vbMaintainMultiHeader) {
				voHCellInfo.constraint = {
					colIndex: voHColumn.rowIndex,
					colSpan: voHColumn.rowSpan,
					rowIndex: voHColumn.colIndex,
					rowSpan: voHColumn.colSpan
				}
			} else {
				// 한 셀에 멀티 헤더 텍스트 합침
				voHCellInfo.constraint = {
					colIndex: 0,
					rowIndex: voHColumn.colIndex,
				}
			}
			voInitConfig.detail.cells.push(voHCellInfo);
		}
	});
	
	var vnBefHeaderCellIndex = -1;
	var vaLastColIndicies = [];
	voGridDtlBand.getCellIndices().forEach(function(dCellIndex,index){
		var vaHdrCellIndices = vcGrid.getHeaderCellIndices(dCellIndex);
		vaHdrCellIndices = vaHdrCellIndices.filter(function(each) {
			// 헤더가 다중 행일 경우, 가장 마지막 행에 배치된 헤더 cellIndex 만 타겟으로 한다.
			var targetColumn = voGridHdrBand.getColumn(each);
			var vnHeaderLen = voGridHdrBand.getRowHeights().length;
			return (targetColumn.rowIndex == vnHeaderLen - 1) || (targetColumn.rowSpan == vnHeaderLen);
		});
		
		vaLastColIndicies.push(voInitConfig.detail.cells.length);
		
		var voDColumn = voGridDtlBand.getColumn(dCellIndex);
		var vnColIndex = vbMaintainMultiHeader ? vnRowHeaderHeights.length : 1;
		var voDCellInfo = {
			"constraint": {
				"rowIndex": voDColumn.colIndex,
				"colIndex": vnColIndex + voDColumn.rowIndex,
				"rowSpan": voDColumn.colSpan,
				"colSpan": voDColumn.rowSpan
			},
			"configurator": voDColumn.cellProp.configurator
		};
		
		if(vaHdrCellIndices.length > 0 && vnBefHeaderCellIndex == vaHdrCellIndices[0]) {
			vaLastColIndicies.splice(vaLastColIndicies.length-2, 1);
			var diff = voDCellInfo["constraint"]["rowIndex"] - voGridHdrBand.getColumn(vnBefHeaderCellIndex).colIndex;
			
			// 새로운 column 추가
			if (voInitConfig.columns.length <= (voDCellInfo["constraint"]["colIndex"] + diff)) {
				voInitConfig.columns.push({
					"width": "100px"
				});
			}
			voInitConfig.detail.rows[index] = "0px";

			// cellInfo 정보 변경
			voDCellInfo["constraint"]["rowIndex"] -=  diff;
			voDCellInfo["constraint"]["colIndex"] += diff;
			voDCellInfo["constraint"]["colSpan"] = 1;
		}
		
		voInitConfig.detail.cells.push(voDCellInfo);
		
		// 이전 헤더셀과 병합되어 있는지 여부를 확인하기 위한 header cellIndex 저장
		vnBefHeaderCellIndex = vaHdrCellIndices[0];
	});
	
	// voInitConfig.detail.cells 에서 마지막 colIndex 에 배치된 컨트롤들의 colSpan 확장
	var vnColumnLen = voInitConfig.columns.length;
	vaLastColIndicies.forEach(function(each){
		var voConstraint = voInitConfig.detail.cells[each].constraint;
		voConstraint["colSpan"] = (vnColumnLen - voConstraint["colIndex"]);
	});
	
	// 폼레이아웃 형태를 위한 클래스 설정
	vcGrid.style.row.setClasses(maMassiveListTypeOption.style.rowClass);
	vcGrid.init(voInitConfig);
	vcGrid.redraw();
}


/************************************************
 * RGrid 글로벌 출판
 ************************************************/
/**
 * 반응형 그리드 인스턴스 생성 유틸리티
 * @param {cpr.controls.Grid} pcGrid 대상 그리드
 * @returns {RGrid} RGrid 인스턴스
 * @returns {Appkit} util AppKit
 */
globals.makeResponsiveGrid = function(pcGrid, util) {
	return new RGrid(pcGrid, util);
}