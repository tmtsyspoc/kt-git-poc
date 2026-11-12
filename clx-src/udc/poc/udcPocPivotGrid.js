/************************************************
 * pivot.js
 * Created at 2020. 4. 2. 오후 5:13:08.
 ************************************************/

/*
 * Body에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange(/* cpr.events.CPropertyChangeEvent */ e){
	var propName = e.property;
	var propValue = e.newValue;
	
	switch(propName) {
		case "suppressedCellType" : {
			var grd = app.lookup("grd1");
			grd.suppressedCellType = propValue;
			break;
		}
	}
}

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	return "Not Support";
};

/**
 * PivotGrid를 그리기 위해 설정하는 함수.
 * @param {cpr.data.DataSet} dataset
 * @param {cols:{column:string}[], rows:{column:string, label:string}[], values:{column:string, label:string, aggregator:(sum|avg|min|max|count)}[]}
 */
exports.setup = function(/* cpr.data.DataSet */ dataset, config) {
	var ds = app.lookup("ds");
	var grd = app.lookup("grd1");
	ds.clear(true);
	
	/**
	 * {
	 *   key:{
	 *    [newColumnName1]: value(config.rows[0].column),
	 *    [newColumnName1]: value(config.rows[1].column),
	 *    ...
	 *   },
	 *   data : { [value(config.cols[0].column)]: { [value(config.cols[1].column)]..: { [config.values[0].label]: 0+,  [config.values[1].label]: 0+ } } }
	 * }[]
	 */
	var dataRows = []; // PivotGrid에 적용할 DataSet의 Data를 가진 Row의 중간형태
	var objMap = new cpr.utils.ObjectMap(); // Entry{keyobj:{[key:string]:string}, valueObj:{[depthValue]:{[depthValue]:{[leaf1Label]:number, [leaf2Label]:number, ...}}}}
	/**
	 * DataSet Column 의  dataRows에서의 값 경로
	 * {Path:string[]}[]
	 */
	var dataCols = [];
	/**
	 * DataSet Column 정보
	 * {name:string, dataType:string|number|decimal, aggregator?:(sum|avg|min|max|count)}[]
	 */
	var dsColumns = [];
	
	var rowColLeng = config.rows.length; // 행으로 처리될 컬럼의 개수
	for(var idx = 0; idx < rowColLeng; idx++) {
		var rowCol = config.rows[idx]; // {column:string, label:string}
		var columnName = "column" + (idx + 1);
		/**
		 * @type cpr.data.header.Header
		 */
		var rowColHeader = dataset.getColumn(rowCol.column).getHeader();
		var dataType = rowColHeader.getDataType();
		
		dataCols[dataCols.length] = [columnName];
		dsColumns[dsColumns.length] = {
			name : columnName,
			dataType : dataType
		};
	}
	
	var colLeng = config.cols.length; // 컬럼 필드의 개수
	var valLeng = config.values.length; // 값 필드의 개수
	
	var rowCount = dataset.getRowCount();
	// 소스 DataSet의 값 집계
	for(var idx = 0; idx < rowCount; idx++) {
		/*
		 * @type cpr.data.Row
		 */
		var row = dataset.getRow(idx);

		var isNew = false;
		var keyObj = {};
		for(var rci = 0; rci < rowColLeng; rci++) {
			var rowCol = config.rows[rci]; // {column:string, label:string}
			keyObj["column" + (rci + 1)] = row.getValue(rowCol.column);
		}
		
		var objMapEntry = objMap.findEntry(function(key, value, index) {
			for(var rci = 0; rci < rowColLeng; rci++) {
				var colNm = "column" + (rci + 1);
				if(key[colNm] != keyObj[colNm]) {
					return false;
				}
			}
			return true;
		});
		var valueObj = null;
		if(objMapEntry) {
			valueObj = objMapEntry.value;
			isNew = false;
		} else {
			valueObj = {};
			objMap.put(keyObj, valueObj);
			isNew = true;
		}
		
		var colPath = []; // 새로운 데이터셋의 데이터경로
		var parentValueWrap = valueObj;
		for(var ci = 0; ci < colLeng; ci++) {
			var colConf = config.cols[ci]; // {column:string, label:string}
			var colValue = row.getValue(colConf.column);
			colPath[colPath.length] = colValue;

			var valueCol = parentValueWrap[colValue];
			if(valueCol == null) {
				valueCol = {};
				parentValueWrap[colValue] = valueCol;
			}
			parentValueWrap = valueCol;
		}
		
		// 통계 데이터 생성
		for(var vi = 0; vi < valLeng; vi++) {
			var valConf = config.values[vi]; // {column:string, label:string, aggregator:(sum|avg|min|max|count)}
			var value = row.getValue(valConf.column);
			var valLabel = valConf.label;
			var aggregator = valConf.aggregator;
			if(!aggregator) {
				aggregator = "sum";
			}
			
			// 통계함수별 처리(Nexacro는 sum, avg, count, min, max, function을 제공)
			switch(aggregator) {
				case "sum" : {
					if(parentValueWrap.hasOwnProperty(valLabel)) {
						parentValueWrap[valLabel] += value;
					} else {
						parentValueWrap[valLabel] = value;
					}
					break;
				}
				case "avg" : {
					if(parentValueWrap.hasOwnProperty(valLabel)) { // 총합
						parentValueWrap[valLabel] += value;
					} else {
						parentValueWrap[valLabel] = value;
					}
					var dataCountLabel = valLabel + "_cnt"; // 카운트 저장 필드명
					if(parentValueWrap.hasOwnProperty(dataCountLabel)) {
						parentValueWrap[dataCountLabel] += 1;
					} else {
						parentValueWrap[dataCountLabel] = 1;
					}
					break;
				}
				case "min" : {
					if(parentValueWrap.hasOwnProperty(valLabel)) {
						var oldValue = parentValueWrap[valLabel];
						if(oldValue > value) {
							parentValueWrap[valLabel] = value;
						}
					} else {
						parentValueWrap[valLabel] = value;
					}
					break;
				}
				case "max" : {
					if(parentValueWrap.hasOwnProperty(valLabel)) {
						var oldValue = parentValueWrap[valLabel];
						if(oldValue < value) {
							parentValueWrap[valLabel] = value;
						}
					} else {
						parentValueWrap[valLabel] = value;
					}
					break;
				}
				case "count" : {
					if(parentValueWrap.hasOwnProperty(valLabel)) {
						parentValueWrap[valLabel] += 1;
					} else {
						parentValueWrap[valLabel] = 1;
					}
					break;
				}
				default : {
					if(parentValueWrap.hasOwnProperty(valLabel)) {
						parentValueWrap[valLabel] += value;
					} else {
						parentValueWrap[valLabel] = value;
					}
				}
			}

			var colContains = false;
			var leafPath = colPath.concat([valLabel]);
			outer : for(var pi = rowColLeng; pi < dataCols.length; pi++) {
				var dsColPath = dataCols[pi];
				for(var pci = 0; pci < leafPath.length; pci++) {
					if(leafPath[pci] != dsColPath[pci]) {
						continue outer;
					}
				}
				colContains = true;
				break outer;
			}
			if(colContains == false) { // 기존 컬럼이 없을 경우 컬럼 추가
				dataCols[dataCols.length] = leafPath;
				// TODO 정밀도, 단위환산 등 처리
				dsColumns[dsColumns.length] = {
					name : "column" + dataCols.length,
					dataType : cpr.data.tabledata.DataType.NUMBER,
					aggregator : aggregator
				};
			}
		}
		
		if(isNew) { // 새로운 통계 행일 경우 행 추가
			dataRows[dataRows.length] = {key: keyObj, data: valueObj};
		}
	}

	// dataSet 초기화
	ds.parseData({"columns" : dsColumns});

	// DataSet row 생성
	for(var idx = 0; idx < dataRows.length; idx++) {
		var dataRow = dataRows[idx];
		
		var row = ds.pushRow();
		for(var ci = 0; ci < dataCols.length; ci++) {
			var dataCol = dataCols[ci]; // path:string[]
			
			var columnName = "column" + (ci + 1);
			var columnValue = null;
			
			if(ci < rowColLeng) {
				columnValue = dataRow.key[columnName];
			} else {
				var parentData = null;
				var dataWrapper = dataRow.data;
				var vpi = 0;
				valueLoop : for(; vpi < dataCol.length; vpi++) {
					if(dataWrapper[dataCol[vpi]] == null) {
						dataWrapper = null;
						break valueLoop;
					} else {
						parentData = dataWrapper;
						dataWrapper = dataWrapper[dataCol[vpi]];
					}
				}
				var aggregator = dsColumns[ci].aggregator;
				switch(aggregator) {
					case "avg" : {
						var total = dataWrapper;
						var dataCountLabel = dataCol[vpi - 1] + "_cnt";
						var dataCnt = parentData[dataCountLabel];
						
						// TODO 정밀도 처리
						columnValue = (total / dataCnt).toFixed(2);
						break;
					}
					default : {
						columnValue = dataWrapper;
					}
				}
			}
			
			row.setValue(columnName, columnValue);
		}
		row.setState(cpr.data.tabledata.RowState.UNCHANGED);
	}
//	ds.setRowStateAll(cpr.data.tabledata.RowState.UNCHANGED);
	
	/**
	 * @type cpr.controls.gridpart.GridConfig
	 */
	var gridInfo = createGridConfig(config, dataCols, dsColumns);
	
	// dataSet 설정
	gridInfo.dataSet = ds;

	// pivot grid 초기화
	grd.init(gridInfo);
	// pivot grid redraw
	grd.redraw();

}

