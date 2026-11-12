/************************************************
 * N26.js
 * Created at 2024. 8. 1. 오후 3:54:49.
 *
 * @author daye
 ************************************************/

var util = createCommonUtil();
var mbFirstLoad = false;
/** @type String */
var knownSortExp = null;
/** @type string */
var cacheId;
var vbFirstLoadData = false;
var vbFetchFirstLoadData = false;
var msLogs = "";
/**
 * 최종 서브미션 receive 시점
 */
var maReceive = [];

cpr.core.AppConfig.INSTANCE.getControlConfig().setValue("grid.useCustomScrollbar", true);

/*
 * "조회" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e) {
	if (!util.validate(app, "rdbType")) return false;
	var vsType = util.SelectCtl.getItemLabel(app, "rdbType");
	var vsTypeValue = util.SelectCtl.getItemValue(app, "rdbType");
	var sms = app.lookup("subList");
	resetCond();
	msLogs += "조회|버튼클릭|"+moment().format("YYYYMMDDHHmmss.SSS")+"\n";
	var vcGrid = app.lookup("grd1");
	var grdConfig = app.lookup("grd1").getInitConfig();
	var dw;
	var dsCovInspe = app.lookup("dsCovInspe");
	switch(vsType){
		
		//일반 tsv
		case "TEXT_TSV_Stream" : 
			break;
		default :
			grdConfig.dataSet = dsCovInspe;
			dw = dsCovInspe;
			sms.addResponseData(dsCovInspe, false);
			var progressUUID = generateUUID();
			sms.addParameter("progress", progressUUID);
		   
			break;
	}
	vcGrid.init(_.clone(grdConfig));
	
	var dataTypes = dw.getColumnNames()
		.map(function(each) {
			return dw.getColumn(each).getHeader().getDataType()
		});
	
	// 파일 추가
//	sms.addFileParameter("file", app.lookup("fit1").file);
	// 데이터 윈도우의 타입 추가
	sms.addParameter("columnTypes", dataTypes.join(","));
	sms.addParameter("dataDivCnt", vsTypeValue);
	// 1. 조회 시작 시각
	var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
	udcPocGrdPrfCount1.startRander();
	
//	util.showLoadMask(app);
	
	sms.addEventListenerOnce("receive", function(e) {
		maReceive.push(new Date().getTime());	
	});
	
	msLogs += "서브미션|시작|"+moment().format("YYYYMMDDHHmmss.SSS")+"\n";
	
	if (sms.action.indexOf("/") == 0) {
		sms.action = ".." + sms.action;
	}
	
	
	sms.send().then(function(se) {
//		util.hideLoadMask(app);
		var progress = app.lookup("pgr1");
		progress.value = 1000;
		
		//2. 조회 종료 시각
		udcPocGrdPrfCount1.endRander();
		
		/** @type string */
		cacheId = sms.getMetadata("cacheId");
		var rowCount = sms.getMetadata("rowCount");
		
		var readTime = sms.getMetadata("readTime");
		
		udcPocGrdPrfCount1.uploadTime = readTime;
		
		if (cacheId) {
			app.lookup("dsCovInspe").init(rowCount, []);
			fetchRows(0, 100);
		}
		maReceive = [];
//		msLogs += "서브미션|종료|"+moment().format("YYYYMMDDHHmmss.SSS")+"\n";
		udcPocGrdPrfCount1.rowCount = app.lookup("grd1").rowCount;
//		msLogs += udcPocGrdPrfCount1.getLog("■ 수행 결과\n");
//		createAndDownloadTxtFile("서버 성능[화면로그_" + vsType + "].log", msLogs);
		
	});
	
	setTimeout(function() {
		fetchProgress(progressUUID);
	}, 500);
}

function getContextPath(){
	
	var vsContextPath = util.getContextPath();
	
	if(vsContextPath.indexOf("ui") > -1){
		vsContextPath =	"";
	}
	
	return vsContextPath;
}

// 텍스트 파일 생성 및 다운로드
//function createAndDownloadTxtFile(filename, content) {
//	
//	var vsType = util.SelectCtl.getItemLabel(app, "rdbType");
//	
//	if(ValueUtil.isNull(msLogs)) return;
//	util.Submit.addParameter(app, "subLogDown", "log", msLogs);
//	util.Submit.addParameter(app, "subLogDown", "fileName", "서버 성능[화면로그_" + vsType + "]");
//	
//	util.Submit.send(app, "subLogDown", function(pbSuccess){
//		msLogs = "";
//	});
//}
/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFit1ValueChange(e) {
	cacheId = null;
	
	var fit1 = e.control;
	
	app.lookup("grd1").resetGrid();
	
	var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
	udcPocGrdPrfCount1.resetRander();
	udcPocGrdPrfCount1.uploadTime = "";
	
	var dsCovInspe = app.lookup("dsCovInspe");
	dsCovInspe.init(0, []);
}

