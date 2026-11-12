/************************************************
 * K7-2.js
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

/* ==== [app/sce/A4/A4-3.clx] 4.3 화면 접근 통제 기능 ==== */
/************************************************
 * 전역변수
 ************************************************/

/**
 * 
 */

/************************************************
 * 사용자정의함수
 ************************************************/

/**
 * 
 * @param {cpr.data.DataSet} pcDataSet 데이터셋
 * @param {String} psLabelCol 라벨 컬럼명
 * @param {String} psValueCol 값 컬럼명
 * @param {String} psParentCol 부모값 컬럼명
 * @param {String} psLevelCol 트리의 아이템별 depth(level)를 저장할 컬럼명
 * @param {String} psSortCol 트리의 아이템별 시각적 아이템 인덱스를 저장할 컬럼명
 */
function GridTreeCellTuner(pcDataSet,psLabelCol,psValueCol,psParentCol,psLevelCol,psSortCol){
	
	this._vnSortIndex = 0;
	
	this._ds = pcDataSet;
	this._label = psLabelCol;
	this._value = psValueCol;
	this._parent = psParentCol;
	this._level = psLevelCol;
	this._sort = psSortCol;
}

GridTreeCellTuner.prototype.getTreeData = function(){
	var start = moment();
	console.log(start.format("YYYY-MM-DD HH:mm:ss"));
	var vcTree = new cpr.controls.Tree();
	vcTree.setItemSet(this._ds, {
		label: this._label,
		value: this._value,
		parentValue: this._parent
	});
	
	vcTree.redraw();
	
	var that = this;
	var vaRootItem = vcTree.findItems({depth : 0});
	var a = this.getDepthNLevel(vaRootItem);
	a.then(function(input){
			
		var vcDs = that._ds;
		vcDs.clearSort();
		vcDs.setSort(that._sort +" asc");
		vcDs.getAppInstance().getContainer().redraw();
		var end = moment();
		console.log(end.format("YYYY-MM-DD HH:mm:ss"));
		console.log(moment.duration(end.valueOf()-start.valueOf()).asSeconds());
		vcTree.dispose();
	});
}

GridTreeCellTuner.prototype.getDepthNLevel = function(/*cpr.controls.TreeItem[]*/paTreeItems){
	var that = this;
	var voPromise = new Promise(function(resolve, reject) {
		
	paTreeItems.forEach(function(each,idx){
		var eachRow = each.row;
		eachRow.putValue(that._level, each.depth+1);
		eachRow.putValue(that._sort, that._vnSortIndex);
		that._vnSortIndex = that._vnSortIndex + 1;
		var vaChildren = each.children;
		
		if(vaChildren.length > 0) {
			that.getDepthNLevel(vaChildren);
		}
		if(idx == paTreeItems.length-1) {
			resolve();
		}
	});
	});
	return voPromise;
};



/**
 * 
 * @param {cpr.data.DataSet} pcDataSet 데이터셋
 * @param {String} psLabelCol 라벨 컬럼명
 * @param {String} psValueCol 값 컬럼명
 * @param {String} psParentCol 부모값 컬럼명
 * @param {String} psLevelCol 트리의 아이템별 depth(level)를 저장할 컬럼명
 * @param {String} psSortCol 트리의 아이템별 시각적 아이템 인덱스를 저장할 컬럼명
 */
function createTreecellTuner(pcDataSet,psLabelCol,psValueCol,psParentCol,psLevelCol,psSortCol){
	
	var tuner =  new GridTreeCellTuner(pcDataSet, psLabelCol, psValueCol, psParentCol,psLevelCol,psSortCol); 
	tuner.getTreeData();
}

/************************************************
 * 컨트롤 이벤트
 ************************************************/


/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	var vsUserType = util.Main.getUserInfo(app,"USER_TYPE");
	if(vsUserType =="user1") {
		util.Control.setEnable(app,false,"btnSave");
	}
	
	var dsAllMenu = app.lookup("dsAllMenu");
	
	var voRootAppIns = app.getRootAppInstance();
	if(voRootAppIns.hasAppMethod("getAllMenu")) {
		var voAllMenus = voRootAppIns.callAppMethod("getAllMenu");
		dsAllMenu.build(voAllMenus);
	}
	dsAllMenu.forEachOfUnfilteredRows(function(dataRow){
		dataRow.putValue("USR_ACCESS_YN", "Y");
		dataRow.putValue("USR_TRANS_YN", "Y");
	});
	
	createTreecellTuner(app.lookup("dsAllMenu"), "MENU_NM", "MENU_ID", "UP_MENU_ID", "MENU_LVL", "SORT_COL");
	util.Control.redraw(app, "grd1");
}

/*
 * "적용" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	if(!util.DataSet.isModify(app, "dsAllMenu")) {
		util.Msg.alertDlg(app, "변경된 행이 없습니다.");
		return;
	}
	util.Msg.confirmDlg(app, "적용하시겠습니까?\n접속한 일반 사용자에 대한 메뉴 권한이 즉시 사라집니다.",null,{
		confirmCallback: function(){
			var ws = getSocket();
			var moWsMsg = {};
			var maMessage = [];
			var vaMessage = app.lookup("dsAllMenu").getRowDatasByState(cpr.data.tabledata.RowState.UPDATED);
			vaMessage = vaMessage[cpr.data.tabledata.RowState.UPDATED];
//			console.log(vaMessage);
			if(vaMessage && vaMessage.length > 0) {
				
				maMessage = vaMessage.map(function(each){
					return {
						"MENU_ID" : each["MENU_ID"],
						"CALL_PAGE" : each["CALL_PAGE"],
						"USR_ACCESS_YN" : each["USR_ACCESS_YN"],
						"USR_TRANS_YN" : each["USR_TRANS_YN"]
					}
				});
			}
			
			moWsMsg.receiver = "user1";
			moWsMsg.receiverType = "user1";
			moWsMsg.message =  maMessage;
			if(ws) {
				ws.send(JSON.stringify(moWsMsg));
			}
			
			app.lookup("dsAllMenu").commit();
		}
	});
}
