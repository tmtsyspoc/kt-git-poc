/************************************************
 * PivotHelperH.js
 * Created at 2020. 5. 14. 오후 4:09:59.
 *
 * @author ryu
 * 
 * --------------------------------------------------------------------------
 * 버전			|작성자	|내용
 * --------------------------------------------------------------------------
 * 1.0			|류다은	|최초 작성
 ************************************************/

/************************************************
 * 사용자 정의 이벤트
 ************************************************/

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	return "Not Support";
};


/**
 * 타겟 데이터 셋의 컬럼명을 통해 피벗 조건을 생성할 수 있는 필드를 생성합니다. 
 * @param {cpr.data.DataSet} pcDataset
 */
function createDatasetField(pcDataset) {
	/* 필드 초기화 */
	removeDatasetFields();
	
	var vcDsTarget = pcDataset; // 피벗으로 그려질 타겟 데이터 셋
	
	var vcGrpAllCn = app.lookup("grpAllCn"); // 전체 컨텐츠 영역
	
	/* 데이터 셋의 컬럼을 전체 컨텐츠 영역에 동적 생성 */
	vcDsTarget.getColumnNames().forEach(function(each){
		var vcField = new cpr.controls.Button(each);
		
		/* 컬럼 정보를 통해 버튼 속성 지정 */
		vcField.fieldLabel = each; // 컬럼 이름
		vcField.value = vcDsTarget.getHeader(each).getInfo() || each; // 라벨
		vcField.style.setClasses("field"); // 스타일
		
		/* 드래그 앤 드롭 설정 */
		setupSource(vcField);
		
		/* 전체 컨텐츠 영역에 자식 추가 */
		vcGrpAllCn.addChild(vcField, {
			width: "100%",
			height: "28px"
		});
	});
}


/**
 * 타겟 데이터 셋의 컬럼명을 통해 생성된 필드를 모두 제거합니다. 
 */
function removeDatasetFields() {
	var vcGrpHlpBd = app.lookup("grpHlpBd"); // 피벗 도우미 바디 영역
	
	/* field 스타일이 적용된 필드를 찾아 모두 삭제 */
	vcGrpHlpBd.getAllRecursiveChildren(false).filter(function(each){
		return each.style.hasClass("field");
	}).forEach(function(each){
		each.getParent().removeChild(each, true);
	});
	
	vcGrpHlpBd.redraw();
}


/**
 * 필드의 드래그 소스 컨텍스트를 지정합니다.
 * @param {cpr.controls.Button} control
 */
function setupSource(control) {
	/** @type cpr.controls.Output */
	var dragSourceFeedback;

	return new cpr.controls.DragSource(control, {
		onDragStart: function(context) {
			context.cursor = "grabbing";
			dragSourceFeedback = createDragSourceFeedback();

			control.style.css("opacity", "0.6");
			context.data = control["value"];

			var actualRect = control.getActualRect();
			dragSourceFeedback.value = context.data;
			app.getRootAppInstance().floatControl(dragSourceFeedback, cpr.controls.layouts.XYLayout.createConstraintWithRect(actualRect));
		},

		onDragMove: function(context) {
			var actualRect = context.source.control.getActualRect();
			var newRect = actualRect.getTranslatedByDimension(context.dragDelta);
			app.getRootAppInstance().floatControl(dragSourceFeedback, cpr.controls.layouts.XYLayout.createConstraintWithRect(newRect));
		},

		onDragCancel: function(context) {
			// 취소 애니메이션
			if (dragSourceFeedback && dragSourceFeedback.disposed === false) {
				var actualRect = control.getActualRect();
				dragSourceFeedback.style.animateTo({
					"left": actualRect.left + "px",
					"top": actualRect.top + "px",
					"opacity": "0"
				}, 0.3);
				dragSourceFeedback.addEventListenerOnce("transitionend", function(e) {
					dragSourceFeedback.dispose();
					dragSourceFeedback = null;
				});
			}
			control.style.removeStyle("opacity");
		},

		onDragEnd: function(context) {
			if (dragSourceFeedback && dragSourceFeedback.disposed === false) {
				// 드롭 타겟이 존재한다면, 작아지는 애니메이션 표시.
				if (context.target) {
					dragSourceFeedback.style.animateTo({
						"transform": "scale(0, 0)"
					}, 0.1);
					dragSourceFeedback.addEventListenerOnce("transitionend", function(e) {
						dragSourceFeedback.dispose();
						dragSourceFeedback = null;
					});
				}

				// 드롭 타겟 없이 드래그 앤 드랍이 종료되었다면 캔슬 애니메이션 표시.
				else {
					var actualRect = control.getActualRect();
					dragSourceFeedback.style.animateTo({
						"left": actualRect.left + "px",
						"top": actualRect.top + "px",
						"opacity": "0"
					}, 0.3);
					dragSourceFeedback.addEventListenerOnce("transitionend", function(e) {
						dragSourceFeedback.dispose();
						dragSourceFeedback = null;
					});
				}
			}
			control.style.removeStyle("opacity");
			
			if (context.target){
				var vcField = context.source.control;
				vcField.getParent().removeChild(vcField, true);
			}
		}
	});
}


