/************************************************
 * device.module.js
 * Created at 2025. 2. 14. 오전 11:33:21.
 *
 * @author HAN
 ************************************************/

var ieUrl ="C:\\Program Files\\Internet Explorer\\Internet Explorer.VBS";

//function isModern () {
//	return navigator.userAgent.indexOf("Chrome") != -1;
//}
//var conn = null;
//var DeviceLoader = {
//	loader: false,
//	isLoaded: function() {
//		return this.loader;
//	},
//	jqueryCssHead: function() {
//		var cssHead = document.createElement("link");
//		cssHead.href = "thirdparty/exdevice/jquery/jquery-ui.css";
//		cssHead.rel = "stylesheet";
//		cssHead.type = "text/css";
//		return cssHead;
//	},
//	jqueryScrint: function() {
//		var script = document.createElement("script");
//		script.src = "thirdparty/exdevice/jquery/external/jquery/jquery.js";
//		script.type = "text/javascript";
//		script.id = "jquery";
//		return script;
//	},
//	jqueryUiScript: function() {
//		
//		var script = document.createElement("script");
//		script.src = "thirdparty/exdevice/jquery/jquery-ui.js";
//		script.type = "text/javascript";
//		script.id = "jqueryui";
//		return script;
//	},
//	deviceClientScript: function() {
//		
//		var script = document.createElement("script");
//		script.src = "thirdparty/exdevice/exdevice-client.js";
//		script.type = "text/javascript";
//		script.id = "deviceCli";
//		return script;
//	},
//	deviceCommonScript: function() {
//		
//		var script = document.createElement("script");
//		script.src = "thirdparty/exdevice/exdevice-common.js";
//		script.type = "text/javascript";
//		script.id = "deviceCom";
//		return script;
//	},
//	checkLibLoaded: function() {
//		var that = this;
//		var voPrms = new Promise(function(resolve, reject) {
//			
//			if (that.loader) {
//				resolve();
//			} else {
//				
//				if (!document.getElementById("deviceCom")) {
//					var cssHead = that.jqueryCssHead();
//					document.head.appendChild(cssHead);
//					
//					var scriptHead = that.jqueryScrint();
//					document.head.appendChild(scriptHead);
//					if(isModern()) {
//						
//						scriptHead.addEventListener("load", function(ev) {
//							var jqueryUi = that.jqueryUiScript();
//							document.head.appendChild(jqueryUi);
//							var deviceClient = that.deviceClientScript();
//							document.head.appendChild(deviceClient);
//							var deviceCommon = that.deviceCommonScript();
//							document.head.appendChild(deviceCommon);
//							deviceClient.addEventListener("load", function() {
//								that.loader = true;
//								resolve();
//							});
//						});
//					} else {
//						
//						scriptHead.onload = function(ev) {
//							var jqueryUi = that.jqueryUiScript();
//							document.head.appendChild(jqueryUi);
//							var deviceClient = that.deviceClientScript();
//							document.head.appendChild(deviceClient);
//							var deviceCommon = that.deviceCommonScript();
//							document.head.appendChild(deviceCommon);
//							deviceClient.onload = function() {
//								that.loader = true;
//								resolve();
//							};
//						};
//					}
//				} else {
//					if(isModern()) {
//						
//						document.getElementById("deviceCom").addEventListener("load", function() {
//							that.loader = true;
//							resolve();
//						});
//					} else {
//						document.getElementById("deviceCom").onload = function(){
//							that.loader = true;
//							resolve();
//						}
//					}
//				}
//			}
//		});
//		return voPrms;
//	}
//}


var loader = new cpr.core.ResourceLoader();
loader.addCSS("thirdparty/exdevice/jquery/jquery-ui.css")
.addScript("thirdparty/exdevice/jquery/external/jquery/jquery.js");

var loader2 = new cpr.core.ResourceLoader();
loader2.addScript("thirdparty/exdevice/jquery/jquery-ui.js")
.addScript("thirdparty/exdevice/exdevice-client.js")
.addScript("thirdparty/exdevice/exdevice-common.js");

