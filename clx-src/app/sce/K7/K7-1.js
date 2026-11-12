/************************************************
 * K7-1.js
 * @프로그램설명 : 
 *
 * @작성일자 :  2026. 11. 5..
 * @작성자 : dyseo
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

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/* ==== [app/sce/A14/A14-3.clx] 14.3 ActiveX 호환 ==== */
var device =null;

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	if(device == null) {
		
		device = createDevice();
		
		device.openConnector("home", function(msg) {
			var voMsgObj = JSON.parse(msg);
			var vsServiceType = voMsgObj["service"]//ReceiveWsPush
			var voMessage = voMsgObj["message"];
			if(vsServiceType == "ReceiveWsPush"){
				
				app.lookup("dm1").build(voMessage);
				util.Control.redraw(app, "grpForm");
			}
		});
	}
}
/*
 * "Button" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	device.setBrowserUri(app.lookup("rdb1").value);
	device.openBrowser();
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdb1SelectionChange(e){
	var rdb1 = e.control;
	var vbDirect = rdb1.value == "";
	app.lookup("ipbUri").visible=  vbDirect;
	if(vbDirect) {
		device.setBrowserUri(app.lookup("ipbUri").value);
	} else {
		device.setBrowserUri(rdb1.value);
	}
}

/*
 * 인풋 박스에서 value-change 이벤트 발생 시 호출.
 * 변경된 value가 저장된 후에 발생하는 이벤트.
 */
function onIpbUriValueChange(e){
	var ipbUri = e.control;
	device.setBrowserUri(ipbUri.value);
}

/* ==== [app/sce/A4/A4-5.clx] 4.5 대용량 로컬 파일제어 ==== */
/************************************************
 ** 글로벌 변수, 전역변수
 ************************************************/


var sysscvStatus = {
	"-1": "정의되지 않은 예외가 발생했습니다. Log 파일을 확인해주세요.",
	"0": "성공",
	"1": "시스템으로부터 IP 정보를 획득할 수 없습니다.",
	"2": "시스템으로부터 연결된 모니터 정보를 획득할 수 없습니다.",
	"3": "시스템으로부터 대상 모니터 정보를 획득할 수 없습니다.",
	"4": "시스템으로부터 모니터 해상도 정보를 획득할 수 없습니다.",
	"5": "지원하지 않는 창(Window)이동 옵션이 입력되었습니다. 지원 옵션: 1,2,3",
	"6": "타겟 프로세스를 식별할 수 없습니다.",
	"7": "창(Window) 모드 설정 실패.",
	"8": "창(Window) 이동 실패.",
	"9": "대상 파일/디렉토리가 존재하지 않음.",
	"10": "최소화 모드에서는 스크린샷 획득 불가.",
	"11": "스크린샷 획득 실패.",
	"12": "파일 저장 실패.",
	"13": "시스템 경로(System Path) 획득에 실패했습니다.",
	"14": "해당 파일이 이미 존재합니다.",
	"98": "유효하지 않은 파라미터가 입력되었습니다.",
	"99": "Win32 Dll method 호출에 실패했습니다."
}

var conn = null;

var vnStartTime = 0;
/************************************************
 ** 사용자 정의 함수
 ************************************************/
/**
 * eXDevice+ 연결
 */
function doOnload( ) {
	if(!conn) return;
	
	/* eXDevice+ 연결 */
	conn.connect();
	
	/* eXDevice+ 콜백 핸들러 */
	conn.onready = function() {
		util.Msg.notify(app, "eXDevice+가 연결되었습니다.");
	};
	conn.onerror = function(msg) {
		console.log("에러가 발생했습니다. " + JSON.stringify(msg));
	};
	conn.onclose = function(msg) {
		console.log("연결이 종료되었습니다. " + JSON.stringify(msg));
	};
	conn.onmessage = function(msg) {
//		console.log(JSON.stringify(msg));
	};
}

function getExdpServiceMsg(stsCd){
	return sysscvStatus[stsCd] + " Service status: [" + stsCd + "]";
}

function checkStatusCode(serviceIdentifier, serviceName, statusCode) {
	if(statusCode == "0000") { return true; }

//	console.log(serviceIdentifier + "호출 에러: " + getMsg(statusCode));
	return false;
}
function checkReturnCode(serviceIdentifier, serviceName, returnCode){
	if(returnCode == 0) { return true; }

//	console.log(serviceIdentifier + "에러: " + getExdpServiceMsg(returnCode));
	return false;
}

