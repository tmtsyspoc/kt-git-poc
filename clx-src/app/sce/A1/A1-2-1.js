/************************************************
 * N26.js
 * Created at 2024. 8. 1. 오후 3:54:49.
 *
 * @author daye
 ************************************************/

var util = createCommonUtil();
var mbFirstLoad = false;


/*
 * "조회" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	if(!util.validate(app, "fit1")) return false;
	
	// 1. 조회 시작 시각
	var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
	udcPocGrdPrfCount1.startRander();
	
	var voFile  = app.lookup("fit1").file;
	var rdbType = app.lookup("rdb1").value;
	if(rdbType == "server") {
		// Server 로 엑셀 데이터 조회
		if(voFile.type == "text/csv"){
			app.lookup("subUpload").action = "/A37/excelFileCsv.do"
		}else{
			app.lookup('subUpload').action = "/A37/excelFileTsv.do";
		}
		
		util.Submit.addImportGridFileParameter(app, "subUpload", "grd1", voFile, {
			datasetId: "dsList"
		});
		var sms = app.lookup("subUpload");
		if (sms.action.indexOf("/") == 0) {
			sms.action = ".." + sms.action;
		}
		// 2. 조회 시작
		sms.send().then(function(input){
			var dsList = app.lookup("dsList");
			var rowCount =dsList.getRowCount();
			for (var i = 0; i < rowCount; i++) {
				dsList.putValue(i, "column21", moment().format("YYYYMMDDHHmmssSSS")); // 업로드 일시
				dsList.putValue(i, "column22", util.Main.getUserInfo(app, "USER_NM")); // 처리자명
			}
				
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
				// 3. 데이터 조회 완료 후 그리드에 렌더링 종료 시점
				udcPocGrdPrfCount1.endRander();
				app.lookup("udcComGridTitle1").redraw();
				mbFirstLoad = false;
			});
		});
	} else if (rdbType == "client") {
		// Client 로 엑셀 데이터 조회
		
		// 로드마스크 활성
		util.showLoadMask(app);
		
		// 2. 조회 시작
		ExcelUtil.importExcel(voFile, app.lookup("grd1"), function(data){
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

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFit1ValueChange(e){
	var fit1 = e.control;
	doReset(fit1);
	util.Control.dispatchEvent(app, "btn1", "click");
}

function doReset(poFile){
	
	var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
	udcPocGrdPrfCount1.resetRander();
	
	var dsList = app.lookup("dsList");
	dsList.clear();
	
	var pgr = app.lookup("pgr1");
	pgr.value = 0;
	if(poFile != null && poFile.file) {
		var vsTempFileNm = poFile.file.name.replace("PoC 항목 체크리스트_샘플데이터_", "");
		pgr.max = ValueUtil.fixNull(vsTempFileNm.substr(0, vsTempFileNm.indexOf("만건"))) * 10000;
	}else{
		var vsLabel = util.SelectCtl.getItemLabel(app, "rdbCnt");
		pgr.max = ValueUtil.fixNumber(vsLabel.replace("만건", "")) * 10000;
	}
	app.lookup("udcComGridTitle1").redraw();
	
}

function doSubmitProgress(poEvent){
	// 최초 Stream Data 를 받은 시점
	var dsList = app.lookup("dsList");
	if(!mbFirstLoad && dsList.getRowCount() > 0) {
		var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
		udcPocGrdPrfCount1.firstLoadRander(new Date().getTime());
		mbFirstLoad = true;
	}
	var pgr = app.lookup("pgr1");
//	progress.max = 100;

	pgr.value = Math.floor((parseInt(poEvent.loaded) / parseInt(poEvent.total)) * 100);
	pgr.redraw();
}


/*
 * 서브미션에서 submit-progress 이벤트 발생 시 호출.
 * 서버로 부터 일정 크기의 데이터를 전송받았을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSubUpload2SubmitProgress(e){
	var subUpload2 = e.control;
	doSubmitProgress(e);
}

/*
 * 서브미션에서 submit-progress 이벤트 발생 시 호출.
 * 서버로 부터 일정 크기의 데이터를 전송받았을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSubListSubmitProgress(e){
	var subList = e.control;
	doSubmitProgress(e);
}

/*
 * "조회" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	doReset(null);
	
	var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
	udcPocGrdPrfCount1.startRander();
	
	var sms = app.lookup("subList");
	sms.action = app.lookup("rdbCnt").value;	
	if (sms.action.indexOf("/") == 0) {
		sms.action = ".." + sms.action;
	}
	// 2. 조회 시작
	sms.send().then(function(input){
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
			var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
			udcPocGrdPrfCount1.endRander();
			app.lookup("udcComGridTitle1").redraw();
			mbFirstLoad = false;
		});
	});
}

/*
 * 서브미션에서 submit-done 이벤트 발생 시 호출.
 * 응답처리가 모두 종료되면 발생합니다.
 */