/*
 * 데이터윈도우에서 fetch 이벤트 발생 시 호출.
 */
function ondsCovInspeFetch(e) {
	if (cacheId) {
		fetchRows(
			e.startRowIndex || 0,
			(e.rowCount || 30) * 2,
			e.sortCondition
		);
	}
}

var fetchRows = _.throttle(_fetchRows, 30);

/**
 * 
 * @param {number} rowStart
 * @param {Number} rowCount
 * @param {string} sortExp
 */
function _fetchRows(rowStart, rowCount, sortExp) {
	var dw = app.lookup("dsCovInspe");
	
	var sortIndex = -1;
	var asc = true;
	var vsSortColumns = "";
	var vsSortAscending = "";
	
	if (sortExp) {
		var sortSegs = sortExp.split(" ");
		sortIndex = dw.getColumnNames().indexOf(sortSegs[0]);
		asc = sortSegs[1] == "asc";
		
		var arrSortColumns = sortExp.split(", ");
		arrSortColumns.forEach(function(each){
			var seq = each.split(" ");
			var idx = dw.getColumnNames().indexOf(seq[0]);
			var asc = seq[1] == "asc";
			vsSortColumns += idx+ ",";
			vsSortAscending += asc + ",";
		});
		vsSortColumns = vsSortColumns.substring(0, vsSortColumns.lastIndexOf(","));
		vsSortAscending = vsSortAscending.substring(0, vsSortAscending.lastIndexOf(","));
	}
	
		
	var needsProgressIndicator = knownSortExp != sortExp;
	knownSortExp = sortExp;
	if (needsProgressIndicator) {
		util.showLoadMask(app);
	}
	
	fetchText(getContextPath()+"/A37/fetch.do", {
		"cacheId": cacheId,
		"rowStart": rowStart,
		"rowCount": rowCount,
		"sortIndex": sortIndex,
		"sortColumns": vsSortColumns,
		"sortAscending": vsSortAscending,
		"asc": asc
	}).then(function(tsvText) {
		if (needsProgressIndicator) {
			util.hideLoadMask(app);
		}
		var columnNames = dw.getColumnNames();
		var data = tsvText.split(/\n/g).filter(function(each) {
			return !each || each.length > 0;
		}).map(function(each) {
			var row = {};
			each.split(/\t/g).forEach(function(value, idx) {
				row[columnNames[idx]] = value;
			});
			return row;
		});
		dw.load(rowStart, data);
		if (rowStart < 1) {
			app.lookup("grd1").redraw();
		}
	}).catch(function(error) {
//		console.warn("중복 페치가 무시되었습니다.");
	});
	
}

/**
 * @param {String} progressId
 */
function fetchProgress(progressId) {
	var sms = app.lookup("fetch_progress");
	sms.addParameter("progress", progressId);
	if (sms.action.indexOf("/") == 0) {
		sms.action = ".." + sms.action;
	}
	var vsType = util.SelectCtl.getItemLabel(app, "rdbType");
	sms.addParameter("type", vsType);
	if (sms.action.indexOf("/") == 0) {
		sms.action = ".." + sms.action;
	}
	sms.send();
}

/*
 * 서브미션에서 submit-done 이벤트 발생 시 호출.
 * 응답처리가 모두 종료되면 발생합니다.
 */
function onFetch_progressSubmitDone(e) {
	var fetch_progress = e.control;
	
	/** @type number */
	var progress = fetch_progress.getMetadata("progress");
	var progressId = fetch_progress.getMetadata("progressId");
	
	var pgr = app.lookup("pgr1");

	if (progress >= 0) {
		pgr.visible = true;
		var vsProGressValue = "" + (progress * 1000).toFixed(); 
		pgr.value = vsProGressValue;
		
		var vsType = util.SelectCtl.getItemLabel(app, "rdbType");
		
		msLogs += "서버의 파일 읽기 진행률 : " + ((progress * 100).toFixed()) + "%\n";
		
		
		setTimeout(function() {
			fetchProgress(progressId);
		}, 250);
	} else {
		pgr.numberValue = 1000;
//		pgr.visible = false;
	}
}