/**
 * 드래그 중 표시되는 피드백을 생성합니다.
 */
function createDragSourceFeedback() {
	var dragSourceFeedback = new cpr.controls.Button();
	dragSourceFeedback.style.css({
		"background-image" : "none",
		"background-color" : "#ffffff",
		"border-radius" : "0",
		"box-shadow": "0px 2px 10px #ddd",
		"cursor": "move",
		"opacity": "0.8",
		"overflow": "hidden",
		"padding" : "0px 5px",
		"text-align": "left",
		"text-overflow": "ellipsis",
		"color" :"inherit"
	});
	
	return dragSourceFeedback;
}


/**
 * 각 필드의 영역에 드롭 타겟 컨텍스트를 설정합니다.
 * @param {cpr.controls.Container} control
 */
function setupVerticalLayoutTarget(control) {
	var targetContainer = control;
	
	/**
	 * 드롭 타켓에 마지막 자식 존재 여부를 판단합니다.
	 * @param {cpr.geometry.Point} location
	 * @return {cpr.controls.UIControl}
	 */
	function findAfter(location) {
		var children = targetContainer.getChildren();
		var after = children.find(function(each) {
			return each.isFloated() === false && location.y < each.getActualRect().center.y;
		});

		return after;
	}
	
	/**
	 * 어느 위치에 드롭할 것인지에 대한 피드백을 생성합니다.
	 */
	function createInsertFeedback() {
		var output = new cpr.controls.Output();
		output.style.css({
			backgroundColor: "#CF6160"
		});
		return output;
	}

	/** @type cpr.controls.UIControl */
	var feedback = null;
	var scrollAmount = 200;
	var edgeWidth = 60;
	
	/**
	 * 드롭 피드백을 생성하거나 이미 생성된 피드백을 리턴합니다.
	 * @return {cpr.controls.Output}
	 */
	function ensureFeedback() {
		if (feedback && feedback.disposed === false) {
			return feedback;
		} else {
			feedback = createInsertFeedback();
			return feedback;
		}
	}

	var dropTarget = new cpr.controls.DropTarget(targetContainer, {
		onDragEnter: function(context) {
			context.cursor = "copy";
		},
		onDrop: function(context) {
			var after = findAfter(context.pointerLocation);
			
			/* 새로운 필드 생성 */
			var button = createFieldControl({
				columnName : context.source.control.fieldLabel,
				value : context.data,
				type : targetContainer.userAttr("pivot-field-type")
			});
			
			button.style.css("opacity", "0");
			
			/* 드래그 앤 드롭 컨텍스트 설정 */
			setupSource(button);
			
			var childConstraint = {
				width: "100%",
				height: "28px"
			};
			
			/* 드롭될 필드의 위치 계산 */
			if (after) {
				var index = targetContainer.getChildren().indexOf(after);
				targetContainer.insertChild(index, button, childConstraint);
			} else {
				targetContainer.addChild(button, childConstraint);
			}
			
			/* 드롭될 필드가 추가된 이후 드롭에 대한 피드백 삭제 */
			if (feedback && !feedback.disposed) {
				feedback.dispose();
				feedback = null;
			}
			
			/* UI가 최초 1회 그려진 이후 애니메이션 실행 */
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
				if (targetContainer.getViewPortRect().containsRect(button.getOffsetRect()) === false) {
					targetContainer.reveal(button, 0.3);
				}
				button.style.animateTo({
					"opacity": "1"
				});
				
				/* 자동 실행 상태인 경우 드롭 이후 즉시 실행 */
				if (app.lookup("cbxAtRn").checked){
					app.lookup("btnRn").click();
				}
			});
		},
		onDragLeave: function(context) {
			if (feedback && !feedback.disposed) {
				feedback.dispose();
				feedback = null;
			}
		},
		onDragIdle: function(cosntraint, repeat) {
			var actualRect = targetContainer.getActualRect();
			var animationDuration = dropTarget.idleRepeatTime;
			if (repeat) {
				animationDuration = dropTarget.idleRepeatTime;
			}
			if (Math.abs(actualRect.right - cosntraint.pointerLocation.y) < edgeWidth) {
				targetContainer.adjustScroll(scrollAmount, 0, animationDuration);
			} else if (Math.abs(actualRect.left - cosntraint.pointerLocation.y) < edgeWidth) {
				targetContainer.adjustScroll(-scrollAmount, 0, animationDuration);
			}
		},
		onDragMove: function(context) {
			/* 드롭 타겟의 위치에 따라 피드백의 위치를 계산 */
			var after = findAfter(context.pointerLocation);
			var y = 0;
			if (after) {
				y = after.getOffsetRect().y - targetContainer.getLayout().spacing * 0.5 - 1;
			} else {
				var lastChild = targetContainer.getChildren().reverse().find(function(e) {
					return e.isFloated() === false;
				});
				if (lastChild) {
					y = lastChild.getOffsetRect().bottom + 1;
				} else {
					y = 0;
				}
			}
			
			/* 피드백을 컨테이너에 플로팅 */
			var feedback = ensureFeedback();
 			targetContainer.floatControl(feedback, {
				left: "5px",
				width: "calc(100% - 10px)",
				top: y + "px",
				height: "1px"
			});
		}
	});
}


