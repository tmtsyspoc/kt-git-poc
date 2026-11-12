/************************************************
 * screenLayout.js
 * Created at 2023. 2. 27. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/

/*
 * "코드 생성" 버튼(btnCreateCode)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCreateCodeClick(e) {
	var btnCreateCode = e.control;
	
	/*부모 컨테이너*/
	var container = app.lookup("grpParent");
	
	var group_5 = new cpr.controls.Container("grpChild");
	group_5.userAttr({"mobile-column-count": "1"});
	group_5.style.setClasses(["sch-filter-box"]);
	var formLayout_4 = new cpr.controls.layouts.FormLayout();
	formLayout_4.scrollable = false;
	formLayout_4.horizontalSpacing = "8px";
	formLayout_4.verticalSpacing = "8px";
	formLayout_4.topMargin = "0px";
	formLayout_4.rightMargin = "0px";
	formLayout_4.bottomMargin = "0px";
	formLayout_4.leftMargin = "0px";
	formLayout_4.setColumns(["1fr", "0px"]);
	formLayout_4.setColumnAutoSizing(1, true);
	formLayout_4.setColumnMinWidth(1, 0);
	formLayout_4.setRows(["1fr"]);
	group_5.setLayout(formLayout_4);
	(function(container){
		var group_6 = new cpr.controls.Container();
		group_6.userAttr({"mobile-column-count": "1"});
		var formLayout_5 = new cpr.controls.layouts.FormLayout();
		formLayout_5.scrollable = false;
		formLayout_5.horizontalSpacing = "8px";
		formLayout_5.verticalSpacing = "8px";
		formLayout_5.setColumns(["0px", "1fr"]);
		formLayout_5.setColumnAutoSizing(0, true);
		formLayout_5.setRows(["28px"]);
		group_6.setLayout(formLayout_5);
		(function(container){
			var output_3 = new cpr.controls.Output();
			output_3.value = "Label";
			output_3.style.setClasses(["label"]);
			container.addChild(output_3, {
				"colIndex": 0,
				"rowIndex": 0
			});
			var inputBox_1 = new cpr.controls.InputBox();
			container.addChild(inputBox_1, {
				"colIndex": 1,
				"rowIndex": 0
			});
		})(group_6);
		container.addChild(group_6, {
			"colIndex": 0,
			"rowIndex": 0,
			"colSpan": 1,
			"rowSpan": 1,
			"width": 100,
			"height": 23
		});
		var group_7 = new cpr.controls.Container();
		group_7.userAttr({"needs-auto-height": "true"});
		group_7.style.setClasses(["search-button-group"]);
		var flowLayout_1 = new cpr.controls.layouts.FlowLayout();
		flowLayout_1.scrollable = false;
		flowLayout_1.verticalSpacing = 0;
		flowLayout_1.horizontalAlign = "right";
		flowLayout_1.verticalAlign = "middle";
		flowLayout_1.lineWrap = false;
		group_7.setLayout(flowLayout_1);
		(function(container){
			var button_2 = new cpr.controls.Button("btnSearch");
			button_2.value = "조회";
			button_2.icon = "0";
			button_2.style.setClasses(["primary", "btn-search"]);
			container.addChild(button_2, {
				"autoSize": "width",
				"width": "86px",
				"height": "28px"
			});
		})(group_7);
		container.addChild(group_7, {
			"colIndex": 1,
			"rowIndex": 0
		});
	})(group_5);
	container.addChild(group_5, {
		"autoSize": "height",
		"width": "982px",
		"height": "54px"
	});
}