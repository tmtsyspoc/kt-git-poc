/************************************************
 * portletDragManager.module.js
 * Created at 2024. 1. 3. 오전 10:25:50.
 * 
 * Version 2.0
 * ------------------------------------------------
 * @수정이력
 * 수정일자 		(수정자) 			수정내용
 * ------------------------------------------------
 * 	2025.03.11		tomatosystem		다양한 기능 최신화
 *  2025.07.25      tomatosystem        드래그 상하좌우 기능 추가
 *  2025.08.18      tomatosystem        드래그 꼭짓점 기능 추가
 * ------------------------------------------------
 * @author tomatosystem
 ************************************************/

/*
 * 본 모듈은 폼 레이아웃 내에서 사용자가 구획을 드래그 앤 드랍하여 포틀릿의 특성을 구현하기 위해서 만들어진 공통 모듈입니다.
 * 포틀릿을 구현한 뒤 개인화를 위해 쿠키에 저장하여 관리할 수 있습니다.
 * 
 * [사용법]
 * 로드되는 모든 화면에 대해서 이벤트 캐치를 하지 않습니다.
 * 따라서 각 화면의 BodyLoad시점에서 글로벌 함수 출판된 createDragManager를 사용하고 사용자속성을 정의합니다.
 * 개인화를 하기위해서는 글로벌 함수로 출판된 portletIndividual을 사용합니다. 
 * 개인화와 관련된 함수는 글로벌 함수인 portletIndividual의 하위에 속해있습니다.
 * 
 * 1. 포틀릿을 적용할 그룹(폼레이아웃일때만 가능)을 선택한 뒤, 선택한 그룹의 사용자 속성으로 portlet 을 정의하고 값은 Y로 지정합니다.
 * 2. 해당 포틀릿이 한 화면에서 하나의 폼 레이아웃에서만 사용하는게 아닐 경우가 있을 수 있기 때문에, dataType이라는 사용자 속성을 사용하여 드래그소스,
 * 	   드랍타겟에 대한 범위를 제한할 수 있습니다. (단, dataType속성에 대한 값은 unique해야 합니다.)
 * 3. 화면이 로딩되었을 때, onBodyLoad이벤트리스너에서 출판된 메서드 createDragManager를 호출합니다.
 * 4. 드래그앤드랍을 빈공간에 할 경우, 타겟컨트롤이 없는경우에는 드랍이 불가능합니다.
 *     따라서 해당 구획에는 빈 그룹을 배치해야 가능합니다.
 * 
 * [사용가능한 메서드]
 * 1. createDragManager : 드래그앤드롭을 시작합니다.
 * 2. removeDragManager : 드래그앤드롭 객체를 삭제합니다.
 * 3. setUseDragManager : 전체 포틀릿 동작 여부 처리
 * 4. setResizePortlet : 포틀릿을 확대/축소합니다. (마우스가 눌린 시점부터 발생하기 때문에 mouseDown 이벤트리스너에서 호출하여 사용합니다.)
 * 5. setCookie : 쿠키를 생성합니다.
 * 6. getCookie : 쿠키를 반환합니다. 반환되는 쿠키는 포틀릿의 constraint 형식으로 반환됩니다.
 * 7. deketeCookie : 쿠키를 삭제합니다.
 */

/************************************************
 * 사용자 설정가능 멤버변수
 ************************************************/
/**
 * 포틀릿 colunm 수
 */
var mnMaxColCnt = 12;

/**
 * 포틀릿 row 수
 */
var mnMaxRowCnt = 12;

/**
 * 포틀릿 적용 여부
 * @type {Boolean}
 */
var mbDraggable = true;

/**
 *  소스컨트롤 확대 및 축소 여부
 * @type {Boolean}
 */
var mbResize = false;

/**
 * 포틀릿 리사이즈바 컨트롤
 * @type {cpr.controls.Output}
 */
var mcResizeBar;

/**
 * 포틀릿 위치 고정
 * 컨트롤의 우측 상단에서만 포틀릿이 가능합니다.
 * @type {Boolean}
 */
var mbPosFix = false;

/**
 * 중복컨트롤에 대해 포틀릿 이동 및 확대/축소 적용여부
 * true 일 경우에 컨트롤 중복을 피합니다.
 * @type {Boolean}
 */
var mbPermitDupl = true;

/**
 * 드래그 시 row증가 여부
 * @type {Boolean}
 */
var mbIncreaseRow = false;

/**
 * 드래그앤드롭 시, 소스컨트롤 크기유지 여부 
 * @type {Boolean}
 */
var mbDropOrginSize = true; 

/**
 * 타겟 컨트롤 스타일
 */
var maTargetStyle = {
	"box-shadow" : "0 3px 12px 1px rgba(44,55,130,0.15)"
};

/**
 * 사용자 속성 (portlet)
 * 포틀릿 사용 여부
 * @type {String}
 */
var ATTR_USE_PORTLET = "portlet";

/**
 * 사용자 속성 (dataType)
 * 포틀릿 영역 지정 시 사용
 * @type {String}
 */
var ATTR_DATA_TYPE = "dataType";

/**
 * 피드백(드래그 시 플로팅 되는 컨트롤) 인라인 스타일
 */
var maFeedbackStyle = {
	"opacity": "0.8",
	"border": "solid 1px red",
	"text-align": "center",
	"color": "black",
	"border-radius": "10px",
	"background": "white",
	"box-shadow": "0px 2px 10px #ddd",
	"transition": "all 0s ease-in-out",
	"cursor": "se-resize"
};

/**
 * 피드백(드래그 시 플로팅 되는 컨트롤) 스타일 클래스
 * @type {#css-class}
 */
var msFeedbackCls = "feedback";

/**
 * mbPosFix 가 true 일 때 
 * portlet 이 가능한 영역 사이즈 (컨트롤 우측 위)
 * @type {Number}
 */
var mnFixArrange = 20;

/**
 * mbPosFix 가 true 일 때
 * portlet이 가능한 영역을 보이기 위한 스타일 클래스
 * @type {#css-class}
 */
var msFixCls = "ctrl-span";

/************************************************
 * 내부 시스템 멤버변수 (변경X)
 ************************************************/
/**
 * 앱 인스턴스
 */
var moApp;

/**
 * 공통모듈 Util 클래스
 */
var moUtil;

/**
 * 드래그 할 때 플로팅되는 컨트롤
 * @type {cpr.controls.Output}
 */
var mcFeedback;

/**
 * 드래그 소스 배열
 * @type {cpr.controls.DragSource[]}
 */
var maDragSource = [];

/**
 * 드롭타겟 배열
 * @type {cpr.controls.DropTarget[]}
 */
var maDropTarget = [];

/**
 * 드래그의 이동량
 * @type {cpr.geometry.Dimension}
 */
var maDragDelta = null;

/************************************************
 * API
 ************************************************/
function Portlet () {
	this._isDraggable = mbDraggable;
}

/**
 * 드래그 시작하는 메서드
 * @param {cpr.core.AppInstance} app 앱인스턴스
 * @param {Boolean} pbPermitDupl? =`true` 드래그앤드롭 시 아이템간 중복 시 드롭여부(true:중복된 아이템과 위치 스위칭, false : 드롭방지)
 * @param {Boolean} pbIncRow? =`false` 드래그 시 마지막 행 기준 한 행 추가여부(true/false)
 * @param {Boolean} pbDrpOrgSz? =`true` 드래그앤드롭 시 소스컨트롤 크기유지 여부(true/false)
 */
Portlet.prototype.createDragManager = function (app, pbPermitDupl, pbIncRow, pbDrpOrgSz) {
	var that = this;
	
	/* 드래그앤드롭시 중복허용 */
	if (pbPermitDupl != null) {
		mbPermitDupl = pbPermitDupl;
	}
	
	/*. 드래그 시 한 행씩 추가 */
	if (pbIncRow != null) {
		mbIncreaseRow = pbIncRow;
	}
	
	/* 드래그앤드롭시 소스컨트롤 크기유지 */
	if (pbDrpOrgSz != null) {
		mbDropOrginSize = pbDrpOrgSz;
	}
	
	moApp = app;
	if(!moUtil) moUtil = createCommonUtil();
	var voContainer = moApp.getContainer();
	
	var vaRecursiveCtrls = voContainer.getAllRecursiveChildren();
	var vaDraggableContainers = vaRecursiveCtrls.filter(function(each) {
		if (each.userAttr(ATTR_USE_PORTLET) == "Y") {
			return each;
		}
	});
	
	vaDraggableContainers.forEach(function( /** cpr.controls.Container*/ each) {
		var vsDataType = each.userAttr(ATTR_DATA_TYPE);
		each.getChildren().forEach(function(eachs) {
			if (eachs.userAttr("isAlready") == "") {
				eachs.userAttr("isAlready", "Y");
				that._createDragSource(moApp, eachs, vsDataType);
			}
		});
		that._createDropTarget(each, vsDataType);
	});
}

