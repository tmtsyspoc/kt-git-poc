/************************************************
 * udcStockMyStock.js
 * Created at 2025. 5. 13. 오후 2:28:51.
 *
 * @author HAN
 ************************************************/
var util = createCommonUtil();
/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};
/**
 * 보유중인 주식 조회 함수 
 */
function getStockList() {
	util.Submit.send(app, "subMyStock", function(pbSuccess, sub) {
		var responseText = sub.xhr.responseText;
		var voData = JSON.parse(responseText);
		var nextkey = voData["LAST_NEXT_KEY"];
		if (nextkey) {
			util.DataMap.setValue(app, "dmMyStockIn", "NEXT_KEY", nextkey);
			getStockList();
		}
	});
}
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	util.DataMap.setValue(app, "dmMyStockIn", "IACN", "50029021011");
	getStockList();
}
