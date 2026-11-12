/************************************************
 * udcCmnTelNo.js
 * Created at 2026. 5. 18. 오후 6:50:10.
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

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	var cmb = app.lookup("cmbFirst");
	var vsFirstNoList = app.getAppProperty("firstNumList");
	vsFirstNoList.split(",").forEach(function(each){
		cmb.addItem(new cpr.controls.Item(each.trim(), each.trim()));
	});
}

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e) {
}