/**
 * 특정 그룹의 드래그앤드롭 속성을 삭제합니다.
 * @param {cpr.controls.Container} pcContainer
 */
Portlet.prototype.removeDragManager = function (pcContainer) {
	if (pcContainer) {
		var vaRecursiveCtrls = pcContainer.getChildren();
		vaRecursiveCtrls.forEach(function(each) {
			each.removeUserAttr("isAlready");
		});
		
		var vsDataType = pcContainer.userAttr(ATTR_DATA_TYPE);
		maDragSource.forEach(function(each, idx) {
			if (each.dataType == vsDataType) {
				maDragSource[idx].dispose();
			}
		});
		
		maDropTarget.forEach(function(each, idx) {
			var vcCtrl = each.control;
			if (vcCtrl && vcCtrl.userAttr(ATTR_DATA_TYPE) == vsDataType) {
				maDropTarget[idx].dispose();
			}
		});
	}
}

/**
 * 포틀릿 드래그 여부 지정
 * @param {Boolean} pbDrag
 */
Portlet.prototype.setUseDragManager = function (pbDrag) {
	this._isDraggable = pbDrag;
}

/**
 * 포틀릿 특성이 적용되어 있을 때, 선택한 컨트롤의 확대/축소 여부를 저장합니다.
 * @param {Boolean} pbResize
 * @param {cpr.controls.UIControl} pcTargetCtrl
 */
Portlet.prototype.setResizePortlet = function (pbResize, pcTargetCtrl) {
	mbResize = pbResize;
	mcResizeBar = pcTargetCtrl;
}

/**
 * 포틀릿을 드래그 앤 드롭할 위치를 고정합니다.
 * @param {Boolean} pbFix
 */
Portlet.prototype.setPotletPosFix = function (pbFix) {
	mbPosFix = pbFix;
	
	if (mbPosFix) {
		// 드래그 가능한 영역 생성
		if (maDragSource.length > 0) {
			maDragSource.forEach(function(each) {
				var vcCtrl = each.control;
				if (vcCtrl) vcCtrl.style.addClass(msFixCls);
			});
		}
	} else {
		// 드래그 영역 삭제
		if (maDragSource.length > 0) {
			maDragSource.forEach(function(each) {
				var vcCtrl = each.control;
				if (vcCtrl) vcCtrl.style.removeClass(msFixCls);
			});
		}
	}
}

/************************************************
 * 내부 함수
 ************************************************/
/**
 * 드래그소스를 만들어주는 함수
 * @param {cpr.core.AppInstance} app
 * @param {cpr.controls.UIControl} pcDragCtrl
 * @param {String} psDataType
 */
Portlet.prototype._createDragSource = function (app, pcDragCtrl, psDataType) {
	var that = this;
	
	var voRootApp = app.getRootAppInstance();
	var vnIncreateIndex = true;
	
	var dragSource = new cpr.controls.DragSource(pcDragCtrl, {
		options: {
			dataType: psDataType,
			threadhold: 10, // 10px만큼 이동해야 드래그시작으로 인식
		},
		
		onBeforeDragStart: function(context) {
			if (mbPosFix && !mbResize) {
				var voActualRect = context.source.control.getActualRect();
				var voStartLoc = context.dragStartLocation;
//				// 앱헤더 영역만 드래그 가능하도록 수정 (2021.10.06 추가)
//				if (voStartLoc.y >= (voActualRect.top + mnFixArrange)) {
				if (voStartLoc.x <= (voActualRect.right - mnFixArrange) || voStartLoc.y >= (voActualRect.top + mnFixArrange)) {
					context.cancel();
				}
			}
		},
		
		onDragStart: function(context) {
			if (that._isDraggable) {
				if (context.source.control.type == "container" && context.source.control.getChildrenCount() == 0) {
					context.cancel();
				} else {
					var voActuralRect = pcDragCtrl.getActualRect();
					pcDragCtrl.style.css("opacity", " 0.5");
					if (mbResize == true) {
						// Span
						context.cursor = "se-resize";
						mcFeedback = _createDragSourceFeedback();
						voRootApp.floatControl(mcFeedback, voActuralRect);
					} else {
						// Drag
						context.cursor = "grabbing";
						mcFeedback = _createDragSourceFeedback();
						var voNewActualRect = voActuralRect.getTranslated(context.dragDelta);
						voRootApp.floatControl(mcFeedback, cpr.controls.layouts.XYLayout.createConstraintWithRect(voNewActualRect));
					}
				}
			} else {
				context.cancel();
			}
		},
		onDragMove: function(context) {
			var voActuralRect = context.source.control.getActualRect();
			if (mbResize == true) {
				// Span
				context.cursor = "se-resize";
				maDragDelta = context.dragDelta;
				var voFloatConstraint = _getDragDirection(voActuralRect, pcDragCtrl, mcResizeBar);
				voRootApp.floatControl(mcFeedback, voFloatConstraint);
			} else {
				// Drag
				context.cursor = "grabbing";
				// 폼레이아웃에 추가한 grabbing 자식의 좌표를 기준으로 floatControl 정의
				_floatFeedback();

				if (mbIncreaseRow == true) {
					var vcParent = pcDragCtrl.getParent();
					var voLayout = vcParent.getLayout();
					var voRow = voLayout.getRows();
					var voColumn = voLayout.getColumns();
					
					if (context.target == null) {
						var vnChildCount = vcParent.getChildrenCount();
						var voLastChildRect = voLayout.getChildrenByLayoutOrder()[vnChildCount - 1].getActualRect();
						var voFeedbackRect = mcFeedback.getActualRect();
						
						/* 아래로 드래그시 새로운 행 추가 */
						if (voFeedbackRect.bottom > voLastChildRect.bottom && context.dragDelta.height > 0) {
							if (vnIncreateIndex == true) {
								voRow.push("1fr");
								voLayout.setRows(voRow);
								vcParent.setLayout(voLayout);
								
								vnIncreateIndex = false;
							}
						}
						that.createDragManager(app, mbPermitDupl);
					}
				}
			}
		},
		onDragEnd: function(context) {
			if (mbResize == true && context.source) { // Span
				_setFormSpan(pcDragCtrl);
			}
			
			// 마지막 row에 아무런 아이템이 없을경우 삭제
			if (mbIncreaseRow) {
				_removeBlankRow(pcDragCtrl);
			}
			
			context.cursor = "";
			mcFeedback.dispose();
			mcFeedback = null;
			pcDragCtrl.style.removeStyle("opacity");
			
			mbResize = false;
			vnIncreateIndex = true;
			context.source.control.redraw();
		}
	});
	
	maDragSource.push(dragSource);
}

/**
 * 드래그소스의 부모객체를받아와서 부모객체에 드랍타겟을 만들어주는 함수
 * @param {cpr.controls.Container} pcCtrlDrop
 * @param {String} psDataType
 */
