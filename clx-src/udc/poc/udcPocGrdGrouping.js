/************************************************
 * grdGroupUDC.js
 * Created at 2023. 3. 22. 오후 3:57:14.
 *
 * @author tomatosystem
 ************************************************/

/* 그리드 초기 설정 정보 */
var moGridInitConfig = null;

/* 그룹핑 컬럼 정보 */
var maGroupingColumnNames = [];

/* 드래그 컨트롤 */
var mcDragSourceGrid = null;
var mcDragSourceButton = null;
var mcDropTarget = null;

/*그룹핑 푸터 컬럼 정보*/
var maGroupingFooterColumnNames = [];

/* 데이터 최초 소트 컨디션*/
var msSortCondition = null;

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

function createDragSourceFeedback() {
	var dragSourceFeedback = new cpr.controls.Output();
	dragSourceFeedback.style.css({
		"opacity": "0.8",
		"text-align": "center",
		"color": "black",
		"border-radius": "10px",
		"background": "white",
		"box-shadow": "0px 2px 10px #ddd",
		"cursor": "move",
		"padding" : "4px 8px"
	});
	return dragSourceFeedback;
}

function setupGridSource( /* cpr.controls.Grid */ grid) {
	/** @type cpr.controls.Output */
	var dragFeedback;
	/** @type cpr.geometry.Rectangle */
	var feedbackLocation = null;
	
	mcDragSourceGrid = new cpr.controls.DragSource(grid, {
		
		onDragStart: function(context) {
			
			var sourceDetail = context.targetObject;
			if (!sourceDetail) {
				context.cancel();
				return;
			}
			var relativeTargetName = sourceDetail.relativeTargetName;
			if (relativeTargetName !== "header") {
				context.cancel();
				return;
			}
			var cellIndex = sourceDetail.cellIndex;
			var column = grid.header.getColumn(cellIndex);
			var targetColumnName = column.targetColumnName;
			if (targetColumnName == null || targetColumnName == "") {
				context.cancel();
				return;
			}
			if (maGroupingColumnNames.indexOf(targetColumnName) != -1) {
				context.cancel();
				return;
			}
			var headerText = column.text || targetColumnName;
			context.data = {
				id: grid.id,
				cellIndex: sourceDetail.cellIndex,
				columnName: targetColumnName,
				headerText: headerText
			};
			context.cursor = "grabbing";
			dragFeedback = createDragSourceFeedback();
			dragFeedback.value = headerText;
			var startLocation = context.dragStartLocation;
			var columnConstraint = column.cellProp.constraint;
			
			feedbackLocation = new cpr.geometry.Rectangle(startLocation.x,
				startLocation.y,
				cpr.utils.ParamUtil.parseSize(columnConstraint.width).size,
				cpr.utils.ParamUtil.parseSize(columnConstraint.height).size);
			app.getRootAppInstance().floatControl(dragFeedback, cpr.controls.layouts.XYLayout.createConstraintWithRect(feedbackLocation));
		},
		onDragMove: function(context) {
			var newRect = feedbackLocation.getTranslated(context.dragDelta);
			app.getRootAppInstance().floatControl(dragFeedback, cpr.controls.layouts.XYLayout.createConstraintWithRect(newRect));
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
				dragFeedback.addEventListenerOnce("transitionend", function(e) {
					dragFeedback.dispose();
					dragFeedback = null;
				});
			}
		}
	});
}

function createInsertFeedback() {
	var output = new cpr.controls.Output();
	output.style.css({
		backgroundColor: "red"
	});
	return output;
}