/**
 * 필드 컨트롤을 동적으로 생성합니다. 전체 영역에서 그 외 영역으로 드롭할 때 사용됩니다.
 * @param {{columnName : String, value : String, type : "all" | "column" | "row" | "value"}} poData
 */
function createFieldControl(poData) {
	var vcField = new cpr.controls.Button(poData.columnName);
	
	/* 필드에 대한 정보 설정 */
	vcField.fieldLabel = poData.columnName;
	vcField.value = poData.value || poData.columnName;	
	
	var vsDfCnfg = "";
	var vsDfClasses = ["field"];
	
	/* 필드가 위치할 영역(타입)에 따라 주어질 스타일 또는 상태값 설정 */
	var vsCnType = poData.type;
	if (vsCnType == "column" || vsCnType == "row"){
		vsDfCnfg = "asc";
	} else if (vsCnType == "value") {
		/** @type cpr.data.DataSet */
		var vcDsTarget = app.getAppProperty("dataset");
		
		var vsDataType = vcDsTarget.getHeader(poData.columnName).getDataType();
		var vsDfCnfg = vsDataType != "string" ? "sum" : "count";
	}
	
	/* 생성 이후에도 데이터를 참조할 수 있도록 사용자 정의 속성 정의 */
	vcField.userAttr("pivot-field-config", vsDfCnfg);
	vcField.style.setClasses("field", vsCnType, vsDfCnfg);
	
	/* 필드를 선택하였을 때 컨텍스트 메뉴 생성 */
	vcField.addEventListener("click", function(e){
		var vcMnuField = new cpr.controls.Menu("mnuField");
		
		/* 필드 타입에 따라 컨텍스트 메뉴의 데이터를 변경 */
		var vcMnuDs = vsCnType == "value" ? app.lookup("dsVFld") : app.lookup("dsCRFld");
		
		vcMnuField.setItemSet(vcMnuDs, {
			label : "label",
			value : "value",
			parentValue : "parent",
			icon : "icon"
		});
		
		var vsFieldCnfg = e.control.userAttr("pivot-field-config");
		vcMnuField.value = vsFieldCnfg;
		
		/* 컨텍스트 메뉴 아이템을 선택했을 때 필드 상태값을 변경 */
		vcMnuField.addEventListener("item-click", function(e) {
			var control = e.control;
			var vcItem = e.item;
			
			vcField.style.removeClass(vsFieldCnfg);
			vcField.style.addClass(vcItem.value);
			vcField.userAttr("pivot-field-config", vcItem.value);
			
			control.blur();
			
			/* 필드의 정보가 변경되었을 때 자동 실행 여부에 따라 피벗 실행 */
			var isChecked = app.lookup("cbxAtRn").checked;
			if (isChecked){
				app.lookup("btnRn").click();
			}
		});
		
		/* 컨텍스트 메뉴를 클릭하거나 포커스를 잃었을 때 컨텍스트 메뉴 파기 */
		vcMnuField.addEventListener("blur", function(e) {
			var control = e.control;
			
			control.hide();
			control.dispose();
		});
		
		/** @type cpr.geometry.Rectangle */
		var voActlRct = e.control.getActualRect();
		
		/* 컨텍스트 메뉴를 버튼의 위치를 기준으로 플로팅 */
		app.getRootAppInstance().getContainer().floatControl(vcMnuField, {
			top : voActlRct.bottom + "px",
			left : voActlRct.left + "px",
			width : voActlRct.width + "px"
		});
		
		vcMnuField.focus();
	});

	return vcField;
}


