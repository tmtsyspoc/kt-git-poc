/************************************************
 * udcMngChart.js
 * Created at 2025. 4. 8. 오후 2:43:25.
 *
 * @author HWPS
 ************************************************/
var mcDs= null;
/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

exports.getData = function(){
	return {
		type:"chart",
		value: app.lookup("ipbTitle").value,
		hasSub:"Y",
		"sub_value" : [{"value":JSON.stringify({
			chartType:app.lookup("dsYCol").getColumnData("type").join(","),
			xAxis: app.lookup("cmb1").value,
			yAxis: app.lookup("dsYCol").getColumnData("column").join(","),
			data : JSON.stringify(app.lookup("grd1").dataSet.getRowDataRanged()),
			posiVer: app.lookup("cmbPosiVer").value,
			posiHori:app.lookup("cmbPosiHori").value,
			})
		}]
	}
}

exports.setData = function(poData){
	app.lookup("ipbTitle").value = poData.value;
	try{
		
	var data = JSON.parse(poData["sub_value"][0]["value"]);
	app.lookup("txa1").value = data["data"];
	makeTable(JSON.parse(data["data"]));
	
	app.lookup("cmbPosiVer").value = data["posiVer"];
	app.lookup("cmbPosiHori").value = data["posiHori"];
	app.lookup("cmb1").value = data["xAxis"];
	/** @type Array */
	var vaYAxis = data["yAxis"].split(",");
	var vaChartType = data["chartType"].split(",");
	vaYAxis.forEach(function(each,idx){
		app.lookup("dsYCol").pushRowData({column:each,type:vaChartType[idx]});
	});
	setChart();
	} catch(e){
		console.log(e);
	}
	
}
function readCsv(file){
	var reader = new FileReader();
	reader.onload = function(ev){
		var text = e.target.result;
		const json = csvToJson(text);
		makeTable(json);
	};
	reader.readAsText(file);
}

function csvToJson(csvText){
	var lines = csvText.trim().split("\n");
	/** @type Array */
	var header = lines[0].split(",").map(function(each){
		return each.trim();
	});
	
	var result = lines.slice(1).map(function(each){
		var values = each.split(",").map(function(eachV){
			return eachV.trim();
		});
		var obj = {};
		header.forEach(function(head,idx){
			obj[head] = values[idx];
		});
		return obj;
	});
	return result;
}

function makeTable(paData){
	if(!paData){
		return;
	}
	var voFirst = paData[0];
	var vaColumnInfo = [];
	Object.keys(voFirst).forEach(function(each){
		var returns = {
			"name" : each
		};
		if(typeof voFirst[each] == "number") {
			returns["dataType"] = voFirst[each];
		}
		vaColumnInfo.push(returns);
	});
			
	mcDs = new cpr.data.DataSet();
	mcDs.parseData({
		columns: vaColumnInfo
	});
	mcDs.build(paData);
	var columns = vaColumnInfo.map(function(each){
		return {"width":"100px"};
	});
	
	var vaHeaders = vaColumnInfo.map(function(each,idx){
		return {
					"constraint": {"rowIndex": 0, "colIndex": idx},
					"configurator": function(cell){
						cell.filterable = false;
						cell.sortable = false;
						cell.targetColumnName = each.name;
						cell.text = each.name;
					}
				}
	});
	var vaDetails = vaColumnInfo.map(function(each,idx){
		return {
					"constraint": {"rowIndex": 0, "colIndex": idx},
					"configurator": function(cell){
						cell.columnName = each.name;
					}
				}
	});
		app.lookup("grd1").init({
				"dataSet": mcDs,
				"columns": columns,
				"header": {
					"rows": [{"height": "44px"}],
					"cells": vaHeaders
				},
				"detail": {
					"rows": [{"height": "45px"}],
					"cells": vaDetails
				}
		});
	
	var vcCmb1 = app.lookup("cmb1");
	vcCmb1.clearSelection();
	vcCmb1.deleteAllItems();
	var vcCmb2 = app.lookup("cmb2");
	vcCmb2.clearSelection();
	vcCmb2.deleteAllItems();
	vaColumnInfo.forEach(function(each){
		var item = new cpr.controls.Item(each.name, each.name);
		vcCmb1.addItem(item);
		vcCmb2.addItem(item);
	});
	
	
		
	var tabItem = app.lookup("tab1").getTabItems()[1];
	tabItem.enabled = true;
	app.lookup("tab1").setSelectedTabItem(tabItem);
}


function setChart(){
	var tabItem = app.lookup("tab1").getTabItems()[2];
	tabItem.enabled = true;
	app.lookup("tab1").setSelectedTabItem(tabItem);
	var vcChart = app.lookup("ch1");
	vcChart.categoryColNm =app.lookup("cmb1").value;
	vcChart.valueColNms = app.lookup("dsYCol").getColumnData("column").join(",");
	vcChart.chartType = app.lookup("dsYCol").getColumnData("type").join(",");
	vcChart.title = app.lookup("ipbTitle").value;
	vcChart.dataSet = app.lookup("grd1").dataSet;
	vcChart.titlePosition = app.lookup("cmbPosiVer").value+"-"+app.lookup("cmbPosiHori").value
	vcChart.drawChart();
}
/*
 * "데이터로 그리드 만들기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var button = e.control;
	if(mcDs != null) {
		mcDs.dispose();
		mcDs = null;
	}
	var vsData = app.lookup("txa1").value.replace(/([\n\t])+/g,"");
	var vaData = JSON.parse(vsData);
	makeTable(vaData);
	
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick2(e){
	var button = e.control;
	var evt = new cpr.events.CAppEvent("mng-delete");
	app.dispatchEvent(evt);
//	app.getHost().dispose();
}

/*
 * "차트 미리보기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick3(e){
	var button = e.control;
	setChart();
}

/*
 * "csv파일 읽기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick4(e){
	var button = e.control;
	app.lookup("fi1").openFileChooser();
}

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFi1ValueChange(e){
	var fi1 = e.control;
	var file = fi1.file;
	readCsv(file);
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCbx1ValueChange(e){
	var cbx1 = e.control;
	var vcType = app.lookup("cmbType");
	if(!cbx1.checked) {
		vcType.value = vcType.values[0];
	}
	vcType.multiple = cbx1.checked;
}

/*
 * "추가" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick5(e){
	var button = e.control;
	app.lookup("dsYCol").addRow();
}

/*
 * "삭제" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick6(e){
	var button = e.control;
	app.lookup("dsYCol").deleteRow(app.lookup("grd2").getSelectedRowIndex());
}
