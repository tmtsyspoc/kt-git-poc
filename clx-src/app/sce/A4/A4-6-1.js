/************************************************
 * A4-6-1.js
 * Created at 2025. 8. 11. 오전 9:52:09.
 *
 * @author dyseo
 ************************************************/

/************************************************
 ** 공통모듈
 ************************************************/
var util = createCommonUtil();

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
/**
 * 로컬 파일 읽기 
 */
function readFile() {
    var serviceIdentifier = "[파일 Read 서비스] ";
	
	var ipbFileReadPath = app.lookup("fileReadPath");
    if(ipbFileReadPath.value == ""){
        util.Msg.alertDlg(app, serviceIdentifier + "파일 경로를 입력하세요.");
        return;
    }

    var serviceName = "WinInfo.ReadFile";
    var param = {
        filePath: ipbFileReadPath.value
    }

    conn.send(serviceName, param, function(msg){
        if(!checkStatusCode(serviceIdentifier, serviceName, msg["statusCode"])){
        	util.Msg.notify(app, "에러가 발생했습니다.");
            return;
		}

        var returnCode = msg["return"]["returnValue"];
		if(!checkReturnCode(serviceIdentifier, serviceName, returnCode)){
			util.Msg.notify(app, "파일을 읽는 데 실패하였습니다.");
            return;
		}
		
		util.Msg.notify(app, "파일을 정상적으로 읽는 데 성공하였습니다.");
        app.lookup("udcexamace2").value = msg["return"]["data"];
    });
}

/**
 * 로컬 파일 오픈
 */
function openFile() {
    var serviceIdentifier = "[파일 Open 서비스] ";
	
	var ipbFileOpenPath = app.lookup("fileOpenPath");
    if(ipbFileOpenPath.value == ""){
        util.Msg.alertDlg(app, serviceIdentifier + "파일 경로를 입력하세요");
        return;
    }

    var serviceName = "WinInfo.OpenFile";
    var param = {
        filePath: ipbFileOpenPath.value,
        args: ""
    };

    conn.send(serviceName, param, function(msg){
        if(!checkStatusCode(serviceIdentifier, serviceName, msg["statusCode"])){
        	util.Msg.notify(app, "에러가 발생했습니다.");
            return;
		}

        var returnCode = msg["return"];
		if(!checkReturnCode(serviceIdentifier, serviceName, returnCode)){
			util.Msg.notify(app, "파일을 오픈하는 데 실패하였습니다.");
            return;
		}
		
		util.Msg.notify(app, "파일을 정상적으로 오픈하였습니다.");
    });
}

/**
 * 로컬 디렉토리 오픈
 */
function openDir(){
    var serviceIdentifier = "[디렉토리 Open 서비스] ";
	
	var ipbDirOpenPath = app.lookup("dirOpenPath");
    if(ipbDirOpenPath.value == ""){
        util.Msg.alertDlg(app, serviceIdentifier + "디렉토리 경로를 입력하세요.");
        return;
    }

    var serviceName = "WinInfo.OpenDirectory";
    var param = {
        dirPath: ipbDirOpenPath.value
    };

    conn.send(serviceName, param, function(msg){
        if(!checkStatusCode(serviceIdentifier, serviceName, msg["statusCode"])){
        	util.Msg.notify(app, "에러가 발생했습니다.");
            return;
		}

        var returnCode = msg["return"];
		if(!checkReturnCode(serviceIdentifier, serviceName, returnCode)){
			util.Msg.notify(app, "폴더를 오픈하는 데 실패하였습니다.");
            return;
		}
		
		util.Msg.notify(app, "폴더를 정상적으로 오픈하였습니다.");
    });
}

/**
 * 파일생성
 */