Portlet.prototype._createDropTarget = function (pcCtrlDrop, psDataType) {
	var vcContainer = pcCtrlDrop;
	var voParentLayout = vcContainer.getLayout();
	
	var vcDropFeedback = null;
	
	function getDropFeedback() {
		if (vcDropFeedback == null) {
			vcDropFeedback = new cpr.controls.Output("optDropFeedback");
			vcDropFeedback.style.css(maTargetStyle);
		}
		return vcDropFeedback;
	}
	
	function hideDropFeedback() {
		if (vcDropFeedback) {
			vcDropFeedback.dispose();
			vcDropFeedback = null;
			if(mcFeedback) moApp.getRootAppInstance().removeFloatingControl(mcFeedback);
		}
	}
	
	/* 드래그 시 컨트롤의 rowIndex 위치 */
	var vnDragRowIndex = null;
	
	/* 드래그 시 컨트롤의 colIndex 위치 */
	var vnDragColIndex = null;
	
	var dropTarget = new cpr.controls.DropTarget(vcContainer, {
		isImportant: function(source) {
			return source.dataType == psDataType;
		},
		onDragMove: function(context) {
			var voReference = voParentLayout.getInsertionReference(context.pointerLocation);
			
			if (!ValueUtil.isNull(context.data)) { 
				// 아이템 추가
				voReference.rowSpan = context.data["rowSpan"];
				voReference.colSpan = context.data["colSpan"];				
				vnDragRowIndex = Math.floor(voReference.rowSpan/2);
				vnDragColIndex = Math.floor(voReference.colSpan/2);
				
			} else { 
				// 아이템 내부 변경					
				var voSourceCtrlRect = vcContainer.getConstraint(context.source.control);
				
				voReference.rowSpan = voSourceCtrlRect.rowSpan ? voSourceCtrlRect.rowSpan : 1;
				voReference.colSpan = voSourceCtrlRect.colSpan ? voSourceCtrlRect.colSpan : 1;
				
				if (vnDragRowIndex == null) {
					vnDragRowIndex = voReference.rowIndex - voSourceCtrlRect.rowIndex;
				}
				if (vnDragColIndex == null) {
					vnDragColIndex = voReference.colIndex - voSourceCtrlRect.colIndex;
				}
			}
			
			// 이동할 수 있는 범위 제한 "최소 0, 최대 삽입 가능한 index"
			var vnMaxRowIndex = voParentLayout.getRows().length - voReference.rowSpan;
			var vnMaxColIndex = voParentLayout.getColumns().length - voReference.colSpan;
			
			voReference.rowIndex = Math.min(Math.max(voReference.rowIndex - vnDragRowIndex, 0), vnMaxRowIndex);
			voReference.colIndex = Math.min(Math.max(voReference.colIndex - vnDragColIndex, 0), vnMaxColIndex);
			
			if (mbResize == false && voReference) {
				vcContainer.addChild(getDropFeedback(), voReference);
				if(mcFeedback) _floatFeedback();
			} else {
				hideDropFeedback();
			}
		},
		onDragLeave: function(context) {
			hideDropFeedback();
		},
		onDrop: function(context) {
			if (mbResize == false) {
				// 타겟 스타일 변경
				hideDropFeedback();
				
				var voInsertionReference = voParentLayout.getInsertionReference(context.pointerLocation);
				var voSourceCtrlRect = {
					"rowIndex" : null,
					"colIndex" : null,
					"rowSpan" : null,
					"colSpan" : null
				};
				
				if (!ValueUtil.isNull(context.data)) { 
					// 아이템 추가
					voInsertionReference.rowSpan = context.data["rowSpan"];
					voInsertionReference.colSpan = context.data["colSpan"];
					
					var vnMaxRowIndex = voParentLayout.getRows().length - voInsertionReference.rowSpan;
					var vnMaxColIndex = voParentLayout.getColumns().length - voInsertionReference.colSpan;
					
					voInsertionReference.rowIndex = Math.min(Math.max(voInsertionReference.rowIndex - vnDragRowIndex, 0), vnMaxRowIndex);
					voInsertionReference.colIndex = Math.min(Math.max(voInsertionReference.colIndex - vnDragColIndex, 0), vnMaxColIndex);
					
					voSourceCtrlRect = voInsertionReference;
				} else{
					// 아이템 내부 변경
					// Drag 일 경우에만 변경되 위치로 드롭
					voSourceCtrlRect = vcContainer.getConstraint(context.source.control);
					voInsertionReference.rowSpan = voSourceCtrlRect.rowSpan ? voSourceCtrlRect.rowSpan : 1;
					voInsertionReference.colSpan = voSourceCtrlRect.colSpan ? voSourceCtrlRect.colSpan : 1;
					
					var vnMaxRowIndex = voParentLayout.getRows().length - voInsertionReference.rowSpan;
					var vnMaxColIndex = voParentLayout.getColumns().length - voInsertionReference.colSpan;
					
					voInsertionReference.rowIndex = Math.min(Math.max(voInsertionReference.rowIndex - vnDragRowIndex, 0), vnMaxRowIndex);
					voInsertionReference.colIndex = Math.min(Math.max(voInsertionReference.colIndex - vnDragColIndex, 0), vnMaxColIndex);
				}
				
				var vcTargetCtrl = voParentLayout.findControls(voInsertionReference).filter(function(each) {
					// 자기자신은 타겟에서 제외
					return each != context.source.control;
				});
				
				var voTargetCtrlRect = vcTargetCtrl.length > 0 ? vcContainer.getConstraint(vcTargetCtrl[0]) : voInsertionReference;
				voSourceCtrlRect.rowSpan = voSourceCtrlRect.rowSpan ? voSourceCtrlRect.rowSpan : 1;
				voSourceCtrlRect.colSpan = voSourceCtrlRect.colSpan ? voSourceCtrlRect.colSpan : 1;
				voTargetCtrlRect.rowSpan = voTargetCtrlRect.rowSpan ? voTargetCtrlRect.rowSpan : 1;
				voTargetCtrlRect.colSpan = voTargetCtrlRect.colSpan ? voTargetCtrlRect.colSpan : 1;
				
				if (mbPermitDupl == true) {
					/* 중복허용 - 위치 스위칭 */
					if (mbDropOrginSize == true) { // 소스 크기만큼 이동
						// TODO 영역이동 시, 겹치는 아이템의 위치를 이동하십시오.
						
						// 소스컨트롤을 이동한 위치가 이동영역 안 일경우에만 constraint 변경
						if (voInsertionReference.rowIndex + voInsertionReference.rowSpan <= voParentLayout.getRows().length &&
							voInsertionReference.colIndex + voInsertionReference.colSpan <= voParentLayout.getColumns().length) {
							
							// 바깥영역으로 나가는 동작 예외처리
							if (voTargetCtrlRect.rowIndex < 0 || voTargetCtrlRect.colIndex < 0) return;
							
							// 넓힌 영역에 겹치는 아이템 유무 확인(소스컨트롤 제외)
							var voTargetConst = {
								rowIndex: voTargetCtrlRect.rowIndex,
								colIndex: voTargetCtrlRect.colIndex,
								rowSpan: voSourceCtrlRect.rowSpan,
								colSpan: voSourceCtrlRect.colSpan
							};
							
							var vaDuplCtrl = vcTargetCtrl.filter(function(each) {
								if (each != context.source.control &&
									(voSourceCtrlRect.rowSpan != voTargetCtrlRect.rowSpan || voSourceCtrlRect.colSpan != voTargetCtrlRect.colSpan)) { // 크기가 다를경우엔 드래그앤드롭방지
									if (each.type == "container" && each.getChildrenCount() == 0) {
										return;
									}
									return each;
								}
							});
							
							if (vaDuplCtrl.length == 0) {
								if (vcTargetCtrl.length > 0) {
									// source 위치 이동
									vcContainer.updateConstraint(context.source.control, voTargetConst);
										
									// target 위치 이동
									vcContainer.updateConstraint(vcTargetCtrl[0], {
										rowIndex: voSourceCtrlRect.rowIndex,
										colIndex: voSourceCtrlRect.colIndex,
										rowSpan: voTargetCtrlRect.rowSpan,
										colSpan: voTargetCtrlRect.colSpan
									});
									
									vcContainer.reorderChild(context.source.control, voTargetConst.rowIndex);
									vcContainer.reorderChild(vcTargetCtrl[0], voSourceCtrlRect.rowIndex);
								} else {
									if (!ValueUtil.isNull(context.data)) {
										// 아이템 추가
										var voData = context.data;						
										if(moApp.hasAppMethod("createCustomItem")){
											moApp.callAppMethod("createCustomItem", voData["data"]["itemId"], voSourceCtrlRect, true, true, true);
										}	
									} else {
										// 아이템 내부 변경
										vcContainer.updateConstraint(context.source.control, voTargetConst);
									}
								}
							} else if (vaDuplCtrl.length == 1) {								
								// 1:1 교환인 경우
								var vcTargetCtrl = vaDuplCtrl[0];
								if (!ValueUtil.isNull(context.data)) {
									// 아이템 추가
									var voTargetItemInfo = vcTargetCtrl.userData("itemInfo");									
									var voData = context.data;
									moUtil.Msg.confirmDlg(moApp, "CRM-M029", [voTargetItemInfo["itemNm"], voData["data"]["itemNm"]], {
										confirmCallback: function() {
											if (moApp.hasAppMethod("deleteCustomItem")) {
												moApp.callAppMethod("deleteCustomItem", vcTargetCtrl);
											}
											
											if(moApp.hasAppMethod("createCustomItem")){
												moApp.callAppMethod("createCustomItem", voData["data"]["itemId"], voSourceCtrlRect, true, true, true);
											}	
										}
									});		
								} else {
									// 아이템 내부 변경
									var voTargetConts = vcContainer.getConstraint(vcTargetCtrl);
									
									vcContainer.updateConstraint(context.source.control, voTargetConts);
									vcContainer.updateConstraint(vaDuplCtrl[0], {
										rowIndex: voSourceCtrlRect.rowIndex,
										colIndex: voSourceCtrlRect.colIndex,
										rowSpan: voSourceCtrlRect.rowSpan,
										colSpan: voSourceCtrlRect.colSpan
									});
								}
							} else {
								moUtil.Msg.alertDlg(moApp, "다수의 아이템과의 위치 교환은 불가능합니다.\n크기를 조정하여 다시 시도하세요.");
							}
						}
					} else {
						// 타겟 크기만큼 이동
						vcContainer.updateConstraint(context.source.control, _checkConstraint(voTargetCtrlRect));
						vcContainer.updateConstraint(vcTargetCtrl[0], _checkConstraint(voSourceCtrlRect));
					}
				} else {
					/* 중복미허용 - 드롭방지 */
					if (vcTargetCtrl.length == 0) {
						var voUpdateConstraint = {
							rowIndex: voTargetCtrlRect.rowIndex,
							colIndex: voTargetCtrlRect.colIndex,
							rowSpan: voSourceCtrlRect.rowSpan ? voSourceCtrlRect.rowSpan : 1,
							colSpan: voSourceCtrlRect.colSpan ? voSourceCtrlRect.colSpan : 1
						};
						
						// 넓힌 영역에 겹치는 아이템 유무 확인(소스컨트롤 제외)
						var voDuplCtrl = vcContainer.getLayout().findControls(voUpdateConstraint).filter(function(each) {
							if (each.type != "container" && each != context.source.control) {
								return each;
							}
						});
						
						if (vaDuplCtrl.length == 0 &&
							voUpdateConstraint.rowIndex + voSourceCtrlRect.rowSpan <= vcContainer.getLayout().getRows().length &&
							voUpdateConstraint.colIndex + voSourceCtrlRect.colSpan <= vcContainer.getLayout().getColumns().length) {
							// 드롭간능 영역 중, 중복되는 아이템이 없을 경우에만 드롭
							vcContainer.updateConstraint(context.source.control, voUpdateConstraint);
							vcContainer.updateConstraint(vcTargetCtrl[0], _checkConstraint(voSourceCtrlRect));
						}
					} else {
						if (typeof AppProperties !== 'undefined' && AppProperties.MSG_TOPIC_ID) {
							cpr.core.NotificationCenter.INSTANCE.post(AppProperties.MSG_TOPIC_ID, {
								TYPE: "danger",
								MSG: "컨트롤 간 위치변경이 불가능 합니다."
							});
						} else {
							alert("컨트롤 간 위치변경이 불가능 합니다.");
						}
					}
				}
			}
			
			vnDragRowIndex = null;
			vnDragColIndex = null;
		}
	});
	
	maDropTarget.push(dropTarget);
}

