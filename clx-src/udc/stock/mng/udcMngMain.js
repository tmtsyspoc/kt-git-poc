/************************************************
 * udcMngMain.js
 * Created at 2025. 4. 7. 오후 4:47:06.
 *
 * @author HWPS
 ************************************************/
var msFileName = null;
var util = createCommonUtil();
/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

exports.getData = function(){
	var voData = app.lookup("dmResult").getDatas();
	
	return {
		value : voData,
		file : app.lookup("fi1").file,
		type:"main"
	}
}

exports.setData = function(poData){
	var vcDmResult =  app.lookup("dmResult");
	vcDmResult.build(poData);
	if(vcDmResult.getValue("fname") != "") {
		app.lookup("btnImg").value = "이미지 변경";
	}
	var vsUrl = vcDmResult.getValue("dir")+vcDmResult.getValue("fname");
	app.lookup("img1").src =vsUrl;
	app.getContainer().redraw();
}

/*
 * 텍스트 에리어에서 value-change 이벤트 발생 시 호출.
 * 변경된 value가 저장된 후에 발생하는 이벤트.
 */
function onTxa1ValueChange(e){
	var txa1 = e.control;
//	app.getContainer().updateConstraint(txa1, {
//		height: "300px"
//	});
}

/*
 * "이미지 추가" 버튼(btnImg)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnImgClick(e){
	var btnImg = e.control;
	app.lookup("fi1").openFileChooser();
}

/*
 * 파일 인풋에서 value-change 이벤트 발생 시 호출.
 * FileInput의 value를 변경하여 변경된 값이 저장된 후에 발생하는 이벤트.
 */
function onFi1ValueChange(e){
	var fi1 = e.control;
	util.DataMap.setValue(app, "dmResult", "fname", fi1.file.name);
	
	var file = fi1.file;
	
	var reader = new FileReader();
	
	reader.onload = function(res){
		
		var text = res.target.result;
		app.lookup("img1").src = text;
		app.lookup("img1").redraw();
	};
	reader.readAsDataURL(file);
}