function writeFile() {
    var serviceIdentifier = "[파일 Write 서비스] ";
	
	var ipbFileWritePath = app.lookup("fileWritePath");
    if(ipbFileWritePath.value == ""){
        util.Msg.alertDlg(app, serviceIdentifier + "파일 경로를 입력하세요.");
        return;
    }
    
    var ipbFileWriteData = app.lookup("udcexamace1");
    if(ipbFileWriteData.value == ""){
        util.Msg.alertDlg(app, serviceIdentifier + "파일에 작성할 데이터를 입력하세요.");
        return;
    }

    var serviceName = "WinInfo.WriteFile";
    var param = {
        filePath: ipbFileWritePath.value,
        fileWriteMode: app.lookup("rdb1").value,
        data: ipbFileWriteData.value
    };

    conn.send(serviceName, param, function(msg){
        if(!checkStatusCode(serviceIdentifier, serviceName, msg["statusCode"])){
        	util.Msg.notify(app, "에러가 발생했습니다.");
            return;
		}

        var returnCode = msg["return"];
		if(!checkReturnCode(serviceIdentifier, serviceName, returnCode)){
			util.Msg.notify(app, "파일을 생성하는 데 실패하였습니다.");
            return;
		}
		
		util.Msg.notify(app, "파일을 정상적으로 생성하였습니다.");
    });
}

/**
 * 파일 복사
 */
function copyFile() {
    var serviceIdentifier ="[파일 Copy 서비스] ";
    
    var ipbSourcePath = app.lookup("ipbSrcPath");
    var ipbTargetPath = app.lookup("ipbTargetPath");
    
    if(ipbSourcePath.value == ""){
        util.Msg.alertDlg(app, serviceIdentifier + "복사할 원본 파일 경로를 입력하세요.");
        return;
    }
    if(ipbTargetPath.value == ""){
        util.Msg.alertDlg(app, serviceIdentifier + "원본 파일이 복사될 경로를 입력하세요.");
        return;
    }

    var vcRdbCopyType = app.lookup("rdbCopy").value;
    var serviceName = "WinInfo.CopyFile";
    var param = {
        srcFilePath: ipbSourcePath.value,
        destFilePath: ipbTargetPath.value,
        fileCopyMode: vcRdbCopyType
    };

    conn.send(serviceName, param, function(msg){
        if(!checkStatusCode(serviceIdentifier, serviceName, msg["statusCode"])){
        	util.Msg.notify(app, "에러가 발생했습니다.");
            return;
		}

        var returnCode = msg["return"];
		if(!checkReturnCode(serviceIdentifier, serviceName, returnCode)){
			util.Msg.notify(app, "파일 복사에 실패하였습니다.");
            return;
		}
		
		util.Msg.notify(app, "성공적으로 파일이 복사되었습니다.");
    });
}

/**
 * 파일 삭제
 */
function deleteFile(){
    var serviceIdentifier = "[파일 Delete 서비스] ";
	
	var ipbFileDeletePath = app.lookup("fileDeletePath");
    if(ipbFileDeletePath.value == ""){
        util.Msg.alertDlg(app, serviceIdentifier + "파일 경로를 입력하세요.");
        return;
    }

    var serviceName = "WinInfo.DeleteFile";
    var param = {
        filePath: ipbFileDeletePath.value
    };

    conn.send(serviceName, param, function(msg){
        if(!checkStatusCode(serviceIdentifier, serviceName, msg["statusCode"])){
        	util.Msg.notify(app, "에러가 발생했습니다.");
            return;
		}

        var returnCode = msg["return"];
		if(!checkReturnCode(serviceIdentifier, serviceName, returnCode)){
			util.Msg.notify(app, "파일 삭제를 실패하였습니다.");
            return;
		}

		util.Msg.notify(app, "성공적으로 파일을 삭제하였습니다.");
    });
}


/************************************************
 ** 컨트롤 이벤트
 ************************************************/
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
 * "파일 읽기" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	readFile();	
}

/*
 * "파일 오픈" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	openFile();	
}

/*
 * "디렉토리 오픈" 버튼(btn4)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn4Click(e){
	openDir();
}

/*
 * "파일 생성" 버튼(btn5)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn5Click(e){
	writeFile();
}

/*
 * "파일 삭제" 버튼(btn6)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn6Click(e){
	deleteFile();	
}

/*
 * "파일 복사" 버튼(btnFileCopy)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnFileCopyClick(e){
	copyFile();
}
