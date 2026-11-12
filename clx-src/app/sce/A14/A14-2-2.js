/************************************************
 * T0001.js
 * Created at 2023. 2. 15. 오후 1:44:01.
 *
 * @author tomatosystem
 ************************************************/

/**************************************************
 * 전역 변수 선언
 **************************************************/
var util = createCommonUtil();

/**************************************************
 * 이벤트 리스너 함수
 **************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	
	/* 공통코드 조회(DS_MPRD_INF : 상품구분, DS_MPRD : 상품, DS_FUND_INF : 펀드)*/
	util.Submit.send(app, "SUB_ONLOAD", function(pbSuccess) {
		app.lookup("cmbMprdInf").selectItem(0); // 상품구분 default(연금) 선택		
	});	
}

/*
 * 상품구분콤보 박스에서 selection-change 이벤트 발생 시 호출.
 * ComboBox Item을 선택하여 선택된 값이 저장된 후에 발생하는 이벤트.
 */
function onCmbMprdInfSelectionChange(e) {
	var cmbMprdInf = e.control;
	var cmbMprdInfVal = cmbMprdInf.value; // 상품구분 콤보박스 value(연금, 변액)
	
	app.lookup("cmbMprd").clearSelection(); // 상품구분 콤보 변경시 상품 콤보 초기화
	
	/* 상품 구분에 따른 상품콤보 데이터 및 동적화면 구성 */
	var subMprd = app.lookup("SUB_MPRD");
	var tabGoodsDiv = app.lookup("tabMprdInf");
	var tabItem = null;
	
	if (cmbMprdInfVal == "연금") {
		subMprd.getResponseData("DS_MPRD").alias = "DS_ANTY_MPRD"; // JSON 연금 데이터 KEY
		tabItem = tabGoodsDiv.getTabItemByID(1); // 연금 탭 아이템		
	} else {
		subMprd.getResponseData("DS_MPRD").alias = "DS_VAR_MPRD"; // JSON 변액 데이터 KEY
		tabItem = tabGoodsDiv.getTabItemByID(2); // 변액 탭 아이템		
	}
	
	// 선택된 데이터 ID로 상품 목록을 재조회 합니다.
	util.Submit.send(app, "SUB_MPRD");
	
	tabGoodsDiv.setSelectedTabItem(tabItem);
}

/*
 * "조회" 버튼(btnSearch)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnSearchClick(e){
	var btnSearch = e.control;
	
	/* 고객(주피보험자)선택 목록에 선택된 고객정보를 삽입*/
	var dsCust = app.lookup("DS_CUST");	
	var csInfoData = app.lookup("DM_CUST_PARAM").getDatas(); // 고객검색 컴포넌트에 바인딩된 데이터 맵(고객정보) 데이터
		
	dsCust.clearData(); // 기존 고객선택 목록 데이터 제거
	
	var csDiv = ["계약자", "주피보험자"]; // 고객 구분(임시 데이터 처리)
	csDiv.forEach(function(each){
		csInfoData["CS_DIV"] = each;	
		dsCust.pushRowData(csInfoData);		
	});		
}



/*
 * "자동 테스트" 버튼(btn1)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtn1Click(e){
	var btn1 = e.control;
	
	autoTest();
}


/**
 * 자동화 테스트 플랜 실행
 */
