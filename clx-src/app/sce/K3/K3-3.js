/************************************************
 * K3-3.js
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

/* ==== [app/sce/A10/A10-3.clx] 10.5 버그 및 오류 관리 ==== */
/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e){
	var q=  getErrorLog();
	var txa = app.lookup("txa1");
	
//	q.forEach(function(each){
//		var timer = each.timestamp
//		/** @type Array */
//		var stack = each.stack;
//		var context = each.context;
//		var plusText = " 에러가 발생했습니다.";
//		switch(context){
//			case "expression" :
//				plusText = "표현식 구문 관련" + plusText;
//				break;
//			case "event-listener" :
//				plusText = "컨트롤의 이벤트 리스너 함수에서" + plusText;
//				break;
//			case  "unknown" :
//				plusText = "알수없는" + plusText;
//				break; 
//			default :
//				break;
//		}
//		txa.value = txa.value + "ERROR context:" + each.context + "=> "+plusText+"\n";
//		stack.forEach(function(eachS){
//			txa.value = txa.value + moment(timer).format("MM-DD HH:mm:ss,sss") + " DEBUG " + eachS+"\n";
//		});
//		txa.value = txa.value + "\n\n";
//	});
	clearErrorLog();
	applyMask();
	cpr.core.NotificationCenter.INSTANCE.subscribe("error-occured",this, function(msg){
		var data = msg.data;
		var timer = data.timestamp
		/** @type Array */
		var stack = data.stack;
		var context = data.context;
		var plusText = " 에러가 발생했습니다.";
		switch(context){
			case "expression" :
				plusText = "표현식 구문 관련" + plusText;
				break;
			case "event-listener" :
				plusText = "컨트롤의 이벤트 리스너 함수에서" + plusText;
				break;
			default :
				break;
		}
		txa.value = txa.value + "ERROR context:" + data.context + "=> "+plusText+"\n";
		stack.forEach(function(eachS){
			txa.value = txa.value + moment(timer).format("MM-DD HH:mm:ss,sss") + " DEBUG " + eachS+"\n";
		});
		txa.value = txa.value + "\n\n";
	});
}

/*
 * "에러 발생" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
	setTimeout(function() {
			
			var someObject = {
				"key1" : "value"
			};
			someObject.key1.key2();
		}, 300)
		
		setTimeout(function(){
			
			var dsData =app.lookup("dsData");
			dsData.getRow(0).getValue("EMAILSS");
		},172);
		setTimeout(function(){
			
			app.lookup("btn3").bind("tooltip").toExpression("의도적인에러발생");
		},100)
		app.lookup("Tyrannosaurus").setAttribute("somePropName","somePropValue");
		
}

/*
 * "오류내용 확인" 버튼(btnErrView)에서 click 이벤트 발생 시 호출.
 * 수집된 오류 로그를 팝업(K3-3P)으로 전달해 확인한다.
 */
function onBtnErrViewClick(e){
	var btnErrView = e.control;
	var vsLog = app.lookup("txa1").value;
	util.Dialog.open(app, "app/sce/K3/K3-3P", 760, 520, function(poDialog){
		app.lookup("btnErrView").focus();
	}, {log: vsLog}, {headerTitle: "오류내용 확인"});
}

/**
 * 마스킹 입력 항목 정의 (입력 컨트롤 / 결과 컨트롤 / 마스킹 유형)
 */
var vaMaskItems = [
	{src: "ipbMName", dst: "optMName", type: "NAME"},
	{src: "ipbMTel", dst: "optMTel", type: "TEL"},
	{src: "ipbMJumin", dst: "optMJumin", type: "JUMIN"},
	{src: "ipbMCard", dst: "optMCard", type: "CARD"},
	{src: "ipbMEmail", dst: "optMEmail", type: "EMAIL"}
];

/**
 * 마스킹 결과 출력. 마스킹 해제 체크 시 원문을 표시한다.
 */
function applyMask(){
	var vbUnmask = app.lookup("cbxUnmask").checked;
	vaMaskItems.forEach(function(voItem){
		var vsValue = app.lookup(voItem.src).value;
		app.lookup(voItem.dst).value = vbUnmask ? vsValue : ValueUtil.maskType(voItem.type, vsValue);
	});
	applyGridMask();
}

/**
 * 서브미션 결과 그리드의 이메일 컬럼에 마스킹 적용.
 */
function applyGridMask(){
	var vcDs = app.lookup("dsData");
	var vbUnmask = app.lookup("cbxUnmask").checked;
	for(var i = 0; i < vcDs.getRowCount(); i++){
		var vsEmail = vcDs.getValue(i, "email");
		vcDs.setValue(i, "email_mask", vbUnmask ? vsEmail : ValueUtil.maskType("EMAIL", vsEmail));
	}
}

/*
 * "마스킹 적용" 버튼(btnMask)에서 click 이벤트 발생 시 호출.
 */
function onBtnMaskClick(e){
	var btnMask = e.control;
	applyMask();
}

/*
 * "마스킹 해제" 체크박스(cbxUnmask)에서 value-change 이벤트 발생 시 호출.
 */
function onCbxUnmaskValueChange(e){
	var cbxUnmask = e.control;
	applyMask();
}

/*
 * "서브미션 조회" 버튼(btnRetrieve)에서 click 이벤트 발생 시 호출.
 * 서브미션 호출 후 결과의 이메일을 마스킹하여 표시한다.
 */
function onBtnRetrieveClick(e){
	var btnRetrieve = e.control;
	util.Submit.send(app, "subRetrieve", function(pbSuccess){
		if(pbSuccess){
			applyGridMask();
			util.Msg.notify(app, "조회되었습니다. (" + app.lookup("dsData").getRowCount() + "건)");
		}
	});
}

/*
 * "로그 출력" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click2(e){
	var btn1 = e.control;
	
	var vsErrorLog = app.lookup("txa1").value;
	var blobs = new Blob([vsErrorLog],{type:"text/plain"});
	var url = URL.createObjectURL(blobs);
	var atag = document.createElement("a");
	atag.href = url;
	atag.download = moment().format("YYYYMMDD_HHmmss_sss")+"_log.txt";
	
	atag.click();
	URL.revokeObjectURL(url);
}
