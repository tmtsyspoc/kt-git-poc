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
	var voReturnData = {
		type : "summary",
		value : app.lookup("ipb1").value
	};
	if(app.lookup("dsSubValue").getRowCount() >0) {
		voReturnData["hasSub"] = "Y";
		voReturnData["sub_value"] = app.lookup("dsSubValue").getRowDataRanged();
	}
	return voReturnData;
}

/**
 * 
 * @param {any} poData
 */
exports.setData = function(poData){
	console.log(poData);
	app.lookup("ipb1").value = poData.value;
	if(poData["sub_value"]) {
		app.lookup("dsSubValue").build(poData["sub_value"])
	}
}


/**
 * 
 * @param {cpr.controls.Container} pcContainer
 */
function updateRowIndex(pcContainer){
	var vcContainer = app.getContainer();
	var vaChildren = vcContainer.getChildren();
	var vnIndex = vaChildren.indexOf(pcContainer);
	
	if(vnIndex != -1) {
		app.lookup("dsSubValue").realDeleteRow(pcContainer.getBindContext().rowIndex);
		for(var i = vnIndex+1; i< vaChildren.length; i++) {
			/** @type cpr.controls.UIControl */
			var vcChild = vaChildren[i];
			if(vcChild.getBindContext() != null) {
				/** @type cpr.bind.DataRowContext */
				var voBindContext = vcChild.getBindContext();
				voBindContext.rowIndex;
				var context = new cpr.bind.DataRowContext(app.lookup("dsSubValue"), voBindContext.rowIndex-1);
				vcChild.setBindContext(context);
			}
		}
	}
}
/*
 * "+Bullet_detail 추가" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e) {
	var button = e.control;
	app.lookup("grd1").dataSet.pushRow();
//	var vcContainer = app.getContainer();
//	var index = vcContainer.getChildren().length-3;
//	app.lookup("dsSubValue").addRow();
//	var group_3 = new cpr.controls.Container();
//	console.log(index);
//	var dataRowContext_1 = new cpr.bind.DataRowContext(app.lookup("dsSubValue"), index);
//	group_3.setBindContext(dataRowContext_1);
//	var formLayout_3 = new cpr.controls.layouts.FormLayout();
//	formLayout_3.scrollable = false;
//	formLayout_3.horizontalSpacing = "4px";
//	formLayout_3.verticalSpacing = "4px";
//	formLayout_3.topMargin = "0px";
//	formLayout_3.rightMargin = "0px";
//	formLayout_3.bottomMargin = "0px";
//	formLayout_3.leftMargin = "0px";
//	formLayout_3.setColumns(["1fr", "32px"]);
//	formLayout_3.setRows(["25px", "32px"]);
//	group_3.setLayout(formLayout_3);
//	(function(container) {
//		var output_3 = new cpr.controls.Output();
//		output_3.value = "Detail";
////		output_3.displayExp = "text +\" \" + userAttr(\"detailIndex\")";
//		container.addChild(output_3, {
//			"colIndex": 0,
//			"rowIndex": 0
//		});
//		var inputBox_2 = new cpr.controls.InputBox();
//		inputBox_2.bind("value").toDataColumn("value");
//		container.addChild(inputBox_2, {
//			"colIndex": 0,
//			"rowIndex": 1,
//			"colSpan": 2,
//			"rowSpan": 1
//		});
//		var button_2 = new cpr.controls.Button();
//		button_2.value = "";
//		button_2.icon = "theme/images/controls/dialog/ic_btn_close.svg";
//		button_2.style.setClasses(["btn-transparent"]);
//		if (typeof onButtonClick2 == "function") {
//			button_2.addEventListener("click", onButtonClick2);
//		}
//		container.addChild(button_2, {
//			"colIndex": 1,
//			"rowIndex": 0
//		});
//	})(group_3);
//	vcContainer.insertChild(vcContainer.getChildren().length-1,group_3, {
//		"autoSize": "height",
//		"width": "276px",
//		"height": "61px"
//	});
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick2(e){
	var button = e.control;
	var vcDetailContainer = button.getParent();
	updateRowIndex(vcDetailContainer);
	vcDetailContainer.dispose();
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick3(e){
	var button = e.control;
	var vcGrd = app.lookup("grd1");
	
	var index = vcGrd.getSelectedRowIndex();
	vcGrd.dataSet.realDeleteRow(index);
}

/*
 * 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick4(e){
	var button = e.control;
	var evt = new cpr.events.CAppEvent("mng-delete");
	app.dispatchEvent(evt);
//	app.getHost().dispose();
}
