/************************************************
 * chart_Bar.js
 * Created at 2020. 7. 8. 오후 6:47:59.
 *
 * @author csj
 ************************************************/

var customType = "";

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

var voChart = null;
var data = [];

exports.setCustomType = function(psType){
	customType = psType;
}

/*
 * 쉘에서 init 이벤트 발생 시 호출.
 */
function onShl1Init( /* cpr.events.CUIEvent */ e) {
	/** 
	 * @type cpr.controls.UIControlShell
	 */
	var shl1 = e.control;
	
	var voChart = app.lookup("shl1").getComponent("bar");
	if (voChart) {
		// 쉘이 축소되어 정상적으로 그리지 못했을 경우 resize 적용    
		if (voChart.getWidth() == 0 || voChart.getHeight() == 0) {
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
				var voHostActr = app.getHost().getActualRect();
				var vnHostWidth = voHostActr.width;
				var vnHostHeight = voHostActr.height;
				voChart.resize({
					width: vnHostWidth,
					height: vnHostHeight
				});
			});
		} else {
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
				voChart.resize({
					width: "auto",
					height: "auto"
				});
			});
		}
	}
	
	if (e.content) {
		e.preventDefault();
	}
	
	window.addEventListener("resize", function(e) {
		if (!app.disposed) {
			app.lookup("shl1").getComponent("bar").resize();
		}
	});
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
	
	if (!voContent) {
		return;
	}
	
	shl1.registerComponent("voContent", voContent);
	
	drawChart();
	
}

exports.drawChart = function(poContent){
	switch(customType){
		case "CON_NO" : drawChart2(poContent);
			
			break;
		
		default : drawChart(poContent);
			break;
	}
}

/**
 * bar 차트를 그립니다.
 * @param {any} poContent
 */
function drawChart() {
	
	var poContent = app.lookup("shl1").getComponent("voContent");
	
	voChart = echarts.init(poContent);
	/** @type cpr.data.DataSet */
	var vcDataset = app.getAppProperty("dataSet");
	if (vcDataset) {
		if(vcDataset.getRowCount() > 0){
			app.lookup("nodatamsg").visible = false;
			var voOption = {
				tooltip: {
					formatter : '{b}시: {c}건'
			    },
			    grid:{
			    	bottom:0,
			    	top:40,
					containLabel: true
			    },
				xAxis: {
					type: 'category',
					data: vcDataset.getColumnData("COLUMN1")
				},
				yAxis: {
					type: 'value',
				},
				series: [{
					data: vcDataset.getColumnData("COLUMN2"),
					type: 'bar'
				}]
			};
			if(app.getAppProperty("title")){
				voOption["title"] = {
			        subtext: app.getAppProperty("title"),
			        left: '50%',
			       	top: '0%',
			        textAlign: 'center'
			    }
			}
			voChart.setOption(voOption);
		}else{
			app.lookup("nodatamsg").visible = true;
		}
	}
	app.lookup("shl1").registerComponent("bar", voChart);
	app.lookup("shl1").getComponent("bar").resize();
}

/**
 * bar 차트를 그립니다.
 * @param {any} poContent
 */
function drawChart2() {
	
	var poContent = app.lookup("shl1").getComponent("voContent");
	
	voChart = echarts.init(poContent);
	/** @type cpr.data.DataSet */
	var vcDataset = app.getAppProperty("dataSet");
	if (vcDataset) {
		
		var voOption = {
			tooltip: {
		    },
			xAxis: {
				type: 'category',
				data: vcDataset.getColumnData("CON_NO")
			},
			yAxis: {
				type: 'value',
			},
			series: [{
				name: "LMS문구문의",
				data: vcDataset.getColumnData("CONS_TYPE1"),
				type: 'bar'
			},{
				name: "LMS문구문의",
				data: vcDataset.getColumnData("CONS_TYPE1"),
				type: 'bar'
			},{
				name: '결제금액문의',
				data: vcDataset.getColumnData("CONS_TYPE2"),
				type: 'bar'
			},{
				name: '결제일문의',
				data: vcDataset.getColumnData("CONS_TYPE3"),
				type: 'bar'
			},{
				name: '계약문의',
				data: vcDataset.getColumnData("CONS_TYPE4"),
				type: 'bar'
			},{
				name: '고객정보변경',
				data: vcDataset.getColumnData("CONS_TYPE5"),
				type: 'bar'
			},{
				name: '연락처변경',
				data: vcDataset.getColumnData("CONS_TYPE6"),
				type: 'bar'
			}]
		};
		voChart.setOption(voOption);
	}
	
	app.lookup("shl1").registerComponent("bar", voChart);
}

/**
 * 
 * @param {cpr.data.DataSet} vcDataset
 */
function PushData(vcDataset) {
	
	data = [];
	
	//데이터의 가장 왼쪽 값을 제거
	data.shift();
	vcDataset.getRowDataRanged().forEach(function(each) {
		var _data = {
			value: each.COLUMN2,
			name: each.COLUMN1
		};
		data.push(_data);
	});
	
	voChart.setOption({
		series: [{
			data: data
		}]
	});
	
}

/**
 * 
 * @param {cpr.data.DataSet} vcDataset
 */
function PushData2(vcDataset) {
	voChart.setOption({
		 	series: [{
		 			name: "LMS문구문의",
		 			data: vcDataset.getColumnData("CONS_TYPE1")
		 		},
		 		{
		 			name: '결제금액문의',
		 			data: vcDataset.getColumnData("CONS_TYPE2")
		 		},
		 		{
		 			name: '결제일문의',
		 			data: vcDataset.getColumnData("CONS_TYPE3")
		 		},
		 		{
		 			name: '계약문의',
		 			data: vcDataset.getColumnData("CONS_TYPE4")
		 		},
		 		{
		 			name: '고객정보변경',
		 			data: vcDataset.getColumnData("CONS_TYPE5")
		 		},
		 		{
		 			name: '연락처변경',
		 			data: vcDataset.getColumnData("CONS_TYPE6")
		 		}
		 	]
	  });
	
}

exports.PushData = function(vcDataset){
	switch(customType){
		case "CONS_NM" : PushData2(vcDataset);
			
			break;
		
		default : PushData(vcDataset);
			break;
	}
}

window.addEventListener("resize", function() {
	cpr.core.NotificationCenter.INSTANCE.post("chart-resize", {
		chart: voChart
	});
});