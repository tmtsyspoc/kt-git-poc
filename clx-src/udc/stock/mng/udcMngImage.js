/************************************************
 * udcMngImage.js
 * Created at 2025. 4. 17. 오후 3:19:03.
 *
 * @author HWPS
 ************************************************/
var msImgUrl = "0";
/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};
exports.getData = function(){
//	if(app.lookup("fi1").file) {
//		
//		return {
//			value : app.lookup("fi1").file,
//			type:"image"
//		}
//	} else if(app.lookup("img1").src != ""){
	var voFile = app.lookup("fi1").file
		return {
			value : voFile ? voFile.name : msImgUrl,
			type:"image"
		}
//	}
}

exports.setData = function(poData){
	app.lookup("img1").src = getStaticUrl()+poData['value'];
	msImgUrl = poData["value"];
}
/*
 * 이미지에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onImageClick(e){
	var image = e.control;
	
	app.lookup("fi1").openFileChooser();
}

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFi1ValueChange(e){
	var fi1 = e.control;
	
	var file = fi1.file;
	var fileReader = new FileReader();
	
	fileReader.onload = function(res) {
		var text = res.target.result;
		app.lookup("img1").src = text;
		app.lookup("img1").redraw();
	};
	fileReader.readAsDataURL(file);
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var button = e.control;
	var evt = new cpr.events.CAppEvent("mng-delete");
	app.dispatchEvent(evt);
}
