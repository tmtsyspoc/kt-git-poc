/************************************************
 * udcCmbEmpNo.js
 * Created at 2026. 5. 18. 오후 7:14:46.
 *
 * @author dyseo
 ************************************************/

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

var util = createCommonUtil();

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e) {
	util.Dialog.open(app, "app/com/comEmpPop", 500, -1, function(evt){
		/** @type cpr.controls.Dialog */
		var dialog = evt.control;
		var voReturnValue = dialog.returnValue;
		
		if(!ValueUtil.isNull(voReturnValue)) {
			console.log(voReturnValue);
			app.lookup("optEmpNm").value = voReturnValue["EMP_NO"];
			app.lookup("ipbEmp").value = voReturnValue["EMP_NM"];
		}
	}, {
		empNo : app.lookup("ipbEmp").value
	}, {
		
	});	
}
