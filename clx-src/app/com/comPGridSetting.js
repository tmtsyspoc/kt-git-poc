/************************************************
 * comPGridSetting.js
 * @프로그램설명 : 
 *
 * @작성일자 :  2024. 7. 22..
 * @작성자 : ryu
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/ 
var msUserAttrNm = "cellIndex";
var msRowClassNm = "row-bottom";

/************************************************
 ** 글로벌 함수
 ************************************************/ 


/************************************************
 ** 파일내 로컬변수 선언  
 ************************************************/ 
var util = createCommonUtil();

// 임시 그리드 및 임시 그리드 레이아웃 정보 변수
var vcTmpGrd, voTmpGrdLayout;

var voPrevRowElement = null;

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/ 
/**
 * 
 * @param {#column} psColumnName
 * @param {any} psValue
 */
function setAllCheck (psColumnName, psValue) {
	var vcGridFilter = app.lookup("grdFilter");
	var rowCount = vcGridFilter.dataSet.getRowCount();
	for(var idx = 0; idx < rowCount; idx++){
		util.DataSet.setValue(app, vcGridFilter.dataSet.id, idx, psColumnName, psValue);
	}	
}

function createDragSourceFeedback() {
	var feedback = new cpr.controls.Output();
	feedback.ellipsis = true;
	feedback.style.css({
		"opacity": "0.8",
		"width": "50px",
		"height": "25px",
		"border": "solid 1px red",
		"text-align": "center",
		"color": "black",
		"border-radius": "10px",
		"background": "white",
		"box-shadow": "0px 2px 10px #ddd",
		"cursor": "move"
	});
	return feedback;
}

/**
 * 파라미터의 컨트롤을 드래그 가능하도록 드래그 소스를 지정하는 함수.
 * @param {cpr.controls.Grid} control
 */
function setDragSource(control) {
	var feedback = null;
	var actualRect = null;
	
	new cpr.controls.DragSource(control, {
		options: {
			dataType: "text",
			threadhold: 10
		},
		onDragStart: function(context) {
			if (context.targetObject.relativeTargetName == "detail") {
				context.cursor = "grabbing";
				feedback = createDragSourceFeedback();
				context.data = context.targetObject;
				feedback.value = JSON.stringify(control.getRow(context.targetObject.rowIndex).getRowData());
				
				var voDragStartLoca = context.dragStartLocation;
				actualRect = new cpr.geometry.Rectangle(voDragStartLoca.x, voDragStartLoca.y, control.getActualRect().width, 25);
				app.getRootAppInstance().floatControl(feedback, actualRect);
				context.source = null;
			} else {
				context.cancel();
			}
		},
		onDragMove: function(context) {
			context.cursor = "grabbing";
			var newRect = actualRect.getTranslated(context.dragDelta);
			app.getRootAppInstance().floatControl(feedback, newRect);
		},
		onDragEnd: function(context) {
			context.cursor = "";
			feedback.dispose();
			feedback = null;
		}
	});
}

/**
 * 파라미터로 받은 컨트롤을 드랍가능한 타겟으로 지정하는 함수.
 * @param {cpr.controls.Grid} control2
 */