/**
 * 이동하고자하는 영역을 잡고 마우스를 드래그할 때 구획에 대한 피드백을 제공하는 함수입니다.
 * @returns {cpr.controls.UIControl} feedbacks
 */
function _createDragSourceFeedback() {
	var vcFeedback = new cpr.controls.Output("feedback");
	vcFeedback.style.css(maFeedbackStyle);
	
	// TODO 플로팅 되는 스타일을 클래스로 지정하기 위해서 아래의 코드를 사용하십시오.
	vcFeedback.style.addClass(msFeedbackCls);
	
	return vcFeedback;
}

/**
 * 전달받은 Constraint에서 rowSpan과 colSpan에 기본값을 넣어주기 위한 함수입니다.
 * @param {cpr.controls.layouts.FormConstraint} poConstraint
 * @returns {cpr.controls.layouts.FormConstraint} constraint
 */
function _checkConstraint(poConstraint) {
	var voConstraint = {
		"rowIndex": poConstraint.rowIndex,
		"colIndex": poConstraint.colIndex,
		"rowSpan": poConstraint.rowSpan ? poConstraint.rowSpan : 1,
		"colSpan": poConstraint.colSpan ? poConstraint.colSpan : 1
	};
	return voConstraint;
}

/**
 * 이동이 끝났을 때 마지막 행이 모두 비어있을 경우 삭제합니다.
 * @param {cpr.controls.UIControl} pcDragCtrl
 */
function _removeBlankRow(pcDragCtrl) {
	/** @type cpr.controls.layouts.FormLayout */
	var voLayout = pcDragCtrl.getParent().getLayout();
	var voRows = voLayout.getRows();
	var voColumns = voLayout.getColumns();
	
	var vaPortletCtrl = pcDragCtrl.getParent().getChildren().filter(function(each) {
		if (!(each.type == "container" && each.getChildrenCount() == 0)) {
			return each;
		}
	});
	
	var voFindCtrls = [];
	for (var i = 0; i < voColumns.length; i++) {
		var vcCtrl = voLayout.findControls({
			rowIndex: voRows.length - 1,
			colIndex: i
		});
		if (vcCtrl.length == 1) {
			if (vcCtrl[0].type == "container" && vcCtrl[0].getChildrenCount() == 0) {
				voFindCtrls.push(vcCtrl);
			}
		}
	}
	
	if (voFindCtrls.length == voColumns.length) {
		voRows.splice(voRows.length - 1, 1);
		voFindCtrls.forEach(function(each) {
			pcDragCtrl.getParent().removeChild(each[0], true);
		});
	}
	
	/* 변경된 레이아웃 설정*/
	voLayout.setRows(voRows);
	pcDragCtrl.getParent().setLayout(voLayout);
}

/**
 * 드래그 플로팅 constraint
 * @param {cpr.geometry.Rectangle} poSourceRect 원본 포틀릿의 사각형 정보
 * @param {cpr.controls.UIControl} pcDragCtrl 드래그 중인 포틀릿 객체
 * @param {cpr.controls.UIControl} psResizeBar 드래그 타겟 컨트롤(리사이즈 바)
 * @return {cpr.controls.layouts.Constraint} constraint 보정된 피드백 사각형
 */