function onSubListSubmitDone(e){
	var subList = e.control;
	
	var udcGrdTitle = app.lookup("udcComGridTitle1");
	udcGrdTitle.title =  "LMS" + (ValueUtil.fixNumber(udcGrdTitle.rowCount) / 10000) + "만건";
}

/*
 * "export" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
	var udcComGridTitle = app.lookup("udcComGridTitle1");
	var dw = app.lookup("dsList");
		
	var grd = app.lookup("grd1");
	
	if(grd.getRowCount() == 0) {
		util.Msg.alertDlg(app, "export할 데이터가 존재하지 않습니다.");
		return;
	}
	
    var exportData = grd.getExportData({
    	rows: [],
    	reduce: true,
    });
    var columnInfo = exportData.cols;
    var columnWidths = columnInfo.map(col => parseInt(col.width.replace("px", ""), 10));
//
    var headers = exportData.rowgroups[0].data;//헤더데이터
    
//    for (var i = 0; i < grd.header.getCellIndices().length; i++) {
//    	if(grd.header.getColumn(i).visible){
//	        headers.push({
//	            "text": grd.header.getColumn(i).text,
//	            "key": grd.header.getColumn(i).targetColumnName
//	        });    		
//    	}
//    }
	var worker = new Worker('app/sce/A1/data/excelExportwokrer.js');
    var totalRows = grd.getRowCount();
    //한번에 보낼 데이터개수
    var dataSize = 10000;
	
	util.showLoadMask(app);
	var activeLoadmask = util.getLoadMask(app);
   
	activeLoadmask.module.show();
	activeLoadmask.module.showProgress();
	
	var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
	udcPocGrdPrfCount1.resetRander();
	udcPocGrdPrfCount1.startRander();

	
    function sendDataToWorker(start) {
    	// 더 이상 보낼 데이터가 없으면 종료
    	if (start >= totalRows) return; 
    	if(start != 0){
    		exportData = null;
    		columnWidths = null;
    		headers = null;
    		if(!mbFirstLoad){	    		
				udcPocGrdPrfCount1.firstLoadRander(new Date().getTime());
				mbFirstLoad = true;   		    			
    		}
    	}
		
	    // 남은 데이터 개수를 계산하여 dataSize 조정
	    var adjustedSize = Math.min(dataSize, totalRows - start);
      	var rowIndex = [];
		for (var i = 0; i < adjustedSize; i++) {
		    rowIndex.push(start + i);
		}
		
		activeLoadmask.module.count(start + adjustedSize);
      	activeLoadmask.module.progress(totalRows, start + adjustedSize);
//      var data = dataSet.getRowDataRanged(start, start + adjustedSize - 1);
		var data = grd.getExportData({
					rows: rowIndex //rows : Export시킬 특정 row index 배열.
					,reduce: true					
				});
		
		 var jsonData = JSON.stringify(data.rowgroups[1].data);
		
	    var encoder = new TextEncoder();
	   var uint8Array = encoder.encode(jsonData); // ✅ Uint8Array로 변환
		var arrayBuffer = uint8Array.buffer.slice(0); // ✅ Transferable Object로 변환
        worker.postMessage({
            actionUrl: getContextPath() + "/A37/export-excelExport.do",
            start: start,
            headers: headers,
            columnWidths: columnWidths,
            dataSize: dataSize,
            totalRows: totalRows,
            data:arrayBuffer
        },[arrayBuffer]);
        data = null;
    }

    // 워커에서 받은 메시지 처리
    worker.onmessage = function (e) {
        if (e.data.type === "next") {
            sendDataToWorker(e.data.start);
        } else if (e.data.type === "download") {
            var url = window.URL.createObjectURL(e.data.blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = app.lookup("udcComGridTitle1").title + "_" + totalRows + ".xlsx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            e.data = null;
            url = null;
            // 작업 완료 후 워커 종료
			worker.terminate();
            util.hideLoadMask(app);
			udcPocGrdPrfCount1.endRander();
        }
    };
   
    
    // 첫 데이터 전송 시작
    sendDataToWorker(0);

}

function getContextPath(){
	
	var vsContextPath = util.getContextPath();
	
	if(vsContextPath.indexOf("ui") > -1){
		vsContextPath =	"";
	}
	
	return vsContextPath;
}

/*
 * 그리드에서 update 이벤트 발생 시 호출.
 * Grid의 행 데이터가 수정되었을 때 이벤트.
 */
