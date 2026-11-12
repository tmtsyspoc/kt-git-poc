/************************************************
 * screenLayout.js
 * Created at 2023. 2. 27. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/
var util = createCommonUtil();
var initConfig,initConfig2;


exports.setMask = function(psType, sourceData){
	return ValueUtil.maskType(psType, sourceData);
}

/**
 * 
 * @param {String} sourceData
 */
exports.setMultiMask = function(sourceData) {
	if (sourceData == null){
		return;
	}
	
	if (sourceData.length == 16 || sourceData == 19){ // 카드번호
		return ValueUtil.maskType("CARD", sourceData);
	} else if (sourceData.length == 10) { // 사업자등록번호
		return ValueUtil.maskType("BSN", sourceData);
	} else if (sourceData.length == 13) { // 주민등록번호
		return ValueUtil.maskType("JUMIN", sourceData);
	} else {
		return sourceData;
	}
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.Submit.send(app, "subList");
	util.Submit.send(app, "subList3");
	util.Submit.send(app, "subList4");
	util.Submit.send(app, "subTree");
	
	initConfig = app.lookup("grdMain2").getInitConfig();
	initConfig2 = app.lookup("grdUdc").getInitConfig();
	
	util.Submit.send(app, "subPivotList", function(pbSuccess) {		
		if (pbSuccess){}
	});
	
	dragImportGrid();
}

/**
 * 상위의  app 이 로드될때 호출해야 함
 * 파일을 그리드에 drop과 dragover 했을 때 실행
 */
function dragImportGrid() {
	var vcGrdFile = app.lookup("grdFile");
	vcGrdFile.addEventListener("drop", function(e) {
		var vcGrd = e.control;
		/* 대상이 최소 1개 이상의 item 혹은 1개 이상의 파일일 경우 기본 동작을 방지 */
		if (!(e.dataTransfer.items.length == 0) || !(e.dataTransfer.files.length == 0)) {
			e.preventDefault();
			if (e.dataTransfer.items) {
				var vaFiles = [];
				for (var i = 0; i < e.dataTransfer.items.length; i++) {
					if (e.dataTransfer.items[i].kind === 'file') {
						var voFile = e.dataTransfer.items[i].getAsFile();
						vaFiles.push(voFile);
					}
				}
				doFileUpload(vaFiles);
			} else {
				for (var i = 0; i < e.dataTransfer.files.length; i++) {
					var voFile = e.dataTransfer.files[i];
					doFileUpload([voFile]);
				}
			}
		}
	});
	
	vcGrdFile.addEventListener("dragover", function(e) {
		/* 대상이 최소 1개 이상의 item 혹은 1개 이상의 파일일 경우 기본 동작을 방지 */
		if (!(e.dataTransfer.items.length == 0) || !(e.dataTransfer.files.length == 0)) {
			e.preventDefault();
		}
	});
}

/*
 * 서브미션에서 submit-success 이벤트 발생 시 호출.
 * 통신이 성공하면 발생합니다.
 */
function onSubList3SubmitSuccess(e){
	var subList3 = e.control;
	app.lookup("udcComGridTitle3").rowCount = util.Grid.getRowCount(app, "grdList");
}

/*
 * "일부포맷변경" 버튼(btnRst4)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnRst4Click(e){
	var btnRst4 = e.control;

	app.lookup("opt42").format = "000000-0000000";
	app.lookup("opt43").format = "000000000";
	
	app.lookup("grd2").redraw();
}

/*
 * "초기화" 버튼(btnRst3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnRst3Click(e){
	var btnRst3 = e.control;
	
	app.lookup("opt42").format = "000000-0******";
	app.lookup("opt43").format = "000*****0";
	
	
	app.lookup("grd2").redraw();
}

/*
 * "파일 업로드" 버튼(btnUpload)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnUploadClick(e){
	app.lookup("fileinput1").openFileChooser();
}

/*
 * "전체다운" 버튼(btnDownAll)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnDownAllClick(e){
	if(app.lookup("grdFile").getRowCount() < 1) return;
	var voSumit = app.lookup("subDownloadAll");
	voSumit.addParameter("strAttcFileNo", app.lookup("dmParam").getValue("strAttcFileNo"));
	//공통코드 서브미션 호출
	util.Submit.send(app, voSumit.id, function(pbSuccess){
		if(pbSuccess) {
		}
	});
}

/*
 * "삭제" 버튼(btnDelete)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnDeleteClick(e){
	var vaCheckRowIndexes = app.lookup("grdFile").getCheckRowIndices();
	if(vaCheckRowIndexes.length < 1){
		//삭제할 데이터가 없습니다.
		util.Msg.alertDlg(app, "INF-M007");
	}else{
		//삭제 수행 함수
		var poOptions = {
			"confirmCallback" : function() {
				//ROW 삭제
				util.Grid.deleteRow(app, "grdFile", vaCheckRowIndexes);
				//삭제 서브미션 호출
				util.Submit.send(app, "subDelete", function(pbSuccess){
					if(pbSuccess){
						doFileList('save');
					}
				});
			},
		}
		//{0}을(를) 삭제하시겠습니까?
		util.Msg.confirmDlg(app, "CRM-M016", ["선택된 파일"], poOptions);
	}
}

/**
 * 첨부파일 목록데이터를 조회한다.
 * @param psStatus - 조회 상태(저장 후 조회인 경우에는 'save' 구분값 넘김)
 */
