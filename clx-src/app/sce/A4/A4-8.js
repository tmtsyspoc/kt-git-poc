/************************************************
 * A31.js
 * Created at 2023. 5. 10. 오후 5:47:16.
 *
 * @author tomatosystem
 ************************************************/

/************************************************
 ** 글로벌 함수
 ************************************************/
cpr.core.AppConfig.INSTANCE.getControlConfig().setValue("grid.useCustomScrollbar", true);

/************************************************
 * 파일내 로컬변수 선언  
 ************************************************/
var util = createCommonUtil();

var controller = new AbortController();
var tsvHeaders = null; // 첫 줄이 헤더
var isSubListError = false;

var mbFirstLoad = false;
/**
 * 조회액션 시작시점
 */
var maBeforeSubmit = [];

/**
 * 최종 서브미션 receive 시점
 */
var maReceive = [];

/**
 * 최초 그리드initConfig(컬럼10개짜리)
 */
var mogrdMstInitConfig;

var STREAM_TIMEOUT_MS = 15000; // 15초간 데이터 미수신시 타임아웃
var streamTimeoutId;
//
var mbFirstLoadData = false;
var timerId;

/************************************************
 * 사용자정의함수
 ************************************************/
function resetCond(pbFile) {
	var vcGrdPrfCnt = app.lookup("udcGrdPrfCnt");
	vcGrdPrfCnt.resetRander();
	vcGrdPrfCnt.redraw();
	
	app.lookup("progressbar").visible = false;
	app.lookup("progressbar2").visible = false;
	app.lookup('progressbar2').value = 0;	
	app.lookup('progressbar').value = 0;	
	
	util.Grid.reset(app, "grdList");
	
	isSubListError = false;
	
	var vcGridTitle = app.lookup("udcComGridTitle1");
	vcGridTitle.rowCount = 0;
	vcGridTitle.redraw();
	
	if(!pbFile)
		app.lookup("fit1").clear();
}

function createLineSplitterStream() {
    var buffer = '';
    return new TransformStream({
        transform: function(chunk, controller) {
            buffer += chunk;
            let lines = buffer.split('\n');
            buffer = lines.pop(); // 마지막 줄은 미완성일 수 있으므로 남겨둠
            for (var i = 0; i < lines.length; i++) {
                controller.enqueue(lines[i]); // 완성된 줄만 다음 단계로 전달
            }
        },
        flush: function(controller) {
            // 스트림이 모두 끝났을 때 버퍼에 남아있는 마지막 데이터를 처리합니다.
            if (buffer) {
                controller.enqueue(buffer);
            }
            buffer = null;
        }
    });
}

function fetchBolbSubmission(){
	
	// 조회조건 유효성 체크
	if(!util.validate(app, "grpSearch")) return false;	
	
	resetCond();
	app.lookup("progressbar").visible = true;
	app.lookup("progressbar").value = 0;
	
	mbFirstLoadData = false;
	
	// 초기화	
	var grdTitle = app.lookup("udcGrdPrfCnt");
	grdTitle.resetRander();
    grdTitle.startRander();		
	var vcSubList = app.lookup("subMassiveList");		
	
	var progressUUID = generateUUID();
			
	vcSubList.addEventListenerOnce("receive", function(e) {
		maReceive.push(new Date().getTime());
	});
	
	vcSubList.removeParameters("progress");
	vcSubList.addParameter("progress", progressUUID);
	
	// 조회액션 시작시점
	maBeforeSubmit.push(new Date().getTime());
	
	if (vcSubList.action.indexOf("/") == 0) {
		vcSubList.action = ".." + vcSubList.action;
	}
	vcSubList.send().then(function(input) {				
		var progress = app.lookup("progressbar");
		progress.value = 100;
		grdTitle.endRander();
		app.lookup("udcComGridTitle1").rowCount = app.lookup("dsList").getRowCount();
		
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
			// 1. 네트워크 이전단 걸리는 시간(sql 이 돌아가 값을 가져오는 시간등)
			var vnBeforeNetwork = maReceive[0] - maBeforeSubmit[0];
			
			// 2. 네트워크 이후단 걸리는 시간(sql 파싱후 화면 로딩이 끝나는 시간)
			var vnAfterNetwork = new Date().getTime() - maReceive[0];
			grdTitle.randerTime = vnAfterNetwork;
			grdTitle.networkTime = vnBeforeNetwork;
			grdTitle.totalTime = new Date().getTime() - maBeforeSubmit[0];
			
			maBeforeSubmit = [];
			maReceive = [];
			
			grdTitle.redraw();
		});
		app.lookup("progressbar").visible = false;
		util.Msg.notify(app, "조회가 완료 되었습니다.");
	});	
	
	setTimeout(function() {
		fetchProgress(progressUUID);
	}, 500);
}