function onGrd1Update(e){
	var grd1 = e.control;
	
	var voUpdateRow = e.row;
	voUpdateRow.setValue("column21", moment().format("YYYYMMDDHHmmssSSS")); // 업로드 일시
	voUpdateRow.setValue("column22", util.Main.getUserInfo(app, "USER_NM")); // 처리자명
}

/*
 * "csvExport" 버튼(btn4)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn4Click(e){
	var btn4 = e.control;
	
	var udcComGridTitle = app.lookup("udcComGridTitle1");
	var dw = app.lookup("dsList");	
	var grd = app.lookup("grd1");
	
	if(grd.getRowCount() == 0) {
		util.Msg.alertDlg(app, "export할 데이터가 존재하지 않습니다.");
		return;
	}
	
    var exportData = grd.getExportData({
    	rows: [],
    	reduce: true,
    });
//    
    var columnInfo = exportData.cols;
    var columnWidths = columnInfo.map(col => parseInt(col.width.replace("px", ""), 10));
//
    var headers = exportData.rowgroups[0].data;//헤더데이터
    
	var worker = new Worker('app/sce/A1/data/excelExportwokrer.js');
    var totalRows = grd.getRowCount();
    //한번에 보낼 데이터개수
    var dataSize = 10000;
	
	util.showLoadMask(app);
	var activeLoadmask = util.getLoadMask(app);
   
	activeLoadmask.module.show();
	activeLoadmask.module.showProgress();
	
	var udcPocGrdPrfCount1 = app.lookup("udcPocGrdPrfCount1");
	udcPocGrdPrfCount1.resetRander();
	udcPocGrdPrfCount1.startRander();

    function sendDataToWorker(start) {
    	// 더 이상 보낼 데이터가 없으면 종료
    	if (start >= totalRows) return; 
    	if(start != 0){
    		exportData = null;
    		columnWidths = null;
    		headers = null;
    		if(!mbFirstLoad){	    		
				udcPocGrdPrfCount1.firstLoadRander(new Date().getTime());
				mbFirstLoad = true;   		    			
    		}
    	}
		
	    // 남은 데이터 개수를 계산하여 dataSize 조정
	    var adjustedSize = Math.min(dataSize, totalRows - start);
      	var rowIndex = [];
		for (var i = 0; i < adjustedSize; i++) {
		    rowIndex.push(start + i);
		}
		
		activeLoadmask.module.count(start + adjustedSize);
      	activeLoadmask.module.progress(totalRows, start + adjustedSize);
//      var data = dataSet.getRowDataRanged(start, start + adjustedSize - 1);
		var data = grd.getExportData({
					rows: rowIndex //rows : Export시킬 특정 row index 배열.
					,reduce: true					
				});
		
		 var jsonData = JSON.stringify(data.rowgroups[1].data);
		
	    var encoder = new TextEncoder();
	   var uint8Array = encoder.encode(jsonData); // ✅ Uint8Array로 변환
		var arrayBuffer = uint8Array.buffer.slice(0); // ✅ Transferable Object로 변환
		//export-csvExport.do
        worker.postMessage({
            actionUrl: getContextPath() + "/A37/export-csvExport.do",//"/A37/export-excelExport.do",
            start: start,
            headers: headers,
            columnWidths: columnWidths,
            dataSize: dataSize,
            totalRows: totalRows,
            data:arrayBuffer
        },[arrayBuffer]);
        data = null;
    }

    // 워커에서 받은 메시지 처리
    worker.onmessage = function (e) {
        if (e.data.type === "next") {
            sendDataToWorker(e.data.start);
        } else if (e.data.type === "download") {
            var url = window.URL.createObjectURL(e.data.blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = app.lookup("udcComGridTitle1").title + "_" + totalRows + ".csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            e.data = null;
            url = null;
            // 작업 완료 후 워커 종료
			worker.terminate();
            util.hideLoadMask(app);
			udcPocGrdPrfCount1.endRander();
        }
    };
   
    
    // 첫 데이터 전송 시작
    sendDataToWorker(0);
}


/*
 * "다운로드" 버튼(btn5)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn5Click(e){
	var btn5 = e.control;
	
	if(!util.validate(app, "cmbUploadFile")) return false;
	
	var vsImportFileNm = app.lookup("cmbUploadFile").value;
	util.DataMap.setValue(app, "dmSampleDownload", "fileNm", vsImportFileNm);
	util.Submit.send(app, "subDownloadSample", function(){
		
	});
}

/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 전파되는 이벤트.
 */
function onBodyScreenChange(e){
	if(AppProperties.SCREEN_MOBILE_NM.indexOf(e.screen.name) > -1) {
		app.lookup("opt1").style.addClass("text-left");
		app.lookup("opt5").style.addClass("text-left");
	} else {
		app.lookup("opt1").style.removeClass("text-left");
		app.lookup("opt5").style.removeClass("text-left");
	}
}
