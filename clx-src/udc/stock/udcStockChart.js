/************************************************
 * udcStockChart.js
 * Created at 2025. 5. 13. 오후 1:17:03.
 *
 * @author HAN
 ************************************************/

var util = createCommonUtil();
var moChartHandler = null;
/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

/**
 * Advanced Chart에서 실시간 데이터를 구독받을때 호출하는 함수
 * @param {String} symbolInfo
 * @param {Objecct} resolution
 * @param {Function} onRealtimeCallback
 * @param {String} subscriberUID
 * @param {Function} onResetCacheNeededCallback
 * @param {Object} lastDailyBar
 */
exports.subscribeOnStream = function(symbolInfo,resolution,onRealtimeCallback,subscriberUID,onResetCacheNeededCallback,lastDailyBar){
	var parsedSymbol = symbolInfo.full_name;
//	const channelString = 
	var handler = {
		id:subscriberUID,
		callback:onRealtimeCallback
	}
	var subscriptionItem = {
		subscriberUID,resolution,lastDailyBar,
		handlers : [handler]
	}
	moChartHandler = subscriptionItem;
}
////차트 업데이트 함수
//function updateChart(){
//	var timeDiv = util.Control.getValue(app, "navTime");
//	var lastTime = moChartHandler.lastDailyBar;
//	var data = app.lookup("dsChegyol").getRow(0);
//	if (timeDiv == "1") { //분봉
//		var minutes = data.getValue("STCK_CNTG_HOUR").substr(0, 5);
//		var dayTime = moment(minutes, "YY:MM").add(1, "minute").unix();
//		if (dayTime > lastTime.time) {
//			var bar = {
//				time: dayTime,
//				open: data.getValue("STCK_PRPR"),
//				high:data.getValue("STCK_PRPR"),
//				low:data.getValue("STCK_PRPR"),
//				close:data.getValue("STCK_PRPR"),
//				volume: data.getValue("CTNG_VOL")
//			}
//			moChartHandler.handlers.forEach(function(each) {
//				each.callback(bar);
//			})
//		} else {
//			lastTime["high"] = Math.max(data.getValue("STCK_PRPR"), moChartHandler.lastDailyBar.high);
//			lastTime["low"] = Math.min(data.getValue("STCK_PRPR"), moChartHandler.lastDailyBar.low);
//			lastTime["close"] = data.getValue("STCK_PRPR");
//			lastTime["volume"] = lastTime["volume"] + data.getValue("CTNG_VOL");
//		moChartHandler.handlers.forEach(function(each) {
//			each.callback(lastTime);
//		})
//		}
//	} else {
//		lastTime["high"] =  Math.max(data.getValue("STCK_PRPR"),moChartHandler.lastDailyBar.high);
//		lastTime["low"] =  Math.min(data.getValue("STCK_PRPR"),moChartHandler.lastDailyBar.low);
//		lastTime["close"] = data.getValue("STCK_PRPR");
//		lastTime["volume"] = lastTime["volume"]+ data.getValue("CTNG_VOL");
//		moChartHandler.handlers.forEach(function(each){
//			each.callback(lastTime);
//		})
//	}
//
//}

function chegyolUpdate(data) {
	var row = app.lookup("dsChegyol").getRow(0);
	row.setRowData(data);
	util.Control.redraw(app, "grpStockInfo");
}

/*
 * 내비게이션 바에서 selection-change 이벤트 발생 시 호출.
 * 선택된 Item 값이 저장된 후에 발생하는 이벤트.
 */
function onNavTimeSelectionChange(e){
	var navTime = e.control;
	app.lookup("chart1").timeDiv = app.lookup("navTime").value;
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var isInfo = app.getHostAppInstance().callAppMethod("getISInfo");
	
	util.Control.setValue(app, "optPDRT", isInfo["PDRT"]);
	util.Control.setValue(app, "optDiv", isInfo["DIV"]);
//	app.lookup("dsChegyol").addRow();
//	addChegyol(chegyolUpdate);
	util.Submit.send(app, "subDayStock", function(pbSuccess, sub){
		if(pbSuccess) {
//			var voFisrtData = app.lookup("dsDayStockOut").getRow(0);
			util.Control.redraw(app, "grpStockInfo");
		}
	});
}