/************************************************
 ** 로컬 파일 제어 (READ/WRITE/COPY/DELETE)
 ************************************************/

function fileReadDialog() {
	var serviceIdentifier = "[파일 Read Dialog 서비스] ";
	var ipbFileOpenPath = app.lookup("fileReadPath");
	var serviceName = "WinInfo.FileReadDialog";
	var timeFormat = 0; //Unix Epoch or ISO 8601
	
	var vsDirPath = ValueUtil.isNull(app.lookup("fileReadPath").value) == true ? "" : app.lookup("fileReadPath").value;

	var param = {
		initDirPath: vsDirPath,
		dialogTitle: "파일탐색기",
		filter: "",
		timeFormat: timeFormat
	};
	
	// 로드 마스크 보임
	util.showLoadMask(app.getRootAppInstance());
		
	conn.send(serviceName, param, function(msg) {
		if (!checkStatusCode(serviceIdentifier, serviceName, msg["statusCode"])) {
			// 로드 마스크 숨김
			util.hideLoadMask(app.getRootAppInstance());
			util.Msg.notify(app, "에러가 발생했습니다.");
			return;
		}
		
		var returnCode = msg["return"]["returnValue"];
		if (!checkReturnCode(serviceIdentifier, serviceName, returnCode)) {
			// 로드 마스크 숨김
			util.hideLoadMask(app.getRootAppInstance());
			util.Msg.notify(app, "파일을 오픈하는 데 실패하였습니다.");
			return;
		}
		
		util.Msg.notify(app, "파일을 정상적으로 오픈하였습니다.");
		
		var csvContent = msg["return"]["data"];
		const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
		const headers = lines[0].split(',');
		
		const jsonArr = lines.slice(1).map(line => {
			const values = line.split(',');
			const obj = {};
			headers.forEach((header, idx) => {
				obj[header] = values[idx] || '';
			});
			return obj;
		});
		
		// 데이터 구성
		app.lookup("dsLMSList").build(jsonArr);
		
		// 선택한 파일의 경로
		app.lookup("fileReadPath").value = msg["return"]["selectedFilePath"].split("\\").slice(0,-1).join("\\");
		
		// 시작 시간
		app.lookup("udcGrdPrfCnt").startRanderTime =  moment(new Date(Math.floor(msg["return"]["startTime"]))).format("YYYY-MM-DD HH:mm:ss.SSS");
		vnStartTime = Math.floor(msg["return"]["startTime"]);
		
		app.lookup("udcGrdPrfCnt").redraw();
	});
}

/************************************************
 * 컨트롤 이벤트
 ************************************************/


/*
 * "파일 오픈" 버튼(btnFileOpen)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnFileOpenClick(e){
	var btnFileOpen = e.control;
	// 데이터 초기화
	app.lookup("udcGrdPrfCnt").resetRander();
	app.lookup("dsLMSList").clearData();
	app.lookup("totalCnt").value = 0;
	fileReadDialog();
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	cpr.core.ResourceLoader.loadScript("thirdparty/exdevice/jquery/external/jquery/jquery.js").then(function(input){
		var resourceLoader = new cpr.core.ResourceLoader();
		resourceLoader.addCSS("thirdparty/exdevice/jquery/jquery-ui.min.css");
		resourceLoader.addScript("thirdparty/exdevice/jquery/jquery-ui.min.js");
		resourceLoader.addScript("thirdparty/exdevice/exdevice-client.js");
		resourceLoader.addScript("thirdparty/exdevice/exdevice-common.js");
		resourceLoader.load().then(function(input){
			conn = new exdevice.Connector();
			doOnload();
		});
	});
}

/*
 * 데이터셋에서 load 이벤트 발생 시 호출.
 * build 메소드에 의해 데이터 구조가 재구성될 때 발생하는 이벤트. 초기 생성시에도 발생합니다.
 */
function onDsLMSListLoad(e){
	var dsLMSList = e.control;
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		// 종료 시간
		app.lookup("udcGrdPrfCnt").endRanderTime =  moment().format("YYYY-MM-DD HH:mm:ss.SSS");
		
		// 소요 시간
		app.lookup("udcGrdPrfCnt").totalRanderTime = Math.floor(moment().valueOf()) - vnStartTime;
		app.lookup("udcGrdPrfCnt").redraw();
		
		// 총 건수
		app.lookup("totalCnt").value = app.lookup("dsLMSList").getRowCount();
		
		// 로드 마스크 숨김
		util.hideLoadMask(app.getRootAppInstance());
	});
}

