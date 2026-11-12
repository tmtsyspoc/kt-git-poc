/************************************************
 * udcComSearchToggle.js
 * Created at 2026. 5. 11. 오후 2:43:13.
 *
 * @author 82106
 ************************************************/

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	app.getHostAppInstance().getContainer().getAllRecursiveChildren().forEach(function(each){
		if(each.style.hasClass("sch-filter-box") && each.getLayout()._rows.length < 3) {
			app.getHost().visible = false;
			
//			each.getParent().getChildren().forEach(function(ctrl){
//				if(ctrl.style.hasClass("sch-btn-wrap")) {
//					ctrl.visible = false;
//				}
//			});
		}
	});
}

/*
 * "상세검색" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e){
	var button = e.control;

	app.getHostAppInstance().getContainer().getAllRecursiveChildren().forEach(function(each){
		if(each.style.hasClass("sch-filter-box")) {
			
			if(button.style.hasClass("expand")) {
				button.style.removeClass("expand");
				for(var idx = 2; idx < each.getLayout()._rows.length; idx++){
					each.getLayout().setRowVisible(idx, true);
				}
			} else {
				button.style.addClass("expand");
				for(var idx = 2; idx < each.getLayout()._rows.length; idx++){
					each.getLayout().setRowVisible(idx, false);
				}
			}
		}
	});


}
