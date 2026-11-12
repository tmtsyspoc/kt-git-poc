/************************************************
 * A5-9-1.js
 * Created at 2025. 8. 1. 오후 4:32:45.
 *
 * @author dyseo
 ************************************************/

/************************************************
 ** 공통모듈
 ************************************************/
var util = createCommonUtil();

/************************************************
 ** 글로벌 변수, 전역변수
 ************************************************/

/************************************************
 ** 사용자 정의 함수
 ************************************************/

/************************************************
 ** 컨트롤 이벤트
 ************************************************/

/*
 * "조회" 버튼(btnSearch3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
async function onBtnSearch3Click(e){
	var btnSearch3 = e.control;
	util.Submit.send(app, "subSearch", function(pbSuccess){
		if(pbSuccess){
			util.Control.redraw(app, ["grpList1", "grpList2", "grpList3"]);
		}
	});
	util.Submit.send(app, "subChart", function(pbSuccess){
		if(pbSuccess){
			app.lookup("chart_bar1").drawChart();
			app.lookup("chart_bar2").drawChart();
			app.lookup("chart_bar3").drawChart();
			app.lookup("chart_line3").drawChart();
		}
	});
}

/*
 * "조회" 버튼(btnSearch2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
async function onBtnSearch2Click(e){
	var btnSearch2 = e.control;
	
	//유효성 검사
	if(!util.validate(app, "grpSearch2")) return;
	
	// Promise.all 기능 제공
	await Promise.all([
		util.Submit.sendAsync(app, "subSearch2"),
		util.Submit.sendAsync(app, "subChart2")
	]);
	
	/*
	 * [Workflow 객체 확인]
	 * ⇒  비동기적으로 처리되는 작업들을 순서대로 처리하는 방법을 제공하는 컴포넌트 제공
	 */
	var workflow = new cpr.foundation.Workflow(app);
	workflow.exec(function(){
		util.Submit.send(app, "subSearch2");
	}).exec(function(){
		util.Submit.send(app, "subChart2");
	});
	
	// Async/Await 기능 제공
	await util.Msg.confirmDlgAsync(app, "조회가 완료되었습니다. 결과를 확인하시겠습니까?", null, {
		cancelCallback: function() {
			console.log("사용자가 취소 버튼을 클릭하였습니다.");
		}
	});
	
	await util.Msg.confirmDlgAsync(app, "2단계 confirm을 통과할까요?", null, {
		cancelCallback: function() {
			console.log("사용자가 취소 버튼을 클릭하였습니다.");
		}
	});
	
	await util.Msg.confirmDlgAsync(app, "3단계 confirm을 통과할까요?", null, {
		confirmCallback: function() {
		},
		cancelCallback: function() {
			console.log("사용자가 취소 버튼을 클릭하였습니다.");
		}
	});
	
	app.lookup("chart_circle1").drawChart();
	app.lookup("chart_bar5").drawChart();
	app.lookup("chart_bar6").drawChart();
	app.lookup("chart_line1").drawChart();
}

/*
 * "고객관리카드" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
	util.Dialog.open(app, "app/sce/A5/A5-9P-1", 600, -1, function(){},null,{modal: true});
}

/*
 * "도움말" 버튼(btn8)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn8Click(e){
	var btn8 = e.control;
	util.Dialog.open(app, "app/sce/A5/A5-9P-2", 600, -1, function(){},null,{modal: false});
}

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(e){
	if(app.getAppProperty("initValue") == "A5-9"){
		// 두 번째 탭 선택
		app.lookup("tab3").setSelectedTabItem(app.lookup("tab3").getTabItemByID(2));
	}
}
