/************************************************
 * udcCmnStepProgress.js
 * Created at 2023. 3. 2. 오전 11:53:55.
 *
 * @author tomatosystem
 ************************************************/

var maStepConts = [];

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
	var vsStepNum = app.getAppProperty("step");
	
	if (ValueUtil.isNull(vsVals)) return false;
	
	app.lookup("grpStep").removeAllChildren(true);
	
	var vaStepItems = vsVals.split(",");
	
	for (var idx = 1; idx < vaStepItems.length + 1; idx++) {
		
		var vsClsNm, vsClsNode;
		
		if (idx == vsStepNum) {
			vsClsNm = "active";
		} else if (idx <= vsStepNum - 1) {
			vsClsNm = "prev-active";
		} else {
			vsClsNm = "no-checked";
		}
		
		if (idx == 1) {
			vsClsNode = "firstBox";
		} else if (idx == vaStepItems.length) {
			vsClsNode = "lastBox";
		} else {
			vsClsNode = "";
		}
		
		createStepItem(idx, vaStepItems[idx - 1], vsClsNm, vsClsNode);
		
	}
}

/**
 * stepItem 생성
 * @param {Number} pnIdx 아이템 인덱스
 * @param {String} psVal value
 * @param {String} psClsNm className
 * @param {String} psClsNode classNode
 */
function createStepItem(pnIdx, psVal, psClsNm, psClsNode) {
	
	var vcGrpStep = app.lookup("grpStep");
	
	var optStepLabel = new cpr.controls.Output("stepLabel" + pnIdx);
	optStepLabel.value = psVal;
	optStepLabel.style.setClasses(psClsNm);
	optStepLabel.style.addClass(psClsNode);
	optStepLabel.userData("step", pnIdx);
	
	vcGrpStep.addChild(optStepLabel, {
		autoSize : "width",
		height: "32px"
	});
	
	optStepLabel.addEventListener("click", function(e) {
		var optStep = e.control;
		var stepVal = optStep.userData("step");
		
		app.setAppProperty("step", stepVal);
		
		var event = new cpr.events.CAppEvent("stepItem-click");
		event.userData = {
			"step": pnIdx,
			"stepValue": psVal
		}
		
		app.dispatchEvent(event);
	});
}
/**
 * step 정보를 반환합니다.
 * @param {Number} pnStep step
 * @return {Object} step 정보(Object, key : stepIndex, stepValue, stepSubValue);
 */
function getStepInfo(pnStep) {
	return maStepConts[pnStep - 1];
}

/**
 * step 정보를 설정합니다.
 * @param {Number} pnStep
 */
function setStepInfo (pnStep) {
	var optStepLabel = new cpr.controls.Output("stepLabel" + pnStep);
	if(optStepLabel) {
		app.setAppProperty("step", pnStep);
		
		var event = new cpr.events.CAppEvent("stepItem-click");
		event.userData = {
			"step": pnStep,
			"stepValue": optStepLabel.value
		}
		
		app.dispatchEvent(event);
	}
}


exports.getStepInfo = getStepInfo;
exports.setStepInfo = setStepInfo;

/*
 * 루트 컨테이너에서 property-change 이벤트 발생 시 호출.
 * 앱의 속성이 변경될 때 발생하는 이벤트 입니다.
 */
function onBodyPropertyChange( /* cpr.events.CPropertyChangeEvent */ e) {
	
	if (e.property == "step") {
		setStepInfo(e.newValue);
		app.getContainer().redraw();
	}
}