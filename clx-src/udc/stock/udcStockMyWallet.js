/************************************************
 * udcStockM.js
 * Created at 2025. 5. 13. 오후 2:32:42.
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
 * 체결잔고 상품별 조회 함수
 */
function getPrdtList(){
	
	util.Submit.send(app, "subPrdtList", function(pbSuccess, sub) {
		var responseText = sub.xhr.responseText;
		var voData = JSON.parse(responseText);
		var nextkey = voData["LAST_NEXT_KEY"];
		if (nextkey) {
			util.DataMap.setValue(app, "dmPrdtIn", "NEXT_KEY", nextkey);
			getPrdtList();
		} else {
			var vcDsPrdt = app.lookup("dsPrdtList");
			var vnSum = app.lookup("dsPrdtList").getSum("EVL_AMT").toNumber();
			util.Control.setValue(app, "optTotalAsset", vnSum);
			app.lookup("udccmnchart1").drawChart();
		}
	});
	
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	
	app.lookup("dsPrdtList").clear();
	getPrdtList();
	
}
