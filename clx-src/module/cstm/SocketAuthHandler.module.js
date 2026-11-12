/************************************************
 * SocketPermissionHandler.module.js
 * Created at 2025. 2. 12. 오후 4:07:45.
 *
 * @author HAN
 ************************************************/
/** @type WebSocket */
var socket = null;
var myData = null;
globals.getSocket = function(){
	return socket;
}
globals.setSocket = function(poSocket){
	socket = poSocket;
}



/**
 * 
 * @param {{"CALL_PAGE":String,"USR_ACCESS_YN":String,"USR_TRANS_YN":String}[]} data
 */
globals.setAuthHandling = function(data) {
	if(data == null ){
		return;
	}
	myData = data;
}