function setDropTarget(control2) {
	
	var dropTarget = new cpr.controls.DropTarget(control2, {
		isImportant: function(source) {
			return source.dataType == "text";
		},
		onDragEnter: function(context) {
			
		},
		onDragLeave: function(context) {
			
		},
		onDragMove: function(context) {
			var vaElementsOnMouse = elementsFromPoint(context.pointerLocation.x, context.pointerLocation.y);
			//현재 마우스 포인터가 위치하는 곳의 뒤에 있는 모든 요소를 가져오는 함수로, 그리드 행의 요소를 가져옵니다.
			var vaClGridRowEle = vaElementsOnMouse.filter(function( /*HTMLElement*/ each) {
				if (each.classList.contains("cl-grid-row")) {
					return each;
				}
				//마우스 뒤의 요소중 cl-grid-row클래스를 포함한 요소들만 필터링합니다.
			});
			var voGridRowElement = vaClGridRowEle[0]; //가장 첫번째 요소에 대해서 하단 보더에 스타일을 주어서 드래그드랍을 통해 대강 어디에 행이 위치할지 정보를 표시할 수 있습니다.
			if (voGridRowElement && !voGridRowElement.classList.contains(msRowClassNm)) {
				if (voGridRowElement != voPrevRowElement && voPrevRowElement) {
					
					voPrevRowElement.classList.remove(msRowClassNm);
				}
				voPrevRowElement = voGridRowElement;
				//그리드에 draggrid클래스가 적용되어있는 행에 row-bottom이 적용되어야만 하단에 빨간색 보더가 보여지게됩니다.
				//해당 클래스들에 대한 설정은 UDC내에 html 스니펫을통해 변경할 수 있습니다.
				voGridRowElement.classList.add(msRowClassNm);
			}
		},
		onDrop: function(context) {
			var vnDragIndex = context.data.rowIndex;
			var vnDragHeaderCellIndex = control2.getRow(vnDragIndex).getAttr(msUserAttrNm);
			
			// 드롭 이동 시 임시 그리드에 이동된 컬럼 정보가 적용되며, 팝업 그리드의 행 순서가 변경된다. 
			var vsTargetName = context.targetObject.relativeTargetName;
			if (vsTargetName == "detail") {
				// 디테일 영역에 드롭한 경우 드롭한 행 하단으로 이동
				var vnDropIndex = context.targetObject.rowIndex;
				var vnDropCellIndex = control2.getRow(vnDropIndex).getAttr(msUserAttrNm);
				vcTmpGrd.moveColumn(vnDragHeaderCellIndex, vnDropCellIndex, false);

			} else if (vsTargetName == "header") { // 헤더 영역에 드롭한 경우 첫 번째 행으로 이동
				vcTmpGrd.moveColumn(vnDragHeaderCellIndex, control2.getRow(0).getAttr(msUserAttrNm));
				
			} else if (ValueUtil.isNull(vsTargetName)) { // 디테일 하단 빈 영역에 드롭한 경우 마지막 행으로 이동
				var vnDropIndex = control2.getRowCount() - 1;
				var vnDropCellIndex = control2.getRow(vnDropIndex).getAttr(msUserAttrNm);
				vcTmpGrd.moveColumn(vnDragHeaderCellIndex, vnDropCellIndex, false);
			}

			doAddRow();

			// 임시 그리드의 컬럼 레이아웃 반환
			voTmpGrdLayout = vcTmpGrd.getColumnLayout(true);
			
			control2.redraw();
			voPrevRowElement.classList.remove(msRowClassNm);
		}
	});
}

/**
 * 마우스 포인터가 위치한 곳 밑에 있는 모든 요소를 가져오는 함수입니다.
 * @param {Number} x
 * @param {Number} y
 * @return {HTMLElement}
 */
function elementsFromPoint(x, y) {
	if (document["msElementsFromPoint"]) {
		var nodeList = document["msElementsFromPoint"](x, y);
		if (!nodeList) {
			return [];
		} else {
			return Array.prototype.slice.call(nodeList);
		}
	} else {
		return (document["elementsFromPoint"](x, y) || []);
	}
}

