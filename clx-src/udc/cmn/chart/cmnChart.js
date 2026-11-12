/************************************************
 * chart.js
 * Created at 2022. 3. 21. 오전 11:13:32.
 *
 * @author You Minsang
 ************************************************/

//=================================================================================
// [Object Setting]
//================================================================================= 
var util = createCommonUtil();
var moChart = null;
var moData = [];
var msChartType = null;
var msSubChartType = null;
var maExistingGraphics = [];
var maColors = ["#EC4651", "#156082"];

//=================================================================================
// [Function]
//================================================================================= 

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

/**
 * 차트 옵션을 반환합니다.
 * @param {cpr.data.DataSet} poDataSet 데이터 셋
 */
function getOption(poDataSet) {
	
	var vsTitle = app.getAppProperty("title");
	var vsType = app.getAppProperty("chartType");
	var vaTypes = vsType.split(" : ");
	msChartType = vaTypes[0];
	msSubChartType = vaTypes[1];
	
	var voOption = {};
	var vaSeries = [];
	
	if (!ValueUtil.isNull(vsTitle)) {
		var vsTitlePosition = app.getAppProperty("titlePosition");
		var vaTitlePosition = vsTitlePosition.split("-");
		
		voOption["title"] = {
			text: vsTitle,
			top: vaTitlePosition[0],
			left: vaTitlePosition[1],
			textStyle: {
				fontSize: '15'
			}
		}
	}
	
	var vsLengedPosition = app.getAppProperty("legendPosition");
	if (vsLengedPosition != "none") {
		voOption["legend"] = {
			top: vsLengedPosition
		};
	}
	
	// 흰색 배경색상 적용(이미지 다운로드시 배경색 지정을 위한 동작
	voOption["backgroundColor"] = '#ffffff';
	if (msChartType == "bar") {
		voOption = setBarOption(poDataSet, voOption);
	} else if (msChartType == "circle") {
		voOption = setCircleOption(poDataSet, voOption);
	} else if (msChartType == "line") {
		voOption = setLineOption(poDataSet, voOption);
	} else if (msChartType == "area") {
		voOption = setAreaOption(poDataSet, voOption);
	} else if (msChartType == "radar") {
		voOption = setRadarOption(poDataSet, voOption);
	}
	
	if (app.getAppProperty("useChartColor")) {
		voOption["color"] = maColors;
	}	
	return voOption;
}

function setBarOption(poDataSet, poOption) {
	
	/** @type cpr.data.DataSet */
	var vcDataset = poDataSet;
	var voOption = poOption;
	var vsType = app.getAppProperty("chartType");
	var vaType = vsType.split(" : ");
	
	var vsCatgoColNms = app.getAppProperty("categoryColNm");
	var vsValColNms = app.getAppProperty("valueColNms");
	var vaSeries = [];
	
	if (vaType[1] == "horizontal") {
		voOption["xAxis"] = {
			type: 'value'
		}
		
		voOption["yAxis"] = {
			type: 'category',
			data: vcDataset.getColumnData(vsCatgoColNms)
		}
	} else {
		voOption["xAxis"] = {
			type: 'category',
			data: vcDataset.getColumnData(vsCatgoColNms)
		}
		
		voOption["yAxis"] = {
			type: 'value'
		}
	}
	
	vsValColNms.split(",").forEach(function(colNm, idx) {
		colNm = colNm.trim();
		
		var name = vcDataset.getHeader(colNm).getInfo();
		if (ValueUtil.isNull(name)) {
			name = vcDataset.getHeader(colNm).getName();
		}
		
		var voSeries = {
			name: vcDataset.getHeader(colNm).getInfo(),
			data: vcDataset.getColumnData(colNm),
			type: 'bar',
			_colNm: colNm
		}
		
		vaSeries.push(voSeries);
	});
	
	voOption["series"] = vaSeries;
	voOption["tooltip"] = {
		trigger: 'axis',
		axisPointer: {
			type: 'shadow'
		}
	};
	
	// 합계 표시
	/** @type Array */
	var vaDatas = voOption["series"];
	var voSumDatas = {};
	vaDatas.forEach(function(each) {
		var vsName = each["name"];
		var vaVal = each["data"];
		voSumDatas[vsName] = vaVal.reduce(function(a, b) {
			return a + b;
		}, 0);
	});
	
	voOption = setViewSum(voOption, voSumDatas, "horizontal");
	return voOption;
}

