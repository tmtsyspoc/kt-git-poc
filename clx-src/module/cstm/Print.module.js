/************************************************
 * Print.module.js
 * 
 * Version 1.0
 * Updated Date : 2021-04-08
 ************************************************/

/**
 * 프린트할 html 반환
 */
function getHTMLToGrid(gridArr, pageInfo){
	var htmlTagArr= [];
	htmlTagArr[htmlTagArr.length] = "<div class='page'>";

	if (pageInfo != null) {
		var name;
		// 제목
		if (pageInfo.hasOwnProperty("title")) {
			htmlTagArr[htmlTagArr.length] = "<h1>"+pageInfo["title"]+"</h1>";
		}
		// 결재선 테이블
		if (pageInfo.hasOwnProperty("approvalLine")) {
			var approvalLineTagArr = [];
			var approvalLineArr = pageInfo["approvalLine"].split(",");
		
			if(pageInfo["approvalLocation"] == "left"){
				approvalLineTagArr[approvalLineTagArr.length] = "<table class='approval_table left' >";
			}else{
				approvalLineTagArr[approvalLineTagArr.length] = "<table class='approval_table right' >";
			}
			approvalLineTagArr[approvalLineTagArr.length] = "<tr>";
			for (var i = 0; i < approvalLineArr.length; i++) {
				approvalLineTagArr[approvalLineTagArr.length] = "<td>"+approvalLineArr[i]+"</td>";
			}
			approvalLineTagArr[approvalLineTagArr.length] = "</tr><tr>";
			for (var i = 0; i < approvalLineArr.length; i++) {
				approvalLineTagArr[approvalLineTagArr.length] = "<td></td>";
			}
			approvalLineTagArr[approvalLineTagArr.length] = "</tr>";
			approvalLineTagArr[approvalLineTagArr.length] = "</table>";
			htmlTagArr[htmlTagArr.length] = approvalLineTagArr.join("");
		}
		// 상세정보
		if (pageInfo.hasOwnProperty("info")) {
			var infoTagArr = [];
			if(pageInfo["approvalLocation"] == "left"){
				infoTagArr[infoTagArr.length] = "<div class='info_group right'>" 
			}else{
				infoTagArr[infoTagArr.length] = "<div class='info_group left'>" 
			}
			
			/** @type Array */
			var vaInfo = pageInfo["info"];
			vaInfo.forEach(function(each){
				var key = Object.keys(each)[0];
				if(key == "출력일시"){
					if(each[key] == "Y"){
						var value = new Date().toLocaleString();
						infoTagArr[infoTagArr.length] = "<p>"+  key + " : " + value + "</p>";
					}
				}else{
					if(key == "출력자명"){
						name = each[key];
					}
					var value = each[key];
					infoTagArr[infoTagArr.length] = "<p>"+  key + " : " + value + "</p>";
				}
			});
			infoTagArr[infoTagArr.length] = "</div>" 
			htmlTagArr[htmlTagArr.length] = infoTagArr.join("");
		}
	}
	
	
	// 그리드
	for (var i = 0; i < gridArr.length; i++) {
		htmlTagArr[htmlTagArr.length] = getGridTable(gridArr[i]).join("");
		
		if (i != (gridArr.length-1)) {
			htmlTagArr[htmlTagArr.length] = "<div style='page-break-before: always; '> </div>";
		}
	}
	// 출력자명이 있는경우
	if(name){
		htmlTagArr[htmlTagArr.length] = "<div class='background-logo'><img src='../../../../theme/img/pages/main/logo.png' alt='Logo'><div class='background-text'>"+ name + "</div></div>";
	}else{
		htmlTagArr[htmlTagArr.length] = "<div class='background-logo'><img src='../../../../theme/img/pages/main/logo.png' alt='Logo'></div>";
	}
	htmlTagArr[htmlTagArr.length] = "</div>";
	
	return htmlTagArr.join("");
}

/**
 * 그리드 데이터를 통한 table 반환
 * @param {cpr.controls.Grid} grid
 */
