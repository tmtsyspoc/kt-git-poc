/************************************************
 * K11-1.js
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

/* ==== [app/sce/A10/A10-1.clx] 10.1 보안 지원 ==== */
/************************************************
 * 전역변수
 ************************************************/

/************************************************
 * 사용자정의함수
 ************************************************/

/**
 * XSS 공격방지 서브미션 send 함수
 * @param {cpr.protocols.Submission} pcSubmissoin
 */
function submitSendXSS(pcSubmissoin) {
	var vcSub = pcSubmissoin;
	vcSub.setRequestEncoder(function(submission, data) {
		console.log(data);
		data = JSON.stringify(data);
		var str = data.replace(/[&<>';/]/g, function(match) {
			return {
				"&": "%amp",
				'<': '&lt;',
				'>': '&gt;',
				"'": '&#39;',
				'/': '&#x2F;'
			} [match];
		});
		alert(str);
		var result = JSON.parse(str);
		return {
			content: result
		}
	});
	util.Submit.send(app,vcSub.id, function(pbSuccess){
		if(pbSuccess){
			util.Control.redraw(app, "grp2");
		}
	});
}

/**
 * 
 * @param {cpr.protocols.Submission} pcSubmissoin
 */
function submitSendCSRF(pcSubmissoin) {
	var vcSub = pcSubmissoin;
	vcSub.setHeader("X-CSRF-TOKEN", getCSRFToken());
	util.Submit.send(app, vcSub.id, function(pbSuccess,pcSub){
		
	});
}
/**
 * 
 * @param {cpr.protocols.Submission} pcSubmission
 */
function submitSendWrongCSRF(pcSubmission) {
	var vcSub = pcSubmission;
	vcSub.setHeader("X-CSRF-TOKEN", "HackedWrongTokenInfo");
	util.Submit.send(app, vcSub.id, function(pbSuccess,pcSub){
		if(!pbSuccess) {
			util.removeCover(app);
		}
	});
}

/************************************************
 * 컨트롤 이벤트
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){	
//	var metaTag = document.createElement("meta");
}

/*
 * "XSS공격이 삽입된 통신 요청" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	submitSendXSS(app.lookup("subXSS"));
}


/*
 * "타 사이트의 악의적인 요청" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click(e){
	var btn2 = e.control;
	submitSendCSRF(app.lookup("subCSRF"));
	
}

/*
 * "서비스 요청" 버튼(btn3)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn3Click(e){
	var btn3 = e.control;
	submitSendWrongCSRF(app.lookup("subCSRF"));
}

/* ==== [app/sce/A10/A10-6.clx] 10.7 우클릭 방지 ==== */
/************************************************
 * 전역변수
 ************************************************/

/**
 * 공통함수 유틸
 */

function contextMenuFilter(e){
	e.preventDefault();
	util.Msg.alertDlg(app, "우클릭 이벤트가 금지되었습니다.");	
}
cpr.events.EventBus.INSTANCE.addFilter("contextmenu", contextMenuFilter);

/*
 * 루트 컨테이너에서 before-unload 이벤트 발생 시 호출.
 * 앱이 언로드되기 전에 발생하는 이벤트 입니다. 취소할 수 있습니다.
 */
function onBodyBeforeUnload(e){
	cpr.events.EventBus.INSTANCE.removeFilter("contextmenu", contextMenuFilter);
}

/* ==== [app/sce/A10/A10-8.clx] 10.9 클립보드 제어 ==== */
/************************************************
 * 전역변수
 ************************************************/
/**
 * 
 */

/************************************************
 * 사용자정의함수
 ************************************************/

/************************************************
 * 컨트롤 이벤트
 ************************************************/
cpr.events.EventBus.INSTANCE.addFilter("keydown", function(e){
	/** @type cpr.controls.UIControl */
	var vcControl = e.control;
	if(typeof vcControl["userAttr"] !== "undefined" && vcControl.userAttr("useSecurityYn") == "Y"){
		//컨트롤 + C 입력 방지
		if(e.ctrlKey && e.keyCode == cpr.events.KeyCode.C){
			e.preventDefault();
			util.Msg.alertDlg(app, "대상 컨트롤의 데이터 복사가 제한되었습니다.");
		}
	}
});

cpr.events.EventBus.INSTANCE.addFilter("contextmenu", function(e){
	/** @type cpr.controls.UIControl */
	var vcControl = e.control;
	if(typeof vcControl["userAttr"] !== "undefined" && vcControl.userAttr("useSecurityYn") == "Y"){
		e.preventDefault();
		util.Msg.alertDlg(app, "대상컨트롤의 데이터 복사 방지를 위해 컨텍스트 메뉴 사용이 제한되었습니다.");
	}
});

///*
// * 그리드에서 copy 이벤트 발생 시 호출.
// * Grid의 선택된 요소를 ctrl + c 로 복사했을 때 발생하는 이벤트.
// */
//function onGrd1Copy(e){
//	var vcGrid = e.control;
//	var voLayout = vcGrid.getColumnLayout();
//	var vbIsSecurityCtrl = voLayout.detail.some(function(each){
//		var vcChildCtrl = vcGrid.detail.getControl(each.cellIndex);
//		return vcChildCtrl.userAttr("useSecurityYn") == "Y";
//	});
//	
//	if(vbIsSecurityCtrl){
//		e.preventDefault();
//		util.Msg.alertDlg(app, "대상 컨트롤의 데이터 복사가 제한되었습니다.");
//	}
//}

/* ==== [app/sce/A10/A10-9.clx] 10.10 보안성 ==== */
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad_6(e){
	
	var vcRdbDuplLogin = app.lookup("rdbDuplLogin");
	if(AppProperties.MAIN_DUPL_LOGIN_ALLOWED){
		vcRdbDuplLogin.value = "Y";
	} else {
		vcRdbDuplLogin.value = "N";
	}	
}

/*
 * "로그인 시간 변경" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click_6(e){
	var btn1 = e.control;
	
	var voMainApp = util.getMainApp(app);
	if(voMainApp.hasAppMethod("setSessionTime")){
		voMainApp.callAppMethod("setSessionTime", 3);	
	}	
}

/*
 * "로그인 시간 연장" 버튼(btn2)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn2Click_6(e){
	var btn2 = e.control;
	
	var voMainApp = util.getMainApp(app);
	var vcSessionTime = voMainApp.lookup("btnAddTime");
	if(vcSessionTime){
		vcSessionTime.click();
	}	
		
}

/*
 * 라디오 버튼에서 selection-change 이벤트 발생 시 호출.
 * 라디오버튼 아이템을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onRdb1SelectionChange(e){
	var rdb1 = e.control;
	
	if(rdb1.value == "Y"){
		sendDuplicateLoginOption(true);
	} else {
		sendDuplicateLoginOption(false);
	}	
}

// 중복 로그인 허용 여부 전달하는 함수
function sendDuplicateLoginOption(allow) {
	var ws = getSocket();
    var message = {
        receiver: util.Main.getUserInfo(app, "USER_TYPE"),
        allowDuplicateLogin: allow
    };
    
    ws.send(JSON.stringify(message));
}
