/************************************************
 * A52.js
 * Created at 2023. 5. 10. 오후 5:47:16.
 *
 * @author tomatosystem
 ************************************************/

/************************************************
 * 전역변수
 ************************************************/

/**
 * 공통함수 유틸
 */
var util = createCommonUtil();

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
