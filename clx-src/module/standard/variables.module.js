/************************************************
 * valiables.module.js
 * Created at 2021. 12. 20. 오후 3:36:06.
 *
 * @author 
 ************************************************/

var goCustNo = "";
var goKorNm = "";

// 전역 변수
globals.goCustNo = goCustNo;//고객번호
globals.goKorNm = goKorNm;//고객명

// 전역 함수
globals.getGoCusNo = function(){
	return goCustNo;
}
globals.setGoCusNo = function(psCustNo){
	goCustNo = psCustNo;
}
globals.getGoKorNM = function(){
	return goKorNm;
}
globals.setGoKorNM = function(psKorNm){
	goKorNm = psKorNm;
}