function doAddRow() {
	var dsData = app.lookup("dsData");
	dsData.clear();
	
	var vcGridFilter = app.lookup("grdFilter");
	var voColumnLayout = vcTmpGrd.getColumnLayout(true);
	
	var vaAutoFit = [];
	if (vcTmpGrd.autoFit == "all") {
		var vnColCnt = vcTmpGrd.columnCount;
		for (var i = 0; i < vnColCnt; i++) {
			vaAutoFit.push(i);
		}
	} else if (vcTmpGrd.autoFit == "none") {
		vaAutoFit = [];
	} else {
		vaAutoFit = vcTmpGrd.autoFit.replace(/ /g, "").split(",");
		vaAutoFit = vaAutoFit.map(function(each) {
			return Number(each);
		});
	}
	
	// 헤더가 다중행인 경우 마지막 행의 데이터만 받아오도록 처리 
	for (var i = 0; i < voColumnLayout.header.length; i++) {
		// 헤더 셀이 병합 되었거나 헤더 셀이 병합되지 않았는데 다중행인 경우 마지막 행의 정보 추가
		var voHeader = voColumnLayout.header[i];
		var vnHRowCnt = vcTmpGrd.header.getRowHeights().length;
		if ((voHeader.rowIndex != vnHRowCnt - 1 && voHeader.rowIndex + voHeader.rowSpan == vnHRowCnt) || voHeader.rowIndex == vnHRowCnt - 1) {
			var voHCol = vcTmpGrd.header.getColumn(voHeader.cellIndex);
			var voAddRow = dsData.addRowData({
				headerNm: voHCol.text,
				columnWidth: voColumnLayout.columnLayout[voHCol.colIndex].width,
				autoFitBool: vaAutoFit.indexOf(voHCol.colIndex) != -1 ? true : false,
				headerFilter: voHCol.filterable,
				headerSort: voHCol.sortable
			});
			voAddRow.setAttr(msUserAttrNm, voHCol.cellIndex)
			voAddRow.setAttr("colIdx", voHCol.colIndex);
			
			// 컬럼 visible이 true인 행 체크
			vcGridFilter.setCheckRowIndex(voAddRow.getIndex(), voHeader.visible);
			
		}
	}
	
	vcGridFilter.commitData();
}

/**
 * 체크박스의 값을 초기화 한다.(이벤트 발생 x)
 * @param {Array} paCbxId 체크박스 아이디 배열
 */
