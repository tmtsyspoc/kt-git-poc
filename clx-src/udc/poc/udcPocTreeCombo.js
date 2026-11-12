/************************************************
 * treeComb.js
 * Created at 2020. 11. 6. 오후 2:11:16.
 *
 * @author tomatosystem
 ************************************************/

/**
 * UDC 컨트롤이 그리드의 뷰 모드에서 표시할 텍스트를 반환합니다.
 */
exports.getText = function() {
	// TODO: 그리드의 뷰 모드에서 표시할 텍스트를 반환하는 하는 코드를 작성해야 합니다.
	return app.lookup("cmb1").value;
};

/*
 * 콤보 박스에서 blur 이벤트 발생 시 호출.
 * 컨트롤이 포커스를 잃은 후 발생하는 이벤트.
 */
function onCmb1Blur( /* cpr.events.CFocusEvent */ e) {
	/** 
	 * @type cpr.controls.ComboBox
	 */
	var cmb1 = e.control;
	if (app.getRootAppInstance().lookup("trees") && !app.getRootAppInstance().lookup("trees").focused) {
		app.getRootAppInstance().lookup("trees").dispose();
	}
}

/*
 * 콤보 박스에서 open 이벤트 발생 시 호출.
 * 리스트박스를 열때 발생하는 이벤트.
 */
function onCmb1Open( /* cpr.events.CUIEvent */ e) {
	/** 
	 * @type cpr.controls.ComboBox
	 */
	var cmb1 = e.control;
	
	e.preventDefault();
	
	if (!app.getRootAppInstance().lookup("trees")) {
		
		var vcDs = app.getAppProperty("itemDataSet");
		var vsLabelCol = app.getAppProperty("labelColumn");
		var vsValueCol = app.getAppProperty("valueColumn");
		var vsParentCol = app.getAppProperty("parentColumn");
		
		var trees = new cpr.controls.Tree("trees");
		trees.setItemSet(vcDs, {
			label: vsLabelCol,
			value: vsValueCol,
			parentValue: vsParentCol
		});
		trees.showLines = true;
		
		if(cmb1.value) {
			trees.selectItemByValue(cmb1.value);
		}
		
		app.getRootAppInstance().getContainer().floatControl(trees, {
			left: cmb1.getActualRect().bottomLeft.x + "px",
			top: cmb1.getActualRect().bottomLeft.y + "px",
			width: "150px",
			height: "350px"
		});
		
		trees.addEventListenerOnce("blur", function(e) {
			e.control.dispose();
		})
		trees.addEventListener("selection-change", function(e) {
			var newSelect = e.newSelection;
			app.lookup("cmb1").selectItemByValue(newSelect[0].value);
			e.control.blur();
		})
		
	}
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(/* cpr.events.CEvent */ e){
	app.lookup("cmb1").setItemSet(app.getAppProperty("itemDataSet"),{
		label: app.getAppProperty("labelColumn"),
		value: app.getAppProperty("valueColumn")
	});
}
