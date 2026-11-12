/************************************************
 * udcStockInvest.js
 * Created at 2025. 5. 13. 오후 1:27:18.
 *
 * @author HAN
 ************************************************/
var util = createCommonUtil();
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
		util.Submit.send(app, "subInvest",function(){
		var vcDsInvest = app.lookup("dsInvestOut");
		var voRow = vcDsInvest.getRow(0);
//		if(voRow.getValue("DATE") == moment().format("YYYY.MM.DD") && voRow.getValue("PRSN_NTBY_QTY") == 0) {
//			vcDsInvest.realDeleteRow(0);
//		}
		util.Grid.selectRow(app, "grdInvest",0);
	});
}

/*
 * 그리드에서 selection-change 이벤트 발생 시 호출.
 * detail의 cell 클릭하여 설정된 selectionunit에 해당되는 단위가 선택될 때 발생하는 이벤트.
 */
function onGrdInvestSelectionChange(e){
	var grdInvest = e.control;
	//선택된 행에 대한 투자자 정보 값 업데이트 처리
	var voRow = grdInvest.getSelectedRow();
	var vnPrsn = Number(voRow.getValue("PRSN_NTBY_QTY"));
	var vnFrgn = Number(voRow.getValue("FRGN_NTBY_QTY"));
	var vnOrgn = Number(voRow.getValue("ORGN_NTBY_QTY"));
	var vnMax = Math.max(Math.abs(vnPrsn),Math.abs(vnFrgn),Math.abs(vnOrgn));
	var vcSlidePrsn = app.lookup("sldPrsn");
	var vcSlideFrgn = app.lookup("sldFrgn");
	var vcSlideOrgn = app.lookup("sldOrgn");
	vcSlidePrsn.max = vnMax;
	vcSlideFrgn.max = vnMax;
	vcSlideOrgn.max = vnMax;
	vcSlidePrsn.min = -vnMax;
	vcSlideFrgn.min = -vnMax;
	vcSlideOrgn.min = -vnMax;
	vcSlidePrsn.value = vnPrsn > 0? 0+","+vnPrsn : vnPrsn+","+0;
	vcSlideFrgn.value = vnFrgn > 0? 0+","+vnFrgn : vnFrgn+","+0;
	vcSlideOrgn.value = vnOrgn > 0? 0+","+vnOrgn : vnOrgn+","+0;
}