function clearHeaderCheckbox(paCbxId) {
	if (!(paCbxId instanceof Array)) {
		paCbxId = [paCbxId];
	}
	for(var i = 0; i < paCbxId.length; i++) {
		app.lookup(paCbxId[i]).putValue("");
	}
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var initValue = app.getHostProperty("initValue");
	if (ValueUtil.isNull(initValue.targetGrid)) return;
	
	var dsData = app.lookup("dsData");
	
	/** @type cpr.controls.Grid */
	var vcGrid = initValue.targetGrid;
	
	/* (1) 그리드 컬럼 설정 */
	
	// 행 이동 시 컬럼 정보 변경을 위한 임시 그리드 생성
	vcTmpGrd = new cpr.controls.Grid("grdTmp");
	vcTmpGrd.init(vcGrid.getInitConfig());
	vcTmpGrd.setColumnLayout(vcGrid.getColumnLayout(true));
	voTmpGrdLayout = vcTmpGrd.getColumnLayout(true);
	
	vcGrid.header.getCellIndices().forEach(function(hclidx){
		var tmpHCol = vcTmpGrd.header.getColumn(hclidx);
		var hCol = vcGrid.header.getColumn(hclidx);
		
		tmpHCol.filterable = hCol.filterable;
		tmpHCol.sortable = hCol.sortable;
	});
	
	doAddRow();
	
	setDragSource(app.lookup("grdFilter"));
	setDropTarget(app.lookup("grdFilter"));
	
	/* (2) 그리드 틀고정 */
	app.lookup("tfGrdSetting").addEventListenerOnce("selection-change", function(evt){
		var voColumnLayout = vcGrid.getColumnLayout();
		
		var dsSplit = app.lookup("dsSplit");
		for (var i = 0; i < vcGrid.header.cellCount; i++) {
			var voHeader = voColumnLayout.header[i];
			// 헤더 셀이 병합 되었거나 헤더 셀이 병합되지 않았는데 다중행인 경우 제외
			var vaHeaderCellIdx = vcGrid.getHeaderCellIndices(voHeader.colIndex);
			if (vaHeaderCellIdx.length > 1 && voHeader.rowIndex!=vaHeaderCellIdx.length-1) continue;
	
	
			// 체크박스, 라디오, 행 인덱스 상태 컬럼인 경우 제외 
			var voHColumn = vcGrid.header.getColumn(voHeader.cellIndex);
			if(voHColumn.columnType != "normal") continue;
			if(voHColumn.text == AppProperties.GRID_INDEX_COL_HEADER_TEXT || voHColumn.text == AppProperties.GRID_STATE_COL_HEADER_TEXT) continue;
			
			// 데이터셋에 그리드 컬럼 정보 추가
			dsSplit.addRowData({
				headerNm: voHColumn.text,
				column: voHColumn.cellIndex
			});
		}
		
		// 그리드에 설정된 split 정보 입력
		var vnLeftSplit = "";
		if(vcGrid.leftSplit != 0) {
			// 병합된 셀의 마지막 셀이 아닌 경우 셀 정보 재계산
			var voHCol = voColumnLayout.header[vcGrid.leftSplit-1];
			vcGrid.getHeaderCellIndices(voHCol.colIndex).forEach(function(each){
				var voHColumn = vcGrid.header.getColumn(each); 
				if(voHColumn.colSpan > 1 && (voHColumn.colIndex + voHColumn.colSpan - 1) != voHCol.colIndex) {
					voHCol = voColumnLayout.header[vcGrid.leftSplit];
				}
			});
			
			var vnCellIdx = vcGrid.header.getColumn(voHCol.cellIndex).cellIndex;
			vnLeftSplit = util.SelectCtl.findValue(app, "cmbLeft", "column", "column=='"+vnCellIdx+"'");
			util.SelectCtl.setValue(app, "nbeLeftWdt", vcGrid.leftSplitWidth);
		}
		util.SelectCtl.setValue(app, "cmbLeft", vnLeftSplit);
		
		var vnRightSplit = "";
		if (vcGrid.rightSplit != 0) {
			var voHCol = voColumnLayout.header[voColumnLayout.header.length - vcGrid.rightSplit];
			var vaHeaderCellIdx = vcGrid.getHeaderCellIndices(voHCol.colIndex);
			for(var i = 0; i<vaHeaderCellIdx.length; i++) {
				// 마지막셀과 병합된 셀의 중간에 위치한 셀의 경우는 고려 안함
				if(i != 0 || vaHeaderCellIdx.length == 1) continue;
				
				// 병합된 셀의 첫 번째 셀의 경우 셀 정보 재 계산
				var voHColumn = vcGrid.header.getColumn(vaHeaderCellIdx[i]);
				if(voHColumn.colIndex == voHCol.colIndex) {
					voHCol = voColumnLayout.header[voColumnLayout.header.length - vcGrid.rightSplit + 1];
				}
			}
			var vnCellIdx = vcGrid.header.getColumn(voHCol.cellIndex).cellIndex;
			vnRightSplit = util.SelectCtl.findValue(app, "cmbRight", "column", "column=='"+vnCellIdx+"'");;
			util.SelectCtl.setValue(app, "nbeRightWdt", vcGrid.rightSplitWidth);
		}
		util.SelectCtl.setValue(app, "cmbRight", vnRightSplit);
		
		if(vcGrid.topSplit != 0) {
			util.Control.setValue(app, "nbeTop", vcGrid.topSplit);
			util.Control.setValue(app, "nbeTopHgt", vcGrid.topSplitHeight);	
		}
		if(vcGrid.bottomSplit != 0) {
			util.Control.setValue(app, "nbeBottom", vcGrid.bottomSplit);
			util.Control.setValue(app, "nbeBtmHgt", vcGrid.bottomSplitHeight);
		}
		
		util.Control.redraw(app, ["cmbLeft", "cmbRight", "nbeTop", "nbeBottom", "nbeLeftWdt", "nbeRightWidth", "nbeTopHgt", "nbeBtmHgt"]);
		
		var vnRowCount = vcGrid.getRowCount();
		app.lookup("nbeTop").max = vnRowCount;
		app.lookup("nbeBottom").max = vnRowCount;
	})
}

