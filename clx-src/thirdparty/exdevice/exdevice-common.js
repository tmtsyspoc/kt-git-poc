/**
 * eXDevicePlus Connector Sample
 */
var msgCode = {
	"0000": "호출성공",

	"1000": "정의되지 않은 eXDevice Agent 오류가 발생했습니다.",
	"1001": "브라우저에서 전송한 Message가 JSON 포맷이 아닙니다.",
	"1002": "브라우저에서 전송한 Message가 eXDevice+ 프로토콜에 맞지 않습니다.",
	"1003": "브라우저에서 전송한 Message에서 service 또는 requestKey의 값이 누락되었습니다.",
	"1004": "modules.json에 기재된 서비스가 존재하지 않습니다. modules.json 파일을 확인해주세요.",
	"1005": "modules.json에 기재되지 않은 서비스를 요청했습니다. 제공하는 서비스를 확인해주세요.",
	"1006": "modules.json에 기재된 파라미터 정보와 브라우저에서 전송한 파라미터 정보가 맞지 않음",
	"1007": "브라우저에서 전송한 Message의 파라미터를 서비스를 호출하기 위한 타입으로 변환할 수 없습니다.",
	"1008": "브라우저에서 전송한 Message에서 serviceId가 누락되었습니다.",

	"2000": "정의되지 않은 Service Manager 오류가 발생했습니다.",
	"2001": "modules.json의 LibType에 데이터가 기재되어 있지 않습니다.",
	"2002": "modules.json의 LibType에 eXDevice+가 지원하지 않는 타입이 기재되어 있습니다.",
	"2003": "modules.json의 LibFile의 데이터가 기재되어 있지 않습니다.",
	"2004": "modules.json의 Delegator의 데이터가 기재되어 있지 않습니다.",
	"2005": "modules.json의 Delegator에 지원하지 않는 대리자가 기재되어 있습니다.",
	"2006": "modules.json의 DestDir의 데이터가 기재되어 있지 않습니다.",
	"2007": "modules.json의 CLSID의 데이터가 기재되어 있지 않습니다.",
	"2008": "modules.json의 Param에 명시된 타입이 지원하지 않는 타입입니다.",
	"2009": "modules.json의 Return에 명시된 타입이 지원하지 않는 타입입니다.",
	"2010": "modules.json의 ReturnObject에 명시된 타입이 지원하지 않는 타입입니다.",
	"2011": "서비스를 호출하기위한 Delegator 생성에 실패했습니다.",
	"2012": "ActiveX를 호출하기위한 SubForm 생성에 실패했습니다.",
	"2013": "serviceId를 지원하지 않는 서비스를 호출하였습니다.",
	"2014": "modules.json의 FileType에 명시된 타입이 지원하지 않는 타입입니다.",
	"2015": "modules.json의 Struct에 지원하지 않는 타입이 기재되었습니다.",

	"3000": "정의되지 않은 Service 오류가 발생했습니다.",
	"3001": "Dll 파일이 로컬에 존재하지 않습니다.",
	"3002": "ActiveX가 레지스트리에 등록되어 있지 않습니다.",
	"3003": "Dll 파일 타입을 식별할 수 없습니다.",
	"3004": "Dll 파일을 메모리에 로드할 수 없습니다.",
	"3005": "지원하지 않는 타입의 Dll 파일입니다.",
	"3006": "Dll에 export된 class가 존재하지 않습니다.",
	"3007": "Dll의 export된 class 중 대상 class를 찾을 수 없습니다.",
	"3008": "대상 class에서 export된 method가 존재하지 않습니다.",
	"3009": "대상 class에서 export된 mehotd 중 대상 method를 찾을 수 없습니다.",
	"3010": "ref 타입의 파라미터 타입을 변환할 수 없습니다.",
	"3011": "런타임 메서드를 생성할 수 없습니다.",
	"3012": "ActiveX 컨트롤 생성에 실패했습니다.",
	"3013": "생성 되지 않은 ActiveX 컨트롤을 Invoke 할 수 없습니다.",
	"3014": "out/ref 파라미터로 반환되는 데이터 획득에 실패했습니다.",
	"3015": "서비스 호출 결과 데이터의 타입 변환에 실패했습니다.",
	"3016": "FuncDesc에 명시된 returnObject의 keyd와 invoke 결과 데이터의 key가 일치하지 않습니다.",
	"3017": "서비스 구동 중 서비스를 요청한 WebSocket Client 연결이 해제되었습니다.",
	"3018": "서비스를 요청한 WebSocket Client의 서비스 리스트 획득에 실패했습니다.",
	"3019": "서비스를 요청한 WebSocket Client의 서비스 리스트 추가에 실패했습니다.",
	"3020": "서비스를 요청한 WebSocket Client의 서비스 리스트에서 관리되지 않는 서비스를 요청하였습니다.",
	"3021": "서비스를 요청한 WebSocket Client의 서비스 리스트에서 서비스 획득에 실패했습니다.",
	"3022": "서비스를 요청한 WebSocket Client의 서비스 리스트에 서비스 추가에 실패했습니다.",
	"3023": "서비스를 요청한 WebSocket Client의 서비스 리스트에서 서비스 제거에 실패했습니다.",
	"3024": "서비스를 요청한 WebSocket Client의 서비스 리스트 제거에 실패했습니다.",

	"4000": "Third party dll, activex 오류"
};

function getMsg(stsCd) {
	return msgCode[stsCd] + "(" + stsCd + ")";
}

function randomStr() {
	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function createFileName() {
	return randomStr() + randomStr();
}

function openMsg(nodeId) {
	$( nodeId ).dialog({
		dialogClass: "no-close",
		modal: true,
		closeOnEscape: false
	});
}

function closeMsg(nodeId) {
	$( nodeId ).dialog("close");
}

