/************************************************
 * ThirdpartyLoader.module.js
 * Created at 2024. 10. 21. 오후 2:49:48.
 *
 * @author HAN
 ************************************************/

CaptureLoader = {
	loader : false,
	isLoaded  : function(){
		return this.loader;
	},
	createScript : function(){

		var script = document.createElement("script");
		script.src = "thirdparty/html2canvas/html2canvas.js";
		script.type = "text/javascript";
		script.id = "html2canvas";

		return script;
	},
	checkLibLoaded : function(){
			var that = this;
			var voPrms = new Promise(function(resolve,reject){

			if(that.loader) {
				resolve();
			} else {

				if(!document.getElementById("html2canvas")){
//					var cssHead = that.createCssHead();
//					document.head.appendChild(cssHead);

					var scriptHead = that.createScript();
					document.head.appendChild(scriptHead);
					scriptHead.addEventListener("load", function(ev){
						that.loader = true;
						resolve();
					});
				} else {
					document.getElementById("html2canvas").addEventListener("load", function(){
						that.loader = true;
						resolve();
					});
				}
			}
			});
			return voPrms;
	}
}