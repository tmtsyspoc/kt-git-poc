/************************************************
 * EXBMSGP01.js
 * Created at 2023. 4. 21. 오후 3:36:34.
 *
 * @author ryu
 ************************************************/

/************************************************
 * 공통 모듈 선언
 ************************************************/

var util = createCommonUtil();

/************************************************
 * 컨트롤 이벤트
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e){
	var voHostCtrl = app.getHost();
	if (!voHostCtrl){
		return;
	}
	/** @type {MessageInterface} */
	var voInitValue = app.getHostProperty("initValue");
	if (ValueUtil.fixNull(voInitValue) != ""){

		/* 메세지 팝업의 유형에 따라 메세지 상태 및 버튼 가시성 제어 */
		if (voInitValue["msgType"] != "alert"){
			util.Control.setVisible(app, true, ["btnNegative"]);
		}
		
		if(!ValueUtil.isNull(voInitValue["msgStateType"])) {
			app.getHost().style.addClass("alert");
		}
		if (voInitValue["msgStateType"] == "SUCCESS"){
			app.getHost().style.addClass("success");
		} else if(voInitValue["msgStateType"] == "WARNING"){
			app.getHost().style.addClass("warning");
		} else if(voInitValue["msgStateType"] == "DANGER"){
			app.getHost().style.addClass("danger");
		} else {
			app.getHost().style.addClass("info");
		}
		
		
		/* 메세지 텍스트 및 버튼 텍스트 변경 */
		var vsMsg = ValueUtil.fixNull(voInitValue["msg"]);
		var vsSubMsg = ValueUtil.fixNull(voInitValue["subMsg"]);
		var vsPositiveBtnTxt = ValueUtil.fixNull(voInitValue["confirmBtnText"]);
		var vsNegativeBtnTxt = ValueUtil.fixNull(voInitValue["cancelBtnText"]);
		
		if(ValueUtil.isNull(vsPositiveBtnTxt)) vsPositiveBtnTxt = "확인";
		if(ValueUtil.isNull(vsNegativeBtnTxt)) vsNegativeBtnTxt = "취소";
		
		util.Control.setValue(app, "optMsg", vsMsg);
		util.Control.setValue(app, "optSubMsg", vsSubMsg);
		util.Control.setValue(app, "btnPositive", vsPositiveBtnTxt);
		util.Control.setValue(app, "btnNegative", vsNegativeBtnTxt);		
	}
}

/*
 * "취소" 버튼(btnNegative)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnNegativeClick(e){
	app.close();
}

/*
 * "확인" 버튼(btnPositive)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPositiveClick(e){
	app.close("close");
}
