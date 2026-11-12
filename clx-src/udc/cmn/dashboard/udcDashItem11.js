/************************************************
 * udcDashItem11.js
 * Created at 2026. 9. 18. 오전 9:19:20.
 *
 * @author doorlee
 ************************************************/
var util = createCommonUtil();
var moChart = null;
var moThemeObserver = null;

/**
 * 다크(고대비) 테마 여부
 */
function isDarkMode() {
	return document.body.getAttribute("data-cl-mode") == "high-contrast";
}

/**
 * 테마별 기본 텍스트 색상 (다크 테마는 대시보드 다른 udc 색상 기준)
 */
function getTextColor() {
	var isDark = isDarkMode();
	return {
		main: isDark ? '#e1e1e1' : '#333333',
		sub: isDark ? '#bdbdbd' : '#666666',
		axis: isDark ? '#bdbdbd' : '#777777'
	};
}

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

exports.drawChart = drawChart;

/**
 * 차트 사이즈 변경
 */
function resizeChart() {
	if (!moChart || app.disposed) {
		return;
	}

	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		if (!moChart || app.disposed) {
			return;
		}

		moChart.resize();
	});
}

/**
 * 옵션설정
 */
function setOption1(data) {
	var voOption = {
		dataset: {
			source: data
		},
		tooltip: {
			show: true,
		},
		grid: {
			left: 5,
			right: 10,
			top: 5,
			bottom: 5,
			containLabel: true
		},
		xAxis: {
			type: 'value',
			minInterval: 1,
			axisLabel: {
				formatter: function(value) {
					return value + "건";
				}
			}
		},
		yAxis: {
			type: 'category',
			axisLabel: {
				color: '#333333'
			}
			
		},
		visualMap: {
			show: false,
			orient: 'horizontal',
			left: 'center',
			min: 0,
			max: 10,
			text: ['High', 'Low'],
			dimension: 0,
			inRange: {
				color: ['#9ad9e7', '#336ebb', '#003b88']
			}
		},
		series: [{
			type: 'bar',
			encode: {
				x: 'value',
				y: 'region'
			},
			label: {
				show: true,
				position: "insideRight",
				color: "#FFFFFF",
				formatter: function(params) {
					return params.dataIndex == 7 ? params.value[0] + "건" : "";
				}
			},
		}]
	};
	
	return voOption;
}

/**
 * 옵션설정2 (현재 지정)
 */
