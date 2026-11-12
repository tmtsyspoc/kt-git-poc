/************************************************
 * screenLayout.js
 * Created at 2023. 2. 27. 오전 9:26:47.
 *
 * @author tomatosystem
 ************************************************/
var util = createCommonUtil();


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
