/************************************************
 * udcPocGridCell.js
 * Created at 2024. 11. 8. 오전 9:41:20.
 *
 * @author daye
 ************************************************/

var util = createCommonUtil();

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	var cellText = app.getAppProperty("cellText");
	if(!ValueUtil.isNull(cellText)) {
		// cellText 가 있을 경우 cellValue 로 저장하고 리턴
		app.setAppProperty("cellValue", cellText);
		return cellText;
	} else  {
		// 컨트롤 타입 별 cellValue 리턴
		// mask 존재 시, mask 에 따른 displayText 리턴
		var ctrlType = app.getAppProperty("ctrlType");
		if(ctrlType == "5") {
			return app.lookup("cmb1").text;		
		} else {
			var mask = app.getAppProperty("mask");
			var cellValue = app.getAppProperty("cellValue");
			if(mask.indexOf(",") > -1) {
				return cellValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			} else {
				return cellValue;
			}
		}
	}
};

exports.changeControl = function (pcCtrl){ 
	var ctrlType = app.getAppProperty("ctrlType");
	var propValue = "none";
	
	if(ctrlType == "1" || ctrlType == "2" || ctrlType == "3") {
		propValue = "none"
	} else if(ctrlType == "4" || ctrlType == "6") {
		propValue = "masknumber";
	} else if(ctrlType == "5") {
		propValue = "combo";
	}
	
	switch(propValue){
		case "none" :
			if(pcCtrl instanceof cpr.controls.Output) return true;
			else return false;
			break;
		case "combo" :
			if(pcCtrl instanceof cpr.controls.ComboBox) return true;
			else return false;
			break;
		case "masknumber" :
			if(pcCtrl instanceof cpr.controls.NumberEditor) return true;
			else return false;
			break;
		default :
			return false;
			break;
	}
}

/*
 * 넘버 에디터에서 value-change 이벤트 발생 시 호출.
 * NumberEditor의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onNbe1ValueChange(e){
	var nbe1 = e.control;
	
	var event = new cpr.events.CUIEvent("amtValueChange");
	app.dispatchEvent(event);
}
