/************************************************
 * K4-1.js
 * @프로그램설명 : 
 *
 * @작성일자 :  2026. 11. 5..
 * @작성자 : dyseo
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/
 
/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/ 


/************************************************
 ** 글로벌 함수
 ************************************************/ 


/************************************************
 ** 파일내 로컬변수 선언  
 ************************************************/ 
var util = createCommonUtil();

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/ 

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/* ==== [app/sce/A5/A5-6.clx] 5.6 코드 생성 ==== */
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

/* ==== [app/sce/A5/A5-9.clx] 5.9 화면디자인 편집기 ==== */
/************************************************
 ** 공통모듈
 ************************************************/

/************************************************
 ** 글로벌 변수, 전역변수
 ************************************************/

/************************************************
 ** 사용자 정의 함수
 ************************************************/

/************************************************
 ** 컨트롤 이벤트
 ************************************************/
/* ==== 양방향 편집 충돌 방지 시연 ==== */
/** 핸들러 동작 모드. "② 직접 코드 수정"으로 JS만 바꿔도 CLX 연결은 그대로 유지된다. */
var vsRtMode = "v1";
/** 디자이너 편집(컨트롤 추가) 시뮬레이션 횟수 */
var vnRtAdded = 0;

/**
 * 변경 이력을 로그에 추가한다.
 */
function addRtLog(psMsg){
	var vcLog = app.lookup("txaRtLog");
	vcLog.value = moment().format("HH:mm:ss") + "  " + psMsg + "\n" + vcLog.value;
}

/*
 * "대상 버튼"(btnRtTarget) 및 동적으로 추가된 버튼에서 click 이벤트 발생 시 호출.
 * 같은 핸들러 이름을 참조하는 한, 컨트롤이 추가되거나 JS 본문이 바뀌어도 연결이 유지된다.
 */
function onBtnRtTargetClick(e){
	var voBtn = e.control;
	var vsMsg = (vsRtMode == "v1")
		? "[v1 핸들러] " + voBtn.id + " 클릭 처리"
		: "[v2 핸들러 - 코드 수정됨] " + voBtn.id + " 클릭 처리 + 추가 로직 실행";
	app.lookup("optRtResult").value = vsMsg;
	addRtLog("실행: " + vsMsg);
}

/*
 * "① 디자이너 편집: 컨트롤 추가" 버튼(btnRtDesign)에서 click 이벤트 발생 시 호출.
 * 디자이너에서 컨트롤을 추가하고 리스너(핸들러 이름)만 연결한 상황을 흉내낸다.
 */
function onBtnRtDesignClick(e){
	var btnRtDesign = e.control;
	vnRtAdded++;
	var vsId = "btnRtAdded" + vnRtAdded;
	var vcBtn = new cpr.controls.Button(vsId);
	vcBtn.value = "추가 버튼 " + vnRtAdded;
	vcBtn.addEventListener("click", onBtnRtTargetClick);
	app.lookup("grpRtHolder").addChild(vcBtn, {width: "120px", height: "28px"});
	addRtLog("CLX 편집: 컨트롤 '" + vsId + "' 추가 + click → onBtnRtTargetClick 연결 (JS 파일 수정 없음)");
}

/*
 * "② 직접 코드 수정: 핸들러 교체" 버튼(btnRtCode)에서 click 이벤트 발생 시 호출.
 * JS 핸들러 본문만 바뀐 상황을 흉내낸다. (CLX 변경 없음)
 */
function onBtnRtCodeClick(e){
	var btnRtCode = e.control;
	vsRtMode = (vsRtMode == "v1") ? "v2" : "v1";
	addRtLog("JS 편집: onBtnRtTargetClick 본문을 " + vsRtMode + " 로 교체 (CLX 파일 수정 없음)");
}

/*
 * "초기화" 버튼(btnRtReset)에서 click 이벤트 발생 시 호출.
 */
function onBtnRtResetClick(e){
	var btnRtReset = e.control;
	var vcHolder = app.lookup("grpRtHolder");
	for(var i = 1; i <= vnRtAdded; i++){
		var vcAdded = app.lookup("btnRtAdded" + i);
		if(vcAdded){
			vcHolder.removeChild(vcAdded);
		}
	}
	vnRtAdded = 0;
	vsRtMode = "v1";
	app.lookup("optRtResult").value = "아직 실행되지 않았습니다.";
	app.lookup("txaRtLog").value = "";
}
