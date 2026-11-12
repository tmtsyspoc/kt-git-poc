/************************************************
 * udcMngMain.js
 * Created at 2025. 4. 7. 오후 4:47:06.
 *
 * @author HWPS
 ************************************************/

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

exports.getData = function(){
	var subValue = app.lookup("dsSubValue").getRowDataRanged();
	subValue.unshift({value:app.lookup("ipbDetail").value});
	return {
		"value" : app.lookup("ipb1").value,
		"type": "caution",
		"hasSub": "Y",
		"sub_value": subValue
	}
}
exports.setData = function(poData){
	console.log(poData);
	var vsValue = poData["value"];
	app.lookup("ipb1").value = vsValue;
	if(poData["sub_value"]) {
		/** @type Array */
		var vaSubValue = poData["sub_value"];
		var vsFirst = vaSubValue.shift();
		app.lookup("dsSubValue").build(vaSubValue);
		app.lookup("ipbDetail").value = vsFirst["value"];
	}
	app.getContainer().redraw();
}

/*
 * "+Bullet_detail 추가" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var button = e.control;

//	var vcGrpBullet = app.lookup("grpBullet");
//	var voForm = vcGrpBullet.getLayout();
//	
//	var division = new cpr.controls.layouts.FormDivision("32px");
//	var rowDivision = voForm.getRowDivisions();
//	rowDivision.push(division);
//	var vnRowIndex = rowDivision.length;
//	voForm.setRowDivisions(rowDivision);
////	vcGrpBullet.setLayout(voForm);
//	var vcTempInput = new cpr.controls.InputBox();
//	vcGrpBullet.addChild(vcTempInput, {
//		rowIndex: vnRowIndex-1,
//		colIndex: 0
//	});
//	var vcDeleteBtn = new cpr.controls.Button();
//	vcDeleteBtn.style.setClasses(["btn-transparent","btn-delete"]);
//	vcDeleteBtn.icon = "0";
//	vcDeleteBtn.addEventListener("click", function(ev){
//		var ctrl = ev.control;
//		var constraint = ctrl.getParent().getConstraint(ctrl);
//		voForm.removeRows([constraint.rowIndex]);
//	});
//	vcGrpBullet.addChild(vcDeleteBtn, {
//		rowIndex: vnRowIndex-1,
//		colIndex:1
//	});
//	app.getContainer().redraw();
//	voForm.insertRows(["32px"]);
	app.lookup("dsSubValue").pushRow();
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick2(e){
	var button = e.control;
	var vcGrd = app.lookup("grd1");
	
	var index = vcGrd.getSelectedRowIndex();
	vcGrd.dataSet.realDeleteRow(index);
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick3(e){
	var button = e.control;
	var evt = new cpr.events.CAppEvent("mng-delete");
	app.dispatchEvent(evt);
}
