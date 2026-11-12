/************************************************
 * comPGridCellView.js
 * Created at 2023. 2. 23. 오전 10:56:35.
 * 
 * @author tomatoSystem
 ************************************************/

var ctrlCopy = createCtrlCopyModule();

/*******************************************
 * 반응형 그리드 dialogType 적용시 에서 상세 버튼 클릭시 
 * 호출되는 다이얼로그
 *******************************************/
/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e) {	
	createFormContent();
}

/**
 * 데이터 view 영역을 생성합니다.
 */
function createFormContent() {
	
	var voInitValue = app.getHostProperty("initValue");
	/** @type {cpr.controls.Grid} */
	var vcGrid = voInitValue["grid"];
	/** @type {cpr.controls.Container} */
	var vcGropBindForm = voInitValue["grpBindForm"];
	var vaColVals = setDsColSetting(vcGrid, vcGropBindForm, voInitValue["rowIdx"]);
	var vcGrpData = app.lookup("grpData");
	var vaRows = [];
	
	for (var i = 0; i < vaColVals.length; i++) {
		vaRows.push("28px");
	}
	
	var vaColumnNames = vaColVals.map(function(each){
		return each["columnName"];
	})
	
	var dmParam = app.lookup("dmParam");
	dmParam.parseData({
		columns: vaColumnNames.map(function(each){
			return  {dataType: "string", name: each};
		})
	});
	
	(function(container) {
		var vcGrpForm = new cpr.controls.Container();
		vcGrpForm.style.setClasses(["form"]);
		var voFormLot = new cpr.controls.layouts.FormLayout();
		voFormLot.scrollable = false;
		voFormLot.topMargin = "4px";
		voFormLot.rightMargin = "8px";
		voFormLot.bottomMargin = "8px";
		voFormLot.leftMargin = "4px";
		voFormLot.horizontalSpacing = "17px";
		voFormLot.verticalSpacing = "9px";
		voFormLot.horizontalSeparatorWidth = 1;
		voFormLot.setColumns(["120px", "1fr"]);
		voFormLot.setUseColumnShade(0, true);
		voFormLot.setRows(vaRows);
		vcGrpForm.setLayout(voFormLot);
		(function(container) {
			
			vaColVals.forEach(function(each, idx) {
				
				voFormLot.setRowAutoSizing(idx, true);
				
				var outHdr = new cpr.controls.Output();
				outHdr.value = each["hdrText"];
				outHdr.style.setClasses(["label"]);
				container.addChild(outHdr, {
					"colIndex": 0,
					"rowIndex": idx
				});
				
				var vcDetailCtrl = each["isGridChild"] ? vcGrid.detail.getControl(idx) : each["bindFormChild"];
				var optDtl = null;

				if(!ValueUtil.isNull(vcDetailCtrl)) {
					optDtl = ctrlCopy.copy(vcDetailCtrl);
				} else {
					optDtl = new cpr.controls.Output();
					optDtl.value = each["dtlText"];
				}
				dmParam.setValue(dmParam.getColumnNames()[idx], each["dtlText"]);
//				optDtl.bind("value").toDataMap(dmParam, dmParam.getColumnNames()[idx]);
				optDtl.userAttr("isGridChild", each["isGridChild"] ? "true" : "false");
				
				container.addChild(optDtl, {
					"colIndex": 1,
					"rowIndex": idx
				});
			});
		})(vcGrpForm);
		
		// cell-click 이벤트 전파
		vcGrpForm.addEventListener("click", function(e){
			if(e.targetControl.style.hasClass("label")) return;

			var voConstraint = vcGrpForm.getConstraint(e.targetControl);
			if(ValueUtil.isNull(voConstraint))return;
			
			// 그리드와 선택 행 컨텍스트 바인딩으로 연결된 그룹(프리폼)을 기준으로 생성된 컨트롤은 dispatchEvent 처리를 제외합니다.
			if (e.targetControl.userAttr("isGridChild") == "false"){
				return;
			}
			
			var vnCellIndex = voConstraint.rowIndex;
			var option = {
				relativeTargetName: "detail",
				row: vcGrid.getRow(voInitValue["rowIdx"]),
				rowIndex: voInitValue["rowIdx"],
				cellIndex: vnCellIndex,
				columnName: vcGrid.detail.getColumn(vnCellIndex).columnName,
				cellBoundingRect: vcGrid.getCellBounds("detail", voInitValue["rowIdx"], vnCellIndex),
			}
			var cellClickEvt = new cpr.events.CGridMouseEvent(cpr.events.GridEventType.CELL_CLICK, option);
			vcGrid.dispatchEvent(cellClickEvt);
		});
		
		container.addChild(vcGrpForm, {
			"autoSize": "height",
			"width": "400px",
			"height": "660px"
		});
	})(vcGrpData);
}

