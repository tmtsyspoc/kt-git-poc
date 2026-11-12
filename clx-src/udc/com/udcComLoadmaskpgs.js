
var intervalID = null;

exports.start = function() {
	var progressbar = app.lookup("progressbar");
	
	if(intervalID) {
		window.clearInterval(intervalID);
		intervalID = null;
	}
	
	intervalID = window.setInterval(function() {
		var pValue = progressbar.numberValue;
		pValue += 4;
		if(pValue > progressbar.max) {
			progressbar.numberValue = 0;
		} else {
			progressbar.numberValue = pValue;
		}
	}, 100);
}

exports.end = function() {
	if(intervalID) {
		window.clearInterval(intervalID);
		var progressbar = app.lookup("progressbar");
		progressbar.numberValue = 0;
		intervalID = null;
	}
}