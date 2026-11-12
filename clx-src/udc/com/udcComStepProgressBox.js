/************************************************
 * StepProgressBox.js
 * Created at 2021. 8. 2. 오후 6:05:53.
 *
 * @author csj
 ************************************************/

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

/*
 * 루트 컨테이너에서 before-draw 이벤트 발생 시 호출.
 * 그룹 컨텐츠가 그려지기 직전에 호출되는 이벤트 입니다. 내부 컨텐츠를 동적으로 구성하기위한 용도로만 사용됩니다.
 */
function onBodyBeforeDraw( /* cpr.events.CUIEvent */ e) {
	var vsVals = app.getAppProperty("values");
	var vsDelimiter = app.getAppProperty("delimiter");
	var vsStepNum = app.getAppProperty("step");
	var vcGrpStep = app.lookup("grpStep");
	
	vcGrpStep.removeAllChildren(true);
	
	var vaStepItems = vsVals.split(vsDelimiter);
	
	for (var idx = 1; idx < vaStepItems.length + 1; idx++) {
		var vcStep = new udc.com.udcComStepItem(idx);
		vcStep.value = vaStepItems[idx - 1]
		if (idx < vsStepNum) {
			vcStep.className = "checked";
		} else if (idx == vsStepNum) {
			vcStep.className = "active";
		} else {
			vcStep.className = "no-checked";
		}
		
		if (idx == 1) {
			vcStep.classNode = "firstBox";
		}
		
		if (idx == vaStepItems.length) {
			vcStep.classNode = "lastBox";
		}
		
		vcGrpStep.addChild(vcStep, {
			width: "200px",
			height: "100px"
		});
	}
}