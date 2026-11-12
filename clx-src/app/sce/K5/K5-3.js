/************************************************
 * K5-3.js
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

/* ==== [app/sce/A14/A14-2-1.clx] 14.2 개발산출물 자동완성 ==== */
/**************************************************
 * 공통 모듈/전역 변수 선언
 **************************************************/
/* ==== 템플릿·UDC 활용 화면 (조회·등록·변경) ==== */
var TP_COLS = ["NAME", "TYPE", "JOIN_DT", "TEL1", "TEL2", "TEL3", "EMAIL_ID", "EMAIL_DOMAIN", "ZIP", "ADDR1", "ADDR2"];

/*
 * "조회" 버튼(btnTpSearch)에서 click 이벤트 발생 시 호출.
 * 조회조건(dmTpSearch)으로 고객 목록(dsTp)을 필터링한다.
 */
function onBtnTpSearchClick(e){
	var btnTpSearch = e.control;
	var vcMap = app.lookup("dmTpSearch");
	var vsName = vcMap.getValue("NAME");
	var vsFrom = vcMap.getValue("FROM_DT");
	var vsTo = vcMap.getValue("TO_DT");
	var vaCond = [];
	if(!ValueUtil.isNull(vsName)){
		vaCond.push("NAME.indexOf('" + vsName + "') >= 0");
	}
	if(!ValueUtil.isNull(vsFrom)){
		vaCond.push("JOIN_DT >= '" + vsFrom + "'");
	}
	if(!ValueUtil.isNull(vsTo)){
		vaCond.push("JOIN_DT <= '" + vsTo + "'");
	}
	var vcDs = app.lookup("dsTp");
	if(vaCond.length > 0){
		vcDs.setFilter(vaCond.join(" && "));
	} else {
		vcDs.clearFilter();
	}
	app.lookup("grdTp").redraw();
}

/*
 * 그리드(grdTp)에서 selection-change 이벤트 발생 시 호출.
 * 선택한 행을 상세 폼(dmTp)에 복사한다. (변경 화면)
 */
function onGrdTpSelectionChange(e){
	var grdTp = e.control;
	var vnIdx = grdTp.getSelectedRowIndex();
	var vcDs = app.lookup("dsTp");
	var vcMap = app.lookup("dmTp");
	TP_COLS.forEach(function(vsCol){
		vcMap.setValue(vsCol, vnIdx < 0 ? "" : vcDs.getValue(vnIdx, vsCol));
	});
}

/*
 * "적용" 버튼(btnTpApply)에서 click 이벤트 발생 시 호출.
 * 상세 폼의 내용을 선택 행에 반영한다. 선택 행이 없으면 신규 행으로 추가한다. (등록/변경 화면)
 */
function onBtnTpApplyClick(e){
	var btnTpApply = e.control;
	var vcMap = app.lookup("dmTp");
	if(ValueUtil.isNull(vcMap.getValue("NAME"))){
		util.Msg.alertDlg(app, "고객명을 입력하세요.", null, {
			confirmCallback: function(){
				app.lookup("ipbTpNm").focus();
			}
		});
		return;
	}
	var voRow = {};
	TP_COLS.forEach(function(vsCol){
		voRow[vsCol] = vcMap.getValue(vsCol);
	});
	var vcDs = app.lookup("dsTp");
	var vnIdx = app.lookup("grdTp").getSelectedRowIndex();
	if(vnIdx >= 0){
		vcDs.updateRow(vnIdx, voRow);
	} else {
		vcDs.addRowData(voRow);
	}
	util.Msg.notify(app, "적용되었습니다. [저장]으로 확정하세요.");
}

/*
 * 그리드 CUD 버튼(udcComGridCudBtnsTp)에서 save 이벤트 발생 시 호출.
 */
function onUdcComGridCudBtnsTpSave(e){
	var vcDs = app.lookup("dsTp");
	for(var i = 0; i < vcDs.getRowCount(); i++){
		if(ValueUtil.isNull(vcDs.getValue(i, "NAME"))){
			util.Msg.alertDlg(app, (i + 1) + "번째 행의 고객명은 필수입니다.");
			app.lookup("grdTp").selectRows(i);
			return;
		}
	}
	vcDs.commit();
	util.Msg.notify(app, "저장되었습니다.");
}
