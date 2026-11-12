/************************************************
 * Sitemap.js
 * @프로그램설명 : 
 *
 * @작성일자 :  2024. 10. 17..
 * @작성자 : ryu
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


/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/ 
/**
 * 전체 사이트 맵 영역 동정 생성 메서드
 */
function createSiteMenu() {
	var vcGrpBxBody = app.lookup("grpBxBody");
	var vcDsAllMenu = app.lookup("dsAllMenu");
	vcDsAllMenu.clearFilter();
	var vaRtMenus = null;
	var vaRtMenus = vcDsAllMenu.findAllRow("UP_MENU_ID == null || UP_MENU_ID == ''");
	
	// 그룹 초기화
	vcGrpBxBody.removeAllChildren(true);
	
	// 최상위 메뉴 동적 생성(item 영역)
	// ex) 컴포넌트 기능 예제 , 템플릿 (서버연동) 
	for(var i = 0; i < vaRtMenus.length; i++){
		var voRtMenuData = vaRtMenus[i];
		
		// 사이트메뉴 박스 생성 (wrapper)
		var vcGrpBox = new cpr.controls.Container();
		vcGrpBox.style.addClass("item");
		var voGrpBoxLt = new cpr.controls.layouts.VerticalLayout();
		voGrpBoxLt.spacing = 12;
		voGrpBoxLt.scrollable = false;
		
		vcGrpBox.setLayout(voGrpBoxLt);
		
		vcGrpBxBody.addChild(vcGrpBox, {
			autoSize: "height"
		});
		
		// 최상위 MENU_NM
		var vcOptTit = new cpr.controls.Output();
		vcOptTit.value = voRtMenuData.getValue("MENU_NM");
		vcOptTit.style.setClasses(["tit", "h4"]);
		
		vcGrpBox.addChild(vcOptTit, {
			autoSize: "height"
		});
		
		// 최상위 MENU_NM의 하위 메뉴 영역 동적 생성
		var vcGrpSiteMenu = new cpr.controls.Container();
		vcGrpSiteMenu.style.addClass("sitemenus");
		
		var voGrpSiteMenuLt = new cpr.controls.layouts.FlowLayout();
		voGrpSiteMenuLt.horizontalAlign = "left";
		voGrpSiteMenuLt.verticalAlign = "top";
		voGrpSiteMenuLt.horizontalSpacing = 36;
		voGrpSiteMenuLt.verticalSpacing = 4;
		voGrpSiteMenuLt.scrollable = false;
		
		vcGrpSiteMenu.setLayout(voGrpSiteMenuLt);
		
		vcGrpBox.addChild(vcGrpSiteMenu, {
			autoSize: "height"
		});
		
		// 사이드 내비게이션 생성 (하위 메뉴들)
		// UP_MENU_ID 가 최상위 MENU_NM 인 경우
		var vaSubMenus = vcDsAllMenu.findAllRow("UP_MENU_ID == '" + voRtMenuData.getValue("MENU_ID") + "'");
		for(var j = 0; j < vaSubMenus.length; j++){
			var voSubMenuData = vaSubMenus[j];
			
			var vcSnavSiteMenu = new cpr.controls.SideNavigation();
			vcSnavSiteMenu.style.item.bindClass().toExpression("CALL_PAGE != null && CALL_PAGE != \"\" ? \"text-link\" : \"\"");
			vcSnavSiteMenu.setItemSet(vcDsAllMenu, {
				label: "MENU_NM",
				value: "MENU_ID",
				parentValue: "UP_MENU_ID"
			});
			
			// 필터 적용 시 아이템이 없다면 해당 사이드 네비게이션 visible = false
			vcSnavSiteMenu.bind("visible").toExpression("getItemCount() == 0 ? false :  true");
			
			// 최상위 메뉴명이 아닌 경우만 필터
			vcSnavSiteMenu.setFilter("depth != 0");
			// 사이드 메뉴 생성 후 검색어 필터
			vcSnavSiteMenu.setTreeFilter("(hasAncestor('" + voSubMenuData.getValue("MENU_ID") + "') || value == '" + voSubMenuData.getValue("MENU_ID") +"') && "
												+"(MENU_LOWERCASE *= #searchMenu.value || DESC_LOWERCASE *= #searchMenu.value || TAG_LOWERCASE *= #searchMenu.value)");

			vcSnavSiteMenu.expandAllItems();
			
			// 사이드네비게이션 닫히지 않도록
			vcSnavSiteMenu.addEventListener("node-close", function(e){
				e.preventDefault();
			});
			
			// 아이템 클릭 시 해당 페이지 오픈
			vcSnavSiteMenu.addEventListener("item-click", function(e){
				// 다른 사이드네비게이션에 메뉴 선택 되어 있을 경우 clear 
				vcGrpBxBody.getAllRecursiveChildren().filter(function(each){
					if (each instanceof cpr.controls.SideNavigation && each.visible) {
						if(each != e.targetControl){
							each.clearSelection();
						}
					}
				});
				var voItemRow = e.item.row;
				var vsCallPage = voItemRow.getValue("CALL_PAGE");
				if (ValueUtil.fixNull(vsCallPage) != "") {
					app.getRootAppInstance().callAppMethod("openPage", voItemRow, true);
//					
//					// 모바일일 때 어사이드 메뉴 닫기
//					app.getRootAppInstance().getFloatingControls().filter(function(each) {
//						return each.style.hasClass("cl-overlay");
//					}).forEach(function(each) {
//						each.dispatchEvent(new cpr.events.CMouseEvent("click"));
//					});
				}
			});
			
			vcGrpSiteMenu.addChild(vcSnavSiteMenu, {
				autoSize: "height",
				width: "calc(100% / 4 - " + voGrpSiteMenuLt.horizontalSpacing + "px)"
			});
		}
		vcGrpBox.bind("visible").toExpression("@getVisible(self)");
	}
	
	exports.getVisible = function(container){
		var vbVisible = true;
		// 사이트메뉴 박스 visible
		var vaSdn = container.getAllRecursiveChildren().filter(function(each){
			// 하위 컨트롤이 사이트네비게이션이고 visible=true 인 경우에 사이트메뉴 박스 visible=true
			if (each instanceof cpr.controls.SideNavigation && each.visible) {
				return each ;
			}
		});
		
		if (vaSdn.length == 0) vbVisible = false;
	
		return vbVisible;		
	}
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var vcRtDsAllMenu = app.getRootAppInstance().lookup("dsAllMenu");
	vcRtDsAllMenu.copyToDataSet(app.lookup("dsAllMenu"));
	createSiteMenu();
}

/*
 * 서치 인풋에서 search 이벤트 발생 시 호출.
 * Searchinput의 enter키 또는 검색버튼을 클릭하여 인풋의 값이 Search될때 발생하는 이벤트
 */
function onSearchMenuSearch(e){
	var searchMenu = e.control;
	app.lookup("grpBxBody").redraw();	
	return;
}
