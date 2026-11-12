/************************************************
 * udcCmnPFileUpload.js
 * 첨부파일 업로드 및 파일 다운로드에 대한 요건은 프로젝트별 상이하므로 
 * 해당 샘플 파일의 업로드 및 다운로드 기능만 참고하시길 바랍니다.
 ************************************************/

var util = createCommonUtil();

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	return "";
};

exports.doClickUpload = doUpload;

/*
 * "업로드" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnUploadClick(e){
	doUpload();
}

function doUpload(){
	//파일업로드 전에 체크할 로직이 있는지 체크
	var vbSuccess = app.dispatchEvent(new cpr.events.CUIEvent("beforeUpload"));
	if(vbSuccess === false) return;
	//공통 업로드를 호출하는 경우
	if(app.getAppProperty("uploadUrl") == "/CmnFile/upload.do"){
		if(app.getAppProperty("multi")){
			var strAttcFileNo = ValueUtil.fixNull(app.getAppProperty("attcFileNo"));
			
			//메뉴권한에 관계없이... 파일업로드 가능하게 할지 여부(true/false)
			var forceAvailableUpload = app.getAppProperty("forceAvailableUpload");
			
			//초기 파라메터 셋팅
			var initValue = {
				strAttcFileNo: strAttcFileNo, //첨부파일번호
				maxUploadSize: app.getAppProperty("maxUploadSize"),	//최대업로드 사이즈
				fileSizeUnit: app.getAppProperty("fileSizeUnit"),	//파일 사이즈 단위
				allowFileExt: app.getAppProperty("allowFileExt"),	//허용 파일 확장자
				onlyDownload: app.getAppProperty("onlyDownload"),	//다운로드만 가능여부(true/false)
				userDefineStorePgmId: app.getAppProperty("userDefineStorePgmId"), //사용자 정의 첨부파일 업로드 경로 프로그램ID
				infoMsgShowYn: app.getAppProperty("infoMsgShowYn"), //최초업로드시저장안내메세지표시여부(N:표시안함)
				forceUpload : forceAvailableUpload,
				strCloseMsg : app.getAppProperty("closeMsg")      // 팝업 닫기시 다른 메시지 처리 
			};
			
			util.Dialog.open(app, "app/com/comPFileUpload", 700, 360, function(/**@type cpr.events.CUIEvent */e){
				/**@type cpr.controls.Dialog*/
				var dialog = e.control;
				var returnValue = dialog.returnValue;
				if(returnValue != null){
					//초기 첨부번호와 업로드 후의 첨부번호가 다르면...
					AppUtil.setAppProperty(app, "attcFileNo", returnValue.attcFileNo);
					//업로드 완료 콜백 이벤트 Dispatch시킴
					var event = new cpr.events.CUIEvent("uploadComplete");
					event.attcFileNo = returnValue.attcFileNo;
					event.fileNm = returnValue.fileNm;
					event.fileCnt = returnValue.fileCnt;
					app.lookup("dmTemp").setValue("tempAccFileNo", returnValue.attcFileNo);
					
					app.dispatchEvent(event);
				}
			}, initValue);
		}else{
			app.lookup("fileinput1").openFileChooser();
		}
	}else{
		app.lookup("fileinput1").openFileChooser();
	}
}

/*
 * Body에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e){
	//다중 파일선택 여부
	if(e.property == "multi"){
		app.lookup("fileinput1").multiple = e.newValue;
	//업로드 가능 파일확장자
	}else if(e.property == "allowFileExt"){
		app.lookup("fileinput1").acceptFile = e.newValue;
	//업로드 URL경로
	}else if(e.property == "uploadUrl"){
		app.lookup("subUpload").action = e.newValue;
	}
}

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFileinput1ValueChange(e){
	var fileinput1 = e.control;
	var vaFiles = fileinput1.files;
	
	if(vaFiles != null && vaFiles.length > 0){
		var submit = app.lookup("subUpload");
		
		/************************************************************
		 * 업로드 서브미션에 부모페이지 데이터맵을 추가
		 * (2019-07-01 정정호 추가)
		 ************************************************************/
		var vsAddDataMapId = app.getAppProperty("addDataMapId");
		
		if(!ValueUtil.isNull(vsAddDataMapId)){
			var vsHostApp = app.getHostAppInstance();
			var voAddParam = vsHostApp.lookup(vsAddDataMapId);
			
			submit.addRequestData(voAddParam, vsAddDataMapId);	
		}
		/************************************************************/
		
		var voFile;
		for(var i = 0, len = vaFiles.length; i < len; i++){
			voFile = vaFiles[i];
			//허용 가능 파일 유형 체크
			if(!util.File.checkFileExt(app, voFile.name, app.getAppProperty("allowFileExt"))) return false;
			
			submit.addFileParameter(voFile.name, voFile);
		}
		
		util.Submit.send(app, submit.id, null, function(pbSuccess, e){
			if(pbSuccess){
				var dmResult = app.lookup("dmUpload");
				
				AppUtil.setAppProperty(app, "attcFileNo", dmResult.getValue("attcFileNo"));
				
				//성공시 upload-complete 이벤트 발생
				var event = new cpr.events.CUIEvent("uploadComplete");
				event.attcFileNo = dmResult.getValue("attcFileNo");
				event.fileNm = dmResult.getValue("fileNm");
				event.fileCnt = dmResult.getValue("fileCnt");
				
				// 엑셀업로드 후 처리건수 리턴. (2019-06-11 정정호 추가)
				event.procCnt = e.getMetadata("strProcCnt");
				
				app.dispatchEvent(event);
			}

			/**
			 * 부모페이지의 데이터맵을 추가한 경우 해당 서브미션의 데이터맵 값을 모두 초기화 한다.
			 * 초기화를 하지 않은 경우 서브미션에 데이터맵이 중복 추가되어 기존 값이 계속 서버단에 전달되어 문제가 발생함.
			 */			
			if(!ValueUtil.isNull(vsAddDataMapId)){
				e.removeAllRequestData();
			}
		});
	}
}

/*
 * 파일 인풋에서 maxsize-exceed 이벤트 발생 시 호출.
 * 파일을 추가 시 파일의 크기가 최대 일 경우 발생하는 이벤트. 추가할 파일이 최대 크기보다 큰 경우 발생합니다. 추가된 파일들의 합계가 최대 크기보다 큰 경우 발생합니다.
 */
function onFileinput1MaxsizeExceed(e){
	var fileinput1 = e.control;
	var maxUploadSize = fileinput1.limitFileSize;
	//파일사이즈는 {0}를 초과 할 수 없습니다.
	util.Msg.alertDlg(app, "WRN-M016", [maxUploadSize]);
}