function _getDragDirection(poSourceRect, pcDragCtrl, psResizeBar) {
	var vcParent = pcDragCtrl.getParent();
	var voConstraint = vcParent.getConstraint(pcDragCtrl);
	
	var voParentRect = vcParent.getActualRect();
	var voFeedbackRect = mcFeedback.getActualRect();
	
	var vnTop = poSourceRect.top;
	var vnLeft = poSourceRect.left;
	var vnWidth = poSourceRect.width + maDragDelta.width;
	var vnHeight = poSourceRect.height + maDragDelta.height;
	
	var voRect = {};
	switch(psResizeBar.userAttr("_direction")){
		case "top" : // 상: 너비 고정, 아래를 기준으로 위로 리사이즈
			vnWidth = poSourceRect.width; // 너비 고정
			vnHeight = poSourceRect.height - maDragDelta.height;
			var vnBottom = voParentRect.bottom - (poSourceRect.top + poSourceRect.height);
			
			// 부모 레이아웃 경계 제한
			if(psResizeBar.getActualRect().top + maDragDelta.height < voParentRect.top) {
				var vnDiff = voParentRect.top - (psResizeBar.getActualRect().top + maDragDelta.height);
				vnHeight -= vnDiff;
			}
			
			voRect["bottom"] = vnBottom + "px";
			voRect["left"] = vnLeft + "px";
			break;
		case "bottom" : // 하: 너비 고정, 상단을 기준으로 아래로 리사이즈
			vnWidth = poSourceRect.width;
			var vnTop = pcDragCtrl.getActualRect().top;
			voRect["top"] = vnTop + "px";
			voRect["left"] = vnLeft + "px";
			break;
		case "left" : // 좌: 높이 고정, 우측을 기준으로 좌측으로 리사이즈
			vnWidth = poSourceRect.width - maDragDelta.width;
			vnHeight = poSourceRect.height;
			var vnRight = voParentRect.right - (poSourceRect.left + poSourceRect.width); // 우측 여백
			
			// 부모 레이아웃 경계 제한
			if(psResizeBar.getActualRect().left + maDragDelta.width < voParentRect.left) {
				var vnDiff = voParentRect.left - (psResizeBar.getActualRect().left + maDragDelta.width);
				vnWidth -= vnDiff;
			}
			
			voRect["top"] = vnTop + "px";
			voRect["right"] = vnRight + "px";
			break;
		case "right" : // 우: 높이 고정, 좌측을 기준으로 우측 리사이즈
			vnHeight = poSourceRect.height;
			var vnLeft = pcDragCtrl.getActualRect().left;
			voRect["top"] = vnTop + "px";
			voRect["left"] = vnLeft + "px";
			break;
		case "bottom-right" : 
			// 경계 제한: 포틀릿이 폼의 범위를 넘어가지 않도록 제한
			var vnRightEdge = vnLeft + vnWidth;
			var vnBottomEdge = vnTop + vnHeight;
			
			// 상단 경계
			if (vnTop < voParentRect.top) {
				vnTop = voParentRect.top;
				vnHeight = vnBottomEdge - vnTop;
			}
			
			// 좌측 경계
			if (vnLeft < voParentRect.left) {
				vnLeft = voParentRect.left;
				vnWidth = vnRightEdge - vnLeft;
			}
			
			// 우측 경계
			if (vnRightEdge > voParentRect.right) {
				vnWidth = voParentRect.right - vnLeft;
			}
			
			// 하단 경계
			if (vnBottomEdge > voParentRect.bottom) {
				vnHeight = voParentRect.bottom - vnTop;
			}
			
			voRect["top"] = vnTop + "px";
			voRect["left"] = vnLeft + "px";
			break;
		case "bottom-left" : 
			// 아래쪽, 왼쪽 확장 및 좌우 반전 대응 
			var vnRight = poSourceRect.left + poSourceRect.width;
			var vnBottom = poSourceRect.top + poSourceRect.height + maDragDelta.height;
			
			vnLeft = poSourceRect.left + maDragDelta.width;
			vnWidth = vnRight - vnLeft;
			
			vnTop = poSourceRect.top;
			vnHeight = vnBottom - vnTop;
			
			// 경계제한: 좌측 경계
			if (vnLeft < voParentRect.left) {
				vnLeft = voParentRect.left;
			  	vnWidth = vnRight - vnLeft;
			}
			
			// 경계제한: 상단 경계
			if (vnTop < voParentRect.top) {
				vnTop = voParentRect.top;
				vnHeight = vnBottom - vnTop;
			}
			
			// 경계제한: 하단 경계
			if (vnBottom > voParentRect.bottom) {
				vnHeight = voParentRect.bottom - vnTop;
			}
			
			voRect["top"] = vnTop + "px";
			voRect["left"] = vnLeft + "px";
			break;
		case "top-right" :
			// 상단, 우측 확장 및 상하/좌우 반전 대응
			var vnRight = poSourceRect.left + poSourceRect.width + maDragDelta.width;
			var vnTop = poSourceRect.top + maDragDelta.height;
			var vnLeft = poSourceRect.left;
			var vnBottom = poSourceRect.top + poSourceRect.height;
			
			var vnWidth = vnRight - vnLeft;
			var vnHeight = vnBottom - vnTop;
			
			// 경계제한: 상단 경계
			if (vnTop < voParentRect.top) {
			    vnTop = voParentRect.top;
			    vnHeight = vnBottom - vnTop;
			}
			
			// 경계제한: 좌측 경계
			if (vnLeft < voParentRect.left) {
			    vnWidth = vnWidth - (voParentRect.left - vnLeft); // 현재 너비에서 잘린 만큼 줄임
				vnLeft = voParentRect.left; // 좌측 경계에 고정
			}
			
			// 경계제한: 우측 경계
			if (vnLeft + vnWidth > voParentRect.right) {
			    vnWidth = voParentRect.right - vnLeft;
			}
			
			// 경계제한: 하단 경계
			if (vnTop + vnHeight > voParentRect.bottom) {
			    vnHeight = voParentRect.bottom - vnTop;
			}
			voRect["top"] = vnTop + "px";
			voRect["left"] = vnLeft + "px";
			break;
		case "top-left" :
			// 상단, 좌측 확장 및 반전 대응
			var vnRight = poSourceRect.left + poSourceRect.width;
			var vnBottom = poSourceRect.top + poSourceRect.height;
			
			// 드래그 반영된 좌상단 좌표
			vnLeft = poSourceRect.left + maDragDelta.width;
			vnTop = poSourceRect.top + maDragDelta.height;
			
			// 드래그 반영된 크기 계산
			vnWidth = vnRight - vnLeft;
			vnHeight = vnBottom - vnTop;
			
			// 경계제한: 좌측 경계
			if (vnLeft < voParentRect.left) {
			    vnWidth = vnRight - voParentRect.left;
			    vnLeft = voParentRect.left;
			}
			// 경계제한: 우측 경계
			if (vnLeft + vnWidth > voParentRect.right) {
				vnWidth = voParentRect.right - vnLeft;
			}
			// 경계제한: 상단 경계
			if (vnTop < voParentRect.top) {
			    vnHeight = vnBottom - voParentRect.top;
			    vnTop = voParentRect.top;
			}
			
			// 경계제한: 하단 경계
			if (vnTop + vnHeight > voParentRect.bottom) {
			    vnHeight = voParentRect.bottom - vnTop;
			}
			
			voRect["top"] = vnTop + "px";
			voRect["left"] = vnLeft + "px";
			break;
		default :
			break;
	}
	voRect["width"] = vnWidth + "px";
	voRect["height"] = vnHeight + "px";
	return voRect;
}

/**
 * 폼레이아웃 확대/축소(span) <br>
 * 타겟 영역의 절반 이상일 때만 확대/축소합니다. <br>
 * 폼레이아웃의 row와 column은 모두 같은 크기로만 구성되어있어야 합니다.
 * @param {cpr.controls.Container} pcDragCtrl
 */