/*
 * "초기화" 버튼(btnReset)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnResetClick(e){
	var btnReset = e.control;
	
	var initValue = app.getHostProperty("initValue");
	if (ValueUtil.isNull(initValue.targetGrid)) return;
	
	var tfGrdSetting = app.lookup("tfGrdSetting");
	var voSelection = tfGrdSetting.getSelectedTabItem();
	
	switch(voSelection.name){
		case "filter" : // 컬럼설정
		
			var vcGrid = initValue.targetGrid;
			vcTmpGrd.init(vcGrid.getInitConfig());
			voTmpGrdLayout = vcTmpGrd.getColumnLayout(true);
			clearHeaderCheckbox(["cbxSort", "cbxFilter", "cbxAutoSize"]);
			doAddRow();
			break;
		case "split" : // 틀고정
			util.Control.reset(app, ["cmbLeft", "cmbRight", "nbeTop", "nbeBottom", "nbeLeftWdt", "nbeRightWdt", "nbeTopHgt", "nbeBtmHgt"]);
			break;
	}
}

/*
 * "닫기" 버튼(btnClose)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnCloseClick(e){
	var btnClose = e.control;
	
	// 임시 그리드 객체 제거
	if(vcTmpGrd) vcTmpGrd.dispose();
	
	app.close();
}

/*
 * "개인화저장" 버튼(btnPersonal)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPersonalClick(e){
	var btnPersonal = e.control;
	
	var initValue = app.getHostProperty("initValue");
	if (ValueUtil.isNull(initValue.targetGrid)) return;

	/** @type cpr.controls.Grid */
	var vcGrid = initValue.targetGrid;
	
	var tfGrdSetting = app.lookup("tfGrdSetting");
	var voSelection = tfGrdSetting.getSelectedTabItem();

	switch(voSelection.name){
		case "filter" : // 컬럼설정

			// 변경된 컬럼 너비 적용
			var vcGridFilter = app.lookup("grdFilter");
			vcGridFilter.dataSet.getRowStatedIndices(cpr.data.tabledata.RowState.UPDATED).forEach(function(each){
				var vnCellIdx = vcGridFilter.getRow(each).getAttr(msUserAttrNm)
				vcTmpGrd.resizeColumn(vnCellIdx, vcGridFilter.getRow(each).getValue("columnWidth") + "px");
			});
			
			// 변경된 컬럼 visible 적용
			var vnRowCount = vcGridFilter.dataSet.getRowCount();
			var vaAutoFitTmp = [];
			for (var i = 0; i < vnRowCount; i++) {
				var voRow = vcGridFilter.getRow(i);
				var vnColIdx = voRow.getAttr("colIdx");
				var voHColumn = vcTmpGrd.header.getColumn(voRow.getAttr(msUserAttrNm));
				// 컬럼이 병합된 경우 병합된 컬럼 visible 여부 같이 변경
				if (vcTmpGrd.header.getColumn(voRow.getAttr(msUserAttrNm)).colSpan > 1) {
					for (var j = vnColIdx; j < vnColIdx + voHColumn.colSpan; j++) {
						vcTmpGrd.columnVisible(j, voRow.rowChecked, "column-index");
					}
				} else {
					vcTmpGrd.columnVisible(vnColIdx, voRow.rowChecked, "column-index");
				}
				
				if(voRow.getValue("autoFitBool") === "true") {
					vaAutoFitTmp.push(voHColumn.cellIndex);
				}
				
				var voRHColumn = vcGrid.header.getColumn(voRow.getAttr(msUserAttrNm));
				// 변경된 필터 사용여부 적용
				voRHColumn.filterable = ValueUtil.fixBoolean(voRow.getValue("headerFilter"));
			// 변경된 정렬 사용여부 적용
				voRHColumn.sortable = ValueUtil.fixBoolean(voRow.getValue("headerSort"));
			}
			
			// 변경된 autoFit 적용
			var vsAutoFilt =  vaAutoFitTmp.join(",");
			if(vsAutoFilt == "") vsAutoFilt = "none";
			vcTmpGrd.autoFit = vsAutoFilt;
			
			voTmpGrdLayout = vcTmpGrd.getColumnLayout(true);
			
			// 메인 화면 그리드에 임시 그리드의 레이아웃 구조 적용
			vcGrid.setColumnLayout(voTmpGrdLayout);
			vcGrid.redraw();
			
			break;
		case "split" : // 틀고정
			
			var vnGrdWidth = vcGrid.getActualRect().width;
			var vnGrdHeight = vcGrid.getActualRect().height;
			var vnRowCount = util.DataSet.getRowCount(app, "dsSplit");
			
			// 좌/우 split 설정
			var voLeftColIdx;
			var vnLeftSplit = util.Control.getValue(app, "cmbLeft");
			var vnLeftSplitWidth = ValueUtil.fixNumber(util.Control.getValue(app, "nbeLeftWdt"));
			var voLeftCol = vcGrid.header.getColumn(ValueUtil.fixNumber(vnLeftSplit));
			if(voLeftCol.colSpan == 1) voLeftColIdx = voLeftCol.colIndex;
			else voLeftColIdx = voLeftCol.colIndex + (voLeftCol.colSpan-1);
			
			var vnRightSplit = util.Control.getValue(app, "cmbRight");
			var vnRightColIdx = vcGrid.header.getColumn(ValueUtil.fixNumber(vnRightSplit)).colIndex;
			var vnRightSplitWidth = ValueUtil.fixNumber(util.Control.getValue(app, "nbeRightWdt"));
			if(!ValueUtil.isNull(vnLeftSplit) || !ValueUtil.isNull(vnRightSplit)) {
				if(voLeftColIdx >= vnRightColIdx && vnRightSplit != 0) {
					if(!util.Msg.confirm("우측 틀고정 컬럼은 좌측 틀고정 컬럼이랑 동일하거나 이전 컬럼을 선택할 수 없습니다.")) {
						return;
					}
					
				} else if(vnLeftSplitWidth + vnRightSplitWidth > vnGrdWidth) {
					if(!util.Msg.confirm("그리드 틀 고정의 너비가 그리드 크기보다 큰 경우 데이터가 겹쳐보이거나 보이지 않는 현상이 발생할 수 있습니다.")) {
						return;
					}
					
				} else if(vnLeftSplitWidth == 0 || vnRightSplitWidth == 0) {
					var vnWidth = 0;
					if(!ValueUtil.isNull(vnLeftSplit)) {	// leftSplit 너비 계산
						for(var i=0; i<=voLeftColIdx; i++) {
							vnWidth += vcGrid.getColumnLayout().columnLayout[i].width;
						}
					}
					
					if(!ValueUtil.isNull(vnRightSplit)) {	// rightSplit 너비 계산
						for(var i=vnRightColIdx; i<vcGrid.columnCount; i++) {
							vnWidth += vcGrid.getColumnLayout().columnLayout[i].width;
						}
					}
					
					if(vnWidth > vnGrdWidth) {
						if(!util.Msg.confirm("그리드 틀 고정의 너비가 그리드 크기보다 큰 경우 데이터가 겹쳐보이거나 보이지 않는 현상이 발생할 수 있습니다.")) {
							return;
						}
					}
					
				}
			}
			if(vnLeftSplit == "") {
				vcGrid.leftSplit = 0;
				vcGrid.leftSplitWidth = 0;
			} else {
				vcGrid.setLeftSplitCellIndex(vnLeftSplit);
				if(vnLeftSplitWidth != "") vcGrid.leftSplitWidth = vnLeftSplitWidth;
			}
			if(vnRightSplit == "") {
				vcGrid.rightSplit = 0;
				vcGrid.rightSplitWidth = 0;
			} else {
				vcGrid.setRightSplitCellIndex(vnRightSplit);
				if(vnRightSplitWidth != "") vcGrid.rightSplitWidth = vnRightSplitWidth;
			}
		
			// 상/하 split 설정
			var vnTopSplit = ValueUtil.fixNumber(util.Control.getValue(app, "nbeTop"));
			var vnTopSplitHeight = ValueUtil.fixNumber(util.Control.getValue(app, "nbeTopHgt"));
			var vnBottomSplit = ValueUtil.fixNumber(util.Control.getValue(app, "nbeBottom"));
			var vnBottomSplitHeight = ValueUtil.fixNumber(util.Control.getValue(app, "nbeBtmHgt"));
			if(vnTopSplit != 0 && vnBottomSplit != 0) {
				var vnViewingIndex = vcGrid.getViewingEndRowIndex() - vcGrid.getViewingStartRowIndex();
				if((vnTopSplit + vnBottomSplit >= vnViewingIndex) || (vnTopSplitHeight + vnBottomSplitHeight > vnGrdHeight)) {
					if(!util.Msg.confirm("그리드 틀 고정의 높이가 그리드 크기보다 큰 경우 데이터가 겹쳐보이거나 보이지 않는 현상이 발생할 수 있습니다.")) {
						return;
					}
					
				} else if(vnTopSplitHeight == 0 || vnBottomSplitHeight == 0) {
					if(vnTopSplitHeight == 0) vnTopSplitHeight = 80;
					if(vnBottomSplitHeight == 0) vnBottomSplitHeight = 80;
					
				}
			}
			vcGrid.topSplit = vnTopSplit;
			vcGrid.bottomSplit = vnBottomSplit;
			vcGrid.topSplitHeight = vnTopSplitHeight;
			vcGrid.bottomSplitHeight = vnBottomSplitHeight;
			
			vcGrid.redraw();
			break;
	}	
	
	// 개인화 저장
	var vsGridKey = vcGrid.getAppInstance().id + vcGrid.id;
	var voGridLayout = vcGrid.getColumnLayout();
	var vsGridLayout = JSON.stringify(voGridLayout);
	localStorage.setItem( vsGridKey , vsGridLayout);
	util.Msg.notify(app, "그리드 상태가 저장되었습니다.");
}

/*
 * 루트 컨테이너에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBodyClick(e){
	e.stopPropagation();
}

/*
 * 넘버 에디터에서 mousedown 이벤트 발생 시 호출.
 * 사용자가 컨트롤 위에 포인터를 위치한 상태로 마우스 버튼을 누를 때 발생하는 이벤트.
 */
function onNumberEditorMousedown(e){
	// 너비 수정 시 드래그 방지
	e.stopPropagation();
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCheckBoxValueChange(e){
	setAllCheck("headerSort", e.newValue);
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCheckBoxValueChange2(e){
	setAllCheck("headerFilter", e.newValue);	
}

/*
 * 체크 박스에서 value-change 이벤트 발생 시 호출.
 */
function onCheckBoxValueChange3(e){
	setAllCheck("autoFitBool", e.newValue);	
}

/*
 * 탭 폴더에서 selection-change 이벤트 발생 시 호출.
 * Tab Item을 선택한 후에 발생하는 이벤트.
 */
function onTfGrdSettingSelectionChange(e) {
	var tfGrdSetting = e.control;
	var vsBtnValue = tfGrdSetting.getSelectedTabItem().id == 1 ? "개인화저장" : "적용";
	util.Control.setValue(app, "btnPersonal", vsBtnValue)
}