/* ==== [app/sce/A4/A4-6.clx] 4.6 파일 제어 기능 ==== */
/************************************************
 ** 공통모듈
 ************************************************/

/************************************************
 ** 글로벌 변수, 전역변수
 ************************************************/

/************************************************
 ** 사용자 정의 함수
 ************************************************/

/************************************************
 ** 컨트롤 이벤트
 ************************************************/
/*
 * "엑셀 업로드" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click_3(e){
	app.lookup("fit1").openFileChooser();
}

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFit1ValueChange(e){
	var fit1 = e.control;
	
	util.Submit.addImportGridFileParameter(app, "subImport", "grdImport", fit1.file, {
		headerLine: app.lookup("grdImport").header.getRowHeights().length
	});
	
	util.Submit.send(app, "subImport", function(pbSuccess){
		if(pbSuccess){ }
	});
}

/*
 * 파일 업로드에서 sendbutton-click 이벤트 발생 시 호출.
 * 파일을 전송하는 button을 클릭 시 발생하는 이벤트. 서브미션을 통해 전송 버튼에 대한 구현이 필요합니다.
 */
function onFid1SendbuttonClick(e){
	var fid1 = e.control;
	
	if(fid1.getSelection().length == 0) {
		util.Msg.alertDlg(app, "업로드 할 파일을 선택해주세요");
		return;
	}
	
	var vaUplaodFiles = fid1.getSelection();
	var submit = app.lookup("subUpload");
	var voFile;
	for (var i = 0, len = vaUplaodFiles.length; i < len; i++) {
		voFile = vaUplaodFiles[i];
		submit.addFileParameter(voFile.name, voFile);
	}
	
	util.Submit.send(app, submit.id, function(pbSuccess) {
		if (pbSuccess) {
			util.Msg.alertDlg(app, "업로드가 정상적으로 완료되었습니다.\n업로드 경로 : " + util.DataMap.getValue(app, "dmUpload", "uploadPath"));
		}
	});
}

/*
 * "다운로드" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var fid = app.lookup("fid1");
	var vaSelection = fid.getSelection();
	
	var filePath = util.DataMap.getValue(app, "dmUpload", "uploadPath");
	if(ValueUtil.isNull(filePath)) {
		util.Msg.alertDlg(app, "업로드가 완료 된 후 다운로드를 할 수 있습니다.");
		return;
	}
	if(vaSelection.length == 0) {
		util.Msg.alertDlg(app, "다운로드 할 파일을 선택해주세요");
		return;
	}
	
	var count = vaSelection.length;
	var curIdx = 0;
	function downloadEachFile(psFileName) {
		util.DataMap.setValue(app, "dmParamDown", "filePath", "cmn/"+psFileName);
		util.DataMap.setValue(app, "dmParamDown", "fileNm", psFileName);
		util.DataMap.setValue(app, "dmParamDown", "resType", app.lookup("subDownload").responseType);
		util.Submit.send(app, "subDownload", function(pbSuccess) {
			if (pbSuccess) {
				if(curIdx < count-1) {
					downloadEachFile(vaSelection[++curIdx].name);
				}
			}
		});
	}
	
	downloadEachFile(vaSelection[curIdx].name);
}

/*
 * "전체다운로드" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var filePath = util.DataMap.getValue(app, "dmUpload", "uploadPath");
	if(ValueUtil.isNull(filePath)) {
		util.Msg.alertDlg(app, "업로드가 완료 된 후 다운로드를 할 수 있습니다.");
		return;
	}
	
	var fid = app.lookup("fid1");
	if(fid.getFiles().length == 0) {
		util.Msg.alertDlg(app, "다운로드 할 파일이 없습니다.");
		return;
	}
	
	var vaFiles = fid.getFiles().map(function(each){
		return each.name;
	});
	util.DataMap.setValue(app, "dmParamDown", "fileNm", vaFiles.join(","));
	util.Submit.send(app, "subDownloadAll", function(pbSuccess) {
		if (pbSuccess) {}
	});
}
