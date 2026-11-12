/************************************************
 * udcAdvancedChart.js
 * Created at 2025. 4. 14. 오전 10:08:32.
 *
 * @author HWPS
 ************************************************/

var moWidget = null;
var util = createCommonUtil();
var msTimeDiv = "";
var mbAlready = false;
var i = 0;
var lastBarsCache = null;
var oldDiv = null;
var divs = {
	"2" : "D",
	"3" : "W",
	"4" : "M",
	"1" : "1"
	
}
var moChartHandler = null;
/** @type Function */
var moCallback = null;

var AdvancedLoader = {
		resourceLoader: null,
		loader: false,
		isLoaded: function() {
			return this.loader;
		},
		checkLibLoaded: function() {
			var that = this;
			if(!this.resourceLoader) {
				
				this.resourceLoader = new cpr.core.ResourceLoader();
			}
			this.resourceLoader.addScript("thirdparty/advanced/charting_library.standalone.js");
			this.resourceLoader.addScript("thirdparty/advanced/bundle.js");
			if(this.resourceLoader.needToLoad()) {
				return this.resourceLoader.load();
			} else {
				return new Promise(function(resolve,reject){
					resolve();
				})
			}
		}
	}
/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

const mockDataFeed = {
	onReady : (cb) => {
		setTimeout(() => cb({
			supported_resolutions: ["1","5","15","60","D"],
		}),0);
	},
	//종목정보 지정하기
	resolveSymbol :(symbolName, onSymbolResolvedCallback, onResolveErrorCallback)=> {
		setTimeout(()=> {
			util.DataMap.setValue(app, "dmChartListIn", "Scode", symbolName);
			util.DataMap.setValue(app, "dmChartListIn", "Scode02", symbolName);
			onSymbolResolvedCallback({
				name : symbolName,
				ticker : symbolName,
				type:"stock",
				session:"24x7",
				Timezone:"Asia/Seoul",
				minmov:1,
				pricescale:100,
				has_intraday:true,
				supported_resolution : ["1","5","15","60","1D"],
				volume_precision: 2
			});
		},0);
	},
	//캔들 데이터 조회하는 함수
	getBars: (symbolInfo, resolution,periodParams, onHistoryCallback, onErrorCallback)=> {
		try {
			const now = Math.floor(Date.now() / 1000);
			let fromTime = periodParams.from;
			let toTime = periodParams.to;
			const secondsPerbar = 86400;
			const defaultBars = 500;
			var targetDate = moment(new Date(toTime*1000)).format("YYYYMMDD");
			
			util.DataMap.setValue(app, "dmChartListIn", "Scode", app.getAppProperty('jongCode'));
			util.DataMap.setValue(app, "dmChartListIn", "Scode02", app.getAppProperty('jongCode'));
			var vsTimeDiv = app.getAppProperty("timeDiv");
//			if(vsTimeDiv.indexOf("m") != -1) {
//				vsTimeDiv = "1";
//			}
			util.DataMap.setValue(app, "dmChartListIn", "Sbtngb",vsTimeDiv);
			util.DataMap.setValue(app, "dmChartListIn", "Sdate",targetDate);
			util.DataMap.setValue(app, "dmChartListIn", "Sdate02",targetDate);
			if(mbAlready) {
				onHistoryCallback([],{noData:true});
				return;
			}
			if(i==1 && app.getAppProperty("timeDiv")=="1") {
				return;
			}
			util.Submit.send(app, "subList", function(pbSuccess,sub){
				
				var reversedData = app.lookup("dsHWS10415Out").getRowDataRanged().reverse();
				var reversedDataFiltered = reversedData.filter(function(each){
					return each.date != "";
				});
				//가장 오래된 날짜의 캔들 이후의 데이터를 조회할때, 이를 막기위한 코드 대응
				mbAlready = true;
//				if(reversedData.length != reversedDataFiltered.length) {
//					mbAlready = true;
//				} else {
//					mbAlready = false;
//				}
				var result = [];
				if(app.getAppProperty("timeDiv") == "1") {
					i = 1;
					var result = reversedDataFiltered.map(function(each){
						return {
							time : moment(each["date"]+" "+each["time"],"YYYYMMDD HHmmss").valueOf(),
							"open": Number(each["open"]),
							"high": Number(each["high"]),
							"low": Number(each["low"]),
							"close": Number(each["close"]),
							"volume":Number(each["fid_11"])
						}
					});
				} else {
					var result = reversedDataFiltered.map(function(each) {
						return {
							"time": moment(each["date"], "YYYYMMDD").add(9,"hours").valueOf(),
//							"time": moment.tz(each["date"],"YYYYMMDD","Asis/Seoul").unix(),
							"open": Number(each["open"]),
							"high": Number(each["high"]),
							"low": Number(each["low"]),
							"close": Number(each["close"]),
							"volume":Number(each["fid_11"])
						}
					});
				}
				if(periodParams.firstDataRequest) {
					lastBarsCache = result[result.length-1];
				}
				if(result && result.length) {
					onHistoryCallback(result,{noData:false});
				} else {
					onHistoryCallback([],{noData:true});
				}
			});
			
		}catch(error) {
			console.log(error);
			onErrorCallback(error);
		}
	},
	//실시간 데이터 구독
	subscribeBars:(symbolInfo,resolution, onRealtimeCallback, subscriberUID,onResetCacheNeddedCallback)=> {
		
		moCallback = onRealtimeCallback;
//		if(app.getHostAppInstance().hasAppMethod("subscribeOnStream")) {
//			app.getHostAppInstance().callAppMethod("subscribeOnStream",symbolInfo,resolution,onRealtimeCallback,subscriberUID,onResetCacheNeddedCallback,lastBarsCache);
//		}
		var parsedSymbol = symbolInfo.full_name;
		//	const channelString = 
		var handler = {
			id:subscriberUID,
			callback:onRealtimeCallback
		}
		var subscriptionItem = {
			subscriberUID,resolution,lastBarsCache,
			handlers : [handler]
		}
		moChartHandler = subscriptionItem;
//		addChegyol(updateChart);
	},
	unsubscribeBars : (listenerGuid)=> {
//		deleteChegyol(updateChart);
	}
}