function setCircleOption(poDataSet, poOption) {
	
	/** @type cpr.data.DataSet */
	var vcDataset = poDataSet;
	var voOption = poOption;
	var vsType = app.getAppProperty("chartType");
	var vaType = vsType.split(" : ");
	
	var vsCatgoColNms = app.getAppProperty("categoryColNm");
	var vsValColNms = app.getAppProperty("valueColNms");
	var vaSeries = [];
	var data = [];
	
	vcDataset.getRowDataRanged().forEach(function(rowData) {
		var _data = {
			name: rowData[vsCatgoColNms],
			value: rowData[vsValColNms]
		};
		data.push(_data);
	});
	
	if (vaType[1] == "pie") {
		voOption["series"] = [{
			type: 'pie',
			radius: '70%',
			center: ['50%', '50%'],
			data: data,
			emphasis: {
				shadowBlur: 10,
				shadowOffsetX: 0,
				shadowColor: 'rgba(0, 0, 0, 0.5)'
			}
		}];
	} else {
		voOption["series"] = [{
			type: 'pie',
			radius: ['40%', '70%'],
			itemStyle: {
				borderRadius: 10,
				borderColor: '#fff',
				borderWidth: 2
			},
			data: data,
			emphasis: {
				label: {
					show: true,
					fontSize: '17',
					fontWeight: 'bold'
				}
			},
			labelLine: {
				show: false
			}
		}];
	}
	
	voOption["tooltip"] = {
		trigger: 'item',
		formatter: '{b} : {c} ({d}%)'
	};
	
	return voOption;
}

function setLineOption(poDataSet, poOption) {
	
	/** @type cpr.data.DataSet */
	var vcDataset = poDataSet;
	var voOption = poOption;
	var vsType = app.getAppProperty("chartType");
	var vaType = vsType.split(" : ");
	
	var vsCatgoColNms = app.getAppProperty("categoryColNm");
	var vsValColNms = app.getAppProperty("valueColNms");
	var vaSeries = [];
	
	voOption["xAxis"] = {
		type: 'category',
		data: vcDataset.getColumnData(vsCatgoColNms)
	}
	
	voOption["yAxis"] = {
		type: 'value'
	}
	
	vsValColNms.split(",").forEach(function(colNm, idx) {
		colNm = colNm.trim();
		
		var name = vcDataset.getHeader(colNm).getInfo();
		if (ValueUtil.isNull(name)) {
			name = vcDataset.getHeader(colNm).getName();
		}
		
		var voSeries = {
			data: vcDataset.getColumnData(colNm),
			type: 'line',
			name: name
		}
		
		if (vaType[1] == "round") {
			voSeries["smooth"] = true;
		} else {
			voSeries["smooth"] = false;
		}
		
		vaSeries.push(voSeries);
	});
	
	voOption["series"] = vaSeries;
	voOption["tooltip"] = {
		trigger: 'axis',
		axisPointer: {
			type: 'shadow'
		}
	};
	
	// 합계 표시
	/** @type Array */
	var vaDatas = voOption["series"];
	var voSumDatas = {};
	vaDatas.forEach(function(each) {
		var vsName = each["name"];
		var vaVal = each["data"];
		voSumDatas[vsName] = vaVal.reduce(function(a, b) {
			return a + b;
		}, 0);
	});
	
	voOption = setViewSum(voOption, voSumDatas, "horizontal");	
	return voOption;
}

function setAreaOption(poDataSet, poOption) {
	
	/** @type cpr.data.DataSet */
	var vcDataset = poDataSet;
	var voOption = poOption;
	var vsType = app.getAppProperty("chartType");
	var vaType = vsType.split(" : ");
	
	var vsCatgoColNms = app.getAppProperty("categoryColNm");
	var vsValColNms = app.getAppProperty("valueColNms");
	var vaSeries = [];
	
	voOption["xAxis"] = {
		type: 'category',
		data: vcDataset.getColumnData(vsCatgoColNms),
		boundaryGap: false
	}
	
	voOption["yAxis"] = {
		type: 'value'
	}
	
	vsValColNms.split(",").forEach(function(colNm, idx) {
		colNm = colNm.trim();
		
		var name = vcDataset.getHeader(colNm).getInfo();
		if (ValueUtil.isNull(name)) {
			name = vcDataset.getHeader(colNm).getName();
		}
		
		var voSeries = {
			data: vcDataset.getColumnData(colNm),
			type: 'line',
			name: name,
			areaStyle: {}
		}
		
		if (vaType[1] == "round") {
			voSeries["smooth"] = true;
		} else {
			voSeries["smooth"] = false;
		}
		
		vaSeries.push(voSeries);
	});
	
	voOption["series"] = vaSeries;
	voOption["tooltip"] = {
		trigger: 'axis',
		axisPointer: {
			type: 'shadow'
		}
	};
	
	// 합계 표시
	/** @type Array */
	var vaDatas = voOption["series"];
	var voSumDatas = {};
	vaDatas.forEach(function(each) {
		var vsName = each["name"];
		var vaVal = each["data"];
		voSumDatas[vsName] = vaVal.reduce(function(a, b) {
			return a + b;
		}, 0);
	});
	
	voOption = setViewSum(voOption, voSumDatas, "horizontal");
		
	return voOption;
}