/*
 * "업로드 파일 다운로드" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	util.Submit.send(app, "subDownloadSample");
}

/*
 * 서브미션에서 submit-load-progress 이벤트 발생 시 호출.
 * 서버로 부터 수신된 데이터가 응답 데이터컨트롤에 부분적으로 적재되었을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSubFileTsvSubmitLoadProgress(e){
	var subFileTsv = e.control;
	var subList = e.control;
	
	if (subList.responseType === "blob") {
		var progress = app.lookup("pgr1");
		progress.value = Math.floor((parseInt(e.loaded) / parseInt(e.total)) * 1000).toFixed();
	}
	
	if (subList.getResponseDataCount() > 0) {
		var rowCnt = subList.getResponseData(0).data.getRowCount();
//		app.lookup("totalCnt").value = rowCnt;
	}
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad2(e){
//	var vsFilterCond = "label == 'XML_TSV_Fatch_Stream' || label == 'XML_TSV_Fatch_Stream(200,000건)'";
//	util.SelectCtl.setFilter(app, "rdbType", vsFilterCond);
	util.SelectCtl.selectItem(app, "rdbType", 0);
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbTypeSelectionChange(e){
	var rdbType = e.control;
//	cacheId = null;
//	vbFirstLoadData = false;
//	var sms = app.lookup("subList");
//	sms.abort();
//	
//	app.lookup("pgr1").numberValue = 0;
//	util.Grid.reset(app, "grd1");
//	
//	var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
//	udcPocGrdPrfCount1.resetRander();
//	
//	var dsCovInspe = app.lookup("dsCovInspe");
//	dsCovInspe.init(0, []);
//	
//	app.lookup("udcComGridTitle1").redraw();
	resetCond();
}


function resetCond(){
	msLogs = "";
	cacheId = null;
	vbFirstLoadData = false;
	vbFetchFirstLoadData = false;
	var sms = app.lookup("subList");
	sms.abort();
	sms.removeAllParameters();
	sms.removeAllResponseData();
	var fetch_progress = app.lookup("fetch_progress");
	fetch_progress.abort();
	fetch_progress.removeAllParameters();
	
	
	app.lookup("pgr1").numberValue = 0;
	util.Grid.reset(app, "grd1");
	
	var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
	udcPocGrdPrfCount1.resetRander();
	
	var dsCovInspe = app.lookup("dsCovInspe");
	dsCovInspe.init(0, []);
	
}
/*
 * 서브미션에서 submit-load-progress 이벤트 발생 시 호출.
 * 서버로 부터 수신된 데이터가 응답 데이터컨트롤에 부분적으로 적재되었을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSubListSubmitLoadProgress(e){
	var subList = e.control;
	
	var vsType = util.SelectCtl.getItemLabel(app, "rdbType");
	if(!vbFirstLoadData){
		var grdTitle = app.lookup("udcPocGrdPrfCount1");
		grdTitle.firstLoadRander();
		msLogs += "그리드|랜더링|"+moment().format("YYYYMMDDHHmmss.SSS")+"\n";
	}
	
	if (subList.responseType === "blob") {
		var progress = app.lookup("pgr1");
		progress.value = Math.floor((parseInt(e.loaded) / parseInt(e.total)) * 1000).toFixed();
	}
	
	if (subList.getResponseDataCount() > 0) {
		var rowCnt = subList.getResponseData(0).data.getRowCount();
		vbFirstLoadData = true;
//		app.lookup("totalCnt").value = rowCnt;
	}
}


/*
 * 서브미션에서 submit-progress 이벤트 발생 시 호출.
 * 서버로 부터 일정 크기의 데이터를 전송받았을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSubUpload2SubmitProgress(e) {
	var subList = e.control;
	
	var vsType = util.SelectCtl.getItemLabel(app, "rdbType");
	if(vsType == "TEXT_TSV_Stream" || vsType == "XML_TSV_Stream") return;
	
	if(!vbFetchFirstLoadData){
		var grdTitle = app.lookup("udcPocGrdPrfCount1");
		grdTitle.firstLoadRander();
		msLogs += "그리드|랜더링|"+moment().format("YYYYMMDDHHmmss.SSS")+"\n";
	}
	
	
	if (subList.responseType === "blob") {
		var pgrServer = app.lookup("pgr1");
		pgrServer.value = Math.floor((parseInt(e.loaded) / parseInt(e.total)) * 1000).toFixed();
	}
		
	if (subList.getResponseDataCount() > 0) {
		var rowCnt = subList.getResponseData(0).data.getRowCount();
		vbFirstLoadData = true;
	}	
		
}
