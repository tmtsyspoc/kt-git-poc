exports.setText = function(vsText){
	app.lookup("optTxt").value = vsText;
};
exports.show = function(){
	app.lookup("optRowCount").visible = true;
	app.lookup("optTxt").visible = false;
};

exports.showProgress = function(){
	app.lookup("progressbar").visible = true;
	app.lookup("optTxt").visible = false;
};

exports.hide = function(){
	app.lookup("optRowCount").visible = false;
	app.lookup("optTxt").visible = true;
};

exports.hideProgress = function(){
	app.lookup("progressbar").visible = false;
	app.lookup("optTxt").visible = true;
};

exports.count = function(pnCount){
	app.lookup("optRowCount").value = "건수 : "+pnCount;
};

exports.isVisibleProgress = function(){
	return app.lookup("progressbar").visible;
};

exports.progress = function(pnTotal, pnLoaded){
	var progress = app.lookup("progressbar");
//	console.log(pnTotal +  "  :  " + pnLoaded);
//	console.log(Math.floor((parseInt(pnLoaded) / parseInt(pnTotal)) * 100));
	progress.max = 100;
	progress.value = Math.floor((parseInt(pnLoaded) / parseInt(pnTotal)) * 100);
};