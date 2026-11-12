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
	
	var voChart = app.lookup("shl1").getComponent("customPie");
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
	 	  	app.lookup("shl1").getComponent("customPie").resize();
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
	
	var poContent = app.lookup("shl1").getComponent("voContent");

	voChart = echarts.init(poContent);
	/** @type cpr.data.DataSet */
	var vcDataset = app.getAppProperty("dataSet");
	
	
	
	if(vcDataset){
		
		if(data.length == 0){
		
		vcDataset.getRowDataRanged().forEach(function(each){
		var _data = {
			value : each.VALUE ,
			name : each.NAME
		};
		data.push(_data);
		});
	}
		
		
		var option = {
		      backgroundColor: '#fff',

    title: {
        text: 'Customized Pie',
        left: 'center',
        top: 20,
        textStyle: {
            color: 'black'
        }
    },

    tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
    },

    visualMap: {
        show: false,
        min: 80,
        max: 600,
        inRange: {
            colorLightness: [0, 1]
        }
    },
    series: [
        {
            name: '과일',
            type: 'pie',
            radius: '55%',
            center: ['50%', '50%'],
            data: data.sort(function (a, b) { return a.value - b.value; }),
            roseType: 'radius',
            label: {
                color: 'rgba(45,52,60,1)'
            },
            labelLine: {
                lineStyle: {
                    color: 'rgba(45,52,60,1)'
                },
                smooth: 0.2,
                length: 10,
                length2: 20
            },
            itemStyle: {
                color: '#c23531',
                shadowBlur: 200,
                shadowColor: 'rgba(0, 0, 0, 0.1)'
            },

            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: function (idx) {
                return Math.random() * 200;
            }
        }
    ]
		};

	
		voChart.setOption(option);
		
	}	
	app.lookup("shl1").registerComponent("customPie", voChart);
}


/**
 * 
 * @param {cpr.data.DataSet} vcDataset
 */
function PushData(vcDataset){
	
	data = [];

	//데이터의 가장 왼쪽 값을 제거
    data.shift();
	
	vcDataset.getRowDataRanged().forEach(function(each){
			var _data = {
				value : each.VALUE ,
				name : each.NAME
			};
			data.push(_data);
		});
	  
	voChart.setOption({
	   series: [{
	         data: data
	      }]
	  });
	
}


exports.PushData = PushData;


window.addEventListener("resize", function() {
	cpr.core.NotificationCenter.INSTANCE.post("chart-resize", {
		chart : voChart
	});
});