/**
 * @param {String} progressId
 */
function fetchProgress(progressId) {
	var sms = app.lookup("fetch_progress");
	sms.removeParameters("progress");
	sms.addParameter("progress", progressId);
	if (sms.action.indexOf("/") == 0) {
		sms.action = ".." + sms.action;
	}
	sms.send();
}

function fetchTextSubmission() {
	if (!util.validate(app, "grpSearch")) return false;
	
	var progress = app.lookup("progressbar2");
	progress.visible = true;
	progress.max = Number(app.lookup("cmb1").text.replace(/,/, ''));

	var progressUUID = generateUUID();
	
//	app.lookup("totalCnt").value = 0;
//	mbFirstLoadData = false;
//	var vcSubList = app.lookup("subMassiveList");
	// 초기화	
	var grdTitle = app.lookup("udcGrdPrfCnt");
	grdTitle.startRander();
	
	var BATCH_SIZE = 3000; // 한 번에 그리드에 추가할 행의 수 (이 값을 조절하여 성능 튜닝 가능)
	var batch = []; // 파싱된 행 데이터를 임시로 담을 배열
	
	var rdbExt = app.lookup("rdbExt");
	let fetchPromise;
	
	if(rdbExt.value == "tsv"){
		const params = new URLSearchParams({
			progress: progressUUID,
			dmParam: JSON.stringify(app.lookup("dmParam").getDatas())
		});
		fetchPromise = fetch(getContextPath() + app.lookup("cmb1").value + "?" + params.toString(), {
			method: "get",
			headers: {
				"Content-Type": "application/json"
			},
			signal: controller.signal
		});
	}else{
		fetchPromise = fetch(getContextPath() + "/krx/A4-9-List.do", {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				"param": {
					"progress": [progressUUID]
				},
				"data": {
					"dmParam": app.lookup("dmParam").getDatas()
				}
			}),
			signal: controller.signal
		});
	}
		
	// 조회액션 시작시점
	maBeforeSubmit.push(new Date().getTime());
	
	fetchPromise.then(function(response) {
			if (!response.ok) {
				isSubListError = true;
				util.Msg.notify(app, "서버에서 에러가 발생했습니다.");
			}
			
			var reader = response.body
				.pipeThrough(new TextDecoderStream()) // 1단계: 바이너리 -> 텍스트
				.pipeThrough(createLineSplitterStream()) // 2단계: 텍스트 -> 한 줄씩
				.getReader();
			
			// 한 줄씩 읽어서 배치 처리
			function processText(result) {
				if (result.done) {
					// 스트림이 끝나면 남아있는 마지막 배치를 처리
					if (batch.length > 0) {
						for (var k = 0; k < batch.length; k++) {
							app.lookup("dsList").pushRowData(batch[k]);
						}
						batch = [];
					}
					tsvHeaders = null;
					return; // 모든 처리 종료
				}
				
				var line = result.value.trim();
				if (!line) { // 빈 줄은 건너뛰기
					return reader.read().then(processText);
				}
				
				if (tsvHeaders === null) {
					tsvHeaders = line.replace(/\r$/, '').split('\t');
				} else {
					var values = line.replace(/\r$/, '').split('\t');
					var rowObj = {};
					for (var i = 0; i < tsvHeaders.length; i++) {
						rowObj[tsvHeaders[i]] = values[i] || '';
					}
					batch.push(rowObj); // 행 데이터를 배치 배열에 추가
				}
				
				// 배치가 꽉 차면 그리드에 추가하고 비움
				if (batch.length >= BATCH_SIZE) {
					if (mbFirstLoadData == false) {
						maReceive.push(new Date().getTime());
						grdTitle.firstLoadRander();
						mbFirstLoadData = true;
					}
					if (batch.length >= BATCH_SIZE) {
						//			    	app.lookup("dsList").build(batch, true);
						for (var j = 0; j < batch.length; j++) {
							app.lookup("dsList").pushRowData(batch[j]);
						}
						batch = [];
					}
					
					var rowCount = app.lookup("dsList").getRowCount();
					progress.value = rowCount;
					app.lookup('udcComGridTitle1').rowCount = rowCount;
				}
				
				// 다음 라인을 계속해서 읽음
				return reader.read().then(processText);
			}
			
			return reader.read().then(processText);
		})
		.then(function() {
			grdTitle.endRander();
			if (!isSubListError)
				isSubListError = false;
				
			var rowCount = app.lookup("dsList").getRowCount();
			progress.value = rowCount;
			app.lookup('udcComGridTitle1').rowCount = rowCount;
			
			clearTimeout(streamTimeoutId); // 끝까지 읽으면 타임아웃 해제
			
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
				// 1. 네트워크 이전단 걸리는 시간(sql 이 돌아가 값을 가져오는 시간등)
				var vnBeforeNetwork = maReceive[0] - maBeforeSubmit[0];
				// 2. 네트워크 이후단 걸리는 시간(sql 파싱후 화면 로딩이 끝나는 시간)
				var vnAfterNetwork = new Date().getTime() - maReceive[0];
				grdTitle.randerTime = vnAfterNetwork;
				grdTitle.networkTime = vnBeforeNetwork;
				grdTitle.totalTime = new Date().getTime() - maBeforeSubmit[0];
				maBeforeSubmit = [];
				maReceive = [];
//				grdTitle.networkTime = 124124;
				grdTitle.redraw();
			});
			
			util.Msg.notify(app, "조회가 완료 되었습니다.");
			
		}).catch(function(error) {
			console.log(error);
			isSubListError = true;
			util.Msg.notify(app, "서버에서 에러가 발생했습니다.");
		});
}

