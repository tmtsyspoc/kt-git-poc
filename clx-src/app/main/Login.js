/************************************************
 * Login.js
 * Created at 2026. 5. 7. 오전 11:27:40.
 *
 * @author jihee
 ************************************************/
/************************************************
 * 공통 모듈 선언
 ************************************************/
var util = createCommonUtil();

/************************************************
 * 사용자 정의 함수
 ************************************************/
/**
 * 쿠키를 설정합니다.
 * 
 * @param {String} psName
 * @param {Strubg} psValue
 * @param {Number} pnExpireDate
 */
function setCookie(psName, psValue, pnExpireDate) {
	var voToday = new Date();
	voToday.setDate(voToday.getDate() + parseInt(pnExpireDate));
	document.cookie = psName + "=" + escape(psValue) + ";path=/;expires=" + voToday.toGMTString() + ";";
}


/**
 * 쿠키를 가져옵니다.
 * @param {String} psName
 */
function getCookie(psName) {
	var vsCookie = document.cookie + ";";

	var vaItems = vsCookie.split(";");
	var vnItemLen = vaItems.length;
	var item = null;
	var voItemInfo = null;
	for (var i = 0; i < vnItemLen; i++) {
		item = vaItems[i];
		voItemInfo = item.split("=");
		if (psName == voItemInfo[0].trim()) {
			return unescape(voItemInfo[1]);
		}
	}
}

/**
 * 쿠키를 지웁니다.
 * @param {String} name
 */
function deleteCookie(name) {
	var expireDate = new Date();
	expireDate.setDate(expireDate.getDate() - 1);
	document.cookie = name + "= " + "; expires=" + expireDate.toGMTString() + "; path=/";
}


/************************************************
 * 이벤트 핸들러
 ************************************************/
/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad2(e){
	/* 쿠키 설정 */
	var vsCookieId = getCookie("expuid");
	
	if (!ValueUtil.isNull(vsCookieId)){
		util.DataMap.setValue(app, "dmReq", "strUserNm", vsCookieId);
		app.lookup("cbxRmbr").checked = true;
	} else {
		app.lookup("ipbUserNm").focus();
	}
	
	util.Control.redraw(app, "grpVerticalLogin");
}

/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 전파되는 이벤트.
 */
