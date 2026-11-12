/************************************************
 * WebSocketManager.module.js
 * Created at 2025. 5. 14. 오전 11:49:00.
 *
 * @author HAN
 ************************************************/
var msStaticUrl = "app/sce/A15/image/";
globals.getStaticUrl = function(){
	return msStaticUrl;
}

var ws = null;

//메세지 컨버팅 관련 전역변수
var prefixData = "";
var reg = /a\._b='([^']+)';a\.([A-Za-z0-9_]*)=new \2\(\[(.*?)\]\);/;
var arrReg = /"([^"]*)"/g;
var hoga = new Set();
var chegyol = new Set();
/**
 * "PDRT": "삼성전자",
 * "DIV": "KOSPI",
 * "PDNO": "005930"
 */
/** @type {PDRT:String,DIV:String,PDNO:String} */
var isInfo = null;

var vaColumnName = [
				"SHRN_ISCD", "STCK_CNTG_HOUR", "HOUR_CLS_CODE", "ANTC_NMIX_CLS_CODE", "STCK_PRPR", "PRDY_VRSS_SIGN", "PRDY_VRSS", "PRDY_CTRT", "STCK_OPRC", "STCK_HGPR",
				"STCK_LWPR", "STCK_SDPR", "STCK_MXPR", "STCK_LLAM", "CNTG_CLS_CODE", "CTNG_VOL", "ACML_VOL", "ACML_TR_PBMN", "ASKP1", "PIDP1", "ASKP_RSQN1", "BIDP_RSQN1",
				"TOTAL_ASKP_RSQN", "TOTAL_BIDP_RSQN", "TRHT_YN", "MANG_ISSU_YN", "PRST_CLS_CODE", "WARN_YN", "NEW_MKOP_CLS_CODE", "RGBF_CNTG_CLS_CODE", "RGTV"
			];


//globals.getISInfo = function(){
//	return isInfo;
//}
globals.connect = function(poIS){
	if(ws != null) {
		return;
	}
	isInfo = poIS;
	var vsISCD = poIS["PDNO"];
	var vsURL = getSocketUrl()  +new Date().getTime()/100;
	ws = new WebSocket(vsURL);
	ws.onopen = function(event){
		ws.send("+"+vsISCD+":iGrid:S00");
		ws.send("+"+vsISCD+":hoga5Form:S15|S00|S02");
		ws.send("+"+vsISCD+":chegyol:S00");
	}
	ws.onmessage = function(event){
		var data = event.data;
		data = data.replace(/\\/g,',^').replace(/\?/g,'`#').replace(/\^/g,'~#').replace(/#/g,'","').replace(/~/g,'000').replace(/`/g,'00').replace(/@/g,'0.') ;
		messageConvert(data);
	};
	ws.onerror = function(error) {
		console.log(error);
	}
}
globals.disconnect = function(){
	ws.close();
	ws = null;
	hoga = new Set();
	chegyol = new Set();
}
globals.addHoga = function(func){
	hoga.add(func)
}
globals.deleteHoga = function(func){
	hoga.delete(func);
}
globals.addChegyol = function(func){
	chegyol.add(func);
}
globals.deleteChegyol = function(func){
	chegyol.delete(func);
}


function messageConvert(msMsg) {
	var data = msMsg;
	var sp=data.indexOf('"');
		if(sp==0) {
			data=prefixData+data;
		}else {
			prefixData=data.substring(0,sp);
		}
		
		var match = data.match(reg);
		const arrs = [];
		let matchs;
		while((matchs = arrReg.exec(match[3])) !== null) {
			arrs.push(matchs[1]);
		}
		var dataObj = {
			info: match[1],
			type: match[2],
			rowArr: arrs
		}
		var updateData = dataObj.rowArr;
		var that = this;
		if(dataObj.type == "S15") {
			//호가
			hoga.forEach(function(valueFunc){
				valueFunc(updateData);
			})
		}
		else if(dataObj.type == "S00") {
			
			var row = {};
			vaColumnName.forEach(function(each,idx){
				row[each] = updateData[idx];
			});
			chegyol.forEach(function(valueFunc){
				valueFunc(row);
			});
		}
}