function setupTarget( /* cpr.controls.Container */ group) {
	/**
	 * @param {cpr.geometry.Point} location
	 */
	function findAfter(location) {
		var children = group.getChildren();
		var after = children.find(function(each) {
			return each.isFloated() === false && location.x < each.getActualRect().center.x;
		});
		return after;
	}
	
	/** @type cpr.controls.Button */
	var feedback = null;
	var scrollAmount = 200;
	var edgeWidth = 60;
	
	function ensureFeedback() {
		if (feedback && feedback.disposed === false) {
			return feedback;
		} else {
			feedback = createInsertFeedback();
			return feedback;
		}
	}
	
	mcDropTarget = new cpr.controls.DropTarget(group, {
		
		onDragEnter: function(context) {
			context.cursor = "copy";
		},
		onDrop: function(context) {
			var columnName = context.data.columnName;
			var headerText = context.data.headerText;
			var cellIndex = context.data.cellIndex;
			
			var after = findAfter(context.pointerLocation);
			
			var vcIpbColNm = createLengendGrp(headerText);// 삭제 버튼 추가 (2022-05-02)
			vcIpbColNm.userAttr({
				columnName: columnName,
				headerText: headerText,
				cellIndex: cellIndex
				
			});
			vcIpbColNm.style.css({
				"opacity": "0",
			});
			var childConstraint = {
				height: "calc(100% - 8px)",
				autoSize: "width"
			};
			if (after) {
				var index = group.getChildren().indexOf(after);
				group.insertChild(index, vcIpbColNm, childConstraint);
				maGroupingColumnNames.splice(index, 0, columnName);
			} else {
				group.addChild(vcIpbColNm, childConstraint);
				maGroupingColumnNames[maGroupingColumnNames.length] = columnName;
			}
			if (feedback && !feedback.disposed) {
				feedback.dispose();
				feedback = null;
			}
			setupLegendSource(vcIpbColNm);
			
			resetGrid();

			vcIpbColNm.style.animateTo({
				"opacity": "1"
			});
		},
		onDragLeave: function(context) {
			if (feedback && !feedback.disposed) {
				feedback.dispose();
				feedback = null;
			}
		},
		
		onDragMove: function(context) {
			var after = findAfter(context.pointerLocation);
			var x = 0;
			if (after) {
				x = after.getOffsetRect().x - group.getLayout().spacing * 0.5 - 1;
			} else {
				var lastChild = group.getChildren().reverse().find(function(e) {
					return e.isFloated() == false;
				});
				if (lastChild) {
					x = lastChild.getOffsetRect().right + 1;
				} else {
					x = 0;
				}
			}
			var feedback = ensureFeedback();
			group.floatControl(feedback, {
				left: x + "px",
				width: "2px",
				top: "0px",
				height: "100%"
			});
		}
	});
}


function createLengendGrp (psValue) {
	
	var vcGrp = new cpr.controls.Container();
	vcGrp.style.setClasses(["cl-button", "primary", "p-0"]);
	
	var voFormLayout = new cpr.controls.layouts.FormLayout();
	voFormLayout.setRows(["1fr"]);
	voFormLayout.setColumns(["1fr", "15px"]);
	voFormLayout.rightMargin = 5;
	voFormLayout.horizontalSpacing = 0;
	vcGrp.setLayout(voFormLayout);
	
	var vcOutput = new cpr.controls.Output();
	vcOutput.style.setClasses(["text-white"]);
	vcOutput.value = psValue;
	vcOutput.style.css({
		"cursor": "pointer",
		"text-align": "center",
		"padding" : "0px 12px"
	});
	vcGrp.addChild(vcOutput, {
		rowIndex : 0,
		colIndex : 0
	});
	
	var vcOptClose = new cpr.controls.Output();
	vcOptClose.style.setClasses(["cursor-pointer", "text-white", "ph", "icon", "ico-x"]);
	vcOptClose.addEventListenerOnce("click", function(){
		var container = vcGrp.getParent();
		var vnIndex = container.getChildren().indexOf(vcGrp);
		maGroupingColumnNames.splice(vnIndex, 1);
		vcGrp.dispose();
		
		resetGrid();
	})
	vcGrp.addChild(vcOptClose, {
		rowIndex : 0,
		colIndex : 1,
		verticalAlign : "center",
		height : "14px"
	});
	
	return vcGrp;
}

function setupLegendSource( /** cpr.controls.Output */ output) {
	/** @type cpr.controls.Output */
	var dragSourceFeedback;
	
	mcDragSourceButton = new cpr.controls.DragSource(output, {
		onDragStart: function(context) {
			context.cursor = "grabbing";
			dragSourceFeedback = createDragSourceFeedback();
			
			output.style.css("opacity", "0.6");
			context.data = {
				columnName: output.userAttr("columnName"),
				headerText: output.userAttr("headerText"),
				cellIndex: output.userAttr("cellIndex")
			};
			
			var actualRect = output.getActualRect();
			dragSourceFeedback.value = context.data.headerText;
			app.getRootAppInstance().floatControl(dragSourceFeedback, cpr.controls.layouts.XYLayout.createConstraintWithRect(actualRect));
		},
		onDragMove: function(context) {
			var actualRect = context.source.control.getActualRect();
			var newRect = actualRect.getTranslated(context.dragDelta);
			app.getRootAppInstance().floatControl(dragSourceFeedback, cpr.controls.layouts.XYLayout.createConstraintWithRect(newRect));
		},
		onDragCancel: function(context) {
			if (dragSourceFeedback && dragSourceFeedback.disposed === false) {
				dragSourceFeedback.dispose();
				dragSourceFeedback = null;
			}
		},
		onDragEnd: function(context) {
			
			var container = output.getParent();
			var index = container.getChildren().indexOf(output);
			
			if (index != -1) {
				maGroupingColumnNames.splice(index, 1);
				output.dispose();
			}
			if (dragSourceFeedback && dragSourceFeedback.disposed === false) {
				dragSourceFeedback.dispose();
				dragSourceFeedback = null;
			}
			
			resetGrid();
		}
	});
}

