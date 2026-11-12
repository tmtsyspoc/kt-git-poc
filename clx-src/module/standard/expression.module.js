/************************************************
 * expression.module.js
 * @프로그램설명 : 익스프레션 바인딩에서 사용하기 위한 사용자 정의 함수 관리 모듈
 *
 * @작성일자 : 2022. 9. 22
 * @작성자 :
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/**
 * 표현식에서 다국어 반환
 * @param {String} psKey 키
 * @param {String} psDefaultValue 기본값
 */
cpr.expression.ExpressionEngine.INSTANCE.registerFunction("getLanguage", function(psKey, psDefaultValue){
	var vsLanguage = null;
	
	try {
	    if (psKey === null || psKey === ''){
	        vsLanguage = psDefaultValue;
	    } else {
	    	vsLanguage = cpr.I18N.INSTANCE.message(psKey, cpr.I18N.INSTANCE.currentLanguage); 
	    }
	} catch (psErr) {
		console.error(psErr);
	}
	
	return vsLanguage;
});

/**
 * 주어진 숫자를 지정된 소수점 자릿수까지 반올림하는 함수.
 * @param {Number} psValue 반올림할 숫자. 유효한 숫자가 아니거나 무한대(Infinity)인 경우 0을 반환.
 * @param {Number} pnPosition? 반올림할 소수점 이하 자릿수. 지정하지 않으면 정수 단위로 반올림.
 * @return {Number} 반올림된 숫자.
 */
cpr.expression.ExpressionEngine.INSTANCE.registerFunction("getRound", function(psValue, pnPosition) {
	if (isNaN(psValue)) return 0;
	else if (psValue == Infinity || psValue == -Infinity) return 0;
	if (pnPosition == undefined || pnPosition == null) return Math.round(psValue);
	else return Math.round(psValue * Math.pow(10, pnPosition)) / Math.pow(10, pnPosition);
});

/**
 * 주어진 숫자를 지정된 소수점 자릿수까지 내림(floor) 처리하는 함수.
 * @param {Number} psValue 내림 처리할 숫자. 유효한 숫자가 아니거나 무한대(Infinity)인 경우 0을 반환.
 * @param {Number} pnPosition? 내림 처리할 소수점 이하 자릿수. 지정하지 않으면 정수 단위로 내림 처리.
 * @return {Number} 내림 처리된 숫자.
 */
cpr.expression.ExpressionEngine.INSTANCE.registerFunction("getFloor", function(psValue, pnPosition) {
	if (isNaN(psValue)) return 0;
	else if (psValue == Infinity || psValue == -Infinity) return 0;
	if (pnPosition == undefined || pnPosition == null) return Math.floor(psValue);
	else return Math.floor(psValue * Math.pow(10, pnPosition))/Math.pow(10, pnPosition);
});

/**
 * 주어진 숫자를 천 단위로 쉼표를 삽입한 문자열로 포맷팅하는 함수.
 * @param {Number} psValue 포맷팅할 숫자. 숫자가 아닌 경우 원본 값이 그대로 반환.
 * @return {String|Number} 천 단위 쉼표가 포함된 문자열 또는 입력값이 숫자가 아닐 경우 원본 값.
 */
cpr.expression.ExpressionEngine.INSTANCE.registerFunction("formatToNumber", function(psValue) {
	if (isNaN(psValue)) return psValue;
	return new String(psValue).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
});

/**
 * 주어진 문자열을 소문자로 변환하는 함수.
 * @param {String} psValue 변환할 문자열.
 * @return {String} 소문자로 변환된 문자열.
 */
cpr.expression.ExpressionEngine.INSTANCE.registerFunction("doLowerCase", function(psValue) {
	return psValue.toLowerCase();
});
