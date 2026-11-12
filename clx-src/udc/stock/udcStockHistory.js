/************************************************
 * udcStockHistory.js
 * Created at 2025. 5. 13. 오후 2:11:13.
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
 * 거래현황 조회 함수
 */
function getAcntList() {
	util.Submit.send(app, "subAcntList", function(pbSuccess, sub) {
		var responseText = sub.xhr.responseText;
		var voData = JSON.parse(responseText);
		var nextkey = voData["LAST_NEXT_KEY"];
		if (nextkey) {
			util.DataMap.setValue(app, "dmAcntIn", "NEXT_KEY", nextkey);
			getAcntList();
		}
	});
}

/*
 * 콤보 박스에서 item-click 이벤트 발생 시 호출.
 * 아이템 클릭시 발생하는 이벤트.
 */
function onCmb1ItemClick(e){
	var cmb1 = e.control;
	var item = e.item;
	var vsItemValue = item.value;
	if(vsItemValue == "direct") {
		util.Control.setVisible(app, true, "grpDtiFromTo");
	} else {
		util.Control.setVisible(app, false, "grpDtiFromTo");
		var vnSubtractValue = Number(vsItemValue);
		util.Control.setValue(app, "dtiTo", moment().format("YYYYMMDD"));
		util.Control.setValue(app, "dtiFrom", moment().subtract(vnSubtractValue, "day").format("YYYYMMDD"));
		getAcntList();
	}
}

/*
 * 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	getAcntList();
}