function onBodyScreenChange(e) {
	var vsScreenNm = e.screen.name;
	
	var rootContainer = app.getContainer(); // XY레이아웃		
	var vcGrpLoginBx = app.lookup("grpLoginBx"); // 공지사항
	var vcGrpNotice = app.lookup("grpNotice"); // 로그인
	var vcGrpHd = app.lookup("grpHeader");
	var vcGrpFt = app.lookup("grpFooter");
	
	if (!vcGrpLoginBx) return;
	
	var bxLayout = vcGrpLoginBx.getLayout();
	var isMobile = (vsScreenNm === "mobile");
	var isTablet = (vsScreenNm === "tablet");
	
	/* 가시성 제어 (모바일만 숨김, 나머지는 표시) */
	var bVisible = !isMobile;
	[vcGrpNotice, vcGrpHd, vcGrpFt, vcOutputBar].forEach(function(ctrl) {
        if (ctrl) ctrl.visible = bVisible;
    });
	
	if (bxLayout && bxLayout.setColumnVisible) {
		bxLayout.setColumnVisible(0, bVisible); // 공지사항 컬럼 제어
	}
	
	// --- 높이 값 조절 컨테이너 찾기 ---
	var vcVerticalLogin = app.lookup("grpVerticalLogin");
	var vsTargetHeight = isMobile ? "40px" : "56px"; // 모바일은 40px, 그 외 56px(기본값)
	
	if (isMobile) { // 모바일		
		/* [Mobile] 0px ~ 767px */
		bxLayout.setColumns(["0px", "1fr"]);
		bxLayout.horizontalSpacing = 0;
		
		var vcOutputBar = app.lookup("optBar");
		if (vcOutputBar) vcOutputBar.visible = false;
		
		rootContainer.updateConstraint(vcGrpLoginBx, {
			"top": "50%",
			"left": "50%",
			"width": "90%",
			"height": "auto",
			"transform": "translate(-50%, -50%)"
		});
		
	} else if (isTablet) {
		/* [Tablet] 768px ~ 1024px */
		bxLayout.setColumns(["1fr", "1fr"]);
		bxLayout.horizontalSpacing = 40;
		bxLayout.verticalSpacing = 20;
		
		rootContainer.updateConstraint(vcGrpLoginBx, {
			"top": "50%",
			"left": "50%",
			"width": "calc(100% - 80px)",
			"height": "auto",
			"transform": "translate(-50%, -50%)"
		});
		
		var vcOutputBar = app.lookup("optBar");
		if (vcOutputBar) vcOutputBar.visible = true;
		
	}
	
	/* 내부 컨트롤 일괄 높이/레이아웃 변경 */
	if (vcVerticalLogin) {
		var vaAllChildren = vcVerticalLogin.getChildren();
		
		while (vaAllChildren.length > 0) {
			var vcChild = vaAllChildren.shift();			
			if (!vcChild) continue;
			
			// 높이 변경 
			if (vcChild instanceof cpr.controls.InputBox || vcChild instanceof cpr.controls.Button) {
				var vcParent = vcChild.getParent();
				if (vcParent && vcParent.updateConstraint) {
					vcParent.updateConstraint(vcChild, {
						"height": vsTargetHeight
					});
				}
			}
			
			// 컨테이너 및 폼 레이아웃 행 높이 변경
			if (vcChild instanceof cpr.controls.Container) {
				var voLayout = vcChild.getLayout();
				
				if (voLayout) {
					var vsLayoutType = String(voLayout.type).toLowerCase();					
					if (vsLayoutType === "formlayout") {
						var vaNewRows = voLayout.getRows().map(function() {return vsTargetHeight;});
						voLayout.setRows(vaNewRows);
					}
				}				
				// 자식 탐색 계속
				vaAllChildren = vaAllChildren.concat(vcChild.getChildren());
			}
			
		}
	}
	app.getContainer().redraw();
}

/*
 * "로그인" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	if(!util.validate(app, ["ipbUserNm", "ipbPw"])) return false;
	
	var vcDmReq = app.lookup("dmReq");
	var vcCbxRmbr = app.lookup("cbxRmbr");
	if (vcCbxRmbr.checked == true) {
		var vsUserNm = vcDmReq.getValue("strUserNm");
		setCookie("expuid", vsUserNm, 30);
	} else {
		deleteCookie("expuid");
	}
	
	if(window.eb6Preview) {
		cpr.core.App.load("app/main/Main", function(loadedApp) {
			app.getRootAppInstance().dispose();
			loadedApp.createNewInstance().run();
			cpr.core.Platform.INSTANCE.setDocumentTitle(loadedApp.title);
		});
	} else {
		var vcSubLogin = app.lookup("subLogin");
		if(util.DataMap.getValue(app, "dmReq", "strUserNm") == "admin") {
			vcSubLogin.addParameter("idParam", "admin");
		} else {
			vcSubLogin.addParameter("idParam", "user");
		}
		
		/* 로그인 서브미션 호출 */
		util.Submit.send(app, "subLogin", function(pbSuccess){
			if (pbSuccess){
				top.location.reload();
			}
		});
	}	
}

/*
 * 인풋 박스에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onIpbUserNmKeydown(e){
	if (e.keyCode == cpr.events.KeyCode.ENTER){
		app.lookup("ipbPw").focus();
	}
}

/*
 * 인풋 박스에서 keydown 이벤트 발생 시 호출.
 * 사용자가 키를 누를 때 발생하는 이벤트. 키코드 관련 상수는 {@link cpr.events.KeyCode}에서 참조할 수 있습니다.
 */
function onIpbPwKeydown(e){
	var ipbPw = e.control;
	if (e.keyCode == cpr.events.KeyCode.ENTER){
		app.lookup("btnSignIn").click();
	}
}
