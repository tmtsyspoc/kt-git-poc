/************************************************
 * fetch.module.js
 * Created at 2024. 8. 13. 오후 1:14:45.
 *
 * @author jeeeyul
 ************************************************/


/**
 * @return {XMLHttpRequest}
 */
function createXMLHttpRequet() {
	if (XMLHttpRequest) { //모질라, 사파리, Edge 등 그외 브라우저, ...
		return new XMLHttpRequest();
	} else if (ActiveXObject) { //IE8 이상
		try {
			return new ActiveXObject("Msxml2.XMLHTTP");
		} catch (e) {
			try {
				return new ActiveXObject("Microsoft.XMLHTTP");
			} catch (e) {
				throw new Error('Could not create XMLHttpReqeust object.');
			}
		}
	}
}


/** @type string */
var knownFetchRequest;
/**
 * 
 * @param {string} url
 * @param {[key:string]:any} params
 * @return {Promise<string>}
 */
function fetchText(url, params) {
	var fetchIdentity = JSON.stringify([url, params]);
	if(knownFetchRequest == fetchIdentity){
		return Promise.reject();
	}
	knownFetchRequest = fetchIdentity;
	
	return new Promise(function(resolve, reject) {
		var xhr = createXMLHttpRequet();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		
		var data = Object.keys(params).map(function(each){
			return each + "=" + encodeURIComponent(params[each]);
		}).join("&");

		xhr.send(data);		
		
		xhr.onload = function() {
			if (xhr.readyState === 4) {
				resolve(xhr.responseText);				
			}
		};
	});
}

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}


globals.fetchText = fetchText;
globals.generateUUID = generateUUID;