/************************************************
 * A10-11.js
 * Created at 2023. 5. 10. 오후 5:47:16.
 *
 * @author tomatosystem
 ************************************************/

var mbCrashBrowserTab = false;


/**
 * 개발자도구가 열려있을 경우, 일정 Delay Time 이후 활성 브라우저 동작을 제어합니다.
 * - reload : 현재 브라우저 새로고침
 * - crash : 활성 브라우저 작동 중단
 */
	
 function handleDevToolsOpen() {
 	if (mbCrashBrowserTab && devtoolsDetector.default.isOpen) {
 		var vnDelayTime = 10;
 		
 		var vsRdbCrash = app.lookup("rdbCrash").value;
 		setTimeout(function () {
 			switch(vsRdbCrash){
 				case "reload" :
 					location.reload();
 					break;
 				case "crash" :
 					devtoolsDetector.crashBrowserCurrentTab();
 					break;
 			}
 		}, vnDelayTime);
 	}
 }

/*
 * "시작" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	/*
	 * 문서 확인
	 * https://www.npmjs.com/package/devtools-detector
	 */
	cpr.core.ResourceLoader.loadScript("thirdparty/devtools-detector/devtools-detector.js").then(function(input) {
		// 감지 interval 지정(ms)
		devtoolsDetector.setDetectDelay(300);
		
		// 감지 리스너 등록
		devtoolsDetector.addListener(function(isOpen, i) {
			handleDevToolsOpen();
		});
		
		// 디텍터 실행중인 경우, stop 후 다시 실행
		if (devtoolsDetector.isLaunch()) {
			devtoolsDetector.stop();
		}
		devtoolsDetector.launch();
		// 디텍터 실행
		//멈추고싶은 경우는 devtoolsDetector.stop();
		app.lookup("rdbCrash").enabled = true;
	});
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdbCrashSelectionChange(e){
	var rdbCrash = e.control;
	
	mbCrashBrowserTab = true;
	handleDevToolsOpen();
}

/*
 * "종료" 버튼(btnStart2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnStart2Click(e){
	var btnStart2 = e.control;
	// 디텍터 정지
	devtoolsDetector.stop();
	app.lookup("rdbCrash").enabled = false;
	app.lookup("rdbCrash").value = "";
}
