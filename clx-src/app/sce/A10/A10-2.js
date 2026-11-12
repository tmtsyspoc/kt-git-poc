/************************************************
 * A10-2.js
 * Created at 2025. 2. 14. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/

/************************************************
 * 전역변수
 ************************************************/
var util = createCommonUtil();

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
function onBtn1Click(e){
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
