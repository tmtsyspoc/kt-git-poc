/************************************************
 * TableCombo.js
 * Created at 2020. 11. 6. 오후 3:30:04.
 *
 * @author HANS
 ************************************************/

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return app.lookup("cmb1").value;
};


/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(/* cpr.events.CEvent */ e){
	app.lookup("cmb1").setItemSet(app.getAppProperty("itemDataSet"),{
		label: app.getAppProperty("labelColumn"),
		value: app.getAppProperty("valueColumn")
	});
}


/*
 * 콤보 박스에서 open 이벤트 발생 시 호출.
 * 리스트박스를 열때 발생하는 이벤트.
 */
function onCmb1Open(/* cpr.events.CUIEvent */ e){
	/** 
	 * @type cpr.controls.ComboBox
	 */
	var cmb1 = e.control;
	
	e.preventDefault();
	
	var vsCmbVal = cmb1.value;
	
	var voRtAppIns = app.getRootAppInstance();
	
	var vcDs = app.getAppProperty("itemDataSet");
	var vsLabelCol = app.getAppProperty("labelColumn");
	var vsValueCol = app.getAppProperty("valueColumn");

	var voNewApp = new cpr.core.App("_table_combo", {
		onCreate: function(app, exports){
			var container = app.getContainer();
			container.style.css({
				"width" : "100%",
				"top" : "0px",
				"height" : "100%",
				"left" : "0px"
			});
			
			var vcGrids = new cpr.controls.Grid("tables");
			vcGrids.init({
				"dataSet": vcDs,
				"columns": [
					{"width": "100px"},
					{"width": "100px"}
				],
				"header": {
					"rows": [{"height": "37px"}],
					"cells": [
						{
							"constraint": {"rowIndex": 0, "colIndex": 0},
							"configurator": function(cell){
								cell.targetColumnName = vsLabelCol;
								cell.filterable = false;
								cell.sortable = false;
								cell.text = vsLabelCol;
							}
						},
						{
							"constraint": {"rowIndex": 0, "colIndex": 1},
							"configurator": function(cell){
								cell.targetColumnName = vsValueCol;
								cell.filterable = false;
								cell.sortable = false;
								cell.text = vsValueCol;
							}
						}
					]
				},
				"detail": {
					"rows": [{"height": "37px"}],
					"cells": [
						{
							"constraint": {"rowIndex": 0, "colIndex": 0},
							"configurator": function(cell){
								cell.columnName = vsLabelCol;
							}
						},
						{
							"constraint": {"rowIndex": 0, "colIndex": 1},
							"configurator": function(cell){
								cell.columnName = vsValueCol;
							}
						}
					]
				}
			});
			
			app.addEventListener("load", function(e){
				var initValue = vsCmbVal;
				
				var row =vcGrids.findFirstRow(vsValueCol+"=='"+cmb1.value+"'")			
				vcGrids.selectRows(row.getIndex());
			});
			
			vcGrids.addEventListener("row-dblclick", function(e) {
				var control = e.control;
				
				var voRow = control.getRow(e.rowIndex);
				var voRowData = voRow.getRowData();
				
				app.close(voRowData);
			});
			
			container.addChild(vcGrids, {
				top: "0px",
				left: "0px",
				right: "0px",
				bottom: "0px"
			});
		}
	});
	
	cpr.core.Platform.INSTANCE.register(voNewApp);
	
	var voCmbActlRct = cmb1.getActualRect();
	
	voRtAppIns.dialogManager.openDialog("_table_combo", "table_combo", {
		left: voCmbActlRct.left,
		top: voCmbActlRct.bottom,
		width: 220,
		height: 350
	}, function(dlg){
		dlg.headerVisible = false;
		dlg.resizable = false;
		dlg.style.overlay.css("background-color", "transparent");
		dlg.style.overlay.css("backdrop-filter", "unset");
		
		dlg.ready(function(ea){
			
		});
		
		dlg.addEventListener("overlay-click", function(e){
			voRtAppIns.dialogManager.closeAll();
		});
		
		dlg.addEventListener("close", function(e){
			var control = e.control;
			var voRtVal = control.returnValue;
			
			if (ValueUtil.isNull(voRtVal)){
				return;
			}
			
			cmb1.selectItemByValue(voRtVal.value);
		});
	});
}