function getContextPath(){
	var vsContextPath = util.getContextPath();
	
	if(vsContextPath.indexOf("ui") > -1){
		vsContextPath =	"";
	}
	
	return vsContextPath;
}

function doImport(){
	if(ValueUtil.isNull(app.lookup("fit1").file)) return;
	
	// 1. 조회 시작 시각
	var udcPocGrdPrfCount1 = app.lookup("udcGrdPrfCnt");
	udcPocGrdPrfCount1.startRander();
	
	var vcSubUpload = app.lookup("subUpload");
	var voFile  = app.lookup("fit1").file;
	var rdbType = app.lookup("rdb2").value;
	if(rdbType == "server") {
		// Server 로 엑셀 데이터 조회
		if(voFile.type == "text/csv"){
			vcSubUpload.action = getContextPath() + "/krx/A5-2-ImportCsv.do"
		}else{
			vcSubUpload.action = getContextPath() + "/krx/A5-2-ImportExcel.do";
		}
		
		util.Submit.addImportGridFileParameter(app, "subUpload", "grdList", voFile, {
			datasetId: "dsList"
		});

		// 2. 조회 시작
		vcSubUpload.send().then(function(input){
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
				// 3. 데이터 조회 완료 후 그리드에 렌더링 종료 시점
				udcPocGrdPrfCount1.endRander();
				app.lookup("udcComGridTitle1").redraw();
				mbFirstLoad = false;
			});
			
			vcSubUpload.removeAllParameters();
		});
	} else if (rdbType == "client") {
		// Client 로 엑셀 데이터 조회
		
		// 로드마스크 활성
		util.showLoadMask(app);
		
		// 2. 조회 시작
		ExcelUtil.importExcel(voFile, app.lookup("grdList"), function(data){
			app.lookup("dsList").build(data);
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
				
				// 3. 데이터 조회 완료 후 그리드에 렌더링 종료 시점
				udcPocGrdPrfCount1.endRander();
				app.lookup("udcComGridTitle1").redraw();
				
				// 로드마스크 제거
				util.hideLoadMask(app);
			});
		});
	}
}

