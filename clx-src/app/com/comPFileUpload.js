/************************************************
 * comPFileUpload.js
 * @프로그램설명 : 
 * 첨부파일 업로드 및 파일 다운로드에 대한 요건은 프로젝트별 상이하므로 
 * 해당 샘플 파일의 업로드 및 다운로드 기능만 참고하시길 바랍니다.
 * 
 * @작성일자 :  2024. 7. 22..
 * @작성자 : ryu
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/ 


/************************************************
 ** 글로벌 함수
 ************************************************/ 


/************************************************
 ** 파일내 로컬변수 선언  
 ************************************************/ 
var util = createCommonUtil();

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/ 
/**
 * 첨부파일 목록데이터를 조회한다.
 * @param psStatus - 조회 상태(저장 후 조회인 경우에는 'save' 구분값 넘김)
 */
function doList(psStatus){
	if (psStatus == "save") {
		app.lookup("dmParam").setValue("strFileStatRcd", "");
	} else {
		app.lookup("dmParam").setValue("strFileStatRcd", "");
	}
	
	util.Submit.send(app, "subList", function(pbSuccess) {
		if (pbSuccess) {
			if (psStatus == "save") {
				//갱신된 데이터가 조회되었습니다.
				util.Msg.notify(app, "INF-M005");
			} else {
				//조회되었습니다.
				util.Msg.notify(app, "INF-M001");
			}
		}
	});
}

//파일 다운로드 요청을 보낸다.
function doDownFile(psSaveFileNm, psFileNm){
	//공통코드 서브미션 호출
	util.Submit.send(app, "subDownload", function(pbSuccess) {
		if (pbSuccess) {
			
		}
	});
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/*
 * Body에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(/* cpr.events.CEvent */ e){
	//초기 파라메터 셋팅
	var initValue = app.getHostProperty("initValue");
	
	var dmParam = app.lookup("dmParam");
	
	var vcFileInput = app.lookup("fileinput1");
	vcFileInput.limitFileSize = initValue.maxUploadSize + initValue.fileSizeUnit;
	if (!ValueUtil.isNull(initValue.allowFileExt)) {
		vcFileInput.acceptFile = initValue.allowFileExt;
	}
	//업로드 가능한 경우에만.... 버튼 활성화
	if (initValue.onlyDownload != true && (util.Main.getMenuInfo(app, "USE_AUTH_RCD") != "CMN045.0002" || initValue.forceUpload == true)) {
		app.lookup("btnUpload").visible = true;
		app.lookup("btnDelete").visible = true;
	}
	
	//첨부파일 번호 정보 셋팅
	if (!ValueUtil.isNull(initValue.strAttcFileNo)) {
		dmParam.setValue("strAttcFileNo", initValue.strAttcFileNo);
		doList();
	}
	//사용자정의 첨부파일 업로드 경로에 대한 프로그램ID
	if (!ValueUtil.isNull(initValue.userDefineStorePgmId)) {
		dmParam.setValue("strUserDefinePgmId", initValue.userDefineStorePgmId);
	}
	
	// 팝업닫기후 다른 메시지를 사용자에게 알려주고싶을때 셋팅 
	//사용자정의 첨부파일 업로드 경로에 대한 프로그램ID
	if (!ValueUtil.isNull(initValue.strCloseMsg)) {
		app.lookup("dmMsg").setValue("strMsg", initValue.strCloseMsg);
	}
}

/*
 * "파일 업로드" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnUploadClick(/* cpr.events.CMouseEvent */ e){
	app.lookup("fileinput1").openFileChooser();
}

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFileinput1ValueChange(/* cpr.events.CValueChangeEvent */ e){
	var fileinput1 = e.control;
	var vaFiles = fileinput1.files;
	
	var initValue = app.getHostProperty("initValue");
	
	if (vaFiles != null && vaFiles.length > 0) {
		var submit = app.lookup("subUpload");
		var voFile;
		for (var i = 0, len = vaFiles.length; i < len; i++) {
			voFile = vaFiles[i];
			//허용 가능 파일 유형 체크
			if (!util.File.checkFileExt(app, voFile.name, ValueUtil.fixNull(initValue.allowFileExt))) return false;
			
			submit.addFileParameter(voFile.name, voFile);
		}
		
		var initValue = app.getHostProperty("initValue");
		
		util.Submit.send(app, submit.id, function(pbSuccess) {
			if (pbSuccess) {
				//초기 파라메터 셋팅
				if (ValueUtil.isNull(initValue.strAttcFileNo)) {
					//업로드한 첨부번호로 데이터 재조회
					var vsAttcFileNo = ValueUtil.fixNull(app.lookup("dmUpload").getValue("attcFileNo"));
					app.lookup("dmParam").setValue("strAttcFileNo", vsAttcFileNo);
				}
				
				doList('save');
			}
		});
	}
}

/*
 * 파일 인풋에서 maxsize-exceed 이벤트 발생 시 호출.
 * 파일을 추가 시 파일의 크기가 최대 일 경우 발생하는 이벤트. 추가할 파일이 최대 크기보다 큰 경우 발생합니다. 추가된 파일들의 합계가 최대 크기보다 큰 경우 발생합니다.
 */
