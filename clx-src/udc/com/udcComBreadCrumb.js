/************************************************
 * udcComBreadCrumb.js
 * Created at 2026. 5. 14. 오후 6:01:30.
 *
 * @author 82106
 ************************************************/

/**************************************************
 * 전역 변수
 **************************************************/
var util = createCommonUtil();

/**************************************************
 * 이벤트 리스너 함수
 **************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var hostApp = app.getHostAppInstance();
	if(!hostApp) return;
	
	if (!util.Dialog.isDialogPopup(hostApp) && app.getRootAppInstance().hasAppMethod("getMenuPath")) {
		//어플리케이션 메뉴 정보
		var voMenuInfo = util.Main.getMenuInfo(app);
		var vsCallPage = voMenuInfo.get("CALL_PAGE");
		var vsMenuId = voMenuInfo.get("MENU_ID");
		
		var vcGrpMenuPath = app.lookup("grpBc");
		vcGrpMenuPath.removeAllChildren();
		var voDmMenuNaviPath = app.getRootAppInstance().callAppMethod("getMenuPath", vsMenuId);
		if (voDmMenuNaviPath) {
			
			var vaMenuNaviPathId = voDmMenuNaviPath.get("MENU_PATH_ID");
			var vaMenuNaviPathNm = voDmMenuNaviPath.get("MENU_PATH_NM");
			var vcGrpMenuPathLayout = vcGrpMenuPath.getLayout();
			vaMenuNaviPathId.some(function(cos, idx) {
				var vcOptMenuPath = new cpr.controls.Output(cos);
				var vsPathNm = vaMenuNaviPathNm[idx];
				
				vcOptMenuPath.value = vsPathNm;
				
				if (idx == vaMenuNaviPathId.length - 1) {
					vcOptMenuPath.tooltip = vsCallPage;
				}
				
				vcGrpMenuPath.addChild(vcOptMenuPath, {
					width: "100px",
					height: "28px",
					autoSize: "width"
				});
			});
		}
	}
}