function getGridTable(grid) {
	var exportData = grid.getExportData({
		exceptStyle : false,
		applyFormat: true,
		applySuppress: true
	});
	
	var tableTagArr = [];
	tableTagArr[tableTagArr.length] = "<table class='content'>";
	var cols = exportData.cols;
	tableTagArr[tableTagArr.length] = "<colgroup>";
	var colWidths = [];
	var totalColumnWidth = 0;
	for (var ci = 0; ci < cols.length; ci++) {
		var colWidth = cpr.utils.ParamUtil.parseSize(cols[ci]["width"]).size;
		totalColumnWidth += colWidth;
		colWidths[colWidths.length] = colWidth;
	}
	for (var ci = 0; ci < colWidths.length; ci++) {
		tableTagArr[tableTagArr.length] = "<col style='width : " + (colWidths[ci] / totalColumnWidth) + "%'>";
	}
	tableTagArr[tableTagArr.length] = "</colgroup>";
	
	var layouts = exportData.rowgroups;
	for (var li = 0; li < layouts.length; li++) {
		var layout = layouts[li];
		var datas = layout.data;
		var styles = layout.style;
		var trTagArr = [];
		
		// 셀별 데이터를 trTagArr에 배열로 추가
		for (var ri = 0; ri < datas.length; ri++) {
			var tdTagArr = [];
			for (var ci = 0; ci < datas[ri].length; ci++) {
				var rowIndex = styles[ci]["rowindex"];
				if (tdTagArr[rowIndex] == null) {
					tdTagArr[rowIndex] = [];
				}
				if (Object.keys(datas[ri][ci]).length != 0) {
					tdTagArr[rowIndex][tdTagArr[rowIndex].length] = getTd(datas[ri][ci], styles[ci]).join("");
				}
			}
			trTagArr = trTagArr.concat(tdTagArr);
		}
		
		if (layout["region"] == "header") {
			tableTagArr[tableTagArr.length] = "<thead>";
		}
		for (var tri=0; tri < trTagArr.length; tri++) {
			tableTagArr[tableTagArr.length] = "<tr>";
			tableTagArr[tableTagArr.length] = trTagArr[tri].join("");
			tableTagArr[tableTagArr.length] = "</tr>";
		}
		if (layout["region"] == "header") {
			tableTagArr[tableTagArr.length] = "</thead>";
		}
	}
	
	tableTagArr[tableTagArr.length] = "</table>";
	return tableTagArr;
	
}

/**
 * 셀 데이터를 통한 td 반환
 * @param {any} cell
 * @param {any} columnInfo
 * @returns {string[]}
 */
function getTd(cell, columnInfo) {
	var value = cell["value"];
	var cellStyle = cell["style"];
	var columnStyle = columnInfo["style"];
	var style = _.extend({}, columnStyle, cellStyle);
	var styleKeys = Object.keys(style);
	
	var tdTagArr = [];
	tdTagArr[tdTagArr.length] = "<td"; 
	if (cell.hasOwnProperty("rowspan")) {
		if (cell["rowspan"] > 1) {
			tdTagArr[tdTagArr.length] = " rowspan='"+cell["rowspan"]+"'";
		}
	} else if (columnInfo["rowspan"] > 1) {
		tdTagArr[tdTagArr.length] = " rowspan='"+columnInfo["rowspan"]+"'";
	}
	if (cell.hasOwnProperty("colspan")) {
		if (cell["colspan"] > 1) {
			tdTagArr[tdTagArr.length] = " colspan='"+cell["colspan"]+"'";
		}
	} else if (columnInfo["colspan"] > 1) {
		tdTagArr[tdTagArr.length] = " colspan='"+columnInfo["colspan"]+"'";
	}
	
	if (styleKeys.length > 0) {
		tdTagArr[tdTagArr.length] = " style='";
		for (var si = 0; si < styleKeys.length; si++) {
			tdTagArr[tdTagArr.length] = styleKeys[si] + " : " + style[styleKeys[si]] +"; ";
		}
		tdTagArr[tdTagArr.length] = "'";
	}
	tdTagArr[tdTagArr.length] = ">" + value + "</td>";
	
	return tdTagArr;
}

/**
 * 입력받은 그리드 프린트
 * @param {cpr.controls.Grid[]} gridArr 프린트 하고자 하는 그리드 배열
 * @param {{title: string<!-- 프린트 상단 제목 -->, approvalLine: string[]<!-- 결재라인 정보 -->}} pageInfo 프린트 시 추가 정보.
 */
globals.printGrid = function(gridArr, pageInfo) {
	
	sessionStorage.setItem("print-content", getHTMLToGrid(gridArr, pageInfo)); 
	var width = 1500;
	var height = 700;
	
	// 현재 창의 화면 중심 계산
	var w = window.innerWidth || document.documentElement.clientWidth || screen.width;
	var h = window.innerHeight || document.documentElement.clientHeight || screen.height;
	
	var left = (w / 2) - (width / 2);
	var top = (h / 2) - (height / 2);
	// TODO 팝업화면 경로가 변경되었을 시 아래의 URL을 수정하십시오.
	var popWindow = window.open('app/sce/A5/print/print.html',"print",'height='+height+',width='+width + ',left=' + left + ',top=' + top);
	return true;
} 