/**
 * 차트를 그립니다.
 */
function drawChart() {
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		var poContent = app.lookup("shlChart").getComponent("voContent");
		
		moChart = echarts.init(poContent);
		/** @type cpr.data.DataSet */
		var vcDataset = app.getAppProperty("dataSet");
		
		// 시연을 위해 default 데이터셋 지정 (2026.07.24)
		if (ValueUtil.isNull(vcDataset)) {
			vcDataset = app.getHostAppInstance().lookup("dsData");
		}
		
		if (vcDataset) {
			if (vcDataset.getRowCount() < 1) {
				app.lookup("nodatamsg").visible = true;
			} else {
				app.lookup("nodatamsg").visible = false;
			}
			var voOption = getOption(vcDataset);
			moChart.setOption(voOption, { notMerge: true });
			
			/* 차트 그리기 동작 완료 후 처리*/
			afterDrawChart();
		}
	});
}
exports.drawChart = drawChart;

/**
 * 차트 그리기 동작 완료 후 처리
 */
function afterDrawChart() {
	
	/* 드래그 Value-Change 사용여부*/
	if (app.getAppProperty("useDragValueChange")) {
		if (msChartType == "radar") {
			createRadarDragGraphic();
		} else if (msChartType == "bar") {			
			createBarDragGraphic();
		}
	}
}

/**
 * 차트에 변경된 데이터를 삽입합니다.
 * @param {cpr.data.DataSet} poDataSet? 데이터 셋이 변경된 경우 적용
 */
function pushData(poDataSet) {
	
	if (!moChart) return;
	
	var vcDataSet = poDataSet;
	
	if (!vcDataSet) vcDataSet = app.getAppProperty("dataSet");
	
	if (vcDataSet.getRowCount() < 1) {
		app.lookup("nodatamsg").visible = true;
	} else {
		app.lookup("nodatamsg").visible = false;
	}
	
	// 특정상황에서 애니메이션이 발생하지 않는경우를 방지하기위해 timeout 적용
	setTimeout(function() {
		var voOption = getOption(vcDataSet);
		moChart.setOption(voOption);
		
		/* 차트 그리기 동작 완료 후 처리*/
		afterDrawChart();	
	}, 30);
}

exports.pushData = pushData;

/**
 * Radar 차트 드래그 그래픽 구성
 */
function createRadarDragGraphic() {
	var radarModel = moChart.getModel().getComponent('radar');
	var coordSys = radarModel.coordinateSystem;
	
	var graphics = [];
	var voOption = moChart.getOption();
	/** @type cpr.data.DataSet */
	var dataSet = app.getAppProperty("dataSet");
	
	/** @type Array */
	var vaData = voOption["series"][0]["data"];
	vaData.forEach(function(data, pidx) {
		
		var targetVals = data.value;
		var colNm = data._colNm;
		var points = targetVals.map(function (v, pidx) {return coordSys.dataToPoint(v, pidx)});
		
		points.forEach(function(point, idx) {
			var x = point[0];
			var y = point[1];
			
			graphics.push({
				type: 'circle',
				position: [x, y],
				shape: {
					r: 4
				},
				style: {
					fill: maColors[pidx]
				},
				draggable: true,
				z: 100,
				ondrag: function(e) {
					var dx = e.target.position[0] - coordSys.cx;
					var dy = e.target.position[1] - coordSys.cy;
					var r = Math.sqrt(dx * dx + dy * dy);
					var ratio = r / coordSys.r;
					
					var indicator = radarModel.getIndicatorModels()[idx];
					var maxValue = indicator.option.max || 100;
					var minValue = indicator.option.min || 0;
					var newValue = Math.min(Math.max(ratio * (maxValue - minValue) + minValue, minValue), maxValue);
					
					var newVal = Math.round(newValue);
					if (newVal < 15) newVal = 0;
					
					vaData[pidx]["value"][idx] = newVal;
									
					// 데이터 갱신
					moChart.setOption({
						series: [{
							data: vaData
						}]
					}, {
						notMerge: false
					});
					
					var event = new cpr.events.CUIEvent("update");
					event.userData = {
						"index" : idx,
						"columName" : colNm,
						"newValue" : newVal,
					}
					app.dispatchEvent(event);
					
					dataSet.setValue(idx, colNm, newVal);
					createRadarDragGraphic();
				}
			});
		});
	});
	
	var allGraphics = maExistingGraphics.concat(graphics);
	moChart.setOption({
		graphic: {
			elements: allGraphics
		}
	});
}