function setOption2() {
	var voTextColor = getTextColor();
	
	var voOption = {
	 // ----------------------------------------
    // 범례
    // ----------------------------------------
    legend: {
        top: 18,
        left: 45,
        itemWidth: 18,
        itemHeight: 3,
        itemGap: 25,

        textStyle: {
            color: voTextColor.sub,
            fontSize: 13
        },

        // 매출 계획은 점선 시리즈라 범례 아이콘도 점선(18x3 안에 대시 3개)으로 그린다
        data: [
            { name: '매출 계획', icon: 'path://M0,0h4v3h-4z M7,0h4v3h-4z M14,0h4v3h-4z' },
            { name: '매출 실적', icon: 'rect' }
        ]
    },

    // ----------------------------------------
    // Tooltip
    // ----------------------------------------
    tooltip: {
        trigger: 'axis',

        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#eeeeee',
        borderWidth: 1,

        textStyle: {
            color: '#555555',
            fontSize: 12
        },

        formatter: function(params) {
            var result = params[0].axisValue + '<br/>';

            for (var i = 0; i < params.length; i++) {
                result +=
                    '<span style="display:inline-block;' +
                    'width:8px;height:8px;border-radius:50%;' +
                    'background:' + params[i].color + ';' +
                    'margin-right:6px;"></span>' +
                    params[i].seriesName +
                    ' <strong>' + params[i].value + '</strong><br/>';
            }

            return result;
        }
    },

    // ----------------------------------------
    // X축
    // ----------------------------------------
    xAxis: {
        type: 'category',

        data: [
            '6월',
            '7월',
            '8월',
            '9월',
            '10월'
        ],

        boundaryGap: false,

        axisLine: {
            lineStyle: {
                color: '#AAB2BD'
            }
        },

        axisTick: {
            show: false
        },

        axisLabel: {
            color: voTextColor.axis,
            fontSize: 12,
            margin: 12
        }
    },

    // ----------------------------------------
    // Y축
    // ----------------------------------------
    yAxis: {
        type: 'value',

        min: 600,
        max: 1200,

        interval: 200,

        axisLine: {
            show: false
        },

        axisTick: {
            show: false
        },

        axisLabel: {
            color: voTextColor.axis,
            fontSize: 12,
            formatter: '{value}'
        },

        splitLine: {
            lineStyle: {
                color: '#E5E8EB',
                type: 'dashed'
            }
        }
    },

    // ----------------------------------------
    // 여백
    // ----------------------------------------
    grid: {
        left: 55,
        right: 25,
        top: 65,
        bottom: 45,
        containLabel: false
    },

    // ----------------------------------------
    // 데이터
    // ----------------------------------------
    series: [
        {
            name: '매출 계획',
            type: 'line',

            data: [
              790,780,850,1050,1150
            ],

            smooth: false,

            symbol: 'circle',
            symbolSize: 7,

            lineStyle: {
                width: 3,
                color: '#7f8794',
                type: 'dashed'
            },

            itemStyle: {
                color: '#7f8794'
            },

            emphasis: {
                scale: true
            }
        },

        {
            name: '매출 실적',
            type: 'line',

            data: [
            	810,750,950,1000,1200
            ],

            smooth: false,

            symbol: 'circle',
            symbolSize: 7,

            lineStyle: {
                width: 3,
                color: '#2563EB'
            },

            itemStyle: {
                color: '#2563EB'
            },

            emphasis: {
                scale: true
            }
        }
    ]
	};
	
	return voOption;
}

/**
 * 차트 그리기
 */
function drawChart(){
	var voShell = app.lookup("shl1");
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		var voContent = voShell.getComponent("voContent");
		moChart = echarts.init(voContent);
		
		var vcDataset = app.lookup("dsChart");
		var aSource = [];
		aSource.push(['value', 'region']);
		for(var i = 0; i < vcDataset.getRowCount(); i++){
			var region = util.DataSet.getValue(app, "dsChart", i, "region");
			var value = util.DataSet.getValue(app, "dsChart", i, "value");
			aSource.push([value, region]);
		}
		
		moChart.setOption(setOption2(aSource));
		
		window.addEventListener("resize", function(e){
			resizeChart();
		});
		
		observeTheme();
	})
}

/**
 * 테마 변경 감지 시 차트 텍스트 색상 재적용
 */
function observeTheme() {
	if (moThemeObserver || typeof MutationObserver === "undefined") {
		return;
	}
	
	moThemeObserver = new MutationObserver(function() {
		if (app.disposed) {
			moThemeObserver.disconnect();
			moThemeObserver = null;
			return;
		}
		
		if (moChart) {
			moChart.setOption(setOption2());
		}
	});
	
	moThemeObserver.observe(document.body, {
		attributes: true,
		attributeFilter: ["data-cl-mode"]
	});
}

/*
 * 쉘에서 init 이벤트 발생 시 호출.
 * 쉘 컨트롤의 내용이 그려지기 전 초기화 하는 이벤트.
 */
function onUIControlShellInit(e) {
	var uIControlShell = e.control;
	
	if (moChart) {
		resizeChart();
	}
	
	if (e.content && moChart) {
		e.preventDefault();
	}
	
}

/*
 * 쉘에서 load 이벤트 발생 시 호출.
 * 쉘이 그려진 후 내용을 작성하는 이벤트.
 */
function onUIControlShellLoad(e) {
	var uIControlShell = e.control;
	var voContent = e.content;
	uIControlShell.registerComponent("voContent", voContent);
	
	var voResource = new cpr.core.ResourceLoader();
	voResource.addScript("./thirdparty/echarts/echarts.min.js");
	voResource.load().then(function(input) {
		drawChart();
	});
	
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e) {
	//리소스 추가
	var voResource = new cpr.core.ResourceLoader();
	voResource.addScript("./thirdparty/echarts/echarts.min.js");
}