function autoTest () {
	runTest(function(test){
		
		var viewer = test.getLogViewer();
		viewer.hide();
		
		/* 1번 플랜 */
		test.addRobotTest(
			"조회조건 - 고객번호 입력",
			// 로봇 계획
			function(plan){
				plan				
				.click(app.lookup("ipbCustNm")).type("10011")
				.delay(200)
				.click(app.lookup("btnCustSearch")).delay(100)										
			},
			// 실제 결과 평가
			function(){
				return app.lookup("ipbCustNm").text;
			},
			// 기대 결과
			"10011"
		);
		
		/* 2번 플랜 */
		test.addRobotTest(
			"조회조건 - 데이터 조회(조회 건수)",
			// 로봇 계획
			function(plan){
				plan				
				.click(app.lookup("btnSearch")).delay(100)
				.delay(500)								
			},			
			// 실제 결과 평가
			function(){
				return app.lookup("grdCust").getRowCount();
			},
			// 기대 결과
			"2"
		);
		
		/* 3번 플랜 */
		test.addRobotTest(
			"상품선택 - 상품구분",
			// 로봇 계획
			function(plan){
				plan				
				.click(app.lookup("cmbMprdInf"),{nodeSelector : ".cl-combobox-button"})
				.delay(200)
				.click(".cl-global-aside .cl-combobox-list", {
					nodeSelector: ".cl-combobox-item",
					nodeIndex:1
				}).delay(100)					
			},
			// 실제 결과 평가
			function(){
				return app.lookup("cmbMprdInf").text;
			},
			// 기대 결과
			"변액"
		);
		
		/* 4번 플랜 */
		test.addRobotTest(
			"상품",
			// 로봇 계획
			function(plan){				
				plan
				.click(app.lookup("cmbMprd"),{nodeSelector : ".cl-combobox-button"})
				.delay(200)
				.click(".cl-global-aside .cl-combobox-list", {
					nodeSelector: ".cl-combobox-item",
					nodeIndex:0
				}).delay(100)
			},
			// 실제 결과 평가
			function(){
				return app.lookup("cmbMprd").text;
			},
			// 기대 결과
			"무배당변액연금전환특약(미보증형)"
		);
		
		/* 5번 플랜 */
		test.addRobotTest(
			"보험료",
			// 로봇 계획
			function(plan){
				plan
				.click(app.lookup("cmbPnsStrAge"),{nodeSelector : ".cl-combobox-button"})
				.delay(200)
				.click(".cl-global-aside .cl-combobox-list", {
					nodeSelector: ".cl-combobox-item",
					nodeIndex:5
				}).delay(100)
				.click(app.lookup("cmbPymntPer"),{nodeSelector : ".cl-combobox-button"})
				.delay(200)
				.click(".cl-global-aside .cl-combobox-list", {
					nodeSelector: ".cl-combobox-item",
					nodeIndex:3
				}).delay(100)
				.click(app.lookup("cmbLAnnGnteePer"),{nodeSelector : ".cl-combobox-button"})
				.delay(200)
				.click(".cl-global-aside .cl-combobox-list", {
					nodeSelector: ".cl-combobox-item",
					nodeIndex:1
				}).delay(100)
				.doubleClick(app.lookup("nbeInsrnFee")).type(127).delay(10)
				.click(app.lookup("nbeInsrnFee")).type("500000")
				.delay(100)		
			},
			// 실제 결과 평가
			function(){
				return app.lookup("nbeInsrnFee").displayText;
			},
			// 기대 결과
			"500,000"
		);
		
		/* 6번 플랜 */
		test.addRobotTest(
			"펀드선택 - 펀드투입비율 합계",
			// 로봇 계획
			function(plan){
				plan				
				.click(app.lookup("grdFundInf"), {nodeSelector:".cl-grid-detail .cl-grid-cell", nodeIndex : 5}).delay(100)
				.doubleClick(app.lookup("nbeFondRate")).type(127).delay(10)
				.click(app.lookup("nbeFondRate")).type("15").delay(100)				
				.click(app.lookup("grdFundInf"), {nodeSelector:".cl-grid-detail .cl-grid-cell", nodeIndex : 8}).delay(100)
				.doubleClick(app.lookup("nbeFondRate")).type(127).delay(10)
				.click(app.lookup("nbeFondRate")).type("18").delay(100)
				.click(app.lookup("grdFundInf"), {nodeSelector:".cl-grid-detail .cl-grid-cell", nodeIndex : 11}).delay(100)							
			},
			// 실제 결과 평가
			function(){					
				return app.lookup("grdFundInf").getFooterCellValue(1);
			},
			// 기대 결과
			33
		);		
	});
}
