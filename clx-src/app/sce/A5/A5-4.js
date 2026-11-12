/************************************************
 * screenLayout.js
 * Created at 2023. 2. 27. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/
/************************************************
 * 전역변수
 ************************************************/
/**
 * 
 */
var util = createCommonUtil();
var dataViewer = cpr.core.Module.require("module/cstm/createNewAppIns");

/************************************************
 * 사용자정의함수
 ************************************************/

/************************************************
 * 컨트롤 이벤트
 ************************************************/
/*
 * "디버거 확인" 버튼(btnDebug)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnDebugClick(e){
	var btnDebug = e.control;
	// TODO debugger를 통해 Break Point가 잡히면 btnDebug.value를 콘솔창에서 입력하여  현재  클릭한 버튼 컨트롤의 value 속성 값을 확인 하십시오.
	debugger;
	var vsTestVariable = "TEST";
	if(vsTestVariable == "OK") {
		console.log("소스코드 디버깅 - debug");
	}
}

/*
 * "콘솔 확인" 버튼(btnConsole)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnConsoleClick(e){
	console.log("소스코드 디버깅 - 콘솔 확인 버튼 클릭");
}

/*
 * "로그 확인" 버튼(btnLog)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnLogClick(e){
	var btnLog = e.control;
	
	var dsLog = app.lookup("dsLog");
	dsLog.clear();
	
	/** @type cpr.data.DataSet */
	var vcDsMsg = cpr.core.Module.require("module/cstm/debug").getLogMsg();
	vcDsMsg.copyToDataSet(dsLog);
	dsLog.setRowStateAll(cpr.data.tabledata.RowState.UNCHANGED);
	
	app.lookup("udcComGridTitle1").rowCount = dsLog.getRowCount();
}

/*
 * "data viewer" 버튼(btnSubmit2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSubmit2Click(e){
	dataViewer._openDialog();
}


/*
 * "송수신 진행" 버튼(btnSubmit)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSubmitClick(e){
	var voSub = app.lookup("sub1");
	
	var voReqParam = voSub.getRequestData(0).data.getDatas();
	var vsReqParam = "{\n";
	Object.keys(voReqParam).forEach(function(key){
		vsReqParam += '	"' + key + '": "' + voReqParam[key] + '"\n';	
	})
	vsReqParam += "}";
	console.log("[Request Data] " + moment().format("YYYY-MM-DD HH:mm:ss")
	+ "\n" + "[action] " + voSub.action + ""
	+ "\n" + "[method] " + voSub.method 
	+ "\n" + "[mediaType] : " + voSub.mediaType
	+ "\n" + "[data] \n" + vsReqParam);
			
	util.Submit.send(app, "sub1", function(pbSuccess){
		if(pbSuccess){
			console.log("[Response Data] " + moment().format("YYYY-MM-DD HH:mm:ss") + "\n" + "[data] "+ "\n" + voSub.xhr.responseText);
		}
	});
}