/**
 * 피벗의 포맷을 가져옵니다.
 * @return {cols:{column:string}[], rows:{column:string, label:string}[], values:{column:string, label:string, aggregator:(sum|avg|min|max|count)}[]}
 */
function getConfig() {
	/* 피벗 데이터 포맷 선언 */
	var voCnfg = {
		cols : [],
		rows : [],
		values : []
	}
	
	/* 필드 상태값을 통해 데이터 정렬 */
	var vaRwCond = app.lookup("grpRwCn").getChildren().map(function(each){
		return each.fieldLabel + " " + each.userAttr("pivot-field-config");
	});
	
	var vaClmnCond = app.lookup("grpClmnCn").getChildren().map(function(each){
		return each.fieldLabel + " " + each.userAttr("pivot-field-config");
	});
	
	if (vaRwCond.length > 0 && vaClmnCond.length > 0){
		/** @type cpr.data.DataSet */
		var vcDsTarget = app.getAppProperty("dataset");
		vcDsTarget.setSort(vaRwCond.concat(vaClmnCond).join(","));
	}
	
	/* 피벗 설정 구조체 생성 */
	app.lookup("grpClmnCn").getChildren().forEach(function(/* cpr.controls.Button */ each, index){
		voCnfg.cols.push({
			column : each.fieldLabel,
			label : each.value
		});
	});
	
	app.lookup("grpRwCn").getChildren().forEach(function(/* cpr.controls.Button */ each, index){
		voCnfg.rows.push({
			column : each.fieldLabel,
			label : each.value,
			suppressible : true,
			suppressRef : (index - 1)
		});
	});
	
	app.lookup("grpValCn").getChildren().forEach(function(/* cpr.controls.Button */ each, index){
		voCnfg.values.push({
			column : each.fieldLabel,
			label : each.value,
			aggregator : each.userAttr("pivot-field-config")
		});
	});
	
	return voCnfg;
}

exports.getConfig = getConfig;


/**
 * 피벗 타겟 데이터 셋을 가져옵니다.
 * 
 * @return {cpr.data.DataSet}
 */
function getDataset() {
	return app.getAppProperty("dataset");
}

exports.getDataset = getDataset;


/**
 * 피벗의 병합 표현 여부를 가져옵니다.
 * 
 * @retrun {"merged" | "split"}
 */
function getSuppressedCellType() {
	return app.lookup("grpValCn").getChildrenCount() > 0 ? "merged" : "split";
}

exports.getSuppressedCellType = getSuppressedCellType;

/************************************************
 * 일반 이벤트
 ************************************************/