function _setFormSpan(pcDragCtrl) {
	var vcParent = pcDragCtrl.getParent();
	var voOldConst = vcParent.getConstraint(pcDragCtrl); // voConstraint
	var voLayout = vcParent.getLayout();
	
	var vnRowLen = voLayout.getRows().length;
	var vnColLen = voLayout.getColumns().length;
	var vnOneWidth = voLayout.getColumns()[0].indexOf("fr") > 0 
					? vcParent.getActualRect().width / vnColLen 
					: voLayout.getColumns()[0].split("px")[0];
	var vnOneHeight = voLayout.getRows()[0].indexOf("fr") > 0 
					? vcParent.getActualRect().height / vnRowLen 
					: voLayout.getRows()[0].split("px")[0];
	
	/* span 영역 */
	var voActualRect = pcDragCtrl.getActualRect();
	var voFeedbackRect = mcFeedback.getActualRect();
	
	var vnRowDiff, vnColDiff;
	
	// 1. rowSpan
	var vnRowSpan = Math.max(1, parseInt(Math.round(voFeedbackRect.height / vnOneHeight), 10));
	
	// 2. colSpan
	var vnColSpan = Math.max(1, parseInt(Math.round(voFeedbackRect.width / vnOneWidth), 10));
	
	// 3. rowIndex
	var vnRowIndex = voOldConst.rowIndex;
	vnRowDiff = vnRowSpan - voOldConst.rowSpan;
	
	var vsDirection = ValueUtil.fixNull(mcResizeBar.userAttr("_direction"));
	
	// 드래그 상하 방향 판단
	if((vsDirection == "bottom-right") && voActualRect.top > voFeedbackRect.top) {
		vnRowIndex = voOldConst["rowIndex"] - vnRowSpan;
	} else if (voOldConst.rowSpan != vnRowSpan) {
		if (maDragDelta.height < 0 && vnRowDiff > 0) {
			vnRowIndex -= vnRowDiff;
		} else if(maDragDelta.height > 0 && vnRowDiff < 0) {
			vnRowIndex += Math.abs(vnRowDiff);
		}
	} 
	
	// 4. colIndex
	var vnColIndex = voOldConst.colIndex;
	vnColDiff = vnColSpan - voOldConst.colSpan;
	if((vsDirection == "bottom-right") && voActualRect.left > voFeedbackRect.left) { // 방향 역전
		vnColIndex = voOldConst.colIndex - vnColSpan;
	} else if (voOldConst.colSpan != vnColSpan) {
		if (maDragDelta.width < 0 && vnColDiff > 0) {
			vnColIndex -= vnColDiff;
		} else if(maDragDelta.width > 0 && vnColDiff < 0) {
			vnColIndex += Math.abs(vnColDiff);
		}
	}
	
	if (vnRowIndex < 0) vnRowIndex = 0;
	if (vnColIndex < 0) vnColIndex = 0;
	
	var voNewConst = {
		rowIndex: vnRowIndex,
		colIndex: vnColIndex,
		rowSpan: vnRowSpan,
		colSpan: vnColSpan
	}
	/** @type Array */
	var vaDuplCtrl = voLayout.findControls(voNewConst).filter(function(each) {
		return each != pcDragCtrl;
	});
	
	var vbHasRemoveItem = false;
	var vaRemoveItemNm = [];
	var vaDuplPageInfo = [];
	
	/* 컨트롤간 겹치는 경우 처리*/
	if (vaDuplCtrl.length > 0) {
		vaDuplCtrl.forEach(function(duplCtrl) {
			var voDuplCtrlConst = vcParent.getConstraint(duplCtrl);
			
			if (!voDuplCtrlConst.colSpan) voDuplCtrlConst.colSpan = 1;
			if (!voDuplCtrlConst.rowSpan) voDuplCtrlConst.rowSpan = 1;
			
			// 겹치는 컨트롤의 constraint 반환
			voDuplCtrlConst = getDuplPositionInfo(voNewConst, voDuplCtrlConst, vnRowDiff, vnColDiff);
			if (voDuplCtrlConst["isRemove"]) {
				vbHasRemoveItem = true;
				vaRemoveItemNm.push(duplCtrl.userData("itemInfo").itemNm);
			}
			
			vaDuplPageInfo.push({
				ctrl: duplCtrl,
				constraint: voDuplCtrlConst["constraint"],
				remove: voDuplCtrlConst["isRemove"]
			});
		});
	}
	
	if (vbHasRemoveItem) { // 삭제 아이템 확인
		// {0}을(를) 삭제하시겠습니까?
		moUtil.Msg.confirmDlg(moApp, "CRM-M016", vaRemoveItemNm.join(","), {
			confirmCallback: function() {
				vaDuplPageInfo.forEach(function(each) {
					if (each["remove"]) {
						if (moApp.hasAppMethod("deleteCustomItem")) {
							moApp.callAppMethod("deleteCustomItem", each["ctrl"]);
						}
					} else {
						vcParent.updateConstraint(each["ctrl"], each["constraint"]);
					}
				});
				
				// 아이템이 새로 그려질 수 있도록 삭제 후 추가
				vcParent.removeChild(pcDragCtrl);
				vcParent.addChild(pcDragCtrl, voNewConst);
			}
		});
	} else {
		vaDuplPageInfo.forEach(function(each) {
			vcParent.updateConstraint(each["ctrl"], each["constraint"]);
		});
		
		// 아이템이 새로 그려질 수 있도록 삭제 후 추가		
		vcParent.removeChild(pcDragCtrl);
		vcParent.addChild(pcDragCtrl, voNewConst);
	}
}

/**
 * 폼레이아웃에 띄운 컨트롤을 기준으로 "mcFeedback" 컨트롤을 플로팅을 한다.
 */
function _floatFeedback() {
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		if(moApp.lookup("optDropFeedback")) {
			var voOptRect = moApp.lookup("optDropFeedback").getActualRect();
			if(mcFeedback.disposed) mcFeedback = _createDragSourceFeedback();
			moApp.getRootAppInstance().floatControl(mcFeedback, voOptRect);	
		}
	});
}

/**
 * 범위를 오름차순 정렬
 * @param {Array} paRange
 */
function _normalizeRange(paRange) {
  return [Math.min(paRange[0], paRange[1]), Math.max(paRange[0], paRange[1])];
}

/**
 * 두 범위 [from,to] 형태의 배열 paDupliFrom, paDupliTob가 있을 때
 * 겹치는 영역이 존재하면 [겹친 시작, 겹친 끝]을 반환,(겹침 판별)
 * 없으면 null 반환하는 범용 함수입니다.
 * @param {Array} paDupliFrom
 * @param {Array} paDupliTo
 */
function _getOverlapRange(paDupliFrom, paDupliTo) {
	var vaARange = _normalizeRange(paDupliFrom);
	var vaBRange = _normalizeRange(paDupliTo);
	
	var vnStart = Math.max(vaARange[0], vaBRange[0]);
	var vnEnd = Math.min(vaARange[1], vaBRange[1]);
	
	return vnStart <= vnEnd ? [vnStart, vnEnd] : null;
}

/**
 * 주어진 범위(`paInner`)가 다른 범위(`paOuter`)에 완전히 포함되어 있는지를 확인합니다.(전체 포함)
 *
 * @param {Number[]} paInner - 포함 여부를 확인할 범위. 형식: [시작값, 끝값].
 * @param {Number[]} paOuter - 기준이 되는 외부 범위. 형식: [시작값, 끝값].
 * @returns {Boolean} `paInner`가 `paOuter` 범위 내에 완전히 포함되어 있으면 `true`, 그렇지 않으면 `false`를 반환합니다.
 */
function _isFullyContained(paInner, paOuter) {
	var vaInnerRange = _normalizeRange(paInner);
	var vaOuterRange = _normalizeRange(paOuter);	
	
	return vaInnerRange[0] >= vaOuterRange[0] && vaInnerRange[1] <= vaOuterRange[1];
}

/**
 * 시작 위치와 span 값을 받아 실제 시작~끝 인덱스를 반환합니다.
 * @param {Number} pnIndex
 * @param {Number} pnSpan
 */
function _getRange(pnIndex, pnSpan) {
	return [pnIndex, pnIndex + pnSpan - 1];
}

/**
 * 겹치는 위치의 유형을 반환합니다: row / col / all / none
 * @param {Array} paNewRow 새로운 row 범위
 * @param {Array} paNewCol 새로운 col 범위
 * @param {Array} paDuplRow 중복된 row 범위
 * @param {Array} paDuplCol 중복된 col 범위
 */
function _getOverlapType(paNewRow, paNewCol, paDuplRow, paDuplCol) {
  if (_isFullyContained(paDuplRow, paNewRow) && _isFullyContained(paDuplCol, paNewCol)) return "all";
  if (_getOverlapRange(paNewRow, paDuplRow)) return "row";
  if (_getOverlapRange(paNewCol, paDuplCol)) return "col";
  return "none";
}

/**
 * Span 확장 시, 확장할 영역에 겹치는 컨트롤이 존재하는 경우,
 * 겹치는 컨트롤의 Constraint 반환
 * 겹치는 컨트롤의 사이즈 조절 or 삭제 여부 결정
 * @param {cpr.controls.layouts.Constraint} poNewConst 
 * @param {cpr.controls.layouts.Constraint} poDuplConst
 * @param {Number} pnRowDiff row 방향 변화량
 * @param {Number} pnColDiff col 방향 변화량
 * @return {
 *     constraint: cpr.controls.layouts.Constraint <!-- poDuplConst 값 -->,
		isRemove: Boolean <!-- 삭제여부 -->
 * }
 */