/**
 * 설정된 그룹 조건으로 그리드를 생성합니다.
 */
function resetGrid() {
	/** @type cpr.controls.Grid */
	var grd1 = app.getAppProperty("grid");
	
	/** @type cpr.controls.Grid */
	var grid = mcDragSourceGrid.control;
	for(var idx = 0; idx < grid.detail.cellCount; idx++){
		var voColumn = grid.detail.getColumn(idx);
		maGroupingFooterColumnNames[idx] = "";
		
		if(voColumn.columnType == "normal") {
			var vsDataType = grid.dataSet.getColumn(voColumn.columnName).getHeader().getDataType();
			if(vsDataType == "number") {
				maGroupingFooterColumnNames[idx] = voColumn.columnName;
			}
		}
	}
	
	var rowGroups = [];
	var sortCondition = "";
	
	for (var i = 0; i < maGroupingColumnNames.length; i++) {
		var groupColumnName = maGroupingColumnNames[i];		
		rowGroups.push(getRowGroupConfig(groupColumnName, i));
		if(sortCondition){
			sortCondition += "," + groupColumnName;
		} else {
			sortCondition += groupColumnName;
		}		 
	}	
	
	if(rowGroups.length < 1) sortCondition = msSortCondition;
	
	if(sortCondition){
		grd1.dataSet.setSort(sortCondition);
	} else {
		grd1.dataSet.clearSort();
	}
		
	moGridInitConfig["rowGroup"] = rowGroups;
	grd1.init(moGridInitConfig);
	
}

/**
 * 그룹핑 셀의 설정정보를 반환합니다.
 * 동적 그리드 생성시 사용.
 */
function getRowGroupConfig(groupColumnName, depth) {
	return {
		"groupCondition": groupColumnName,
		"gheader": {
			"rows": [{
				"height": "37px",
			}],
			"cells": [{
					"constraint": {
						"rowIndex": 0,
						"colIndex": 0,
						"rowSpan": 1,
						"colSpan": mcDragSourceGrid.control.header.cellCount
					},
					"configurator": function(cell) {
						cell.expr = groupColumnName;
						cell.style.css({
							"background-color" : "#eeeeee",
							"background-image" : "none",
							"text-align": "left",
						});
					}
				},
			]
		},
		"gfooter" : (function(){
			if(maGroupingFooterColumnNames.join("").length == 0 ) return;
			
			var vaFooter = {
				"rows": [{
					"height": "37px"
				}],
				"cells": []
			}
			
			maGroupingFooterColumnNames.forEach(function(each, idx) {
				if(each != "" && each != null && each != undefined) {
					vaFooter["cells"].push({
						"constraint": {
							"rowIndex": 0,
							"colIndex": idx,
							"rowSpan": 1,
							"colSpan": 1
						},
						"configurator": function(cell) {
							cell.expr = "getSum(\"" + each + "\")";
							cell.control = (function() {
								var output_1 = new cpr.controls.Output();
								output_1.value = "Output";
								output_1.dataType = "number";
								output_1.format = "s#,###.#";
								output_1.style.setClasses(["text-right"]);
								return output_1;
							})();
							cell.style.css({
								"background-color": "#ccc",
								"background-image": "none"
							});
						}
					})
				}
			});
			
			return vaFooter;
		})()
	};
};

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad( /* cpr.events.CEvent */ e) {
	
	/** @type cpr.controls.Grid */
	var grd = app.getAppProperty("grid");	
	var grp = app.lookup("grp");
	
	msSortCondition = grd.dataSet.getSort();	
	moGridInitConfig = grd.getInitConfig();
	
	setupGridSource(grd);
	setupTarget(grp);
}
