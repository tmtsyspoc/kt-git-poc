/************************************************
 * chart_line.js
 * Created at 2020. 7. 8. 오후 6:48:14.
 *
 * @author csj
 ************************************************/

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

var voChart = null;
var data = [];

/*
 * 쉘에서 init 이벤트 발생 시 호출.
 */
function onShl1Init(/* cpr.events.CUIEvent */ e){
	/** 
	 * @type cpr.controls.UIControlShell
	 */
	var shl1 = e.control;
	
	var voChart = app.lookup("shl1").getComponent("barLine");
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
		
	if(e.content) {
		e.preventDefault();
	}
	
    window.addEventListener("resize", function(e){    
	 	if(!app.disposed){
	 	  	app.lookup("shl1").getComponent("barLine").resize();
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

exports.drawChart = drawChart;

/**
 * 라인차트를 차트를 그립니다.
 * @param {any} poContent
 */
function drawChart () {
	
	cpr.core.DeferredUpdateManager.INSTANCE.update();
	var poContent = app.lookup("shl1").getComponent("voContent");
	
	voChart = echarts.init(poContent);
	/** @type cpr.data.DataSet */
	var vcDataset = app.getAppProperty("dataSet");
	
	if(vcDataset){
		
		var voOption = {
			 tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross',
            crossStyle: {
                color: '#999'
            }
	        }
	    },
	    legend: {
	        data : vcDataset.getColumnNames().filter(function(each){
	        	return each != "MONTH"})
	    },
	    xAxis: [
	        {
	            type: 'category',
	            data: vcDataset.getColumnData("MONTH"),
	            axisPointer: {
	                type: 'shadow'
	            }
	        }
	    ],
	    yAxis: [
	        {
	            type: 'value',
	            name: 'rainwater',
	            min: 0,
	            max: 250,
	            interval: 50,
	            axisLabel: {
	                formatter: '{value} ml'
	            }
	        },
	        {
	            type: 'value',
	            name: 'degree Celsius',
	            min: 0,
	            max: 25,
	            interval: 5,
	            axisLabel: {
	                formatter: '{value} °C'
	            }
	        }
	    ],
	    series: [
	        {
	            name: 'Evaporation',
	            type: 'bar',
	            data: vcDataset.getColumnData("EVAPORATION")
	        },
	        {
	            name: 'Precipitation',
	            type: 'bar',
	            data:  vcDataset.getColumnData("PRECIPITATION")
	        },
	        {
	            name: 'Temperature',
	            type: 'line',
	            yAxisIndex: 1,
	            data:  vcDataset.getColumnData("TEMPERATURE")
	        }
	    ]
			
			
			
		};
	
		voChart.setOption(voOption);
	}	
	
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		voChart.resize();
	});
	
	
	app.lookup("shl1").registerComponent("barLine", voChart);
}


/**
 * 
 * @param {cpr.data.DataSet} addData
 */
function PushData(vcDataset){
	
	//데이터의 가장 왼쪽 값을 제거
    data.shift();
	
	voChart.setOption({
		xAxis: [
	        {
	            data: vcDataset.getColumnData("MONTH"),
	        }
	    ],
	   series: [{
	   		name: 'Evaporation',
	   		data: vcDataset.getColumnData("EVAPORATION")
	   	},
	   	{
	   		name: 'Precipitation',
	   		data: vcDataset.getColumnData("PRECIPITATION")
	   	},
	   	{
	   		name: 'Temperature',
	   		data: vcDataset.getColumnData("TEMPERATURE")
	   	}
	   ]
	  });
}

exports.PushData = PushData;


window.addEventListener("resize", function() {
	cpr.core.NotificationCenter.INSTANCE.post("chart-resize", {
		chart : voChart
	});
});
