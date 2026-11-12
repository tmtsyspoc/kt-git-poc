/************************************************
 * udcStockHoga.js
 * Created at 2025. 5. 13. 오후 1:24:36.
 *
 * @author HAN
 ************************************************/
var util = createCommonUtil();
var mnMaxRSQN = 10000;//호가 최대값 기본

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function(){
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};


/**
 * 호가창 프로그레스 최대값 지정 함수
 */
function setMaxProgress () {
	var vcDm = app.lookup("dmHoga5Out");
	var vaRSQN = [];
	for(var i=0; i <5; i++) {
		vaRSQN.push(vcDm.getValue("out_val_"+(46+i)));
		vaRSQN.push(vcDm.getValue("out_val_"+(51+i)));
	}
	
	var vnMaxRSQN = Math.max(...vaRSQN);
	mnMaxRSQN = vnMaxRSQN;
	util.DataMap.setValue(app, "dmHoga5Out", "MAX_RSQN", vnMaxRSQN);
	util.Control.redraw(app, "grpHoga");
}



/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
		util.Submit.send(app,"subHoga5List",function(){
		setMaxProgress();
		util.Control.redraw(app, "grpHoga");
	});
}
