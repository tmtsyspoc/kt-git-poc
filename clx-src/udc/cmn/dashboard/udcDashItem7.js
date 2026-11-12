/************************************************
 * udcDashItem7.js
 * Created at 2026. 5. 15. 오전 9:19:49.
 *
 * @author suhyu
 ************************************************/


/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/ 
var moSlide = [];
var util = createCommonUtil();
var newsSlide = null;

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
	
	var vnSlideCnt = 4;
	util.Control.setVisible(app, true, ["btnNewsScrollL","btnNewsScrollR"])
	if(AppProperties.SCREEN_MOBILE_NM.indexOf(vsTargetScrnNm) > -1) {
		vnSlideCnt = 1; // 모바일
		util.Control.setVisible(app, false, ["btnNewsScrollL","btnNewsScrollR"])
	} else if(AppProperties.SCREEN_TABLET_NM.indexOf(vsTargetScrnNm) > -1) {
		// 태블릿
		vnSlideCnt = 2;
		util.Control.setVisible(app, false, ["btnNewsScrollL","btnNewsScrollR"])
	}
	
	if(moSlide.length > 0) {
		moSlide.forEach(function(swiper) {
			_setSwiperOption(swiper);	
		});
	} else {
		newsSlide = slidify(app.lookup("grpNewsList"));
		_setSwiperOption(newsSlide);
		newsSlide.start();
		moSlide.push(newsSlide);
	}
	
	function _setSwiperOption (swiper) {
		swiper._originSpacing = 12;
		swiper.showCount = vnSlideCnt;
		swiper.navigationButtonStyle = "none";
		swiper.showPagination = false;
		swiper.useInfiniteScroll = true;
//		swiper.orientation = "horizontal";
	}
}

/*
 * 버튼(btnNewsScrollL)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnNewsScrollLClick(e) {
	var btnNewsScrollL = e.control;
	newsSlide.showPrev();
}

/*
 * 버튼(btnNewsScrollR)에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnNewsScrollRClick(e) {
	var btnNewsScrollR = e.control;
	newsSlide.showNext();
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

/*
 * 탭 폴더에서 selection-change 이벤트 발생 시 호출.
 * Tab Item을 선택한 후에 발생하는 이벤트.
 */
function onTabFolderSelectionChange(e) {
	var tabFolder = e.control;
}