function resetStreamTimeout() {
    if (streamTimeoutId) clearTimeout(streamTimeoutId);
    streamTimeoutId = setTimeout(() => {
        controller.abort();
    }, STREAM_TIMEOUT_MS);
}



function doSubmitProgress(poEvent){
	// 최초 Stream Data 를 받은 시점
	var dsList = app.lookup("dsList");
	
	if(!mbFirstLoad && dsList.getRowCount() > 0) {
		var udcPocGrdPrfCount1 = app.lookup("udcGrdPrfCnt");
		udcPocGrdPrfCount1.firstLoadRander(new Date().getTime());
		mbFirstLoad = true;
	}
	
	var rowCount = app.lookup("dsList").getRowCount();
	app.lookup("udcComGridTitle1").rowCount = rowCount;
}

/**
 * @param {String} progressId
 */
function fetchProgressDataRead(progressId) {
	var sms = app.lookup("fetch_progress_data_read");
	sms.addParameter("progressId", progressId);
	if (sms.action.indexOf("/") == 0) {
		sms.action = ".." + sms.action;
	}
	sms.send().then(function(input){
		sms.removeAllParameters();
	});;
}

/************************************************
 * 컨트롤 이벤트
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	app.lookup("rdb1").selectItem(0);
}

/*
 * "초기화" 버튼(btnRst)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnRstClick(e) {
	resetCond();
}

/*
 * "조회" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click2(e) {
	resetCond();
	
	var rdb1 = app.lookup("rdb1");
	if (rdb1.value == "text") {
		fetchTextSubmission();
	} else {
		fetchBolbSubmission();
	}
}

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFit1ValueChange(e){
	resetCond(true);
	doImport();
}

/*
 * 서브미션에서 submit-load-progress 이벤트 발생 시 호출.
 * 서버로 부터 수신된 데이터가 응답 데이터컨트롤에 부분적으로 적재되었을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSubMassiveListSubmitLoadProgress(e){
	var subMassiveList = e.control;
	if(!mbFirstLoadData){
		var grdTitle = app.lookup("udcGrdPrfCnt");
		grdTitle.firstLoadRander();
	}
	
	if (subMassiveList.responseType === "blob") {
		var progress = app.lookup("progressbar");
		progress.value = Math.floor((parseInt(e.loaded) / parseInt(e.total)) * 100);
	}
	
	if (subMassiveList.getResponseDataCount() > 0) {
		var rowCnt = subMassiveList.getResponseData(0).data.getRowCount();
//		app.lookup("totalCnt").value = rowCnt;
		app.lookup("udcComGridTitle1").rowCount = rowCnt;
		mbFirstLoadData = true;
	}
}

/*
 * 사용자 정의 컨트롤에서 server-export 이벤트 발생 시 호출.
 * 서버에서 바로 엑셀을 export하는 경우
 */
function onUdcComGridTitle1ServerExport(e){
	var udcComGridTitle1 = e.control;
	// XXX
	var progressUUID = generateUUID();
	app.lookup("dmParam").setValue("progressId", progressUUID);
		
	util.Submit.send(app, "subCountList", function(pbSuccess) {
		if (pbSuccess) {
			
			var vnRowTotalCnt = util.DataMap.getValue(app, "dmResCnt", "totRowCnt");
			
			if (ValueUtil.fixNumber(vnRowTotalCnt) > 0) {
				
				var udcPocGrdPrfCount1 = app.lookup("udcGrdPrfCnt");
				udcPocGrdPrfCount1.resetRander();
				udcPocGrdPrfCount1.startRander();
				
				timerId = setTimeout(function() {
					fetchProgressDataRead(progressUUID);
				}, 500);
				
				util.Grid.exportMassiveDataServer(app, "grdList", "LMS목록", {
					applyFormat: true,
					applyClassStyle: true
				}, app.lookup("dmParam"), function(pbSuccess) {
					if (pbSuccess) {
//						udcPocGrdPrfCount1.endRander();
					}
				});
			}
		}
	});
}


