/************************************************
 * chart_line.js
 * Created at 2020. 7. 8. 오후 6:48:14.
 *
 * @author csj
 ************************************************/

var customYAxis = "";

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

var voChart = null;

exports.setCustomYAxis = function(psYAxis){
	customYAxis = psYAxis;
}

/*
 * 쉘에서 init 이벤트 발생 시 호출.
 */
function onShl1Init(/* cpr.events.CUIEvent */ e){
	/** 
	 * @type cpr.controls.UIControlShell
	 */
	var shl1 = e.control;
	
	var voChart = app.lookup("shl1").getComponent("Ybar");
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
			app.lookup("shl1").getComponent("Ybar").resize();
		}
	});
}


/*
 * 쉘에서 load 이벤트 발생 시 호출.
 */
function onShl1Load(/* cpr.events.CUIEvent */ e){
	/** 
	 * @type cpr.controls.UIControlShell
	 */
	var shl1 = e.control;
	
	var voContent = e.content;
	
	if(!voContent) {
		return;
	}
	
	shl1.registerComponent("voContent", voContent);

	drawChart();
	
}

exports.drawChart = function(poContent){
	switch(customYAxis){
		case "CONS_NM" : drawChart2(poContent);
			
			break;
		
		default : drawChart(poContent);
			break;
	}
}

/**
 * 라인차트를 차트를 그립니다.
 * @param {any} poContent
 */
function drawChart (poContent) {
	
	var poContent = app.lookup("shl1").getComponent("voContent");
	
	voChart = echarts.init(poContent);
	/** @type cpr.data.DataSet */
	var vcDataset = app.getAppProperty("dataSet");
	
	if(vcDataset){
		
		
		var voOption = {
			 tooltip: {
        trigger: 'axis',
        axisPointer: {            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
        }
    },
    legend: {
        data: vcDataset.getColumnNames().filter(function(each){
	        	return each != "DAY"})
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: {
        type: 'value'
    },
    yAxis: {
        type: 'category',
        data: vcDataset.getColumnData("DAY")
    },
    series: [
        {
            name: "tomato",
            type: 'bar',
            stack: '합계',
            label: {
                show: true,
                position: 'insideRight'
            },
            data: vcDataset.getColumnData("TOMATO")
        },
        {
            name: 'watermelon',
            type: 'bar',
            stack: '합계',
            label: {
                show: true,
                position: 'insideRight'
            },
            data: vcDataset.getColumnData("WATERMELON")
        },
        {
            name: 'strawberry',
            type: 'bar',
            stack: '합계',
            label: {
                show: true,
                position: 'insideRight'
            },
            data: vcDataset.getColumnData("STRAWBERRY")
        },
        {
            name: 'orange',
            type: 'bar',
            stack: '합계',
            label: {
                show: true,
                position: 'insideRight'
            },
            data: vcDataset.getColumnData("ORANGE")
        }
    ]
			
			
		};
	
		voChart.setOption(voOption);
	}	
	
	
	
	app.lookup("shl1").registerComponent("Ybar", voChart);
}

/**
 * 라인차트를 차트를 그립니다.
 * @param {any} poContent
 */
function drawChart2 (poContent) {
	var poContent = app.lookup("shl1").getComponent("voContent");
	
	voChart = echarts.init(poContent);
	
	/** @type cpr.data.DataSet */
	var vcDataset = app.getAppProperty("dataSet");
	
	if(vcDataset){
		
		
		var voOption = {
			 tooltip: {
        trigger: 'axis',
        axisPointer: {            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
        }
    },
    legend: {
        data: vcDataset.getColumnNames().filter(function(each){
	        	return each != "CONS_NM"})
    },
    grid: {
    	left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: {
        type: 'value'
    },
    yAxis: {
        type: 'category',
        data: vcDataset.getColumnData("CONS_NM")
    },
    series: [
        {
            name: "LMS문구문의",
            type: 'bar',
            stack: '합계',
            label: {
                show: true,
                position: 'insideRight'
            },
            data: vcDataset.getColumnData("CONS_TYPE1")
        },
        {
            name: '결제금액문의',
            type: 'bar',
            stack: '합계',
            label: {
                show: true,
                position: 'insideRight'
            },
            data: vcDataset.getColumnData("CONS_TYPE2")
        },
        {
            name: '결제일문의',
            type: 'bar',
            stack: '합계',
            label: {
                show: true,
                position: 'insideRight'
            },
            data: vcDataset.getColumnData("CONS_TYPE3")
        },
        {
            name: '계약문의',
            type: 'bar',
            stack: '합계',
            label: {
                show: true,
                position: 'insideRight'
            },
            data: vcDataset.getColumnData("CONS_TYPE4")
        },
        {
            name: '고객정보변경',
            type: 'bar',
            stack: '합계',
            label: {
                show: true,
                position: 'insideRight'
            },
            data: vcDataset.getColumnData("CONS_TYPE5")
        },
        {
            name: '연락처변경',
            type: 'bar',
            stack: '합계',
            label: {
                show: true,
                position: 'insideRight'
            },
            data: vcDataset.getColumnData("CONS_TYPE6")
        }
    ]
			
			
		};
	
		voChart.setOption(voOption);
	}		
	
	app.lookup("shl1").registerComponent("Ybar", voChart);
}


/**
 * 
 * @param {cpr.data.DataSet} addData
 */
function PushData(vcDataset){

	voChart.setOption({
		 	series: [{
		 			name: "tomato",
		 			data: vcDataset.getColumnData("TOMATO")
		 		},
		 		{
		 			name: 'watermelon',
		 			data: vcDataset.getColumnData("WATERMELON")
		 		},
		 		{
		 			name: 'strawberry',
		 			data: vcDataset.getColumnData("STRAWBERRY")
		 		},
		 		{
		 			name: 'orange',
		 			data: vcDataset.getColumnData("ORANGE")
		 		}
		 	]
	  });
}

/**
 * 
 * @param {cpr.data.DataSet} addData
 */
function PushData2(vcDataset){

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
	switch(customYAxis){
		case "CONS_NM" : PushData2(vcDataset);
			
			break;
		
		default : PushData(vcDataset);
			break;
	}
	
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		voChart.resize();
	});
}


window.addEventListener("resize", function() {
	cpr.core.NotificationCenter.INSTANCE.post("chart-resize", {
		chart : voChart
	});
});
