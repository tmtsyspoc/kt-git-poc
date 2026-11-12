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
var msCurrentType = null;

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
	if(vsType.indexOf(",") != -1) {
		
		return drawHard(poDataSet);
	}
	msCurrentType = vsType.split(" : ")[0];
	
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
	if (msCurrentType == "bar") {
		voOption = setBarOption(poDataSet, voOption);
	} else if (msCurrentType == "circle") {
		voOption = setCircleOption(poDataSet, voOption);
	} else if (msCurrentType == "line") {
		voOption = setLineOption(poDataSet, voOption);
	} else if (msCurrentType == "area") {
		voOption = setAreaOption(poDataSet, voOption);
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
		var name = vcDataset.getHeader(colNm).getInfo();
		if (ValueUtil.isNull(name)) {
			name = vcDataset.getHeader(colNm).getName();
		}
		
		var voSeries = {
			name: vcDataset.getHeader(colNm).getInfo(),
			data: vcDataset.getColumnData(colNm),
			type: 'bar'
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
	data = data.filter(function(each){
			return each.value != 0;
		});
		voOption["color"] = ["#dc2626","#f27824","#facc15","#16a34a","#0d9488","#0891b2","#2563eb","#4f46e5","#9333ea","#db2777"]
	if (vaType[1] == "pie") {
		voOption["series"] = [{
			type: 'pie',
			radius: '50%',
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
			center: ["50%",'40%'],
			itemStyle: {
				borderRadius: 10,
				borderColor: '#fff',
				borderWidth: 2
			},
			data: data,
			emphasis: {
				label: {
					show: true,
					fontSize: '14',
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
//		formatter: '{b} : {c} ({d}%)'
		formatter : function(params) {
			const value = Number(params.value).toLocaleString();
			return `${params.marker}${params.name}: ${value} (${params.percent}%)`;
		},
		textStyle: {
			fontSize:12
		}
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
		
		var name = vcDataset.getHeader(colNm).getInfo();
		if (ValueUtil.isNull(name)) {
			name = vcDataset.getHeader(colNm).getName();
		}
		
		var voSeries = {
			data: vcDataset.getColumnData(colNm),
			type: 'line'
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
		
		var name = vcDataset.getHeader(colNm).getInfo();
		if (ValueUtil.isNull(name)) {
			name = vcDataset.getHeader(colNm).getName();
		}
		
		var voSeries = {
			data: vcDataset.getColumnData(colNm),
			type: 'line',
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
	
	return voOption;
}

function _checkEchartsLoad (callback) {
	var voResource = new cpr.core.ResourceLoader();
	voResource.addScript("./thirdparty/echarts/echarts.min.js");
	
	if (voResource.needToLoad()) {
		voResource.load().then(function(input) {
			callback();
		});
		return false;
	} else {
		return true;
	}
}

/**
 * 차트를 그립니다.
 */
function drawChart() {
	var vbLoaded = _checkEchartsLoad(function () {drawChart();});
	if(!vbLoaded) return false;
	
	if(!app.lookup("shlChart").getComponent("voContent")) {
		return;
	}
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		var poContent = app.lookup("shlChart").getComponent("voContent");
		
		moChart = echarts.init(poContent);
		/** @type cpr.data.DataSet */
		var vcDataset = app.getAppProperty("dataSet");
		
		if (vcDataset) {
			if (vcDataset.getRowCount() < 1) {
				app.lookup("nodatamsg").visible = true;
			} else {
				app.lookup("nodatamsg").visible = false;
			}
			var voOption = getOption(vcDataset);
			moChart.setOption(voOption);
		}
		
		window.addEventListener("resize", function(e) {
			if (!app.disposed) {
				if (moChart) {					
					moChart.resize();
				}
			}
		});
	});
}
exports.drawChart = drawChart;
function drawHard(poDataSet){
	var voOption = {};
	var vsTitle = app.getAppProperty("title");
	var vsType = app.getAppProperty("chartType");
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
	voOption["tooltip"] = {
		trigger : "axis",
		axisPointer: {
			type:"cross"
		}
	}
	var vsLengedPosition = app.getAppProperty("legendPosition");
	if (vsLengedPosition != "none") {
		voOption["legend"] = {
			top: vsLengedPosition
		};
	}
	
	voOption["xAxis"] = {
			type: 'category',
			data: poDataSet.getColumnData(app.getAppProperty("categoryColNm"))
		}
	var vaYAxis = app.getAppProperty("valueColNms").split(",");
	/** @type Array */
	var vaTypes = vsType.split(",");
	voOption["yAxis"]= [];
	var yaxis = [];
	var series = [];
	vaTypes.forEach(function(each,idx){
		yaxis.push(
			{
				type:"value",
				name: vaYAxis[idx],
			}
		);
		
		series.push(
			{
				name : vaYAxis[idx],
				type: each.split(" : ")[0],
				data: poDataSet.getColumnData(vaYAxis[idx]),
				yAxisIndex: idx
			}
		);
	});
	voOption["yAxis"] = yaxis;
	voOption["series"] = series;
//	voOption["grid"] = {
//		right : 40
//	}
	return voOption;
	
}
function drawChartWithData(poOption) {
	var vbLoaded = _checkEchartsLoad(function () {drawChartWithData(poOption);});
	if(!vbLoaded) return false;
	
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		var poContent = app.lookup("shlChart").getComponent("voContent");
		
		moChart = echarts.init(poContent);
		/** @type cpr.data.DataSet */
		var vcDataset = app.getAppProperty("dataSet");
		
		moChart.setOption(poOption);
		window.addEventListener("resize", function(e) {
			if (!app.disposed) {
				if (moChart) {					
					moChart.resize();
				}
			}
		});
	});
}

exports.drawChartWithData = drawChartWithData;
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
	}, 30)
}
exports.pushData = pushData;

window.addEventListener("resize", function(e) {
	cpr.core.NotificationCenter.INSTANCE.post("chart-resize", {
		chart: moChart
	});
});

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
	voResource.addScript("./thirdparty/echarts/echarts.min.js");
	
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
	
	ctxMenu.addItem(new cpr.controls.TreeItem("이미지 저장", "image", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("PDF 출력", "pdf", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("엑셀 출력", "export", "root"));
	ctxMenu.addItem(new cpr.controls.TreeItem("리포트 출력", "report", "root"));
	
	ctxMenu.addEventListener("item-click", function( /**@type cpr.events.CItemEvent */ e) {
		var itemValue = e.item.value;
		var parentValue = e.item.parentValue;
		
		if (parentValue != "root" && msCurrentType != parentValue && itemValue != "export" && itemValue != "image"){
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
			if (msCurrentType != vsAftType) {
				drawChart();
			} else {
				pushData();
			}
		}
	}
}