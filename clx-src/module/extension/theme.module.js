/************************************************
 * theme.module.js
 * Created at 2025. 4. 15. 오전 9:34:58.
 *
 * @author daye
 ************************************************/

var voRootApp = null;

/**
 * 운영체제의 테마를 감지하여 다크모드 적용 여부 결정
 * @param {any} pbDarkMode
 */
function setThemeClass (pbDarkMode) {
	var vsAttrTheme = document.body.getAttribute("data-xb-theme");
	if(vsAttrTheme == null || vsAttrTheme == "system") {
		if(pbDarkMode) {
			// system이 dark 테마인 경우
			document.body.classList.add("dark-mode");
		} else {
			// system이 dark 테마가 아닌 경우
			document.body.classList.remove("dark-mode");
		}
		
		if(voRootApp == null) {
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function(){
				var voLoadApps = cpr.core.Platform.INSTANCE.getAllRunningAppInstances();
				if(voLoadApps.length > 0) {
					voRootApp = voLoadApps[0].getRootAppInstance();
				}
			});
		}
		
		if(voRootApp && voRootApp.hasAppMethod("setDarkLogo")) {
			voRootApp.callAppMethod("setDarkLogo", document.body.classList.contains("dark-mode"));
		}
	}
}

// 운영체제 다크모드 감지
var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
setThemeClass(mediaQuery.matches);

// IE11 호환: addListener 사용
if (typeof mediaQuery.addEventListener === "function") {
	mediaQuery.addEventListener("change", function (e) {
		setThemeClass(e.matches);
	});
} else if (typeof mediaQuery.addListener === "function") {
	mediaQuery.addListener(function (e) {
		setThemeClass(e.matches);
	});
}

/**
 * 운영체제의 테마가 다크모드인지 확인
 * @return {Boolean} 다크모드 여부
 */
globals.getSystemTheme = function () {
	var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	return mediaQuery.matches;
}