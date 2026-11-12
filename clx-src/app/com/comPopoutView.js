/************************************************
 * comPopoutView.js
 * @프로그램설명 : 
 *
 * @작성일자 :  2026. 5. 20..
 * @작성자 : dyseo
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
var util = createCommonUtil();

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술 
 ************************************************/ 


/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시) 
 ************************************************/

/*
 * "닫기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onButtonClick(e) {
	app.close();
}

/*
 * 루트 컨테이너에서 init 이벤트 발생 시 호출.
 * 앱이 최초 구성될 때 발생하는 이벤트 입니다.
 */
function onBodyInit(e) {
	var voInitValue = app.getHostProperty("initValue");
	if(voInitValue) {
		var vcGrpData = app.lookup("grpData");
		var vcAddCtrl = voInitValue["control"];
		if(vcAddCtrl instanceof cpr.controls.Grid) {
			vcAddCtrl = new cpr.controls.Grid(vcAddCtrl.id);
			var voConfig = voInitValue["config"];
			
			var ds = new cpr.data.DataSet(voConfig.dataSet.id);
			voConfig.dataSet.copyToDataSet(ds);
			app.register(ds);
			
			vcAddCtrl.init(voConfig);
		} else if(vcAddCtrl instanceof cpr.controls.Image) {
			var xyLayout = new cpr.controls.layouts.XYLayout();
			vcGrpData.setLayout(xyLayout);
			vcGrpData.addChild(vcAddCtrl, {
				top : "0px",
				left : "0px",
				right : "0px",
				bottom : "0px"
			});
			app.getContainer().getLayout().setRowVisible(1, true);
			return;
		}
		
		if(vcAddCtrl) {
			vcGrpData.addChild(vcAddCtrl, {
				autoSize: "height"
			});
			util.Grid.init(app, vcAddCtrl.id);
		}
	}
}

/*
 * 루트 컨테이너에서 before-unload 이벤트 발생 시 호출.
 * 앱이 언로드되기 전에 발생하는 이벤트 입니다. 취소할 수 있습니다.
 */
function onBodyBeforeUnload(e) {
	app.setHostProperty("returnValue", {
		"control" : app.lookup("grpData").getFirstChild()
	});
}