/*
 * Body에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(/* cpr.events.CEvent */ e){
	/* 각 필드 영역에 드롭 타켓 컨텍스트를 지정 */
	app.lookup("grpHlpBd").getChildren().filter(function(each){
		return each instanceof cpr.controls.Container;
	}).forEach(function(each){
		setupVerticalLayoutTarget(each);
	});
}


/*
 * Body에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(/* cpr.events.CPropertyChangeEvent */ e){
	/* 데이터 셋 앱 속성이 변경되었을 때 피벗 도우미 실행 */
	if (e.property == "dataset"){
		if (e.newValue instanceof cpr.data.DataSet){
			createDatasetField(e.newValue);
		}
	}
}


/*
 * 버튼(btnTggl)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnTgglClick(/* cpr.events.CMouseEvent */ e){
	/** 
	 * @type cpr.controls.Button
	 */
	var btnTggl = e.control;

	var voGrpCntLt = app.getContainer().getLayout();
	
	/* 현재 피벗 도우미 바디 영역의 표시 여부에 따라 숨기거나 표시 */
	var vbRwVs = voGrpCntLt.isRowVisible(1);
	
	voGrpCntLt.setRowVisible(1, !vbRwVs);
	
	var vcHost = app.getHost();
	var vcHostCn = vcHost.getParent();
	
	var vnStdHt = 28; // 최소 사이즈
	if (!vbRwVs){ // 미표시 -> 표시
		vnStdHt = app.getAppProperty("maxHeight"); // 최대 사이즈 (default:250)
		if(btnTggl.style.hasClass("ico-plus")) {
			btnTggl.style.removeClass("ico-plus");
		}
		btnTggl.style.addClass("ico-minus");
	} else { // 표시 -> 미표시
		if(btnTggl.style.hasClass("ico-minus")) {
			btnTggl.style.removeClass("ico-minus");
		}
		btnTggl.style.addClass("ico-plus");
	}
	btnTggl.redraw();
	/* 폼 레이아웃이 아닌 경우에만 자동으로 높이를 조절 */
	if (vcHostCn.getLayout() instanceof cpr.controls.layouts.FormLayout == false){
		vcHostCn.updateConstraint(vcHost, {
			height : vnStdHt + "px"
		});
	}	
	
	/* 토글 이벤트 디스패치 */
	var voEvToggle = new cpr.events.CMouseEvent("toggle", {
		content : {
			"visible" : !vbRwVs,
			"height" : vnStdHt
		}
	});
	app.dispatchEvent(voEvToggle);
}


/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 * CheckBox의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onCbxAtRnValueChange(/* cpr.events.CValueChangeEvent */ e){
	/** 
	 * @type cpr.controls.CheckBox
	 */
	var cbxAtRn = e.control;
	
	/* 자동 실행 체크 여부에 따라 피벗 정보를 실행 */
	var vbAtUpd = cbxAtRn.checked;
	
	if (vbAtUpd){
		app.lookup("btnRn").click();
	}
	
	/* 자동 실행 상태가 변경되었을 때 업데이트 이벤트 디스패치 */
	var voEvAtUpd = new cpr.events.CMouseEvent("update");
	app.dispatchEvent(voEvAtUpd);
}


/*
 * 버튼(btnRst)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnRstClick(/* cpr.events.CMouseEvent */ e){
	/** 
	 * @type cpr.controls.Button
	 */
	var btnRst = e.control;
	
	/* 각 데이터 셋 필드를 초기화하여 전체 영역에 다시 그리기 */
	createDatasetField(app.getAppProperty("dataset"));
	app.lookup("btnRn").click();
	
	/* 초기화 이벤트 디스패치 */
	var voEvRst = new cpr.events.CMouseEvent("reset");
	app.dispatchEvent(voEvRst);
}


/*
 * 버튼(btnRn)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnRnClick(/* cpr.events.CMouseEvent */ e){
	/** 
	 * @type cpr.controls.Button
	 */
	var btnRn = e.control;
	
	/* 각 필드 영역에 대한 정보를 바탕으로 피벗 데이터 생성 후 실행 이벤트 디스패치 */
	var voEvExt = new cpr.events.CMouseEvent("execute", {
		content : {
			dataset : getDataset(),
			cellType : getSuppressedCellType(),
			config : getConfig()
		}
	});
	app.dispatchEvent(voEvExt);
}
