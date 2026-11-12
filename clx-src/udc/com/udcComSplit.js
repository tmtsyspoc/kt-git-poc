/************************************************
 * udc_split.js
 * Created at 2019. 5. 23. 오전 11:36:34.
 *
 * @author kim su hyun
 ************************************************/

var vnRightWitdh = "0px";

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return "";
};

exports.clickSplitBtn = function() {
	app.lookup("btn").click();
};

var btn_next = null; // next 버튼 udc

/*
 * "" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnClick( /* cpr.events.CMouseEvent */ e) {
	/**
	 * @type cpr.controls.Button
	 */
	var btn = e.control;
	if(app.getAppProperty("direction") == "horizontal") {
		if(btn.style.icon.hasClass("left")) {
			btn.style.icon.addClass("right");
			btn.style.icon.removeClass("left");
		} else {
			btn.style.icon.addClass("left");
			btn.style.icon.removeClass("right");
		}
	} else {
		if(btn.style.icon.hasClass("up")) {
			btn.style.icon.removeClass("up");
		} else {
			btn.style.icon.addClass("up");
		}
	}
	
	var voHostApp = app.getHostAppInstance();
	
	/** @type cpr.controls.Container */
	var vcBtmGrp = app.getAppProperty("bottomGroup"); // 하단/우측 그룹 컨트롤
	/** @type cpr.controls.Container */
	var vcTopGrp = app.getAppProperty("topGroup"); // 상단/좌측 그룹

	if(ValueUtil.isNull(vcBtmGrp) || ValueUtil.isNull(vcTopGrp)){
		return false;
	}

	var isVertical = app.getAppProperty("direction") == "vertical";
	var vcParentCtl = vcBtmGrp.getParent();

	/** @type cpr.controls.layouts.FormLayout */
	var voParentLayOut = vcParentCtl.getLayout();
	var vnRIdx = indexFnc(vcParentCtl, vcBtmGrp.id, isVertical);
	var vnLIdx = indexFnc(vcParentCtl, vcTopGrp.id, isVertical);
	
	var voConst = vcParentCtl.getConstraint(vcBtmGrp);
	var layOut = [];

	//상세보임
	if(isVertical) {
		if (voParentLayOut.isRowVisible(voConst.rowIndex)) {
//			var tempRows = voParentLayOut.getRows();
//			vnLIdx.forEach(function(each){
//				if(voParentLayOut.getRows()[each].indexOf("fr") == -1) {
//					tempRows[each] = "1fr";
//				}
//			});
//			voParentLayOut.setRows(tempRows);
			vnRIdx.forEach(function(each) {
				voParentLayOut.setRowVisible(each, false);
			});
		} else {
			vnRIdx.forEach(function(each) {
				voParentLayOut.setRowVisible(each, true);
			});
//			if(!ValueUtil.isNull(vcParentCtl.userData("_originSplitRows_"))) {
//				voParentLayOut.setRows(vcParentCtl.userData("_originSplitRows_"));
//			}
		}
		
	} else {
		if (voParentLayOut.isColumnVisible(voConst.colIndex)) {
			vnRIdx.forEach(function(each) {
				voParentLayOut.setColumnVisible(each, false);
			});
		} else {
			vnRIdx.forEach(function(each) {
				voParentLayOut.setColumnVisible(each, true);
			});
		}
	}
	
	app.dispatchEvent(new cpr.events.CUIEvent("clickCallFunc"));
}

/**
 * 스플릿 영역을 기준으로 좌측, 우측 컨트롤의 인덱스를 알아오는 함수
 * @param {String} parent 부모 컨테이너
 * @param {String} appID 좌측 또는 우측 컨트롤의 아이디
 * */
function indexFnc(parent, appID, isVertical) {
	var index = null;
	var range = [];

	parent.getChildren().filter(function(each) {
		if (each.id == appID) {
			var voConst = parent.getConstraint(each);
			if(isVertical) {
				// rowSpan 없는 경우
				if (voConst.rowSpan == null) {
					for (var idx = voConst.rowIndex; idx <= voConst.rowIndex; idx++) {
			        	range.push(idx);
			      }
				} else {
					for (var idx = voConst.rowIndex; idx < voConst.rowIndex + voConst.rowSpan; idx++) {
			        	range.push(idx);
			      }
				}
			} else {
				// colSpan 없는 경우
				if (voConst.colSpan == null) {
					for (var idx = voConst.colIndex; idx <= voConst.colIndex; idx++) {
			        	range.push(idx);
			      }
				} else {
					for (var idx = voConst.colIndex; idx < voConst.colIndex + voConst.colSpan; idx++) {
			        	range.push(idx);
			      }
				}
			}
		}
	});
	
	return range;
}

/*
 * Body에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit( /* cpr.events.CEvent */ e) {
}


/*
 * Body에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(/* cpr.events.CEvent */ e){
	/** @type cpr.controls.Container */
	var vcBtmGrp = app.getAppProperty("bottomGroup");
	if(!ValueUtil.isNull(vcBtmGrp)){
		var vcParentCtl = vcBtmGrp.getParent();
		var voParentLayOut = vcParentCtl.getLayout();
		vcParentCtl.userData("_originSplitRows_", voParentLayOut.getRows());
	} else {
		return;
	}
	
	var btn = app.lookup("btn");
	if(app.getAppProperty("direction") == "horizontal") {
		var container = app.getContainer();
		var optDiv = app.lookup("optDiv");
		container.replaceConstraint(optDiv, {
			top : "0px",
			bottom : "0px",
			right : "-8px",
			width : "1px"
		});
		
		btn.style.icon.addClass("right");
		var vnBtnWid = parseInt(container.getConstraint(btn).width);
		container.replaceConstraint(btn, {
			top : "calc(50% - "+vnBtnWid/2+"px)",
			left : "-4px",
			right : "-16px",
			height : vnBtnWid+"px"
		});
		btn.style.addClass("horizontal");
	}
	
	btn.style.css("z-index", "999");
}


/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 호출되는 이벤트.
 */
function onBodyScreenChange(/* cpr.events.CScreenChangeEvent */ e){
	if( AppProperties.SCREEN_DEFAULT_NM.indexOf(e.screen.name)  == -1){
		app.getContainer().visible = false;
	}else{
		app.getContainer().visible = true;
	}
}