/**
 * Bar 차트 드래그 그래픽 구성
 */
function createBarDragGraphic() {
	var coordSys = moChart.getModel().getSeriesByIndex(0).coordinateSystem;
	var graphics = [];
	var voOption = moChart.getOption();
	/** @type cpr.data.DataSet */
	var dataSet = app.getAppProperty("dataSet");
	
	/** @type Array */
	var vaSeries = voOption["series"];
	var isHorizontalType = msSubChartType == "horizontal" ? true : false;
	
	var barWidth = 4;
	var barHeight = 4;
	var shapeOption = {};
	var cursor;
	
	if (isHorizontalType) {
		var yAxis = moChart.getModel().getComponent('yAxis').axis;
		var barBandHeight = yAxis.getBandWidth();
		
		barHeight = (barBandHeight * 0.7) / vaSeries.length + 2;
		shapeOption = {
			x: -4,
			y: 0,
			width: barWidth,
			height: barHeight
		};
		
		cursor = "ew-resize";
	} else {
		var xAxis = moChart.getModel().getComponent('xAxis').axis;
		var barBandWidth = xAxis.getBandWidth();
		
		barWidth = (barBandWidth * 0.7) / vaSeries.length + 2;
		shapeOption = {
			x: 0,
			y: -4,
			width: barWidth,
			height: barHeight
		};
		
		cursor = "ns-resize";
	}
	
	vaSeries.forEach(function(series, pidx) {
		var targetVals = series.data;
		var colNm = series._colNm;
		
		targetVals.forEach(function(data, idx) {
			var arrPointType = [idx, data];
			var arrPointIdx = 1;
			
			if (isHorizontalType) {
				arrPointType = [data, idx];
				arrPointIdx = 0;
			}
			
			var point = moChart.convertToPixel({
				seriesIndex: 0
			}, arrPointType); // 위치 계산
			
			var x = point[0];
			var y = point[1];
			var drapPositionX = x;
			var drapPositionY = y;
			
			if (pidx == 0) {
				if (isHorizontalType) {
					drapPositionY = y - barHeight;
				} else {
					drapPositionX = x - barWidth;
				}
			}
			
			graphics.push({
				id: 'drag-point-' + pidx + idx,
				type: 'rect',
				position: [drapPositionX, drapPositionY],
				shape: shapeOption,
				style: {
					fill: 'rgba(0,0,0,0)', // 완전 투명
					stroke: '',
					lineWidth: 0
				},
				draggable: true,
				z: 100,
				cursor: cursor,
				ondrag: function(e) {
					var invData = moChart.convertFromPixel({
						seriesIndex: 0
					}, e.target.position);
					var newValue = invData[arrPointIdx];
					
					// 범위 제한 (0 ~ 1600)
					newValue = Math.max(0, Math.min(1600, newValue));
					let newVal = Math.round(newValue);
					
					vaSeries[pidx]["data"][idx] = newVal;
										
					// 데이터 갱신
					moChart.setOption({
						series: vaSeries
					}, {
						notMerge: false
					});
					
					var event = new cpr.events.CUIEvent("update");
					event.userData = {
						"index" : idx,
						"columName" : colNm,
						"newValue" : newVal,
					}
					app.dispatchEvent(event);
					
					dataSet.setValue(idx, colNm, newVal);
					createBarDragGraphic();
				}
			});
		});
	});
	
	var allGraphics = maExistingGraphics.concat(graphics);
	moChart.setOption({
		graphic: {
			elements: allGraphics
		}
	});
}

