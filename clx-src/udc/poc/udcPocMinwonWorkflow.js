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

/**
 * @param {Number} width
 * @param {String} str
 * rgb (0, 25, 25) => 에서 16진수로 변환하는 경우 0은 00이 되도록 변환
 */
var fillZero = function(width, str) {
	return str.length >= width ? str : new Array(width - str.length + 1).join('0') + str; //남는 길이만큼 0으로 채움
}

/**
 * 다음 스텝으로 이동합니다.
 */
exports.moveNext = function () {
	var vaChildren = app.getContainer().getFirstChild().getChildren();
	
	var vaActiveItem = vaChildren.filter(function(each) {return each.style.hasClass("active")});
	vaActiveItem.forEach(function(item) {
		var vnIndex = vaChildren.indexOf(item);
		if(vnIndex < vaChildren.length -1) {
			/** @type cpr.controls.Container */
			var voNextItem = vaChildren[vnIndex + 1];
			voNextItem.enabled = true;
			
			voNextItem.style.addClass("current");
			item.style.addClass("done");
			
			var clictEvt = new cpr.events.CUIEvent("click");
			voNextItem.dispatchEvent(clictEvt);
		}
	});
}

/**
 * 이전 스텝으로 이동합니다.
 */
exports.movePrev = function () {
	var vaChildren = app.getContainer().getFirstChild().getChildren();
	var vaActiveItem = vaChildren.filter(function(each) {return each.style.hasClass("active")});
	vaActiveItem.forEach(function(item) {
		var vnIndex = vaChildren.indexOf(item);
		if(vnIndex > 0) {
			/** @type cpr.controls.Container */
			var voPrevItem = vaChildren[vnIndex - 1];
			var clictEvt = new cpr.events.CUIEvent("click");
			voPrevItem.dispatchEvent(clictEvt);
		}
	});
}


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
		var group = new cpr.controls.Container();
		group.style.setClasses(["step-wrap"]);
		var formLayout = new cpr.controls.layouts.FormLayout();
		formLayout.scrollable = false;
		formLayout.horizontalSpacing = "0px";
		formLayout.verticalSpacing = "0px";
		formLayout.topMargin = "0px";
		formLayout.rightMargin = "0px";
		formLayout.bottomMargin = "0px";
		formLayout.leftMargin = "0px";
		var vaColumns = [];
		for(var i = 0; i < rowCnt - 1; i++){
			vaColumns.push("1fr");
		}
		vaColumns.push("1fr");
		formLayout.setColumns(vaColumns);
		formLayout.setRows(["1fr"]);
		group.setLayout(formLayout);
		(function(container){
			var j = 1;
			ds.getRowDataRanged().forEach(function(each, index){
				
				var innerGroup = new cpr.controls.Container();
				innerGroup.style.setClasses(["step-item"]);
				var innerForm = new cpr.controls.layouts.FormLayout();
				innerForm.scrollable = false;
				innerForm.horizontalSpacing = "0px";
				innerForm.verticalSpacing = "0px";
				innerForm.topMargin = "0px";
				innerForm.rightMargin = "0px";
				innerForm.bottomMargin = "0px";
				innerForm.leftMargin = "0px";
				innerForm.setColumns(["1fr"]);
				innerForm.setRows(["40px", "0px", "0px", "0px"]);
				innerForm.setRowAutoSizing(0, true);
				innerForm.setRowAutoSizing(1, true);
				innerForm.setRowAutoSizing(2, true);
				innerForm.setRowAutoSizing(3, true);
				innerGroup.setLayout(innerForm);
				
				if(index == 0){
					innerGroup.style.addClass("current");	
					innerGroup.style.addClass("active");	
				} else {
					innerGroup.enabled = false;
				}
				
				var vnIndex =each["index"];
				
				var opt1 = new cpr.controls.Output();
				var vsIconIndex = "step" + fillZero(2, vnIndex);
				opt1.style.setClasses(["step-icon", vsIconIndex]);
				innerGroup.addChild(opt1 , {
					rowIndex : 0,
					colIndex : 0,
					horizontalAlign : "center",
					verticalAlign : "center",
					width : 40,
					height: 40
				});
				
				var opt2 = new cpr.controls.Output();
				opt2.style.setClasses(["step-num"]);
				opt2.value = vnIndex + "단계";
				innerGroup.addChild(opt2 , {
					rowIndex : 1,
					colIndex : 0
				});
				
				var opt3 = new cpr.controls.Output();
				opt3.style.setClasses(["step-tit"]);
			 	opt3.value = each["title"];
				innerGroup.addChild(opt3 , {
					rowIndex : 2,
					colIndex : 0
				});
				
				
				var opt4 = new cpr.controls.Output();
				opt4.style.setClasses(["step-txt"]);
				opt4.value = each["subTitle"];
				innerGroup.addChild(opt4 , {
					rowIndex : 3,
					colIndex : 0
				});
				
				innerGroup.addEventListener("click", function(e){
					var event = new cpr.events.CUIEvent("proccess-click", {"info": each});
					app.dispatchEvent(event);
					group.getChildren().forEach(function(each){
						if(each.style.hasClass("active")){
							each.style.removeClass("active");
						}
					});
					innerGroup.style.addClass("active");
					util.EmbApp.dispose(app.getHostAppInstance(), vsEmbId);
					util.EmbApp.setPage(app.getHostAppInstance(), vsEmbId, each["src"]);
				});
				
				container.addChild(innerGroup, {
					rowIndex : 0,
					colIndex : index
				});
			});
		})(group);
		app.getContainer().addChild(group, {
			"colIndex": 0,
			"rowIndex": 0
		});
	}
	
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
		var clictEvt = new cpr.events.CUIEvent("click");
		group.getFirstChild().dispatchEvent(clictEvt);
	});
}