/*
 * 서브미션에서 submit-done 이벤트 발생 시 호출.
 * 응답처리가 모두 종료되면 발생합니다.
 */
function onFetch_progressSubmitDone(e){
	var fetch_progress = e.control;
	/** @type number */
	var progress = fetch_progress.getMetadata("progress");
	var progressId = fetch_progress.getMetadata("progressId");
	
	var pgr = app.lookup("progressbar2");
	if (progress >= 0) {
		pgr.visible = true;
		pgr.numberValue = progress;		
		setTimeout(function() {
			if(!isSubListError)
				fetchProgress(progressId);
		}, 250);
	} else {
		pgr.numberValue = 100;
		pgr.visible = false;
	}
}

/*
 * 서브미션에서 submit-error 이벤트 발생 시 호출.
 * 통신 중 문제가 생기면 발생합니다.
 */
function onSubMassiveListSubmitError(e){
	var subMassiveList = e.control;
	isSubListError = true;	
	util.Msg.notify(app, "서버에서 에러가 발생했습니다.");
}

/*
 * 서브미션에서 submit-success 이벤트 발생 시 호출.
 * 통신이 성공하면 발생합니다.
 */
function onSubMassiveListSubmitSuccess(e){
	var subMassiveList = e.control;
	isSubListError = false;
	
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCbx1ValueChange(e){
	var cbx1 = e.control;
	var subMassiveList = app.lookup("subMassiveList");
	if(!cbx1.checked){
		subMassiveList.responseType = "blob";
	}else{
		subMassiveList.responseType = "text";
	}
	
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdb1SelectionChange(e){
	var rdb1 = e.control;
	var vsType = rdb1.value;
	app.lookup("subMassiveList").responseType = vsType;
	if(vsType == "blob"){
		app.lookup("progressbar").visible = true;
	}else{
		app.lookup("progressbar").visible = false;
	}
	
}

/*
 * 서브미션에서 submit-progress 이벤트 발생 시 호출.
 * 서버로 부터 일정 크기의 데이터를 전송받았을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSubUploadSubmitProgress(e){
	var subUpload = e.control;
	doSubmitProgress(e);
}

/*
 * 사용자 정의 컨트롤에서 csv-export 이벤트 발생 시 호출.
 * 서버에서 바로 CSV를 export하는 경우
 */
function onUdcComGridTitle1CsvExport(e){
	var udcComGridTitle1 = e.control;
	// XXX
	var progressUUID = generateUUID();
	app.lookup("dmParam").setValue("progressId", progressUUID);
	app.lookup("dmParam").setValue("ROWCOUNT", udcComGridTitle1.rowCount);
	
	util.Submit.send(app, "subCountList", function(pbSuccess) {
		if (pbSuccess) {
			
			var vnRowTotalCnt = util.DataMap.getValue(app, "dmResCnt", "totRowCnt");
			
			if (ValueUtil.fixNumber(vnRowTotalCnt) > 0) {
				
				var udcPocGrdPrfCount1 = app.lookup("udcGrdPrfCnt");
				udcPocGrdPrfCount1.resetRander();
				udcPocGrdPrfCount1.startRander();
				
				timerId = setTimeout(function() {
					fetchProgressDataRead(progressUUID);
				}, 500);
				
				util.Grid.exportCsvServer(app, "grdList", "LMS목록", app.lookup("dmParam"), function(pbSuccess){
				if(pbSuccess){
//					udcPocGrdPrfCount1.endRander();
				}
			});
			}
		}
	});
}

/*
 * 서브미션에서 submit-done 이벤트 발생 시 호출.
 * 응답처리가 모두 종료되면 발생합니다.
 */
function onFetch_progress_data_readSubmitDone(e){
	var fetch_progress_data_read = e.control;
	/** @type number */
	var progress = fetch_progress_data_read.getMetadata("progress");
	var progressId = fetch_progress_data_read.getMetadata("progressId");
	var pgr = app.lookup("progressbarCnt");
	if (progress >= 0) {
		util.showLoadMask(app);
		pgr.visible = true;
//		pgr.value = "" + (progress * 1000).toFixed();
		pgr.value = ValueUtil.fixNumber(progress);
		var vnTotRowCnt = app.lookup("dmResCnt").getValue("totRowCnt");
		pgr.displayExp = "\""+String(progress)+" / "+String(vnTotRowCnt)+"\""
		setTimeout(function() {
			fetchProgressDataRead(progressId);
		}, 500);
	} else {
		pgr.numberValue = 0
		pgr.visible = false;
		app.lookup("udcGrdPrfCnt").endRander();
		util.hideLoadMask(app);
		clearTimeout(timerId);
	}
}

/*
 * 사용자 정의 컨트롤에서 fetch-export 이벤트 발생 시 호출.
 * 그리드 일정 데이터를 export하는 경우
 */
function onUdcComGridTitle1FetchExport(e){
	var udcComGridTitle1 = e.control;
	var udcGrdPrfCnt = app.lookup("udcGrdPrfCnt");
	udcGrdPrfCnt.resetRander();
	udcGrdPrfCnt.startRander();
	util.Grid.exportMassiveData(app, "grdList", udcComGridTitle1.title, e.userData, function(pbSuccess){
		udcGrdPrfCnt.endRander();
	});
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdb3SelectionChange(e){
	var voLayout = app.lookup("grpCount").getLayout();
	var vBool = e.newSelection.value == "db";
	voLayout.setColumnVisible(0, vBool);
	voLayout.setColumnVisible(1, !vBool);
	
	resetCond();
}

/*
 * 서브미션에서 submit-load-progress 이벤트 발생 시 호출.
 * 서버로 부터 수신된 데이터가 응답 데이터컨트롤에 부분적으로 적재되었을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSubTsvSubmitLoadProgress(e){
	var subTsv = e.control;
	
	if(!mbFirstLoadData){
		var grdTitle = app.lookup("udcGrdPrfCnt");
		grdTitle.firstLoadRander();
	}
	
//	if (subTsv.responseType === "blob") {
//		var progress = app.lookup("progressbar");
//		progress.value = Math.floor((parseInt(e.loaded) / parseInt(e.total)) * 100);
//	}
	
	if (subTsv.getResponseDataCount() > 0) {
		var rowCnt = subTsv.getResponseData(0).data.getRowCount();
		app.lookup("udcComGridTitle1").rowCount = rowCnt;
		
		var progress = app.lookup("progressbar");
		var cmb = app.lookup("cmb1");
		var vnTotal = Number(cmb.getSelectionFirst().label.replace(/,/g,""));
		progress.value = Math.floor((rowCnt / vnTotal) * 100);
		
		mbFirstLoadData = true;
	}
}

/*
 * 그룹에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onGrpCountKeydown(e){
	if(e.keyCode == cpr.events.KeyCode.ENTER) {
		app.lookup("btn1").click();
	}
}

/*
 * 사용자 정의 컨트롤에서 client-export 이벤트 발생 시 호출.
 * 클라이언트에서 엑셀을 export하는 경우
 */
function onUdcComGridTitle1ClientExport(e){
	app.lookup("progressbar2").visible = false;
//	app.lookup("progressbarCnt").visible = false;
	
	var udcGrdPrfCnt = app.lookup("udcGrdPrfCnt");
	udcGrdPrfCnt.resetRander();
	udcGrdPrfCnt.startRander();
}

/*
 * 사용자 정의 컨트롤에서 client-export-done 이벤트 발생 시 호출.
 * 클라이언트에서 엑셀을 export 종료 후
 */
function onUdcComGridTitle1ClientExportDone(e){
	var udcGrdPrfCnt = app.lookup("udcGrdPrfCnt");
	udcGrdPrfCnt.endRander();
}

/*
 * 콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmb1SelectionChange(e) {
	resetCond();
}
