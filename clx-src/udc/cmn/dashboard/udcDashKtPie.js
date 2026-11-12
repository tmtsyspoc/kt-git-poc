/************************************************
 * udcDashKtPie.js
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
		sub: isDark ? '#bdbdbd' : '#666666'
	};
}

/*
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
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

		// 변경된 너비 기준으로 하단 지표 재배치
		moChart.setOption({
			graphic: getBottomGraphic()
		});
	});
}

/**
 * 옵션설정
 */
function setOption1() {
	
	var nWidth = moChart.getWidth();
	var nHeight = moChart.getHeight();
	
	// 가로/세로 중 작은 값을 기준으로 계산
	var nBaseSize = Math.min(nWidth, nHeight);
	
	// 폰트 크기
	var nFontSize = nBaseSize * 0.05;
	
	//너무 작거나 커지지 않도록 제한
	nFontSize = Math.max(12, Math.min(20, nFontSize));
	
	// lineHeight = fontSize의 1.2배
	var nLineHeight = nFontSize * 1.2;
	
	var voOption = {
		tooltip: {
			trigger: 'item'
		},
		
		legend: {
			orient: 'vertical',
			right: '5%',
			top: '5%'
		},
		
		series: [{
			type: 'pie',
			center: ['40%', '50%'],
			radius: ['30%', '67%'],
			avoidLabelOverlap: false,
			
			itemStyle: {
				borderRadius: 10,
				borderColor: '#fff',
				borderWidth: 1
			},
			
			label: {
				show: true,
				position: 'inside',
				color: '#fff',
				formatter: function(params) {
					return params.value + '건';
				}
			},
			
			labelLine: {
				show: false
			},
			
			data: [{
					value: 3,
					name: '결재대기'
				},
				{
					value: 2,
					name: '승인대기'
				},
				{
					value: 5,
					name: '결재진행'
				}
			]
		}]
	};
	
	return voOption;
}

/**
 * 옵션설정2 (현재지정)
 */
function setOption2() {
	var nWidth = moChart.getWidth();
	var nHeight = moChart.getHeight();
	var voTextColor = getTextColor();
	
	var voOption = {
		tooltip: {
			trigger: 'item',
			formatter: '{b}<br/>{c}건 ({d}%)'
		},
		
		legend: {
			orient: 'vertical',
			right: 10,
			top: 'center',
			itemWidth: 10,
			itemHeight: 10,
			itemGap: 14,
			textStyle: {
				color: voTextColor.main,
				fontSize: 14
			},
			formatter: function(name) {
				var data = voOption.series[0].data;
				var value = 0;
				
				for (var i = 0; i < data.length; i++) {
					if (data[i].name === name) {
						value = data[i].value;
						break;
					}
				}
				
				return name + '   ' + value + '대';
			}
		},
		
		series: [{
			name: '수출 생산오더 현황',
			type: 'pie',
			
			// 도넛 형태
			radius: ['38%', '55%'],
			
			// 차트 위치
			center: ['27%', '50%'],
			
			// 조각 사이 여백
			padAngle: 1,
			
			// 테두리
			itemStyle: {
				borderColor: '#ffffff',
				borderWidth: 2
			},
			
			// 중앙 텍스트
			label: {
				show: true,
				position: 'center',
				
				formatter: function() {
					return '{title|총 오더}\n{value|128건}';
				},
				
				rich: {
					title: {
						fontSize: 13,
						color: voTextColor.sub,
						lineHeight: 22
					},
					
					value: {
						fontSize: 22,
						fontWeight: 'bold',
						color: voTextColor.main,
						lineHeight: 28
					}
				}
			},
			
			labelLine: {
				show: false
			},
			
			data: [{
					value: 82,
					name: '개통작업중',
					itemStyle: {
						color: '#6F7A89'
					}
				},
				{
					value: 28,
					name: '현장출동 대기',
					itemStyle: {
						color: '#A3ACB9'
					}
				},
				{
					value: 12,
					name: '장비수급 대기',
					itemStyle: {
						color: '#F59E0B'
					}
				},
				{
					value: 6,
					name: '개통지연',
					itemStyle: {
						color: '#E4002B'
					}
				}
			]
		}],
		
		// 중앙 텍스트
		graphic: [
			{
				type: 'text',
				top: 5,
				left: 20,
				style: {
					text: '총 오더',
					fill: voTextColor.sub,
					fontSize: 13
				}
			},
			{
				type: 'text',
				top: 25,
				left: 20,
				style: {
					text: '128건',
					fill: voTextColor.main,
					fontSize: 20,
					fontWeight: 'bold'
				}
			},
			
			{
				type: 'text',
				left: 115,
				top: 5,
				style: {
					text: '정상 진행',
					fill: voTextColor.sub,
					fontSize: 13
				}
			},
			{
				type: 'text',
				left: 115,
				top: 25,
				style: {
					text: '110건',
					fill: '#6F7A89',
					fontSize: 20,
					fontWeight: 'bold'
				}
			},
			
			{
				type: 'text',
				left: 210,
				top: 5,
				style: {
					text: '기한준수율',
					fill: voTextColor.sub,
					fontSize: 13
				}
			},
			{
				type: 'text',
				left: 210,
				top: 25,
				style: {
					text: '95.3%',
					fill: '#6F7A89',
					fontSize: 20,
					fontWeight: 'bold'
				}
			}
			
		].concat(getBottomGraphic())
		
	};
	
	return voOption;
}