function getDuplPositionInfo(poNewConst, poDuplConst, pnRowDiff, pnColDiff) {
	var vaNewRowPosition = _getRange(poNewConst["rowIndex"], poNewConst["rowSpan"]);
	var vaNewColPosition = _getRange(poNewConst["colIndex"], poNewConst["colSpan"]);
	var vaDuplRowPosition = _getRange(poDuplConst["rowIndex"], poDuplConst["rowSpan"]);
	var vaDuplColPosition = _getRange(poDuplConst["colIndex"], poDuplConst["colSpan"]);
	
	var setRowPosition = function() {
		var vaOverlap = _getOverlapRange(vaNewRowPosition, vaDuplRowPosition);
		if (!vaOverlap) return; // 겹침 없음 → 이동 불필요
	
		var vnOverlapStart = vaOverlap[0];
		var vnOverlapEnd = vaOverlap[1];
	
		// dup의 시작과 끝
		var vnDupStart = poDuplConst["rowIndex"];
		var vnDupEnd = vnDupStart + poDuplConst["rowSpan"] - 1;
	
		if (vnOverlapStart <= vnDupStart) {
			// 위쪽에서 겹침 → dup 시작을 new 아래로 밀어냄
			var vnNewBottom = vaNewRowPosition[1];
			poDuplConst["rowIndex"] = vnNewBottom + 1;
			poDuplConst["rowSpan"] = vnDupEnd - poDuplConst["rowIndex"] + 1;
		} else {
			// 아래쪽에서 겹침 → rowIndex 유지하고 span만 줄임
			poDuplConst["rowSpan"] = vnOverlapStart - vnDupStart;
		}
	
		// 최소 rowSpan 보장
		if (poDuplConst["rowSpan"] < 1) {
			poDuplConst["rowSpan"] = 1;
		}
	}
	
	var setColPosition = function() {
		var vaOverlap = _getOverlapRange(vaNewColPosition, vaDuplColPosition);
		if (!vaOverlap) return; // 겹침 없음 → 이동 불필요
	
		var vnOverlapStart = vaOverlap[0];
		var vnOverlapEnd = vaOverlap[1];
	
		// dup의 시작과 끝
		var vnDupStart = poDuplConst["colIndex"];
		var vnDupEnd = vnDupStart + poDuplConst["colSpan"] - 1;
	
		if (vnOverlapStart <= vnDupStart) {
			// 왼쪽에서 겹침 → 시작을 new의 끝 다음으로 이동
			var vnNewRight = vaNewColPosition[1];
			poDuplConst["colIndex"] = vnNewRight + 1;
			poDuplConst["colSpan"] = vnDupEnd - poDuplConst["colIndex"] + 1;
		} else {
			// 오른쪽에서 겹침 → 시작을 오른쪽으로 밀고 span 축소
			poDuplConst["colSpan"] = vnOverlapStart - vnDupStart;
		}
	
		// 최소 colSpan 보장
		if (poDuplConst["colSpan"] < 1) {
			poDuplConst["colSpan"] = 1;
		}
	}
	
	var vbRemove = false;
	var vsDuplPoint = _getOverlapType(vaNewRowPosition, vaNewColPosition, vaDuplRowPosition, vaDuplColPosition);
	
	if (vsDuplPoint == "all") {
		if (vaNewRowPosition[1] >= vaDuplRowPosition[1] && vaNewColPosition[1] >= vaDuplColPosition[1]) {
			vbRemove = true;
		} else {
			if (pnRowDiff < 0) {
				if (vaNewRowPosition[0] < vaDuplRowPosition[0] && vaDuplRowPosition[0] <= vaNewRowPosition[1]) {
					var vnDuplRowDiff = 1;
					if (vaNewRowPosition[1] > vaDuplRowPosition[0]) {
						vnDuplRowDiff = vaNewRowPosition[1] - vaDuplRowPosition[0] + 1;
					}
					
					var vnDuplRowSpan = poDuplConst["rowSpan"] - vnDuplRowDiff;
					if (vnDuplRowSpan < 1) vnDuplRowSpan = 1;
					
					if (poDuplConst["rowIndex"] + vnDuplRowDiff >= mnMaxRowCnt) {
						setColPosition();
					} else {
						poDuplConst["rowIndex"] = poDuplConst["rowIndex"] + vnDuplRowDiff;
						poDuplConst["rowSpan"] = vnDuplRowSpan;
					}
				}
			}
			
			if (pnColDiff < 0) {
				if (vaNewColPosition[0] < vaDuplColPosition[0] && vaDuplColPosition[0] <= vaNewColPosition[1]) {
					var vnDuplColDiff = 1;
					if (vaNewColPosition[1] > vaDuplColPosition[0]) {
						vnDuplColDiff = vaNewColPosition[1] - vaDuplColPosition[0] + 1;
					}
					
					var vnDuplColSpan = poDuplConst["colSpan"] - vnDuplColDiff;
					if (vnDuplColSpan < 1) vnDuplColSpan = 1;
					
					if (poDuplConst["colIndex"] + vnDuplColDiff >= mnMaxColCnt) {
						setRowPosition();
					} else {
						poDuplConst["colIndex"] = poDuplConst["colIndex"] + vnDuplColDiff;
						poDuplConst["colSpan"] = vnDuplColSpan;
					}
				}
			}
		}
	} else if (vsDuplPoint == "row") {
		var vbIsRowFullyOverlapped = vaNewRowPosition[0] <= vaDuplRowPosition[0] &&
                           vaNewRowPosition[1] >= vaDuplRowPosition[1];
		var vbIsColFullyOverlapped = vaNewColPosition[0] <= vaDuplColPosition[0] &&
		                           vaNewColPosition[1] >= vaDuplColPosition[1];
		if (vbIsRowFullyOverlapped && vbIsColFullyOverlapped) {
		  vbRemove = true;
		} else if (vbIsRowFullyOverlapped) {
		  setColPosition();
		} else {
		  setRowPosition();
		}		
	} else if (vsDuplPoint == "col") {
		if (vaNewColPosition[1] >= vaDuplColPosition[1]) {
			if (vaNewRowPosition[1] >= vaDuplRowPosition[1] &&
				vaNewRowPosition[0] == vaDuplRowPosition[0]) {
				vbRemove = true;
			} else {
				setRowPosition();
			}
		} else {
			setColPosition();
		}
	}
	
	return {
		constraint: poDuplConst,
		isRemove: vbRemove
	};
}

/************************************************
 * 쿠키 관련 함수 (개인화)
 ************************************************/
var portletIndvdl = function(portletObj) {
	this._portlet = portletObj;
};

/**
 * 개인화를 위한 constraint 쿠키에 저장
 * @param {cpr.core.AppInstance} app
 * @param {#container} psFormId 포틀릿 그룹 ID
 * @param {String} psExpireDate 유효기간
 */