//차트 업데이트 함수
function updateChart(newData){
	var timeDiv = util.Control.getValue(app, "navTime");
	var lastTime = lastBarsCache;
	var data = newData;
	if (timeDiv == "1") { //분봉
		var minutes = data.getValue("STCK_CNTG_HOUR").substr(0, 5);
		var dayTime = moment(minutes, "YY:MM").add(1, "minute").unix();
		if (dayTime > lastTime.time) {
			var bar = {
				time: dayTime,
				open: data["STCK_PRPR"],
				high:data["STCK_PRPR"],
				low:data["STCK_PRPR"],
				close:data["STCK_PRPR"],
				volume: data["CTNG_VOL"]
			}
			moCallback(bar);
//			moChartHandler.handlers.forEach(function(each) {
//				each.callback(bar);
//			})
		} else {
			lastTime["high"] = Math.max(data["STCK_PRPR"], lastBarsCache.high);
			lastTime["low"] = Math.min(data["STCK_PRPR"], lastBarsCache.low);
			lastTime["close"] = data["STCK_PRPR"];
			lastTime["volume"] = lastTime["volume"] + data["CTNG_VOL"];
//		moChartHandler.handlers.forEach(function(each) {
//			each.callback(lastTime);
//		})
		moCallback(bar);
		}
	} else {
		lastTime["high"] =  Math.max(data.getValue("STCK_PRPR"),lastBarsCache.high);
		lastTime["low"] =  Math.min(data.getValue("STCK_PRPR"),lastBarsCache.low);
		lastTime["close"] = data.getValue("STCK_PRPR");
		lastTime["volume"] = lastTime["volume"]+ data["CTNG_VOL"];
		moCallback(lastTime);
//		moChartHandler.handlers.forEach(function(each){
//			each.callback(lastTime);
//		})
	}

}
function dataConfig (data){
//			var vcDs = app.lookup("dsChegyol");
//			var vaColumnNms = vcDs.getColumnNames();
//			var row = {};
//			vaColumnNms.forEach(function(each, idx) {
//					row[each] = updateData[idx];
//				});
//				vcDs.insertRowData(0, false, row).setState(cpr.data.tabledata.RowState.UNCHANGED);
//				var todayRow = app.lookup("dsDayStockOut").getRow(0);
//				todayRow.setValue("out_val4_29", row["STCK_PRPR"]);
//				todayRow.setValue("out_val4_32", row["PRDY_VRSS"]);
//				todayRow.setValue("out_val4_33", row["PRDY_CTRT"]);
//				app.lookup("grpStockInfo").redraw();
//				util.DataMap.update(app, "dmHoga5Out", {
//					"out_val_20": row["STCK_OPRC"],
//					"out_val_21" : row["STCK_HGPR"],
//					"out_val_22": row["STCK_LWPR"],
//					"out_val_32": row["STCK_SDPR"],
//					"out_val_24" : row["STCK_MXPR"],
//					"out_val_25": row["STCK_LLAM"]
//				});
//				updateChart(row);
}
function createChart(){
	var vsOrigin = (location.protocol == "http:" || location.protocol == "https:") ? location.pathname.slice(0,location.pathname.lastIndexOf("clx-src"))+"clx-src/" :"";
	
	if(location.hostname == "localhost" || location.hostname.indexOf("edu.tomatosystem.co.kr") > -1) {
		vsOrigin = "";
		var baseTag = document.head.querySelector('base');
		if(baseTag) {
			vsOrigin = baseTag.getAttribute("href");
		}
	}
//	var vsOrigin = location.hostname == "127.0.0.1" || location.hostname == "localhost" ? "/hanwha-wts-ui/clx-src/" : "";
	var widget = new TradingView.widget({
				container : "chartContainer",
				"library_path" : vsOrigin+"thirdparty/advanced/",
				"locale":"ko",
				"symbol" :app.getAppProperty("jongCode") ||"012450",
				"interval" : divs[app.getAppProperty("timeDiv")] || "D",
				datafeed: mockDataFeed,
				timezone:"Asia/Seoul",
				disabled_features: [
					"header_widget",
//					"left_toolbar",
					"control_bar",
					"timeframes_toolbar",
					"display_markey_status"
				],
				custom_translate_function: function(originalText,singularOriginText,translatedText){
					if(translatedText =="날") {
						return "일"
					}
					return null;
				},
				autosize:true,
			});
//		window["c1"] =widget;
		moWidget = widget;
		widget.onChartReady(()=>{
			const chart = widget.activeChart();
			
			const studies = chart.getAllStudies();
			const volumeStudy = studies.find(function(ele){
				return ele.name === "Volume";
			});
			if(volumeStudy) {
				chart.removeEntity(volumeStudy.id);
			}
			chart.createStudy("Volume",false,false);
			});
}

/*
 * 쉘에서 init 이벤트 발생 시 호출.
 * 쉘 컨트롤의 내용이 그려지기 전 초기화 하는 이벤트.
 */
function onShl1Init(e){
	var shl1 = e.control;
	if(shl1.getComponent("chart")) {
		e.preventDefault();
		return;
	}
}

/*
 * 쉘에서 load 이벤트 발생 시 호출.
 * 쉘이 그려진 후 내용을 작성하는 이벤트.
 */
function onShl1Load(e){
	var shl1 = e.control;
	var content = e.content;
//	console.log("")
//	debugger;
	content.setAttribute("id", "chartContainer");
	shl1.registerComponent("chart", content);
	AdvancedLoader.checkLibLoaded().then(function(input){
		createChart();
	});
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	
}
/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e){
	if(e.property == "jongCode") {
		
	}
	 else if(e.property == "timeDiv") {
	 	var vsTimeDiv = e.newValue;
	 	var chart = moWidget.activeChart();
			chart.resetData();
			moWidget.remove();
		 	mbAlready = false;
		 	i=0;
			createChart();
	 }
}
