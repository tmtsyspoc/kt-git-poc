/************************************************
 * udcDashItem10.js
 * Created at 2026. 5. 15. 오전 9:20:05.
 *
 * @author suhyu
 ************************************************/

var slidify = cpr.core.Module.require("module/cstm/Slidify").slidify;
var optGuide = null;

/*
 * 버튼(btnGSlidePlay)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnGSlidePlayClick(e) {
	var btnGSlidePlay = e.control;
	optGuide.autoplay.stop();
	
	app.lookup("btnGSlideStop").visible = true;
	app.lookup("btnGSlidePlay").visible = false;
}

/*
 * 버튼(btnGSlideStop)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnGSlideStopClick(e) {
	var btnGSlideStop = e.control;
	
	optGuide.autoplay.start();
	app.lookup("btnGSlideStop").visible = false;
	app.lookup("btnGSlidePlay").visible = true;
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	 if (app.disposed) return;
	//우측의 텍스트 슬라이드 작동 위해
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(function() {
		var optGuideSlide = document.querySelector(".guide-swiper-content");

		/** @type HTMLElement */
		var optSwiperInLayout = optGuideSlide.firstChild;
		optSwiperInLayout.classList.add("swiper", "swiper-guide");
		
		/** @type HTMLElement */
		var optSwiperInLayoutCont = optSwiperInLayout.firstChild;
		optSwiperInLayoutCont.classList.add("swiper-wrapper");
		
		/** @type HTMLElement[] */
		var optSwiperInLayoutWraps = optSwiperInLayoutCont.childNodes;
		optSwiperInLayoutWraps.forEach(function( /* HTMLElement */ el) {
			el.classList.add("swiper-slide");
		});
		
		optGuide = new Swiper(".swiper-guide", {
			direction: 'vertical',
			slidesPerView: 1,
			loop: true,
				autoplay: {
					delay: 3000,
					disableOnInteraction: false
			}
		});
		
		if (!app.rendered) return;
		app.lookup("btnPrev").addEventListener("click", function(e){
			optGuide.slidePrev();
		});
		app.lookup("btnNext").addEventListener("click", function(e){
			optGuide.slideNext();
		});
	});
}