/**
 * 하단 주요 지표 그래픽 (차트 너비 기준 가운데 정렬, 하단 기준 배치)
 */
function getBottomGraphic() {
	var nWidth = moChart.getWidth();
	var voTextColor = getTextColor();
	
	// 구분선 길이 (좌우 여백 20px)
	var nLineWidth = Math.max(0, nWidth - 40);
	
	// 지표 1개당 너비 (너무 벌어지지 않도록 제한)
	var nColWidth = Math.min(120, nLineWidth / 3);
	
	var vaItems = [
		{ title: '이번주 개통예정', value: '14건', color: '#6F7A89' },
		{ title: '품질검수 대기', value: '9건', color: '#F59E0B' },
		{ title: '개통 지연', value: '6건', color: '#E4002B' }
	];
	
	var vaChildren = [];
	for (var i = 0; i < vaItems.length; i++) {
		vaChildren.push({
			type: 'text',
			x: nColWidth * i,
			y: 0,
			style: {
				text: vaItems[i].title,
				fill: voTextColor.sub,
				fontSize: 12,
				textAlign: 'center',
				textVerticalAlign: 'top'
			}
		});
		vaChildren.push({
			type: 'text',
			x: nColWidth * i,
			y: 18,
			style: {
				text: vaItems[i].value,
				fill: vaItems[i].color,
				fontSize: 17,
				fontWeight: 'bold',
				textAlign: 'center',
				textVerticalAlign: 'top'
			}
		});
	}
	
	return [
		// 구분선
		{
			id: 'bottomLine',
			type: 'line',
			left: 'center',
			bottom: 56,
			shape: {
				x1: 0,
				y1: 0,
				x2: nLineWidth,
				y2: 0
			},
			style: {
				stroke: '#eeeeee',
				lineWidth: 1
			}
		},
		// 지표 영역 (그룹 단위로 가운데 정렬, 하단에서 8px 위에 고정)
		{
			id: 'bottomStats',
			type: 'group',
			left: 'center',
			bottom: 8,
			children: vaChildren
		}
	];
}

/**
 * 차트 그리기
 */
function drawChart() {
	var voShell = app.lookup("shl1");
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		var voContent = voShell.getComponent("voContent");
		moChart = echarts.init(voContent);
		
		moChart.setOption(setOption2());
		
		window.addEventListener("resize", function(e) {
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