function doFileList(psStatus){
	app.lookup("dmParam").setValue("strFileStatRcd", "");
	util.Submit.send(app, "subFileList", function(pbSuccess){
		if(pbSuccess){
			if(psStatus == "save"){
				//갱신된 데이터가 조회되었습니다.
				util.Msg.notify(app, "INF-M005");
			}else{
				//조회되었습니다.
				util.Msg.notify(app, "INF-M001");
			}
		}
	});
}

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFileinput1ValueChange(e){
	var fileinput1 = e.control;
	var vaFiles = fileinput1.files;
	doFileUpload(vaFiles);
}

function doFileUpload(paFiles){
	var vaFiles = paFiles;
	var initValue = app.getHostProperty("initValue");
	if(vaFiles != null && vaFiles.length > 0){
		var submit = app.lookup("subUpload");
		var voFile;
		for(var i = 0, len = vaFiles.length; i < len; i++){
			voFile = vaFiles[i];
			//허용 가능 파일 유형 체크
			submit.addFileParameter(voFile.name, voFile);
		}
		
		util.Submit.send(app, submit.id, function(pbSuccess){
			if(pbSuccess){
				//업로드한 첨부번호로 데이터 재조회
				var vsAttcFileNo = ValueUtil.fixNull(app.lookup("dmUpload").getValue("attcFileNo"));
				app.lookup("dmParam").setValue("strAttcFileNo", vsAttcFileNo);
				doFileList('save');
			}
		});
	}
}

/*
 * 그리드에서 cell-click 이벤트 발생 시 호출.
 * Grid의 Cell 클릭시 발생하는 이벤트.
 */
function onGrdFileCellClick(e){
	var grdFile = e.control;
	if(e.cellIndex == 5){
		var vsSaveFileNm = e.row.getValue("SAVE_FILE_NM");	//저장 파일명
		var vsFileNm = e.row.getValue("FILE_NM");			//파일명
		var vsFilePath = e.row.getValue("FILE_PATH");		//파일경로
		
		app.lookup("dmParamDown").setValue("filePath", vsFilePath+"/"+vsSaveFileNm);
		app.lookup("dmParamDown").setValue("fileNm", vsFileNm);
		
		var voSumit = app.lookup("subCheckExist");
		util.Submit.send(app, "subCheckExist", function(pbSuccess){
			if(pbSuccess){
				if(voSumit.getMetadata("exist") == "Y"){
					app.lookup("dmParamDown").setValue("resType", app.lookup("subDownload").responseType);
					doDownFile(vsFilePath+"/"+vsSaveFileNm, vsFileNm);
				}
			}
		});
	}
}

//파일 다운로드 요청을 보낸다.
function doDownFile(psSaveFileNm, psFileNm){
	//공통코드 서브미션 호출
	util.Submit.send(app, "subDownload", function(pbSuccess){
		if(pbSuccess) {
		}
	});
}

/*
 * 사용자 정의 컨트롤에서 execute 이벤트 발생 시 호출.
 * 피벗을 실행했을 때 발생하는 이벤트
 */
function onUdcPocPivotHelperHExecute(e){
	/** 
	 * @type udc.scr.PivotHelperH
	 */
	var pivotHelperH = e.control;
	util.Control.setVisible(app, false, "grdGho");
	
	/** @type {{dataset : cpr.data.DataSet, cellType : "split" | "merged", config : Object}} */
	var voPvSt = e.content;
	var vcPvGrd = app.lookup("pv");
	vcPvGrd.suppressedCellType = voPvSt.cellType;
	vcPvGrd.setup(voPvSt.dataset, voPvSt.config);
}

/*
 * "임포트용 엑셀 파일 다운로드" 버튼(btnDownload)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnDownloadClick(e){
	var btnDownload = e.control;
	util.Submit.send(app, "subDownloadSample", function(){
			
	});
}

/*
 * "엑셀 임포트" 버튼(btnImport)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnImportClick(e){
	app.lookup("fit1").openFileChooser();
}

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFit1ValueChange(e){
	var fit1 = e.control;
	var file = fit1.file;
	var vsTypeDiv = app.lookup("rdbDiv").value;
	
	if(vsTypeDiv == "server") {
		
		util.Submit.addImportGridFileParameter(app, "subImport", "grdList2", file);
		util.Submit.send(app, "subImport", function(pbSuccess) {
				if (pbSuccess) {
					app.lookup("udcComGridTitle8").rowCount = util.DataSet.getRowCount(app, "dsList3");
				}
		});
	} else {
		ExcelUtil.importExcel(file, app.lookup("grdList2"),function(data){
			app.lookup("grdList2").dataSet.build(data);
		});
	}
}

/*
 * "엑셀 다운로드" 버튼(btnImport2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnImport2Click(e){
	var btnImport2 = e.control;
	var vsTypeDiv = app.lookup("rdbDiv").value;
	
	if(vsTypeDiv =="server") {
		util.Grid.exportData(app, "grdList2", "excelData");
	} else {
		ExcelUtil.exportExcel("excelData.xlsx", "sheet1", app.lookup("grdList2"));
	}
}

/*
 * 사용자 정의 컨트롤에서 save 이벤트 발생 시 호출.
 * 저장 클릭 이벤트
 */
function onGrd3Save(e) {
	var grd3 = e.control;
	
	util.Msg.notify(app, "저장되었습니다.");
	app.lookup("grdUdc").commitData();
}
