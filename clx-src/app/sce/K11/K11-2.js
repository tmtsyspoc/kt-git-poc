/************************************************
 * K11-2.js
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

/* ==== [app/sce/A10/A10-11.clx] 10.2 리소스 암호화 ==== */
var mbCrashBrowserTab = false;


/**
 * 개발자도구가 열려있을 경우, 일정 Delay Time 이후 활성 브라우저 동작을 제어합니다.
 * - reload : 현재 브라우저 새로고침
 * - crash : 활성 브라우저 작동 중단
 */
	
 function handleDevToolsOpen() {
 	if (mbCrashBrowserTab && devtoolsDetector.default.isOpen) {
 		var vnDelayTime = 10;
 		
 		var vsRdbCrash = app.lookup("rdbCrash").value;
 		setTimeout(function () {
 			switch(vsRdbCrash){
 				case "reload" :
 					location.reload();
 					break;
 				case "crash" :
 					devtoolsDetector.crashBrowserCurrentTab();
 					break;
 			}
 		}, vnDelayTime);
 	}
 }

/*
 * "시작" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	/*
	 * 문서 확인
	 * https://www.npmjs.com/package/devtools-detector
	 */
	cpr.core.ResourceLoader.loadScript("thirdparty/devtools-detector/devtools-detector.js").then(function(input) {
		// 감지 interval 지정(ms)
		devtoolsDetector.setDetectDelay(300);
		
		// 감지 리스너 등록
		devtoolsDetector.addListener(function(isOpen, i) {
			handleDevToolsOpen();
		});
		
		// 디텍터 실행중인 경우, stop 후 다시 실행
		if (devtoolsDetector.isLaunch()) {
			devtoolsDetector.stop();
		}
		devtoolsDetector.launch();
		// 디텍터 실행
		//멈추고싶은 경우는 devtoolsDetector.stop();
		app.lookup("rdbCrash").enabled = true;
	});
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbCrashSelectionChange(e){
	var rdbCrash = e.control;
	
	mbCrashBrowserTab = true;
	handleDevToolsOpen();
}

/*
 * "종료" 버튼(btnStart2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnStart2Click(e){
	var btnStart2 = e.control;
	// 디텍터 정지
	devtoolsDetector.stop();
	app.lookup("rdbCrash").enabled = false;
	app.lookup("rdbCrash").value = "";
}

/* ==== [app/sce/A10/A10-2.clx] 10.3 데이터 암호화 ==== */
/************************************************
 * 전역변수
 ************************************************/

/************************************************
 * 사용자정의함수
 ************************************************/
exports.setMask = function(psType, sourceData, pbMask) {
	
	if(pbMask){
		return ValueUtil.maskType(psType, sourceData);
	} else {		
		return sourceData.substring(0, 6) + "-" + sourceData.substring(6, sourceData.length);
	}	
}

/**
 * 데이터 암호화
 * @param {String} psPlaintext
 */
function encrypt(psPlaintext) {
	// 사용자의 비밀번호
	var passphrase = "exb6Frame";
	
	// salt 및 초기화 벡터(IV)(서버에서 전달받아야 하는 데이터로 임시구성)
	var saltHex = "0c68efe9e3c3a02b3f9f69a08987e4ab";
	var ivHex = "18b8e16db963ae9bfe9fccbe37d452e0";
	var iterations = 10000;
	var keySize = 128; // 키 크기는 128비트 (16바이트)
	
	var saltWordArray = CryptoJS.enc.Hex.parse(saltHex);
	var ivWordArray = CryptoJS.enc.Hex.parse(ivHex);
	
	var key = CryptoJS.PBKDF2(passphrase, saltWordArray, {
		keySize: keySize / 32, // Key size in words
		iterations: iterations
	});
	
	var encrypted = CryptoJS.AES.encrypt(psPlaintext, key, {
		iv: ivWordArray,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7
	});
	
	return encrypted.toString();
}

/**
 * 데이터 복호화
 * @param {String} psPlaintext
 */
function decrypt(psPlaintext) {
	
	// 사용자의 비밀번호
	var passphrase = "exb6Frame";
	
	// salt 및 초기화 벡터(IV)(서버에서 전달받아야 하는 데이터로 임시구성)
	var saltHex = "0c68efe9e3c3a02b3f9f69a08987e4ab";
	var ivHex = "18b8e16db963ae9bfe9fccbe37d452e0";
	var iterations = 10000;
	var keySize = 128; // 키 크기는 128비트 (16바이트)
	
	var saltWordArray = CryptoJS.enc.Hex.parse(saltHex);
	var ivWordArray = CryptoJS.enc.Hex.parse(ivHex);
	
	var key = CryptoJS.PBKDF2(passphrase, saltWordArray, {
		keySize: keySize / 32, // Key size in words
		iterations: iterations
	});
	
	var decrypted = CryptoJS.AES.decrypt(psPlaintext, key, {
		iv: ivWordArray,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7
	});
	
	return decrypted.toString(CryptoJS.enc.Utf8);
}