function setRadarOption(poDataSet, poOption) {
	var vnMax = 1600;
	var vnSplitNumber = 8;
	
	/** @type cpr.data.DataSet */
	var vcDataset = poDataSet;
	var voOption = poOption;
	var vsType = app.getAppProperty("chartType");
	var vaType = vsType.split(" : ");
	
	var vsCatgoColNms = app.getAppProperty("categoryColNm");
	var vsValColNms = app.getAppProperty("valueColNms");
	var voSeries = {};
	var vaIndicator = [];
	
	voSeries["type"] = "radar";
	voSeries["data"] = [];
	
	vsValColNms.split(",").forEach(function(each){
		each = each.trim();
		
		var vnMaxData = _.max(vcDataset.getColumnData(each));
		if(vnMax < vnMaxData) vnMax = vnMaxData;
	});
	
	vcDataset.getRowDataRanged().forEach(function(each) {
		vaIndicator.push({
			"name": each[vsCatgoColNms],
			"max": vnMax
		});
	});
	
	vsValColNms.split(",").forEach(function(colNm, idx) {
		colNm = colNm.trim();
		
		var name = vcDataset.getHeader(colNm).getInfo();
		if (ValueUtil.isNull(name)) {
			name = vcDataset.getHeader(colNm).getName();
		}
		
		var voData = {
			value: vcDataset.getColumnData(colNm),
			name: vcDataset.getHeader(colNm).getInfo(),
			_colNm: colNm
		}
		
		if (vaType[1] == "detail") {
			voData["label"] = {
				show: true,
				formatter: function(params) {
					return params.value;
				}
			}
		}
		
		voSeries["data"].push(voData);
	});
	
	voOption["radar"] = {
		indicator: vaIndicator,
		splitNumber: vnSplitNumber,
		name: {
			textStyle: {
				color: "#6D6D6D"
			}
		}
	}
	
	voOption["series"] = [voSeries];
	voOption["tooltip"] = {
		trigger: 'item'
	};
	
	// 추가 필드 표시
	var vaSplitText = [];
	for (var i = 0; i <= vnSplitNumber; i++) {
		var vnTop = 50 - i * 5;
		var vnLeft = 46;
		if (i == 0) {
			vnLeft = 48;
		}
		var voSplitItem = {
			id: 'text-point-' + i,
			type: 'text',
			left: vnLeft + '%',
			z: 10,
			top: vnTop + '%',
			style: {
				text: i * (vnMax / vnSplitNumber), // 중간값 위치에 라벨
				fill: '#6D6D6D',
				font: '10px sans-serif',
				textAlign: 'center'
			}
		}
		vaSplitText.push(voSplitItem);
	}
	
	// 합계 표시
	/** @type Array */
	var vaDatas = voSeries["data"];
	var voSumDatas = {};
	vaDatas.forEach(function(each) {
		var vsName = each["name"];
		var vaVal = each["value"];
		voSumDatas[vsName] = vaVal.reduce(function(a, b) {
			return a + b;
		}, 0);
	});
	
	if (voOption["graphic"]) {
		voOption["graphic"].push(vaSplitText);
	} else {
		voOption["graphic"] = vaSplitText;
	}
	
	voOption = setViewSum(voOption, voSumDatas, "vertical");
	
	return voOption;
}

/**
 * 합계 텍스트 표시
 * @param {any} poOption
 * @param {any} poSumData
 * @param {"vertical" | "horizontal"} psType
 */
function setViewSum(poOption, poSumData, psType) {
	
	var isViewSum = app.getAppProperty("viewSumText");
	
	if (isViewSum) {
		var vsSumText = "";
		var vaKeys = Object.keys(poSumData);
		vaKeys.forEach(function(each, idx) {
			vsSumText += each + " 합계 : " + poSumData[each].toLocaleString();
			if (idx < vaKeys.length - 1) {
				
				if (psType == "vertical") {
					vsSumText += "\n";
				} else {
					vsSumText += " ";
				}
				
			} else if (idx == vaKeys.length - 1) {
				if (psType == "vertical") {
					vsSumText += "\n";
				} else {
					vsSumText += " ";
				}
				vsSumText += "(단위 : 만원)";
			}
		});
		
		var voSumText = {
			type: 'text',
			left: '10%',
			top: '8%',
			style: {
				text: vsSumText,
				font: 'bold 13px sans-serif',
				lineHeight: 20,
				textAlign: "right",
				fill: '#333'
			}
		}
		
		var vaGraphic = poOption["graphic"];
		if (vaGraphic != null && vaGraphic instanceof Array) {
			vaGraphic.push(voSumText);
			maExistingGraphics = vaGraphic;
		} else {
			poOption["graphic"] = [voSumText];
			maExistingGraphics = [voSumText];
		}
	}
	
	return poOption;
}