/**
 * GridConfig 객체를 생성하여 리턴한다.
 * @param {cols:{column:string}[], rows:{column:string, label:string}[], values:{column:string, label:string}[]} config
 * @param [path:string][] dataCols 각 컬럼의 값 경로
 * @param {name:string, dataType:string|number|decimal}[] dsColumns
 * @return cpr.controls.gridpart.GridConfig
 */
function createGridConfig(config, dataCols, dsColumns) {
	var rowColLeng = config.rows.length; // 행으로 처리될 컬럼의 개수
	
	/**
	 * Grid의 header cell 정보
	 * {label:string,
	 *  target:"columnName",
	 *  control?:string, // Control Type
	 *  sub:{label:string,..}[]}[]
	 */
	var headerCells = [];
	var hRowCnt = 0;
	
	for(var idx = 0; idx < dataCols.length; idx++) {
		var dataCol = dataCols[idx]; // Path:string[]
		var dataColumn = dsColumns[idx]; // {name:string, dataType:string|number|decimal}
		
		if(hRowCnt < dataCol.length) {
			hRowCnt = dataCol.length;
		}
		
		if(rowColLeng > idx) {
			var headerCell = {
				label: config.rows[idx].label,
				target : dataColumn.name,
				sub: null
			};
			if(config.rows[idx].hasOwnProperty("suppressible")) {
				headerCell.suppressible = config.rows[idx]["suppressible"];
			}
			if(config.rows[idx].hasOwnProperty("suppressRef")) {
				headerCell.suppressRef = config.rows[idx]["suppressRef"];
			}
			// 단일 구조
			headerCells[headerCells.length] = headerCell;
		} else {
			// 계층형 구조
			var parentCellContainer = headerCells;
			var headerCell = null;
			for(var i = 0; i < dataCol.length; i++) {
				var label = dataCol[i];
				var match = false;
				var nextContainer = null;
				check : for(var j = 0; j < parentCellContainer.length; j++) {
					headerCell = parentCellContainer[j];
					if(headerCell && headerCell.label == label) { // TODO rowlabel의 cell은 비교 대상에서 제거
						match = true;
						nextContainer = headerCell.sub;
						if(nextContainer == null) {
							nextContainer = [];
							headerCell.sub = nextContainer;
						}
						break check;
					}
				}
				if(match == false) {
					nextContainer = [];
					headerCell = {
						label : label,
						target : null,
						sub : nextContainer
					};
					parentCellContainer[parentCellContainer.length] = headerCell;
				}
				parentCellContainer = nextContainer;
			}
			if(headerCell) {
				headerCell.sub = null;
				headerCell.target = dataColumn.name;
				headerCell.control = "number"; // 값을 출력하는 DetailCell은 NumberEditor로 처리
			} else {
				console.log("GridCell is null!!!");
			}
		}
	}
	
	/**
	 * @type cpr.controls.gridpart.GridConfig
	 */
	var gridInfo = {};
	/**
	 * Detail Cell에 매핑할 dataset의 columnName 및 셀의 속성 배열
	 * {
	 *  column:string,
	 *  suppressible?:boolean,
	 *  suppressRef?:number,
	 *  control?:string // detail cell의 컨트롤 타입
	 * }
	 */
	var detailCells = [];
	
	// grid columns 설정
	gridInfo.columns = [];
	for(var i = 0; i < dsColumns.length; i++) {
		gridInfo.columns[gridInfo.columns.length] = {width: "100px"};
	}
	
	// grid header 생성
	gridInfo.header = function() {
		var headerInfo = {
			rows: [],
			cells: []
		};
		// grid header의 행 설정
		for(var i = 0; i < hRowCnt; i++) {
			headerInfo.rows[headerInfo.rows.length] = {height: "37px"};
		}
		
		var startRowIdx = 0;
		var startColIdx = 0;
		var maxRowSpan = hRowCnt;
		var cellCreator = function(headerCell, idx) {
			var cellInfo = {
				constraint: {},
				configurator: function(cell) {
					if(headerCell.target) {
						cell.targetColumnName = headerCell.target;
						cell.sortable = true;
					}
					cell.text = headerCell.label;
				}
			};
			cellInfo.constraint.rowIndex = startRowIdx;
			cellInfo.constraint.colIndex = startColIdx;
			cellInfo.constraint.rowSpan = maxRowSpan - getMaxDepth(headerCell) + 1;
			cellInfo.constraint.colSpan = getColSpan(headerCell);
			
			if(headerCell.target) {
				var detailCell = {
					column: headerCell.target
				};
				
				if(headerCell.hasOwnProperty("suppressible")) {
					detailCell.suppressible = headerCell["suppressible"];
				}
				if(headerCell.hasOwnProperty("suppressRef")) {
					detailCell.suppressRef = headerCell["suppressRef"];
				}
				if(headerCell.control === "number") {
					detailCell.control = "number";
				}
				
				detailCells[cellInfo.constraint.colIndex] = detailCell;
			}
			
			headerInfo.cells[headerInfo.cells.length] = cellInfo;
			
			if(headerCell.sub && headerCell.sub.length > 0) {
				var maxRowSpanBack = maxRowSpan;
				
				startRowIdx += cellInfo.constraint.rowSpan;
				startColIdx = cellInfo.constraint.colIndex;
				maxRowSpan -= cellInfo.constraint.rowSpan;

				headerCell.sub.forEach(cellCreator); // header group을 처리하기 위해 재귀호출
				
				maxRowSpan = maxRowSpanBack; // 재귀호출 후 값 원복
			}
			
			// 다음셀 연산을 위해 인덱스 값 초기화
			startRowIdx = cellInfo.constraint.rowIndex;
			startColIdx = cellInfo.constraint.colIndex + cellInfo.constraint.colSpan;
		}
		
		headerCells.forEach(cellCreator);
		
		
		return headerInfo;
	}();
	
	// grid detail 생성
	gridInfo.detail = function() {
		var detailInfo = {
			rows: [{height: "37px"}], // detail은 한 행
			cells: []
		};
		
		detailCells.forEach(function(detailCell, idx) {
			var cellInfo = {
				constraint: {rowIndex: 0, colIndex: idx},
				configurator: function(cell) {
					cell.columnName = detailCell.column;
					
					if(detailCell.control == "number") {
						cell.control = (function() {
							var numberEditor = new cpr.controls.NumberEditor();
							numberEditor.style.css({
								"text-align" : "right"
							});
							numberEditor.bind("value").toDataColumn(detailCell.column);
							
							// TODO 정밀도, 표현형식 처리
							
							return numberEditor;
						})();
					}
					if(detailCell.suppressible) {
						cell.suppressible = true;
					}
					if(detailCell.hasOwnProperty("suppressRef")) {
						cell.suppressRef = detailCell["suppressRef"];
					}
				}
			};
			detailInfo.cells[detailInfo.cells.length] = cellInfo;
		});
		
		return detailInfo;
	}();
	
	return gridInfo;
}

/**
 * 전달받은 gridCell이 포함하는 최하단 노드의 개수를 리턴한다.
 * @param {label:string, target:"columnName", sub:{label:string,..}[]} gridCell
 * @return
 */
function getColSpan(gridCell) {
	var colSpan = 0;
	
	if(gridCell.sub == null || gridCell.sub.length == 0) {
		colSpan += 1;
	} else {
		var sub = gridCell.sub;
		for(var idx = 0; idx < sub.length; idx++) {
			colSpan += getColSpan(sub[idx]);
		}
	}
	
	return colSpan;
}

/**
 * 전달받은 gridCell이 포함하는 최하단 노드까지의 깊이를 리턴한다.
 * @param {label:string, target:"columnName", sub:{label:string,..}[]} gridCell
 */
function getMaxDepth(gridCell) {
	var sub = gridCell.sub;
	if(sub == null || sub.length == 0) {
		return 1;
	}
	var depth = 0;
	for(var i = 0; i < sub.length; i++) {
		var subcell = sub[i];
		var subCellDepth = getMaxDepth(subcell);
		if(depth < subCellDepth) {
			depth = subCellDepth;
		}
	}
	return depth + 1;
}