function requestEncoder(submission, poReqData) {
	var voReqData = poReqData["data"];
	Object.keys(voReqData).forEach(function(pcReqCtrlId){
		var voData = voReqData[pcReqCtrlId];
		if(voData instanceof Array){
			//데이터셋인 경우
			/** @type Array */
			var vaData = voData;
			vaData.forEach(function(poData){
				Object.keys(poData).forEach(function(each){
					if(each != "sts"){
						var vsColumnData = poData[each];
						poData[each] = encrypt(vsColumnData);
					}
				});
			});
		}else{
			//데이터맵인 경우
			Object.keys(voData).forEach(function(each){
				var vsColumnData = voData[each];
				voData[each] = encrypt(vsColumnData);
			});
		}
	});
	return {content : {"data" : voReqData}};
}

function responseDecoder(/* cpr.protocols.Submission */submission, poResData) {
	var voResData = JSON.parse(poResData);
	Object.keys(voResData).forEach(function(pcResCtrlId){
		var voData = voResData[pcResCtrlId];
		if(voData instanceof Array){
			//데이터셋인 경우
			/** @type Array */
			var vaData = voData;
			vaData.forEach(function(poData){
				Object.keys(poData).forEach(function(each){
					var vsColumnData = poData[each];					
					var decryptedData = decrypt(vsColumnData);
					
					if(!ValueUtil.isNull(decryptedData)){
						poData[each] = decryptedData;
					}
				});
			});
		}else{
			//데이터맵인 경우
			Object.keys(voData).forEach(function(each){
				var vsColumnData = voData[each];
				var decryptedData = decrypt(vsColumnData);					
				if(!ValueUtil.isNull(decryptedData)){
					voData[each] = decryptedData;
				}
			});
		}
	});
	
	console.log("서버단에서 암호화한 dsList의 데이터를 클라이언트단에서 복호화한 데이터");
	console.log(voResData);
	var voProtocolJson = {};
	voProtocolJson["_METADATA_"] = {success: true};
	for(var i = 0; i < submission.getResponseDataCount(); i++){
		var voResponseData = submission.getResponseData(i);
		var vsResDataCtrlId = voResponseData.data.id;
		voProtocolJson[vsResDataCtrlId] = voResData[vsResDataCtrlId];
	}
	
	return {contentType: "application/json", content: voProtocolJson};
}

function doSearch(){
	console.log("클라이언트단에서 암호화 전 요청데이터");
	console.log(app.lookup("dmParam").getDatas());
	util.Submit.send(app, "subList", function(pbSucecss){
		if(pbSucecss){
			
		}
	});
}
/************************************************
 * 컨트롤 이벤트
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){	
	//서버로 전송하는 데이터 payload를 가공
	//가공하는 payload의 값을 CryptoJS 외부 라이브러리를 사용 하여 암호화 진행
 	var vcSubList = app.lookup("subList");
	vcSubList.setRequestEncoder(requestEncoder);
	vcSubList.setResponseDecoder(responseDecoder);
	
	app.lookup("mseNm").addCustomPattern("k", /[가-힣]/);
	
	app.lookup("grpForm").getAllRecursiveChildren(false).filter(function(each){
		return each instanceof cpr.controls.MaskEditor;
	}).forEach(function(each){
		each.userAttr("mask", each.mask);
	});
}

/*
 * "조회" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click_2(e){
	doSearch();
}

/*
 * "초기화" 버튼(btnRst)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnRstClick(e){
	util.Group.clear(app, "grpSearch");
	util.Grid.reset(app, "grdList");
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCheckBoxValueChange(e) {
	var checkBox = e.control;
	app.lookup("grpForm").getAllRecursiveChildren(false).filter(function(each) {
		return each instanceof cpr.controls.MaskEditor;
	}).forEach(function(each) {
		if(checkBox.checked) {
			each.mask = each.userAttr("mask");
		} else {
			if(each.id == "mseNm") {
				each.mask = "kkk";
			} else {
				function _getMask (mask) {
					var result = "";
					var data = mask.mask.split("");
					console.log(data);
					for(var idx = 0; idx < data.length; idx++){
						if(data[idx] == "-") result += "-";
						else result += "X";
					}
					return result;
				}
				var mask = "";
				if(each.id == "mseEmail") mask = "XXXXXX@XXXXXXXXXXXX.XX.XX";
				else mask = _getMask(each);
				
				each.mask = mask;
			}
		}
	});
}

/* ==== [app/sce/A10/A10-6.clx] 우클릭 방지 ==== */
/************************************************
 * 전역변수
 ************************************************/

/**
 * 공통함수 유틸
 */

function contextMenuFilter(e){
	e.preventDefault();
	util.Msg.alertDlg(app, "우클릭 이벤트가 금지되었습니다.");	
}
cpr.events.EventBus.INSTANCE.addFilter("contextmenu", contextMenuFilter);

/*
 * 루트 컨테이너에서 before-unload 이벤트 발생 시 호출.
 * 앱이 언로드되기 전에 발생하는 이벤트 입니다. 취소할 수 있습니다.
 */
function onBodyBeforeUnload(e){
	cpr.events.EventBus.INSTANCE.removeFilter("contextmenu", contextMenuFilter);
}
