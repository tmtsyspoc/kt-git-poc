/************************************************
 * udcCmnAddress.js
 * Created at 2026. 5. 18. 오후 7:52:35.
 *
 * @author dyseo
 ************************************************/

var util = createCommonUtil();

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e) {
	var vcContainer = app.getContainer();
	var voLayout = vcContainer.getLayout();
	
	if(e.property == "visibleAddress1") {
		voLayout.setColumnVisible(2, e.newValue);	
	}
	if(e.property == "visibleAddress2") {
		voLayout.setColumnVisible(3, e.newValue);	
	}
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e) {
	util.Dialog.open(app, "app/com/comAddressPop", 1000, -1, function(evt){
		/** @type cpr.controls.Dialog */
		var dialog = evt.control;
		var voReturnValue = dialog.returnValue;
		
		if(!ValueUtil.isNull(voReturnValue)) {
			app.lookup("schAddr").value = voReturnValue["ROAD_ADDR"];
		}
	}, {
		addr : app.lookup("schAddr").value
	}, {
		
	});	
}
