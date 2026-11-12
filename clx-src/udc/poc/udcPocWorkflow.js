/************************************************
 * udcPocWorkflow .js
 * Created at 2025. 8. 5. 오후 1:35:09.
 *
 * @author cin07
 ************************************************/

/************************************************
 ** 공통모듈
 ************************************************/
var util = createCommonUtil();

/************************************************
 ** 사용자 정의 함수
 ************************************************/
/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

/************************************************
 ** 컨트롤 이벤트
 ************************************************/
/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e){
	if(e.property == "dataSet"){
		var vsEmbId = app.getAppProperty("embId");
		/** @type cpr.data.DataSet */
		var ds = app.getAppProperty("dataSet");
		ds.setFilter("useYN != 'N'");
		ds.setSort("index");
			
		var rowCnt = ds.getRowCount();
		var group = new cpr.controls.Container("grp1");
		var formLayout = new cpr.controls.layouts.FormLayout();
		formLayout.scrollable = false;
		formLayout.horizontalSpacing = "8px";
		formLayout.verticalSpacing = "8px";
		formLayout.topMargin = "0px";
		formLayout.rightMargin = "0px";
		formLayout.bottomMargin = "0px";
		formLayout.leftMargin = "0px";
		var vaColumns = [];
		var j = 1;
		for(var i = 0; i < rowCnt - 1; i++){
			vaColumns.push("1fr");
			vaColumns.push("15px");
			formLayout.setColumnAutoSizing(j, true);
			j += 2;
		}
		vaColumns.push("1fr");
		formLayout.setColumns(vaColumns);
		formLayout.setRows(["1fr"]);
		group.setLayout(formLayout);
		(function(container){
			var j = 1;
			ds.getRowDataRanged().forEach(function(each, index){
				var button = new cpr.controls.Button();
				button.value = each["title"];
				if(index == 0){
					 button.style.addClass("active");
				}
				button.addEventListener("click", function(e){
					var event = new cpr.events.CUIEvent("proccess-click", {"info": each});
					app.dispatchEvent(event);
					group.getChildren().forEach(function(each){
						if(each.style.hasClass("active")){
							each.style.removeClass("active");
						}
					});
					button.style.addClass("active");
					util.EmbApp.dispose(app.getHostAppInstance(), vsEmbId);
					util.EmbApp.setPage(app.getHostAppInstance(), vsEmbId, each["src"])
				});
				container.addChild(button, {
					"colIndex": index*2,
					"rowIndex": 0
				});
				
				var output = new cpr.controls.Output();
				output.value = "->";
				container.addChild(output, {
					"colIndex": j,
					"rowIndex": 0
				});
				j += 2;
			});
		})(group);
		app.getContainer().addChild(group, {
			"colIndex": 0,
			"rowIndex": 0
		});
	}
}