//=================================================================================
// [Control Event Function]
//=================================================================================

/*
 * 쉘에서 init 이벤트 발생 시 호출.
 */
function onShl1Init( /* cpr.events.CUIEvent */ e) {
	/** 
	 * @type cpr.controls.UIControlShell
	 */
	var shl1 = e.control;
	var voContent = e.content;
	
	if (moChart) {
		// 쉘이 축소되어 정상적으로 그리지 못했을 경우 resize 적용    
		if (moChart.getWidth() == 0 || moChart.getHeight() == 0) {
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
				var voHostActr = app.getHost().getActualRect();
				var vnHostWidth = voHostActr.width;
				var vnHostHeight = voHostActr.height;
				moChart.resize({
					width: vnHostWidth,
					height: vnHostHeight
				});
			});
		} else {
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
				moChart.resize({
					width: "auto",
					height: "auto"
				});
			});
		}
	}
	
	if (voContent && moChart) {
		e.preventDefault();
	}
}

/*
 * 쉘에서 load 이벤트 발생 시 호출.
 */
function onShl1Load( /* cpr.events.CUIEvent */ e) {
	/** 
	 * @type cpr.controls.UIControlShell
	 */
	var shl1 = e.control;
	var voContent = e.content;
	shl1.registerComponent("voContent", voContent);
	
	var voResource = new cpr.core.ResourceLoader();
	voResource.addScript("./thirdparty/echarts/echarts.min.js")
	
	if (voResource.needToLoad()) {
		voResource.load().then(function(input) {
			drawChart();
		});
	} else {
		drawChart();
	}
}

/*
 * 루트 컨테이너에서 contextmenu 이벤트 발생 시 호출.
 * 마우스의 오른쪽 버튼이 클릭되거나 컨텍스트 메뉴 키가 눌려지면 호출되는 이벤트.
 */
