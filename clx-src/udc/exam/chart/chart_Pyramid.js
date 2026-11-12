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

/*
 * 쉘에서 init 이벤트 발생 시 호출.
 */
function onShl1Init(/* cpr.events.CUIEvent */ e){
	/** 
	 * @type cpr.controls.UIControlShell
	 */
	var shl1 = e.control;
	
	var voChart = app.lookup("shl1").getComponent("pyramid");
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
			app.lookup("shl1").getComponent("pyramid").resize();
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

	drawChart(voContent);
	
}

exports.drawChart = drawChart;


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
		
		var data = [];
	
		vcDataset.getRowDataRanged().forEach(function(each){
		var _data = {
			value : each.VALUE ,
			name : each.NAME
			};
		data.push(_data);
		});
		
		var voOption = {
    tooltip: {
        trigger: 'item',
        formatter: "{a} <br/>{b} : {c}%"
    },
    legend: {
        data: vcDataset.getColumnData("NAME")
    },

    series: [
        {
            name:'계급',
            type:'funnel',
            left: '20%',
            top: 60,
            //x2: 80,
            bottom: 60,
            width: '40%',
            // height: {totalHeight} - y - y2,
            min: 0,
            max: 100,
            minSize: '0%',
            maxSize: '100%',
            sort: 'ascending',
            gap: 2,
            label: {
                show: true,
                position: 'inside'
            },
            labelLine: {
                length: 10,
                lineStyle: {
                    width: 1,
                    type: 'solid'
                }
            },
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 1
            },
            emphasis: {
                label: {
                    fontSize: 20
                }
            }, 
            data: data
        }
    ]
		};
	
		voChart.setOption(voOption);
		
	}
			
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		voChart.resize();
	});
	app.lookup("shl1").registerComponent("pyramid", voChart);
}



window.addEventListener("resize", function() {
	cpr.core.NotificationCenter.INSTANCE.post("chart-resize", {
		chart : voChart
	});
});