function deviceConnect(){
	var that = this;
	this.conn = null;
	this._resolve = null;
	this.connPromise = new Promise(function(parm1,parm2){
		that._resolve = parm1;
	});
}

deviceConnect.prototype.openConnector = function(psConnectorInfo,onMessage){
	var me = this;
	if(loader2.needToLoad()) {
		loader.load().then(function(input){
			loader2.load().then(function(input){
				if(me.conn == null) {
					var connects = new exdevice.Connector();
					connects.onready = function(){
						me.conn = connects;
						me.updateInfo(psConnectorInfo).then(function(input){
							
							me._resolve();
						});
					};
					connects.onerror = function(msg){
						alert("eXDevice+설치가 필요합니다. 담당자에게 설치 파일 문의하세요.");
						console.log(msg);
						me.conn = null;
					};
					connects.onclose = function(msg){
						alert("CLOSE");
						console.log(msg);
						me.conn = null;
					};
					
					connects.onmessage =onMessage;
					connects.connect();
				}
				
			});
		});
	} else {
		if(me.conn == null) {
			var connects = new exdevice.Connector();
			connects.onready = function(){
				me.conn = connects;
				me.updateInfo(psConnectorInfo).then(function(input){
					
					me._resolve();
				});
			};
			connects.onerror = function(msg){
				alert("eXDevice+설치가 필요합니다. 담당자에게 설치 파일 문의하세요.");
				console.log(msg);
				me.conn = null;
			};
			connects.onclose = function(msg){
				alert("CLOSE");
				console.log(msg);
				me.conn = null;
			};
			
			connects.onmessage =onMessage;
			connects.connect();
		}
	}
}
deviceConnect.prototype.updateInfo = function(psInfo){
	var serviceName = "UpdateWsInfo";
	var that = this;
	
	return new Promise(function(resolve,reject){
			
		that.conn.send(serviceName, {info: psInfo}, function(msg){
			if(msg["statusCode"] != "0000"){
				console.log("브라우저 등록에 에러가 발생했습니다.",msg);
			}
			if(msg["return"] != 0){
				console.log("브라우저 등록에 실패했습니다",msg["return"]);
			} else {
				console.log("브라우저 등록에 성공했습니다.");
				resolve();
			}
		}, true);
	})
}
deviceConnect.prototype.sendMessage = function(psTargetInfo,psMsg) {
	
	// push 대상 client 정보 array에 적재
	var targetClients = [];
	targetClients.push({info:psTargetInfo})

	var serviceName = "PushWsMessage";
	var parameters = {
		receiver: targetClients, 
		message: psMsg
	};

	this.conn.send(serviceName, parameters, function(msg){
		console.log(serviceName + " 호출 결과: " + JSON.stringify(msg));

		if(msg["statusCode"] != "0000"){
			alert("Push 서비스 호출 에러: " + msg["statusCode"]);
			return;
		}
		switch(msg["return"]["returnValue"]){
			case 0:
			console.log("성공!");
				return;
			case 2:
				console.log("일부 실패");
				break;
			default:
				console.log("실패");
				break;
		}
	},true);
}

deviceConnect.prototype.openBrowser = function(){
	var serviceIdentifier = "[다중 브라우저 구동 서비스] ";

	var serviceName = "WinInfo.OpenBrowser";
	var browsers = [];
	var parameters = {
		filePath:ieUrl, url:"http://localhost:8080/ui/app/sce/A14/data/popup.html"
	};
	if(this.conn) {
		
		this.conn.send(serviceName, parameters, function(msg){
			console.log(msg);
		}, true);
	} else {
		var me = this;
		this.connPromise.then(function(input){
			me.conn.send(serviceName, parameters, function(msg){
			console.log(msg);
		}, true);
		});
	}
}

deviceConnect.prototype.setBrowserUri = function(psUri){
	ieUrl = psUri;
}

globals.createDevice = function(){
	return new deviceConnect();
}