function onBodyContextmenu(e) {
	var group = e.control;
	// 우클릭 기본동작 방지
	e.preventDefault();
	
	var _app = app.getHostAppInstance();
	var ctxMenu = new cpr.controls.Menu("ctx_menu");
	ctxMenu.addItem(new cpr.controls.TreeItem("BarChart", "bar", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("세로형", "barVertical", "bar"));
	ctxMenu.addItem(new cpr.controls.TreeItem("가로형", "barHorizontal", "bar"));
	
	if (app.getAppProperty("valueColNms").split(",").length == 1) {
		ctxMenu.addItem(new cpr.controls.TreeItem("CircleChart", "circle", "root"));
		ctxMenu.addItem(new cpr.controls.TreeItem("파이형", "circlePie", "circle"));
		ctxMenu.addItem(new cpr.controls.TreeItem("고리형", "circleRing", "circle"));
	}
	
	ctxMenu.addItem(new cpr.controls.TreeItem("LineChart", "line", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("꺽은선형", "lineFold", "line"));
	ctxMenu.addItem(new cpr.controls.TreeItem("곡선형", "lineRound", "line"));
	
	ctxMenu.addItem(new cpr.controls.TreeItem("AreaChart", "area", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("꺽은선형", "areaFold", "area"));
	ctxMenu.addItem(new cpr.controls.TreeItem("곡선형", "areaRound", "area"));
	
	ctxMenu.addItem(new cpr.controls.TreeItem("RadarChart", "radar", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("방사형", "radarDef", "radar"));
	ctxMenu.addItem(new cpr.controls.TreeItem("방사형-상세", "radarDtl", "radar"));
	
	ctxMenu.addItem(new cpr.controls.TreeItem("이미지 저장", "image", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("PDF 출력", "pdf", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("엑셀 출력", "export", "root"));
	// ctxMenu.addItem(new cpr.controls.TreeItem("리포트 출력", "report", "root"));
	
	ctxMenu.addEventListener("item-click", function( /**@type cpr.events.CItemEvent */ e) {
		var itemValue = e.item.value;
		var parentValue = e.item.parentValue;
		
		if (parentValue != "root" && msChartType != parentValue && itemValue != "export" && itemValue != "image"){
			moChart.dispose(); // 차트 타입이 다를경우 제거
		} 
		
		if (itemValue == "bar" || itemValue == "barVertical") {
			app.setAppProperty("chartType", "bar : vertical");
		} else if (itemValue == "barHorizontal") {
			app.setAppProperty("chartType", "bar : horizontal");
		} else if (itemValue == "circle" || itemValue == "circlePie") {
			app.setAppProperty("chartType", "circle : pie");
		} else if (itemValue == "circleRing") {
			app.setAppProperty("chartType", "circle : ring");
		} else if (itemValue == "line" || itemValue == "lineFold") {
			app.setAppProperty("chartType", "line : fold");
		} else if (itemValue == "lineRound") {
			app.setAppProperty("chartType", "line : round");
		} else if (itemValue == "area" || itemValue == "areaFold") {
			app.setAppProperty("chartType", "area : fold");
		} else if (itemValue == "areaRound") {
			app.setAppProperty("chartType", "area : round");
		} else if (itemValue == "radar" || itemValue == "radarDef") {
			app.setAppProperty("chartType", "radar : default");
			
		} else if (itemValue == "radarDtl") {
			app.setAppProperty("chartType", "radar : detail");
			
		} else if (itemValue == "image") {
			var canvas = moChart.getDom().getElementsByTagName("canvas");
			if (canvas && canvas.length > 0) {
				if (canvas[0].msToBlob) { // Only Works in IE
					var blob = canvas[0].msToBlob();
					window.navigator.msSaveBlob(blob, app.getAppProperty("title") + ".png");
				} else {
					var link = document.createElement("a");
					link.download = app.getAppProperty("title") + ".png";
					link.href = canvas[0].toDataURL("image/png");
					link.click();
				}
			} else {
				util.Msg.alertDlg(app, "생성된 차트가 존재하지 않습니다.");
			}
			
		} else if (itemValue == "pdf") { 
			var canvas = moChart.getDom().getElementsByTagName("canvas");
			if (canvas && canvas.length > 0) {
				var resourceLoader = new cpr.core.ResourceLoader();
				resourceLoader.addScript("thirdparty/jsPDF/polyfills.umd.js"); // IE와 같은 구버전 브라우저에서 사용할 경우 주석 해제
				resourceLoader.addScript("thirdparty/jsPDF/jspdf.umd.min.js");
				resourceLoader.load(function(error){
					window.jsPDF = window.jspdf.jsPDF;
					
					var imgData = canvas[0].toDataURL("image/png");
					
					var imgWidth = 210; // 이미지 가로 길이(mm) (A4기준)
					var pageHeight = imgWidth * 1.414; // 출력 페이지 세로 길이 계산 (A4 기준)
					var imgHeight = canvas[0].height * imgWidth / canvas[0].width;
					var heightLeft = imgHeight;
					
					var doc = new jsPDF({
						orientation: 'p',
						unit: 'mm',
						format: 'a4',
					});
					var margin = 5;
					var position = margin;
					
					// 첫 페이지 출력
					// addImage(imageData, format, x, y, width, height, alias, compression, rotation)
					doc.addImage(imgData, "PNG", margin, position, imgWidth-(margin*2), imgHeight-(margin*2));
					heightLeft -= pageHeight;
					
					// 한 페이지 이상일 경우 루프 돌면서 출력
					while(heightLeft >= 20) {
						position = heightLeft - imgHeight + margin;
						doc.addPage();
						doc.addImage(imgData, "PNG", margin, position, imgWidth-(margin*2), imgHeight-(margin*2));
						heightLeft -= pageHeight;
					}
					
					doc.setProperties({
						title: app.getAppProperty("title") + ".pdf"
					});
					
					if (canvas[0].msToBlob) { // Only Works in IE
						doc.save(app.getAppProperty("title") + ".pdf");
					} else {
						util.Dialog.open(app, "app/sce/A1/P1-1-6", 700, 500, function(e) {
						}, {
							pdf :  doc.output("bloburl")
						}, {
							resizable: true
						});
					}
				})
			}
		} else if (itemValue == "export") {
			var vsTitle = app.getAppProperty("title");
			/** @type cpr.data.DataSet */
			var voDataSet = app.getAppProperty("dataSet");
			
			if (!voDataSet || voDataSet.getRowCount() < 1) {
				util.Msg.alertDlg(app, "출력할 데이터가 존재하지 않습니다.");
			} else {
				ExcelUtil.exportExcel(vsTitle, null, voDataSet, null, app.getAppProperty("useExportColInfo"));
			}
		} else if (itemValue == "report") {
			/** @type cpr.data.DataSet */
			var voDataSet = app.getAppProperty("dataSet");
			
			if (!voDataSet || voDataSet.getRowCount() < 1) {
				util.Msg.alertDlg(app, "출력할 데이터가 존재하지 않습니다.");
			} else {
				util.Dialog.open(app, "app/sce/A1/P1-1-4", 900, 800, function(dialog){
				}, {
					fileName : app.getAppProperty("title"),
					dataSet : voDataSet
				}, {
					headerTitle : app.getAppProperty("title")
				})
			}
		}
	});
	
	ctxMenu.addEventListenerOnce("blur", function( /**@type cpr.events.CFocusEvent*/ e) {
		e.control.dispose();
	});
	
	/**@type cpr.controls.Container */
	var rootContainer = null;
	var showConstraint = {
		"position": "absolute",
		"width": "auto",
		"height": "auto"
	};
	
	if (util.Dialog.isDialogPopup(_app)) {
		rootContainer = _app.getContainer();
		
		if ((e.clientY - rootContainer.getActualRect().top + 130) > rootContainer.getActualRect().height)
			showConstraint.top = (e.clientY - rootContainer.getActualRect().top - 130) ;
		else
			showConstraint.top = (e.clientY - rootContainer.getActualRect().top);
		
		showConstraint.left = (e.clientX - (rootContainer.getActualRect().left));
	} else {
		rootContainer = _app.getRootAppInstance().getContainer();
//		// 스크롤 이동 후 컨텍스트 메뉴를 띄운 경우 클릭된 위치에 스크롤 이동량 추가
//		showConstraint.top = (e.clientY + e.view.scrollY) + "px";
//		showConstraint.left = (e.clientX) + "px";
//		
		showConstraint.left = e.clientX;
		showConstraint.top = e.clientY;
	}
	
	var layoutConstraint = rootContainer.getActualRect();
	var itemConstraint = {//근사값
		width : 121,
		height: 176
	};
	if(showConstraint.left + itemConstraint.width > layoutConstraint.width) {
		showConstraint.left = showConstraint.left -itemConstraint.width;
	}
	if(showConstraint.top + itemConstraint.height > layoutConstraint.height) {
		showConstraint.top = showConstraint.top - itemConstraint.height;
	}
	
	showConstraint.left = showConstraint.left + "px";
	showConstraint.top = showConstraint.top + "px";
	var layout = rootContainer.getLayout();
	if (layout instanceof cpr.controls.layouts.FormLayout ||
		layout instanceof cpr.controls.layouts.VerticalLayout) {
		rootContainer.floatControl(ctxMenu, showConstraint);
	} else {
		rootContainer.addChild(ctxMenu, showConstraint);
	}
	ctxMenu.focus();
}

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e) {
	if (e.property == "chartType") {
		if (moChart) {
			/** @type String */
			var newVal = e.newValue;
			var vsAftType = newVal.split(" : ")[0];
			if (msChartType != vsAftType) {
				drawChart();
			} else {
				pushData();
			}
		}
	}
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var vcDs = app.getAppProperty("dataSet");
	
	if (vcDs && vcDs instanceof cpr.data.DataSet) {
		vcDs.addEventListener("update", function() {
			drawChart();
		});
	}
		
	window.addEventListener("resize", function(e) {
		if (!app.disposed) {				
			if (moChart) {
				moChart.resize();
				
				/* 드래그 Value-Change 사용여부*/
				if (app.getAppProperty("useDragValueChange")) {
					if (msChartType == "radar") {
						createRadarDragGraphic();
					} else if (msChartType == "bar") {
						createBarDragGraphic();
					}
				}
			}
		}
	});
	
	app.getHostAppInstance().getContainer().addEventListener("before-draw", function(e){			
		if (!app.disposed) {				
			if (moChart) {
				cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
					moChart.resize();
				
					if (app.getAppProperty("useDragValueChange")) {
						if (msChartType == "radar") {
							createRadarDragGraphic();
						} else if (msChartType == "bar") {
							createBarDragGraphic();
						}
					}
				});				
			}
		}
	});		
}