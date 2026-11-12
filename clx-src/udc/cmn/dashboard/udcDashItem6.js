/************************************************
 * udcDashItem6.js
 * Created at 2026. 5. 15. 오전 9:19:44.
 *
 * @author suhyu
 ************************************************/


/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/ 
var moSlide = [];
var quickSlide = null;
var util = createCommonUtil();

/************************************************
 ** 파일내 로컬변수 선언  
 ************************************************/
var slidify = cpr.core.Module.require("module/cstm/Slidify").slidify;

exports.redrawSwiper = function () {
	moSlide.forEach(function(swiper){
		swiper.restore();
		swiper.start();
	});
}

/**
 * 대시보드 Swiper 설정
 */
function startSwiper () {
	var vsTargetScrnNm = app.targetScreen.name;
	
	var vnSlideCnt = 6;
	if(AppProperties.SCREEN_MOBILE_NM.indexOf(vsTargetScrnNm) > -1) {
		vnSlideCnt = 3; // 모바일
	} else if(AppProperties.SCREEN_TABLET_NM.indexOf(vsTargetScrnNm) > -1) {
		// 태블릿
		vnSlideCnt = 4;
	}
	
	if(moSlide.length > 0) {
		moSlide.forEach(function(swiper) {
			_setSwiperOption(swiper);	
		});
	} else {
		quickSlide = slidify(app.lookup("grpQuickList"));
		_setSwiperOption(quickSlide);
		quickSlide.start();
		moSlide.push(quickSlide);
	}
	
	function _setSwiperOption (swiper) {
		swiper.showCount = vnSlideCnt;
		swiper.navigationButtonStyle = "none";
		swiper.showPagination = false;
		swiper.useInfiniteScroll = true;
		swiper.autoPlayDelay = 3;
//		swiper.orientation = "horizontal";
	}
}

/*
 * 버튼(btnPrevQuick)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnPrevQuickClick(e) {
	var btnPrevQuick = e.control;
	quickSlide.showPrev();
}

/*
 * 버튼(btnQSlidePlay)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnQSlidePlayClick(e) {
	var btnQSlidePlay = e.control;
	quickSlide.stopAutoPlay();
	app.lookup("btnQSlideStop").visible = true;
	app.lookup("btnQSlidePlay").visible = false;
	
}

/*
 * 버튼(btnQSlideStop)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnQSlideStopClick(e) {
	var btnQSlideStop = e.control;
	quickSlide.autoPlay();
	app.lookup("btnQSlideStop").visible = false;
	app.lookup("btnQSlidePlay").visible = true;
}

/*
 * 버튼(btnNextQuick)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnNextQuickClick(e) {
	var btnNextQuick = e.control;
	quickSlide.showNext();
}

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 앱이 최초 구성된후 최초 랜더링 직후에 발생하는 이벤트 입니다.
 */
function onBodyLoad(e) {
	// swiper 동작 시작
	startSwiper();
}

/*
 * 루트 컨테이너에서 screen-change 이벤트 발생 시 호출.
 * 스크린 크기 변경 시 전파되는 이벤트.
 */
function onBodyScreenChange(e) {
	// swiper 동작 시작
	startSwiper();
}