function onFileinput1MaxsizeExceed(/* cpr.events.CFileUploadEvent */ e){
	var fileinput1 = e.control;
	var maxUploadSize = fileinput1.limitFileSize;
	//파일사이즈는 {0}를 초과 할 수 없습니다.
	util.Msg.alertDlg(app, "WRN-M016", [maxUploadSize]);
}

/*
 * "삭제" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnDeleteClick(/* cpr.events.CMouseEvent */ e){
	var vaCheckRowIndexes = app.lookup("grdFile").getCheckRowIndices();
	if (vaCheckRowIndexes.length < 1) {
		//삭제할 데이터가 없습니다.
		util.Msg.alertDlg(app, "INF-M007");
	} else {
		//삭제 수행 함수
		var poOptions = {
			"confirmCallback": function() {
				//ROW 삭제
				util.Grid.deleteRow(app, "grdFile", vaCheckRowIndexes);
				
				//삭제 서브미션 호출
				util.Submit.send(app, "subDelete", function(pbSuccess) {
					if (pbSuccess) {
						doList('save');
					}
				});
			},
		}
		//{0}을(를) 삭제하시겠습니까?
		util.Msg.confirmDlg(app, "CRM-M016", ["선택된 파일"], poOptions);
	}
}

/*
 * 그리드에서 cell-click 이벤트 발생 시 호출.
 * Grid의 Cell 클릭시 발생하는 이벤트.
 */
function onGrdCodeCellClick(/* cpr.events.CGridEvent */ e){
	if (e.cellIndex == 5) {
		var vsSaveFileNm = e.row.getValue("SAVE_FILE_NM"); //저장 파일명
		var vsFileNm = e.row.getValue("FILE_NM"); //파일명
		var vsFilePath = e.row.getValue("FILE_PATH"); //파일경로
		
		app.lookup("dmParamDown").setValue("filePath", vsFilePath + "/" + vsSaveFileNm);
		app.lookup("dmParamDown").setValue("fileNm", vsFileNm);
		
		var voSumit = app.lookup("subCheckExist");
		util.Submit.send(app, "subCheckExist", function(pbSuccess) {
			if (pbSuccess) {
				if (voSumit.getMetadata("exist") == "Y") {
					
					app.lookup("dmParamDown").setValue("resType", app.lookup("subDownload").responseType);
					
					doDownFile(vsFilePath + "/" + vsSaveFileNm, vsFileNm);
				}
			}
		});
	}
}

/*
 * "화면닫기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCloseClick(/* cpr.events.CMouseEvent */ e){
	app.close();
}

/*
 * Body에서 before-unload 이벤트 발생 시 호출.
 * 앱이 언로드되기 전에 발생하는 이벤트 입니다. 취소할 수 있습니다.
 */
function onBodyBeforeUnload(/* cpr.events.CEvent */ e){
	var vsAttcFileNo = app.lookup("dmParam").getValue("strAttcFileNo");
	var vnFileCnt = app.lookup("grdFile").rowCount;
	var vnFileName = "";
	if (vnFileCnt > 0) {
		vnFileName = app.lookup("grdFile").getCellValue(0, "FILE_NM");
		vnFileName += vnFileCnt > 1 ? "외 " + (vnFileCnt - 1) + "건" : "";
	}
	
	//첨부파일이 없으면... 모두 삭제된 걸로 판단
	if (vnFileCnt < 1) {
		vsAttcFileNo = "";
	}
	
	var initValue = app.getHostProperty("initValue");
	
	/**
	 * 파일업로드 후 부모페이지에서 바로 저장이 실행되는 경우 안내문구가 필요없어서 예외처리함.
	 */
	if (initValue.infoMsgShowYn == "Y") {
		if (vnFileCnt > 0 && ValueUtil.isNull(initValue.strAttcFileNo)) {
			var strMsg = app.lookup("dmMsg").getValue("strMsg");
			if (!ValueUtil.isNull(strMsg)) {
				util.Msg.alertDlg(app, strMsg);
			} else {
				util.Msg.alertDlg(app, "최초 첨부파일 업로드시 창을 닫은 후 \n저장버튼을 클릭해야 합니다.");
			}
		} else if (vnFileCnt < 1 && !ValueUtil.isNull(initValue.strAttcFileNo)) {
			util.Msg.alertDlg(app, "전체 첨부파일 삭제시 창을 닫은 후 \n저장버튼을 클릭해야 합니다.");
		}
	}
	
	app.setHostProperty("returnValue", {
		"attcFileNo": vsAttcFileNo,
		"fileCnt": vnFileCnt,
		"fileNm": vnFileName
	});
}


/*
 * "전체다운" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnDownAllClick(/* cpr.events.CMouseEvent */ e){
	if (app.lookup("grdFile").getRowCount() < 1) return;
	
	var voSumit = app.lookup("subDownloadAll");
	voSumit.addParameter("strAttcFileNo", app.lookup("dmParam").getValue("strAttcFileNo"));
	//공통코드 서브미션 호출
	util.Submit.send(app, voSumit.id, function(pbSuccess) {
		if (pbSuccess) {
			
		}
	});
}