portletIndvdl.prototype.setCookie = function(app, psFormId, psExpireDate) {
	/** @type cpr.controls.Container */
	var vcGrpPortlet = app.lookup(psFormId);
	if (vcGrpPortlet && vcGrpPortlet.type == "container") {
		
		var voLayout = vcGrpPortlet.getLayout();
		
		var voToday = new Date();
		voToday.setDate(voToday.getDate() + parseInt(psExpireDate));
		
		// 1. form config
		var vsFormlayoutConfig = voLayout.getRows().length + "," + voLayout.getColumns().length;
		document.cookie = "formlayout=" + escape(vsFormlayoutConfig) + ";path=/;expires=" + voToday.toGMTString() + ";";
		
		// 2. constraint
		var vaConstraint = [];
		var vnIndex = 0;
		var vsChildIds = "";
		vcGrpPortlet.getChildren().forEach(function(each, idx) {
			var voEachContraint = vcGrpPortlet.getConstraint(each);
			var vnRowSpan = voEachContraint.rowSpan ? voEachContraint.rowSpan : 1;
			var vnColSpan = voEachContraint.colSpan ? voEachContraint.colSpan : 1;
			var vsCtrlConstraint = voEachContraint.rowIndex + "," + voEachContraint.colIndex + "," + vnRowSpan + "," + vnColSpan;
			
			vsChildIds += each.id;
			if (idx < vcGrpPortlet.getChildren().length - 1) {
				vsChildIds += ",";
			}
			
			if (each.type != "container" || (each.type == "container" && each.getChildren().length > 0)) {
				vaConstraint.splice(vnIndex, 1, vsCtrlConstraint);
			} else {
				vaConstraint.push(vsCtrlConstraint);
			}
			vnIndex++;
		});
		
		var vaContent = "";
		for (var key in vaConstraint) {
			if (vaContent != "") {
				vaContent += ",";
			}
			vaContent += "::" + vaConstraint[key];
		}
		
		document.cookie = "id=" + vsChildIds;
		document.cookie = "constraint=" + escape(vaContent) + ";path=/;expires=" + voToday.toGMTString() + ";";
		
		if (typeof AppProperties !== 'undefined' && AppProperties.MSG_TOPIC_ID) {
			cpr.core.NotificationCenter.INSTANCE.post(AppProperties.MSG_TOPIC_ID, {
				TYPE: "info",
				MSG: "포틀릿 정보가 성공적으로 저장되었습니다."
			});
		} else {
			alert("포틀릿 정보가 성공적으로 저장되었습니다.");
		}
	} else {
		if (typeof AppProperties !== 'undefined' && AppProperties.MSG_TOPIC_ID) {
			cpr.core.NotificationCenter.INSTANCE.post(AppProperties.MSG_TOPIC_ID, {
				TYPE: "danger",
				MSG: "포틀릿이 적용된 컨트롤이 아닙니다."
			});
		} else {
			alert("포틀릿이 적용된 컨트롤이 아닙니다.");
		}
	}
}

/**
 * 쿠키확인 및 리턴
 * @param {String} psName
 * @return {Array} constraint
 */
portletIndvdl.prototype.getCookie = function(psName) {
	var vsCookieArr = _getCookieByNm(psName);
	return vsCookieArr;
}

/**
 * 쿠키확인
 * @param {String} psName
 */
function _getCookieByNm(psName) {
	var vsCookie = document.cookie + ";";
	
	var voItems = vsCookie.split(";");
	var vnItemLen = voItems.length;
	var vaItem = null;
	var voItemInfo = null;
	for (var i = 0; i < vnItemLen; i++) {
		vaItem = voItems[i];
		voItemInfo = vaItem.split("=");
		if (psName == voItemInfo[0].trim()) {
			return unescape(voItemInfo[1]);
		}
	}
}

/**
 * 쿠키에 저장된 개인화 정보를 폼레이아웃에 세팅합니다.
 * @param {cpr.core.AppInstance} app
 * @param {#container} psFormId
 */
portletIndvdl.prototype.updateConstraintByCookie = function(app, psFormId) {
	/** @type String */
	var vsIds = this.getCookie("id");
	var vsFormlayout = this.getCookie("formlayout");
	var vsConstraint = this.getCookie("constraint");
	
	if (vsFormlayout == "" || vsFormlayout == null || vsConstraint == "" || vsConstraint == null) {
		//		cpr.core.NotificationCenter.INSTANCE.post("app-msg", {
		//			TYPE: "danger",
		//			MSG: "저장된 포틀릿 데이터가 없습니다."
		//		});
		return;
	}
	
	function setFormConfig(pnConfig) {
		var vaArr = [];
		for (var idx = 0; idx < pnConfig; idx++) {
			vaArr.push("1fr");
		}
		return vaArr;
	}
	
	/** @type cpr.controls.Container */
	var vcGrpPortlet = app.lookup(psFormId);
	var vaChildren = vcGrpPortlet.getChildren();
	
	// 1. 폼레이아웃 구성
	/** @type cpr.controls.layouts.FormLayout */
	var voFormLayout = vcGrpPortlet.getLayout();
	voFormLayout.setRows(setFormConfig(vsFormlayout.split(",")[0]));
	voFormLayout.setColumns(setFormConfig(vsFormlayout.split(",")[1]));
	vcGrpPortlet.setLayout(voFormLayout);
	
	// 2. 컨트롤 위치
	var vaConstraint = _getRealConstraint("constraint");
	if (!ValueUtil.isNull(vsIds)) {
		/** @type Array */
		var vaCtrls = vsIds.split(",");
		vaCtrls.forEach(function(each, idx) {
			var targetCtrl = vaChildren.filter(function(each2) {
				return each2.id == each;
			});
			vcGrpPortlet.replaceConstraint(targetCtrl[0], vaConstraint[idx]);
			vcGrpPortlet.reorderChild(targetCtrl[0], vaConstraint[idx]["rowIndex"]);
		});
	} else {
		// 2. 컨트롤 위치
		for (var idx = 0; idx < vaConstraint.length; idx++) {
			vcGrpPortlet.replaceConstraint(vaChildren[idx], vaConstraint[idx]);
			//vcGrpPortlet.addChild(vaChildren[idx], vaConstraint[idx]);		
		}
	}
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		vcGrpPortlet.redraw();
	});
	this._portlet.createDragManager(app, mbPermitDupl, mbIncreaseRow, mbDropOrginSize);
}

function _getRealConstraint(psName) {
	var vsCookieArr = _getCookieByNm(psName);
	var vaData = [];
	
	if (vsCookieArr) {
		var vaNames = vsCookieArr.split("::");
		
		for (var idx in vaNames) {
			if (idx != 0) {
				if (vaNames[idx].indexOf("function") != -1) break;
				vaData.push(vaNames[idx]);
			}
		}
	}
	
	var vaRealData = [];
	for (var idx = 0; idx < vaData.length; idx++) {
		var voEachConstraint = vaData[idx].split(",");
		vaRealData.push({
			rowIndex: parseInt(voEachConstraint[0]),
			colIndex: parseInt(voEachConstraint[1]),
			rowSpan: parseInt(voEachConstraint[2]) ? parseInt(voEachConstraint[2]) : 1,
			colSpan: parseInt(voEachConstraint[3]) ? parseInt(voEachConstraint[3]) : 1
		});
	}
	
	return vaRealData;
}

/**
 * 포틀릿 정보와 관련된 쿠키를 삭제합니다.
 * 특정 쿠키만 삭제 하고싶을 경우, 삭제 할 쿠키이름을 매개변수로 전달하십시오.
 * @param {String} psName?
 */
portletIndvdl.prototype.deleteCookie = function(psName) {
	var voExpireDate = new Date();
	voExpireDate.setDate(voExpireDate.getDate() - 1);
	
	if (psName) {
		var vsCookie = _getCookieByNm(psName);
		if (vsCookie) {
			document.cookie = psName + "= " + "; expires=" + voExpireDate.toGMTString() + "; path=/";
			if (typeof AppProperties !== 'undefined' && AppProperties.MSG_TOPIC_ID) {
				cpr.core.NotificationCenter.INSTANCE.post(AppProperties.MSG_TOPIC_ID, {
					TYPE: "info",
					MSG: "삭제되었습니다."
				});
			} else {
				alert("삭제되었습니다.");
			}
		} else {
			if (typeof AppProperties !== 'undefined' && AppProperties.MSG_TOPIC_ID) {
				cpr.core.NotificationCenter.INSTANCE.post(AppProperties.MSG_TOPIC_ID, {
					TYPE: "danger",
					MSG: "삭제 할 쿠키정보가 없습니다. (" + psName + ")"
				});
			} else {
				alert("삭제 할 쿠키정보가 없습니다. (" + psName + ")" );
			}
		}
	} else {
		document.cookie = "formlayout= " + "; expires=" + voExpireDate.toGMTString() + "; path=/";
		document.cookie = "constraint= " + "; expires=" + voExpireDate.toGMTString() + "; path=/";
		if (typeof AppProperties !== 'undefined' && AppProperties.MSG_TOPIC_ID) {
			cpr.core.NotificationCenter.INSTANCE.post(AppProperties.MSG_TOPIC_ID, {
				TYPE: "info",
				MSG: "포틀릿 정보가 삭제되었습니다."
			});
		} else {
			alert("포틀릿 정보가 삭제되었습니다.");
		}
	}
}

/* 개인화 */
Portlet.prototype.portletIndividual = function () {
	return new portletIndvdl(this);
}

/************************************************
 * 글로벌 출판
 ************************************************/
/* 포틀릿 */
globals.createPortlet = function() {
	return new Portlet();
};