/**
 * 선택한 로우의 그리드 데이터를 정제합니다.
 * @param {cpr.controls.Grid} pcGrid
 * @param {cpr.controls.Container} pcGroup
 * @param {Number} pnRowIdx
 * @return {Array} return
 */
function setDsColSetting(pcGrid, pcGroup, pnRowIdx) {
	var appInstance = pcGrid.getAppInstance(); // 대상 그리드 앱인스턴스
	var vcGrd = pcGrid; // 그리드
	
	var header = vcGrd.header; // 그리드 헤더
	var detail = vcGrd.detail; // 그리드 디테일
	
	var vaDatas = []; // 그리드를 기준으로 폼레이아웃 구성 정보를 저장할 배열
	var voRGrid = vcGrd["_RGrid"]; // 반응형 그리드 유틸리티
	/** @type Array */
	var vaHideCollIdxs = voRGrid._hideCellIdxs; // 반응형 그리드 모듈에 의해 모바일화면에서 숨겨진 colIndex
	
	// 반응형으로 숨겨진 컬럼이 아닌, 디자인 편집기 상에서 숨겨진 colIndex ( 표시하지 않음 )
	var vaRealHideColIdxs = vcGrd.getColIndicesByVisible(false).map(function(each) {
		return each - 1;
	}).filter(function(arg) {
		return vaHideCollIdxs.indexOf(arg) == -1;
	});
	
	/*
	 * 디테일 영역에서의 cellIndex
	 * 디테일 행이 다중 행일 경우, 동일한 colIndex 에 배치된 cell을 찾기 위해 sort 처리
	 */
	var dtlCellIdxs = vcGrd.getColumnLayout(true).detail.sort(function(a,b) {return (a.colIndex - b.colIndex)}).map(function(arg){return arg.cellIndex});
	for(var d = 0; d < dtlCellIdxs.length; d++){
		var voColInfo = {}; // 디테일 컬럼별 레이아웃 정보를 저장할 객체
		
		var vnDtlCellIdx = dtlCellIdxs[d];
		var voDtlCol = vcGrd.detail.getColumn(vnDtlCellIdx);
		var vsDtlText = "";
		var vcDtlCtrl = voDtlCol.control;
		var vnDtlColIdx = voDtlCol.colIndex;
		
		// 특수(checkbox, radio)컬럼, 버튼(__responseButton__)컬럼 제외
		if (voDtlCol.columnType == "checkbox" || voDtlCol.columnType == "radio" || (vcDtlCtrl instanceof cpr.controls.Button && vcDtlCtrl.userAttr("__responseButton__") == "true")) {
			continue;
		}
		
		var vsHdrText = "";
		if(voDtlCol.columnType == "rowindex") {
			// 특수(rowindex)컬럼 headerText 정의
			vsHdrText = AppProperties.GRID_INDEX_COL_HEADER_TEXT;	
		} else {
			var vaRelatedHdrs = vcGrd.getHeaderCellIndices(vnDtlCellIdx);
			for(var h = 0; h < vaRelatedHdrs.length; h++) {
				var vnHdrCellIdx = vaRelatedHdrs[h];
				var voHdrCol = vcGrd.header.getColumn(vnHdrCellIdx);
				var vbHdrVisible = voHdrCol.visible;
				var vsCurrentHdrText = voHdrCol.text;
				
				// 상태 컬럼 제외
				if (typeof AppProperties !== 'undefined') {
					if (vsCurrentHdrText == AppProperties.GRID_STATE_COL_HEADER_TEXT) continue;
				}
				
				// 반응형 동작을 위해 구성된 표시항목 외 visible = false 인컬럼 숨김
				// vnDtlColIdx-1 ⇒ 맨 앞 상세버튼(__responseButton__) 을 제외한 origin Colindex
				if (vaRealHideColIdxs.indexOf(vnDtlColIdx-1) > -1) {
					vsHdrText = "";
					continue;
				}
				
				vsCurrentHdrText = vsHdrText.length == 0 ? vsCurrentHdrText : " - " + vsCurrentHdrText;
				vsHdrText += vsCurrentHdrText;
			}
		}

		if(vsHdrText == "") continue; 
		
		vsDtlText = vcGrd.getCellText(pnRowIdx, vnDtlCellIdx);
		voColInfo = {
			"isGridChild": true,
			"hdrText": vsHdrText,
			"dtlText": vsDtlText,
			"columnName": voDtlCol.columnName || ("tmepcolumn" + vnDtlCellIdx)
		};
		vaDatas.push(voColInfo);
	}
	
	/*
	 * 그리드와 선택 행 컨텍스트 바인딩으로 연결된 그룹(프리폼)을 기준으로 데이터를 정제합니다.
	 */
	var grpBindForm = pcGroup;
	var grpBindFormChildren;
	
	if (grpBindForm == undefined){
		return vaDatas;
	}
	
	if (!grpBindForm instanceof cpr.controls.Container){ // grpBindForm가 그룹 컨트롤인지 체크
//		alert("프리폼의 내용이 포함되지 않았습니다.");
//		alert(vcGrd.id + "의 사용자 속성 \"bindDataFormId\"에 입력한 ID가 그룹 컨트롤이 아닙니다.");
		return vaDatas;
	} else if (vcGrd != grpBindForm.getBindContext().grid){ // grpBindForm에 설정한 바인딩 컨텍스트 정보가 정확한지 체크
//		alert("프리폼의 내용이 포함되지 않았습니다.");
//		alert("대상 폼의 바인딩 컨텍스트가 " + vcGrd.id + "가 아닙니다.");
		return vaDatas;
	}
	
	grpBindFormChildren = grpBindForm.getChildren().filter(function(each){
		return each.getBindInfo("value") != null;
	});
	
	for(var i = 0; i < grpBindFormChildren.length; i++){
		/** @type {cpr.controls.Control} */
		var targetCtrl = grpBindFormChildren[i];
		
		var vsBFLabelText;
		var vsBFDtlText;
		var bindColNm;
		var voBindFormInfo = {};
		
		// vsHdrText 얻기
		vsBFLabelText = targetCtrl.userAttr("label");
		var containsValue = vaDatas.some(function(obj){
			return obj["hdrText"] === vsBFLabelText;
		})
		if (containsValue){
			continue;
		}
		
		// vsDtlText 얻기
		vsBFDtlText = targetCtrl.value;
		
		//targetColumnName 얻기
		bindColNm = targetCtrl.getBindInfo("value").columnName;
		
		voBindFormInfo = {
			"isGridChild": false,
			"bindFormChild": targetCtrl,
			"hdrText": vsBFLabelText,
			"dtlText": vsBFDtlText,
			"columnName" : bindColNm 
		}
		
		vaDatas.push(voBindFormInfo);
	}
	
	return vaDatas;
}

/*
 * 루트 컨테이너에서 before-unload 이벤트 발생 시 호출.
 * 앱이 언로드되기 전에 발생하는 이벤트 입니다. 취소할 수 있습니다.
 */
function onBodyBeforeUnload(e){
	app.getHost().returnValue = app.lookup("dmParam").getDatas();
}

/*
 * "닫기" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click3(e) {
	var btn1 = e.control;
	app.close(app.lookup("dmParam").getDatas());
}
