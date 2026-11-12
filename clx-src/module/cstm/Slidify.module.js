/************************************************
 * Slidify.module.js
 * Created at 2019. 1. 3. 오후 12:56:32.
 *
 * @author jeeeyul
 ************************************************/

/************************************************
 * SlideView
 ************************************************/
/**
 * @param {Event} e
 */
function eventStopper(e) {
	e.stopPropagation();
	e.preventDefault();
}

/**
 * @param {cpr.controls.Container} container
 */
function SlideView(container) {
	this._container = container;
	/** @type cpr.controls.layouts.FlowLayout */
	this._layout = container.getLayout();
	
	this._cloneLayout = this._containerStrategy(this._layout);
	this._restoreConstraint = this._container.getChildren().map(function(each){
		return each.getParent().getConstraint(each);
	});
	
	/** @type {
	* 	 default: String[], 
	* 	 tablet: String[], 
	* 	 mobile: String[]
	* 	} 
	**/
	this._screenNms = this._setScreenNm();
	this._setup();
};

/************************************************
 * 사용자 정의 가능 Property
 ************************************************/
/**
 * 한 페이지에서 표시할 콘텐츠 수
 * @type {Number} 
 */
SlideView.prototype.showCount = 2;

/**
 * 페이지 내 한 컨텐츠의 너비<br/>
 * 0인 경우 비율로 균등 분배합니다.
 * @type {Number} 
 */
SlideView.prototype.itemSize = 0;

/**
 * 페이지 내 한 컨텐츠의 너비를 자동크기 지정 여부 (itemSize 무시)
 * @type {Boolean} 
 */
SlideView.prototype.itemAutoSize = false;

/**
 * 자동 재생시 애니메이션의 길이. 단위 초.
 * @type {Number} 
 */
SlideView.prototype.autoPlayDuration = 1.0;

/**
 * 자동 재생시, 각 재생간의 간격. 단위 초.<br/>
 * 0 이상의 값을 주면 start()시 자동 재생이 시작됩니다.<br/>
 * 0을 주는 경우, 자동으로 재생을 시작하지 않습니다.
 * @type {Number} 
 */
SlideView.prototype.autoPlayDelay = 0;

/**
 * 터치 또는 마우스로 드래그 중 놓았을 때, 스내핑 애니메이션의 길이. 단위 초.
 * @type {Number} 
 */
SlideView.prototype.snapDuration = 0.3;

/**
 * 페이지니션을 표시할 것인지 여부.
 * @type {Boolean} 
 */
SlideView.prototype.showPagination = true;

/**
 * 커스텀 페이지니션을 연결할 것인지 여부.
 * @type {Boolean} 
 */
SlideView.prototype.useCustomPagination = true;

/**
 * 연결할 페이지인덱서.
 * @type {cpr.controls.PageIndexer} 
 */
SlideView.prototype.pagination = null;

/**
 * 페이지니션에 추가로 부여할 클래스 명.
 * @type {#css-class} 
 */
SlideView.prototype.paginitionClassName = "";

/**
 * 페이지니션 표시 스타일
 * <ul><li>button: 버튼으로 제공</li>
 * <li>text: 숫자 텍스트로 제공</li></ul>
 * @type {"button" | "text"} 
 */
SlideView.prototype.paginitionStyle = "button";

/**
 * 좌우 버튼의 크기
 * @type {Number} 
 */
SlideView.prototype.navigationButtonSize = 30;

/** 
 * 좌우버튼에 추가적으로 줄 클래스 명.
 * @type {String} 
 */
SlideView.prototype.navigationButtonClassName = null;

/**
 * 내비게이션 버튼 표시 스타일
 * <ul><li>hover: 컨테이너 가장자리에 호버 시킴</li>
 * <li>inside: 컨테이너 안쪽에 표시</li>
 * <li>outside: 컨테이너 가장자리 바깥쪽에 표시</li>
 * <li>content-hover: 가운데 정렬된 콘텐츠의 가장자리에 호버 시킴</li>
 * <li>content-outside: 가운데 정렬된 콘텐츠의 가장자리에 바깥쪽에 표시</li></li>
 * <li>none: 버튼 표시 안함</li></ul>
 * @type {"hover" | "inside" | "outside" | "content-hover" | "content-outside" | "none"} 
 */
SlideView.prototype.navigationButtonStyle = "inside";

/**
 * 무한 스크롤 사용 여부.
 * @type {Boolean} 
 */
SlideView.prototype.useInfiniteScroll = false;

/**
 * 시작 페이지 번호<br/>
 * 페이지 번호는 0부터 시작합니다.
 * @type {Number} 
 */
SlideView.prototype.initialPage = 0;

/** 
 * 슬라이드 방향
 * <ul><li>horizontal (기본값) : 가로 방향</li>
 * <li>vertical: 세로 방향</li></ul>
 * @type {"horizontal" | "vertical"} 
 */
SlideView.prototype.orientation = "horizontal";

/**
 * screen-change 이벤트 발생 시, 슬라이드 옵션을 다르게 적용할지 여부<br/>
 * <ul><li>true: 스크린 별 슬라이드 옵션 변경 가능</li>
 * <li>false (기본값): 모든 스크린에 대하여 동일한 슬라이드 옵션 적용</li></ul>
 * @type {Boolean}
 */
SlideView.prototype.acceptScreen = true;


/************************************************
 * 내부 정의 Property (값 변경 X)
 ************************************************/
/** @type Number */
SlideView.prototype._originSpacing = 0 ; // 스와이프 변경 전 레이아웃 내 간격

/** @type SlidePaginition */
SlideView.prototype._paginition = null;

/** @type cpr.controls.UIControl[] */
SlideView.prototype._originalChildren = [];

SlideView.prototype._knownScreenXY = -1;

SlideView.prototype._initialScrollXY = -1;

/** @type cpr.controls.Container */
SlideView.prototype._innerContainer = null;

/** @type cpr.controls.layouts.FlowLayout */
SlideView.prototype._innerLayout = null;

/** @type cpr.geometry.Rectangle */
SlideView.prototype._knownBounds = null;

/** @type cpr.controls.Button */
SlideView.prototype._prevButton = null;

/** @type cpr.controls.Button */
SlideView.prototype._nextButton = null;

/** @type cpr.animation.Animator */
SlideView.prototype._activeAnimator = null;

SlideView.prototype._autoPlayTimerID = -1;

/** @type cpr.controls.PageIndexer */
SlideView.prototype._customPagination = null;

/************************************************
 * SlideView Prototype
 ************************************************/
/**
 * 각 디바이스(스크린)에 대한 설정
 */
SlideView.prototype._setScreenNm = function(){
	var voScreenNms = {
		"default" : ["default"],
		"tablet" : ["tablet"],
		"mobile" : ["mobile"]
	};
	
	if (typeof AppProperties !== 'undefined') {
		if(!ValueUtil.isNull(AppProperties.SCREEN_DEFAULT_NM)) {
			voScreenNms["default"] = AppProperties.SCREEN_DEFAULT_NM;
		}
		if(!ValueUtil.isNull(AppProperties.SCREEN_TABLET_NM)) {
			voScreenNms["tablet"] = AppProperties.SCREEN_TABLET_NM;
		}
		if(!ValueUtil.isNull(AppProperties.SCREEN_MOBILE_NM)) {
			voScreenNms["mobile"] = AppProperties.SCREEN_MOBILE_NM;
		}
	}
	
	return voScreenNms;
}

/**
 * 이벤트 핸들러와 업데이트 함수 초기화
 */
SlideView.prototype._setup = function(){
	this._onMouseDown = this._onMouseDown.bind(this);
	this._onMouseUp = this._onMouseUp.bind(this);
	this._onMouseMove = this._onMouseMove.bind(this);

	this._onTouchEnd = this._onTouchEnd.bind(this);
	this._onTouchStart = this._onTouchStart.bind(this);
	this._onTouchMove = this._onTouchMove.bind(this);
	
	this._onScreenChange = this._onScreenChange.bind(this);
	this._doUpdateButtons = _.debounce(this._doUpdateButtons.bind(this), 500);
	this._updateActivePageButton = _.debounce(this._updateActivePageButton.bind(this), 50);

	this._onResize = this._onResize.bind(this);
}

/**
 * 기존 컨테이너에 있는 자식 요소들을 재구성하여, 
 * 슬라이드 형태로 배치할 수 있도록 내부 레이아웃과 제약조건 적용
 */
SlideView.prototype._transform = function() {
	if(!this._container.style.hasClass("cl-unselectable")) {
		this._container.style.addClass("cl-unselectable");
	}
	
	this._originalChildren = this._container.getChildren();
	
	var layout = new cpr.controls.layouts.FlowLayout();
	layout.scrollable = false;
	
	var itemConstraint = {};
	var itemSizeExpression = this.itemSize + "px";
	
	if (this.orientation == "horizontal") {
		layout.lineWrap = false;
		
		this._originSpacing = this._layout.horizontalSpacing;
		layout.horizontalSpacing = this._originSpacing;
		
//		this._layout.horizontalSpacing = 0;
		this._layout.horizontalAlign = "center";
		
		itemConstraint.height = "100%";
		
		if (this.itemSize <= 0) {
			itemSizeExpression = "(100% - " + (this.showCount) * layout.horizontalSpacing + "px) / " + this.showCount;
			itemConstraint.width = "calc(" + itemSizeExpression + ")";
		} else {
			itemConstraint.width = this.itemSize + "px";
		}
		
	} else {
		layout.lineWrap = true;
		
		this._originSpacing = this._layout.verticalSpacing;
		layout.verticalSpacing = this._originSpacing;
		
		this._layout.verticalSpacing = 0;
		this._layout.verticalAlign = "center";
		
		itemConstraint.width = "100%";
		
		if (this.itemSize <= 0) {
			itemSizeExpression = "(100% - " + (this.showCount-1) * layout.verticalSpacing+ "px) / " + this.showCount;
			itemConstraint.height = "calc(" + itemSizeExpression + ")";
		} else {
			itemConstraint.height = this.itemSize + "px";
		}
	}
	
	if (this.itemAutoSize) {
		if (this.orientation == "horizontal") {
			itemConstraint.autoSize = "width";
		} else {
			itemConstraint.autoSize = "height";
		}
	}
	this._innerContainer = new cpr.controls.Container();
	this._innerContainer.setLayout(layout);
	this._innerLayout = layout;
	this._layout.scrollable = false;
	
	this._container.getChildren().forEach((function( /* cpr.controls.UIControl */ each, idx) {
		each.userAttr("-snap-point", "true");
		this._innerContainer.addChild(each, itemConstraint);
	}).bind(this));
	
	if (this.orientation == "horizontal") {
		this._container.addChild(this._innerContainer, {
			width: this.itemSize > 0 ? this.showCount * this.itemSize + (this.showCount - 1) * layout.horizontalSpacing + "px" : "100%",
			height: this.itemAutoSize ? "auto" : "100%"
		});
	} else {
		this._container.addChild(this._innerContainer, {
			height: this.itemSize > 0 ? this.showCount * this.itemSize + (this.showCount - 1) * layout.verticalSpacing + "px" : "100%",
			width: this.itemAutoSize ? "auto" : "100%"
		});
	}
	
	this._paginition = new SlidePaginition(this);
	this._customPagination = this.pagination;
	this._container.getParent().floatControl(this._paginition.control);
	this._container.getParent().reorderChild(this._paginition.control, this._container.getParent().getChildren().indexOf(this._container)+1);
}

/**
 * 슬라이드 뷰를 시작합니다.<br/>
 * 시작하기전 모든 설정이 마쳐져야 합니다.
 */
SlideView.prototype.start = function() {
	if (this._container.getActualRect().width === 0) {
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(this.start.bind(this));
		return;
	}
	
	this._transform();
	
	this._innerContainer.addEventListener("scroll", this._updateActivePageButton);
	this._container.addEventListener("mousedown", this._onMouseDown);
	this._container.addEventListener("touchstart", this._onTouchStart);
	this._container.addEventListenerOnce("dispose", this._handleDispose.bind(this));
	if(this.acceptScreen === true) {
		this._container.getAppInstance().removeEventListener("screen-change", this._onScreenChange);
		this._container.getAppInstance().addEventListener("screen-change", this._onScreenChange);
	}
	cpr.core.NotificationCenter.INSTANCE.subscribe("main-size-changed", this, this._updateButtons);
	cpr.core.NotificationCenter.INSTANCE.subscribe("swipe-transition-occured", this, this._onResize);
	cpr.core.NotificationCenter.INSTANCE.subscribe(cpr.core.SystemTopics.RESIZE, this, this._onResize);
	
	this._updateActivePageButton();
	
	if (this.autoPlayDelay > 0) {
		this.autoPlay();
	}
	
	if (this.initialPage > 0) {
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec((function() {
			if (this._container.disposed) {
				return;
			}
			this.setActivePage(this.initialPage);
		}).bind(this));
	}
	
	cpr.core.DeferredUpdateManager.INSTANCE.asyncExec((function() {
		if (this._container.disposed) {
			return;
		}
		this._doUpdateButtonsImmediatly();
	}).bind(this));
};

/**
 * 자동 재생을 시작합니다.<br/>
 * autoPlayDelay가 지정된 경우, 슬라이드 시작시 자동으로 재생이 시작됩니다.
 */
SlideView.prototype.autoPlay = function() {
	if (this._autoPlayTimerID >= 0) {
		return;
	}
	this._autoPlayTimerID = setInterval(this.showNext.bind(this), (this.autoPlayDelay + this.autoPlayDuration) * 1000);
};

/**
 * 자동 재생중인 경우, 자동 재생을 중단합니다.
 */
SlideView.prototype.stopAutoPlay = function() {
	if (this._autoPlayTimerID >= 0) {
		clearInterval(this._autoPlayTimerID);
		this._autoPlayTimerID = -1;
	}
};

/**
 * 이벤트 핸들러 제거
 */
SlideView.prototype._handleDispose = function() {
	this.stopAutoPlay();
	this._container.removeEventListener("mousedown", this._onMouseDown);
	this._container.removeEventListener("touchstart", this._onTouchStart);
	cpr.core.NotificationCenter.INSTANCE.unsubcribeAllTopic(this);
};

/**
 * 스크린 변경
 * @param {cpr.events.CScreenChangeEvent} e
 */
SlideView.prototype._onScreenChange = function(e){

	if(this.acceptScreen === true) {
		var vsScrnName = e.screen.name;
		if(this._screenNms["default"].indexOf(vsScrnName) != -1
		|| this._screenNms["tablet"].indexOf(vsScrnName) != -1
		|| this._screenNms["mobile"].indexOf(vsScrnName) != -1) {
			if(this._innerContainer == null) {
				this.start();
			} else {
				/*
				 * 슬라이드 속성이 스크린 별로 다르게 적용되어야 하는 경우
				 * 슬라이드 원복 후 재설정
				 */
				this.restore();
				this.start();
			}
		} else {
			this.restore();
		}
	}
}

/**
 * 터치 시작 처리 핸들러
 * @param {cpr.events.CTouchEvent} e
 */
SlideView.prototype._onTouchStart = function(e) {
	if (this._activeAnimator) {
		return;
	}
	
	var touch = e.targetTouches.item(0);
	if (this.orientation == "horizontal") {
		this._knownScreenXY = touch.screenX;
		this._initialScrollXY = this._innerContainer.getViewPortRect().x;
	} else {
		this._knownScreenXY = touch.screenY;
		this._initialScrollXY = this._innerContainer.getViewPortRect().y;
	}
	
	window.addEventListener("touchmove", this._onTouchMove);
	window.addEventListener("touchend", this._onTouchEnd);
	
	e.stopPropagation();
	this.stopAutoPlay();
};

/**
 * 터치 이동 핸들러
 * @param {cpr.events.CTouchEvent} e
 */
SlideView.prototype._onTouchMove = function(e) {
	var touch = e.targetTouches.item(0);
	if (this.orientation == "horizontal") this._handleMoveX(touch.screenX);
	else this._handleMoveY(touch.screenY);
	e.stopPropagation();
};

/**
 * 터치 종료 핸들러
 * @param {cpr.events.CTouchEvent} e
 */
SlideView.prototype._onTouchEnd = function(e) {
	window.removeEventListener("touchmove", this._onTouchMove);
	window.removeEventListener("touchend", this._onTouchEnd);
	this._knownScreenXY = -1;
	this._snapToClosestContent();
};

/**
 * 마우스 다운 핸들러
 * @param {cpr.events.CMouseEvent} e
 */
SlideView.prototype._onMouseDown = function(e) {
	if (e.button !== 0) {
		return;
	}
	
	if (this._activeAnimator) {
		return;
	}
	
	if (this.orientation == "horizontal") {
		// 마우스가 다운 된 위치를 기억 해 둠.
		this._knownScreenXY = e.screenX;
		// 현재 뷰포트의 위치를 기억해 둠.
		this._initialScrollXY = this._innerContainer.getViewPortRect().x;
		
	} else {
		// 마우스가 다운 된 위치를 기억 해 둠.
		this._knownScreenXY = e.screenY;
		// 현재 뷰포트의 위치를 기억해 둠.
		this._initialScrollXY = this._innerContainer.getViewPortRect().y;
	}
	
	window.addEventListener("mouseup", this._onMouseUp);
	window.addEventListener("mousemove", this._onMouseMove);
	
	// 혹시라도 마우스 업이 내비게이션 버튼에서 일어나, 드래깅 상태가 지속되는 문제를 미연에 방지.
	if (this._prevButton && this._nextButton) {
		this._prevButton.removeEventListener("mouseup", eventStopper);
		this._nextButton.removeEventListener("mouseup", eventStopper);
	}
	
	this.stopAutoPlay();
	e.stopPropagation();
};

/**
 * 마우스/터치의 이동 처리
 * @param {Number} screenX
 */
SlideView.prototype._handleMoveX = function(screenX) {
	var container = this._innerContainer;
	var layout = this._innerLayout;
	
	if(!this._innerContainer) return;
	
	// 스크롤 불능일 경우 중단.
	if (container.getViewPortRect().width >= container.getContentPaneRect().width) {
		return;
	}
	
	if (this._knownScreenXY < 0) {
		return;
	}
	
	// 터치/마우스의 이동량을 구함.
	var delta = this._knownScreenXY - screenX;
	
	// 새로운 뷰포트의 위치
	var newScrollLeft = this._initialScrollXY + delta;
	
	// 왼쪽 경계선 너머로 스크롤.
	if (newScrollLeft < 0) {
		if (this.useInfiniteScroll === false) {
			container.scrollTo(0, 0);
			return;
		}
		var children = container.getChildren();
		
		// 오른쪽 끝 자식을 떼어 내어 왼쪽으로 이동시키고, 스크롤 상황을 업데이트 함.
		var lastChild = container.getLastChild();
		container.reorderChild(lastChild, 0);
		
		var fix = this._innerLayout.horizontalSpacing + lastChild.getOffsetRect().width;
		this._initialScrollXY += fix;
		container.scrollTo(fix, 0);
		cpr.core.DeferredUpdateManager.INSTANCE.update();
		return;
	}
	
	// 오른쪽 경계선 너머로 스크롤.
	else if (newScrollLeft + container.getViewPortRect().width > container.getContentPaneRect().width) {
		if (this.useInfiniteScroll === false) {
			container.scrollTo(container.getContentPaneRect().width - container.getViewPortRect().width, 0);
			return;
		}
		var children = container.getChildren();
		
		// 첫번째 자식을 떼어내어 오른쪽 끝으로 이동시키고 스크롤 상황을 업데이트 함.
		var firstChild = container.getFirstChild();
		
		var fix = firstChild.getOffsetRect().width + this._innerLayout.horizontalSpacing;
		this._initialScrollXY -= fix;
		container.reorderChild(firstChild, container.getChildrenCount());
		container.adjustScroll(-fix, 0);
		cpr.core.DeferredUpdateManager.INSTANCE.update();
		return;
	}
	
	container.scrollTo(newScrollLeft, 0);
}

/**
 * 마우스/터치의 이동 처리
 * @param {Number} screenY
 */
SlideView.prototype._handleMoveY = function(screenY) {
	var container = this._innerContainer;
	var layout = this._innerLayout;
	
	// 스크롤 불능일 경우 중단.
	if (container.getViewPortRect().height >= container.getContentPaneRect().height) {
		return;
	}
	
	if (this._knownScreenXY < 0) {
		return;
	}
	
	// 터치/마우스의 이동량을 구함.
	var delta = this._knownScreenXY - screenY;
	
	// 새로운 뷰포트의 위치
	var newScrollTop = this._initialScrollXY + delta;
	
	// 왼쪽 경계선 너머로 스크롤.
	if (newScrollTop < 0) {
		if (this.useInfiniteScroll === false) {
			container.scrollTo(0, 0);
			return;
		}
		var children = container.getChildren();
		
		// 오른쪽 끝 자식을 떼어 내어 왼쪽으로 이동시키고, 스크롤 상황을 업데이트 함.
		var lastChild = container.getLastChild();
		container.reorderChild(lastChild, 0);
		
		var fix = this._innerLayout.verticalSpacing + lastChild.getOffsetRect().height;
		this._initialScrollXY += fix;
		container.scrollTo(0, fix);
		cpr.core.DeferredUpdateManager.INSTANCE.update();
		return;
	}
	
	// 오른쪽 경계선 너머로 스크롤.
	else if (newScrollTop + container.getViewPortRect().height > container.getContentPaneRect().height) {
		if (this.useInfiniteScroll === false) {
			container.scrollTo(0, container.getContentPaneRect().height - container.getViewPortRect().height);
			return;
		}
		var children = container.getChildren();
		
		// 첫번째 자식을 떼어내어 오른쪽 끝으로 이동시키고 스크롤 상황을 업데이트 함.
		var firstChild = children[0];
		var fix = firstChild.getOffsetRect().height + this._innerLayout.verticalSpacing;
		this._initialScrollXY -= fix;
		container.reorderChild(firstChild, children.length);
		container.adjustScroll(0, -fix);
		cpr.core.DeferredUpdateManager.INSTANCE.update();
		return;
	}
	
	container.scrollTo(0, newScrollTop);
}

/**
 * 마우스/터치의 이동 처리
 * @param {cpr.events.CMouseEvent} e
 */
SlideView.prototype._onMouseMove = function(e) {
	if (this.orientation == "horizontal") this._handleMoveX(e.screenX);
	else this._handleMoveY(e.screenY);
	e.preventDefault();
};

/**
 * 이전/다음 버튼에 대한 이벤트 재 설정
 * @param {cpr.events.CMouseEvent} e
 */
SlideView.prototype._onMouseUp = function(e) {
	window.removeEventListener("mouseup", this._onMouseUp);
	window.removeEventListener("mousemove", this._onMouseMove);
	this._knownScreenXY = -1;
	this._snapToClosestContent();
	if (this._prevButton && this._nextButton) {
		this._prevButton.addEventListener("mouseup", eventStopper);
		this._nextButton.addEventListener("mouseup", eventStopper);
	}
};

/**
 * 페이지네이션 업데이트
 */
SlideView.prototype._updateButtons = function() {
	if (this._container.disposed) {
		return;
	}
	if (this._prevButton) {
		this._prevButton.dispose();
		this._prevButton = null;
	}
	if (this._nextButton) {
		this._nextButton.dispose();
		this._nextButton = null;
	}
	
	this._paginition.control.visible = false;
	this._doUpdateButtons();
}

/**
 * 내비게이션 버튼(이전/다음 버튼)과 페이지네이션 컨트롤의 표시 여부
 * , 스타일, 위치 및 애니메이션 효과 업데이트
 */
SlideView.prototype._doUpdateButtonsImmediatly = function() {
	if (this._container.disposed || !this._innerContainer) {
		return;
	}
	
	this._knownBounds = this._container.getOffsetRect();
	
	var shouldShowButtons = this._innerContainer.getChildrenCount() > 1 && this._innerContainer.getViewPortRect().width < this._innerContainer.getContentPaneRect().width;
	if (!shouldShowButtons) {
		if (this._prevButton) {
			this._prevButton.dispose();
			this._prevButton = null;
		}
		if (this._nextButton) {
			this._nextButton.dispose();
			this._nextButton = null;
		}
		this._paginition.control.visible = false;
		
	} else {
		this._paginition.control.visible = this.showPagination;
		if (this.showPagination) {
			this._paginition.control.style.css({
				top: this._knownBounds.bottom + "px",
				left: this._knownBounds.left + "px",
				width: this._knownBounds.width + "px"
			});
			this._paginition.control.style.animateFrom({
				"opacity": "0"
			});
		} else if (this.useCustomPagination && this._customPagination) {
			/* 커스텀 페이지인덱서 추가 */
			
			this._customPagination.totalRowCount = this._originalChildren.length;
			this._customPagination.pageRowCount = this.showCount;
			this._customPagination.redraw();
		}
		
		if (this.navigationButtonStyle != "none") {
			// 이전, 다음 버튼에 클릭 이벤트 연결 
			if(ValueUtil.isNull(this._prevButton)) {
				this._prevButton = new cpr.controls.Button();
				this._prevButton.fieldLabel = "이전 슬라이드";
				this._prevButton.userAttr("slide-page-item", "true");

				this._prevButton.addEventListener("click", (function() {
					this.showPrev();
				}).bind(this));
				this._prevButton.addEventListener("mousedown", eventStopper);
				this._prevButton.addEventListener("mouseup", eventStopper);
				this._prevButton.addEventListener("click", eventStopper);
			}
			
			if (ValueUtil.isNull(this._nextButton)) {
				this._nextButton = new cpr.controls.Button();
				this._nextButton.fieldLabel = "다음 슬라이드";
				this._nextButton.userAttr("slide-page-item", "true");
				
				this._nextButton.addEventListener("click", (function() {
					this.showNext();
				}).bind(this));
				this._nextButton.addEventListener("mousedown", eventStopper);
				this._nextButton.addEventListener("mouseup", eventStopper);
				this._nextButton.addEventListener("click", eventStopper);
			}
			
			// 이전, 다음 버튼에 스타일 설정 
			if(!this._prevButton.style.hasClass("slide-button")) {
				this._prevButton.style.addClass("slide-button");
			}
			if(!this._nextButton.style.hasClass("slide-button")) {
				this._nextButton.style.addClass("slide-button");
			}
			
			if (this.orientation == "horizontal") {
				if(!this._prevButton.style.hasClass("slide-prev-button")) {
					this._prevButton.style.addClass("slide-prev-button");
				}
				if(!this._nextButton.style.hasClass("slide-next-button")) {
					this._nextButton.style.addClass("slide-next-button");
				}
			} else {
				if(!this._prevButton.style.hasClass("slide-up-button")) {
					this._prevButton.style.addClass("slide-up-button");
				}
				if(!this._nextButton.style.hasClass("slide-down-button")) {
					this._nextButton.style.addClass("slide-down-button");
				}
			}
			if (this.navigationButtonClassName) {
				if(!this._prevButton.style.hasClass(this.navigationButtonClassName)) {
					this._prevButton.style.addClass(this.navigationButtonClassName);
				}
				if(!this._nextButton.style.hasClass(this.navigationButtonClassName)) {
					this._nextButton.style.addClass(this.navigationButtonClassName);
				}
			}
			
			// 이전, 다음 버튼 추가 위치(offset) 설정
			var superContainer = this._container.getParent();
			var leftConstraint = {};
			var rightConstraint = {};
			if (this.orientation == "horizontal") {
				leftConstraint.left = this._knownBounds.left + "px";
				leftConstraint.top = this._knownBounds.top + "px";
				leftConstraint.height = this._knownBounds.height + "px";
				leftConstraint.width = this.navigationButtonSize + "px";
				
				rightConstraint.left = this._knownBounds.right - this.navigationButtonSize + "px";
				rightConstraint.top = this._knownBounds.top + "px";
				rightConstraint.height = this._knownBounds.height + "px";
				rightConstraint.width = this.navigationButtonSize + "px";
				
			} else {
				leftConstraint.left = this._knownBounds.left + "px";
				leftConstraint.top = this._knownBounds.top + "px";
				leftConstraint.width = this._knownBounds.width + "px";
				leftConstraint.height = this.navigationButtonSize + "px";
				
				rightConstraint.left = this._knownBounds.left + "px";
				rightConstraint.top = this._knownBounds.bottom - this.navigationButtonSize + "px";
				rightConstraint.width = this._knownBounds.width + "px";
				rightConstraint.height = this.navigationButtonSize + "px";
			}
			
			var offsetRect = this._innerContainer.getOffsetRect();
			switch (this.navigationButtonStyle) {
				case "inside": {
					break;
				}
				case "content-hover": {
					leftConstraint.left = offsetRect.x + "px";
					leftConstraint.top = offsetRect.y + "px";
					if(this.orientation == "horizontal") {
						rightConstraint.left = offsetRect.right - this.navigationButtonSize + "px";
						rightConstraint.top = offsetRect.y + "px";
					} else {
						leftConstraint.width = offsetRect.width + "px";
						
						delete rightConstraint.top;
						rightConstraint.left = offsetRect.x + "px";
						rightConstraint.bottom = offsetRect.y + "px";
						rightConstraint.width = offsetRect.width + "px";
					}
					superContainer = this._container;
					break;
				}
				case "content-outside": {
					if(this.orientation == "horizontal") {
						leftConstraint.top = offsetRect.y + "px";
						leftConstraint.left = offsetRect.x - this.navigationButtonSize + "px";
						rightConstraint.left = offsetRect.right + "px";
						rightConstraint.top = offsetRect.y + "px";
					} else {
						leftConstraint.top = offsetRect.y - this.navigationButtonSize + "px";
						leftConstraint.left = offsetRect.x + "px";
						leftConstraint.width = offsetRect.width + "px";
						
						delete rightConstraint.top;
						rightConstraint.bottom = offsetRect.y - this.navigationButtonSize + "px";
						rightConstraint.left = offsetRect.x + "px";
						rightConstraint.width = offsetRect.width + "px";
					}
					
					superContainer = this._container;
					break;
				}
				case "outside": {
					if(this.orientation == "horizontal") {
						leftConstraint.left = this._knownBounds.left - this.navigationButtonSize + "px";
						rightConstraint.left = this._knownBounds.right + "px";
					} else {
						leftConstraint.top = this._knownBounds.top - this.navigationButtonSize + "px";
						rightConstraint.top = this._knownBounds.bottom + "px";
					}
					break;
				}
			}
			
			superContainer.floatControl(this._prevButton, leftConstraint);
			superContainer.floatControl(this._nextButton, rightConstraint);
			
			this._prevButton.visible = false;
			this._nextButton.visible = false;
			cpr.core.DeferredUpdateManager.INSTANCE.asyncExec((function() {
				if (this._container.disposed) {
					return;
				}
				if (this._prevButton) {
					this._prevButton.visible = true;
					this._prevButton.style.animateFrom({
						"opacity": "0"
					});
				}
				if (this._nextButton) {
					this._nextButton.visible = true;
					this._nextButton.style.animateFrom({
						"opacity": "0"
					});
				}
			}).bind(this));
		}
	}
	
}

/**
 * 
 */
SlideView.prototype._doUpdateButtons = function() {
	if (this._container.disposed) {
		return;
	}
	this._doUpdateButtonsImmediatly();
};

/**
 * 
 */
SlideView.prototype._onResize = function() {
	if (this._container.disposed) {
		return;
	}
	
	// 처음 그리는 경우.
	if (!this._knownBounds) {
		this._updateButtons();
	}
	
	// 그외의 경우, 컨테이너의 영역이 달라진 경우에만 새로 그림.
	else if (this._knownBounds.equals(this._container.getOffsetRect()) === false) {
		this._updateButtons();
	}
};

/**
 * 슬라이드 이전 페이지로 이동합니다.
 */
SlideView.prototype.showPrev = function() {
	if (this._activeAnimator) {
		return;
	}
	
	this._snapToClosestContent(0);
	this._knownScreenXY = 0;
	
	var animator = new cpr.animation.Animator(this.autoPlayDuration, cpr.animation.TimingFunction.EASE_IN_OUT);
	var me = this;
	
	if (this.orientation == "horizontal") {
		this._initialScrollXY = this._innerContainer.getViewPortRect().x;
		
		var fullWidth = this._innerContainer.getViewPortRect().width;
		animator.addTask(function(p) {
			me._handleMoveX(p * fullWidth);
		});
		
	} else {
		this._initialScrollXY = this._innerContainer.getViewPortRect().y;
		
		var fullHeight = this._innerContainer.getViewPortRect().height;
		animator.addTask(function(p) {
			me._handleMoveY(p * fullHeight);
		});
	}
	
	this._activeAnimator = animator;
	animator.run().then((function() {
		this._activeAnimator = null;
	}).bind(this));
};

/**
 * 슬라이드 다음 페이지로 이동합니다.
 */
SlideView.prototype.showNext = function() {
	if (this._activeAnimator || !this._innerContainer) {
		return;
	}
	
	this._snapToClosestContent(0);
	this._knownScreenXY = 0;
	
	var animator = new cpr.animation.Animator(this.autoPlayDuration, cpr.animation.TimingFunction.EASE_IN_OUT);
	var me = this;
	
	if (this.orientation == "horizontal") {
		this._initialScrollXY = this._innerContainer.getViewPortRect().x;
		
		var fullWidth = this._innerContainer.getViewPortRect().width;
		animator.addTask(function(p) {
			me._handleMoveX(-p * fullWidth);
		});
		
	} else {
		this._initialScrollXY = this._innerContainer.getViewPortRect().y;
		
		var fullHeight = this._innerContainer.getViewPortRect().height;
		animator.addTask(function(p) {
			me._handleMoveY(-p * fullHeight);
		});
	}
	
	this._activeAnimator = animator;
	animator.run().then((function() {
		this._activeAnimator = null;
	}).bind(this));
};

/**
 * 가장 가까운 컨텐츠로 스크롤 시킵니다.
 * @param {Number} viewportXY
 * @param {Boolean} firstControl?
 */
SlideView.prototype._findMostCloseControl = function(viewportXY, firstControl) {
	if (firstControl === undefined) {
		firstControl = false;
	}
	
	var shortedDistance = Number.MAX_VALUE;
	/** @type cpr.controls.UIControl */
	var controlToScroll = null;
	var children = this._innerContainer.getChildren();
	if (firstControl) {
		children = children.reverse();
	}
	
	var vaPrimaryItems = this._getPrimaryItems();
	children.filter(function( /* cpr.controls.UIControl */ each) {
		return each.userAttr("-snap-point") == "true";
		/*
		 * TODO 가까운 컨텐츠를 페이지 단위로 스크롤하고자 할 경우 아래 주석을 해제하십시오.
		 * (기본동작은 아이템 단위로 스크롤 합니다)
		 */
//	}).filter(function(each,index){
//		if(vaPrimaryItems.indexOf(index) != -1) {
//			return each;
//		}
	}).forEach((function( /* cpr.controls.UIControl */ each) {
		var eachDistance = 0;
		if (this.orientation == "horizontal") {
			eachDistance = Math.abs(each.getOffsetRect().x - this._innerLayout.horizontalSpacing - viewportXY);
		} else {
			eachDistance = Math.abs(each.getOffsetRect().y - this._innerLayout.verticalSpacing - viewportXY);
		}
		
		// 가까운 컨텐츠에 있는 컨트롤을 받아옵니다.
		if (eachDistance < shortedDistance) {
			shortedDistance = eachDistance;
			controlToScroll = each;
		}
	}).bind(this));
	
	return controlToScroll;
};

/**
 * 
 */
SlideView.prototype._getPrimaryItems = function(){
	var vnCount = this.showCount;
	var vaChildren = this._innerContainer.getChildren();
	var vnChildLength = this._innerContainer.getChildrenCount();
	
	var vaResult = [];
	var vnRepeatLength = Math.ceil(vnChildLength / vnCount);
	for(var i = 0 ; i < vnRepeatLength ; i++) {
		var vnItemIndex = vnCount * i;
		if(vnItemIndex+vnCount > vnChildLength) {
			vnItemIndex = vnChildLength - vnCount +1;
		}
		vaResult.push(vnItemIndex);
	}
	
	return vaResult;
}

/**
 * 가장 가까운 컨텐츠로 스크롤 시킵니다.
 * @param {Number} duration
 */
SlideView.prototype._snapToClosestContent = function(duration) {
	if (duration == null) {
		duration = this.snapDuration;
	}
	
	if (this._container.disposed || !this._innerContainer) {
		return;
	}
	
	var viewPortRect = this._innerContainer.getViewPortRect();
	if (this.orientation == "horizontal") {
		var controlToScroll = this._findMostCloseControl(viewPortRect.x);
		if (controlToScroll && viewPortRect.width >= controlToScroll.getOffsetRect().width) {
			this._innerContainer.scrollTo(controlToScroll.getOffsetRect().x - this._innerLayout.horizontalSpacing, 0, duration, cpr.animation.TimingFunction.EASE_OUT_CUBIC);
		}
		
	} else {
		var controlToScroll = this._findMostCloseControl(viewPortRect.y);
		if (controlToScroll && viewPortRect.height >= controlToScroll.getOffsetRect().height) {
			this._innerContainer.scrollTo(0, controlToScroll.getOffsetRect().y - this._innerLayout.verticalSpacing, duration, cpr.animation.TimingFunction.EASE_OUT_CUBIC);
		}
		
	}
};

/**
 * 활성 페이지 번호를 리턴합니다.
 * @return {Number} 페이지 번호
 */
SlideView.prototype.getActivePage = function() {
	var control = null;
	if (this.orientation == "horizontal") {
		control = this._findMostCloseControl(this._innerContainer.getViewPortRect().x);
	} else {
		control = this._findMostCloseControl(this._innerContainer.getViewPortRect().y);
	}
	return Math.floor(this._originalChildren.indexOf(control) / this.showCount);
};

/**
 * 활성 페이지를 설정합니다.
 * @param {Number} page 페이지 번호 (0부터 시작)
 * @param {Number} duration? 스크롤 애니메이션의 길이. 단위는 초.
 */
SlideView.prototype.setActivePage = function(page, duration) {
	if (this._container.disposed) {
		return;
	}
	
	if (duration == null) {
		duration = 0;
	}
	
	var targetControl = this._originalChildren[page * this.showCount];
	if (targetControl) {
		if (this.orientation == "horizontal") this._innerContainer.scrollTo(targetControl.getOffsetRect().x - this._innerLayout.horizontalSpacing, 0, duration);
		else this._innerContainer.scrollTo(0, targetControl.getOffsetRect().y - this._innerLayout.verticalSpacing, duration);
	}
};

/**
 * 현재 활성화된 페이지를 표시하기 위해 업데이트
 */
SlideView.prototype._updateActivePageButton = function() {
	if (this._container.disposed) {
		return;
	}
	
	var activePage = this.getActivePage();
	if (this.paginitionStyle == "text") {
		this._paginition.control.getChildren().forEach(function( /* cpr.controls.PageIndexer */ each, idx) {
			each.currentPageIndex = activePage + 1;
		});
		
	} else {
		this._paginition.control.getChildren().forEach(function( /* cpr.controls.Button */ each, idx) {
			if (idx == activePage) {
				each.style.addClass("active");
			} else {
				each.style.removeClass("active");
			}
		});
	}
	
	if (!this.showPagination && this.useCustomPagination && this._customPagination){
		this._customPagination.currentPageIndex = activePage + 1;
	}
}

/**
 * 원래상태로 원복
 */
SlideView.prototype.restore = function(){
	this._container.removeEventListener("mousedown", this._onMouseDown);
	this._container.removeEventListener("touchstart", this._onTouchStart);

	cpr.core.NotificationCenter.INSTANCE.unsubcribeAllTopic(this);
	
	this._container.style.removeClass("cl-unselectable");
	this._container.setLayout(this._cloneLayout);

	var that = this;
	if(this._innerContainer) {
		this._innerContainer.getChildren().forEach(function(each,idx){
			each.removeUserAttr("-snap-point");
			that._container.addChild(each,that._restoreConstraint[idx]);
		});
		
		this._innerContainer.dispose();
		this._innerContainer = null;
	}

	if(this._paginition) {
		this._paginition.control.dispose();
		this._paginition = null;
	}
	if(this._nextButton) {
		this._nextButton.dispose();
		this._nextButton = null;
	}
	if(this._prevButton) {
		this._prevButton.dispose();
		this._prevButton = null;
	}
}

/**
 * 레이아웃을 복사 합니다.
 * @param {cpr.controls.layouts.Layout} poLayout
 */
SlideView.prototype._containerStrategy = function(poLayout){
	var _this = this;
	var layout = poLayout;
	var layoutType = layout.constructor;
	
	var newLayout = new layoutType();
	if(newLayout instanceof cpr.controls.layouts.FormLayout) {
		(function(/* cpr.controls.layouts.FormLayout */ origin, /* cpr.controls.layouts.FormLayout */ newLayout) {
			// 레이아웃 별 속성 정보 복사
			_getCtrlPropertyList(origin).forEach(function(each){
				newLayout[each] = origin[each];
			});
			// 각 행/컬럼 구조 설정(너비, 자동크기여부 등)
			origin.getColumns().forEach(function(each, i){
				newLayout.setColumnAutoSizing(i, origin.isColumnAutoSizing(i));
			});
			origin.getRows().forEach(function(each, i){
				newLayout.setRowAutoSizing(i, origin.isRowAutoSizing(i));
			});
			newLayout.setColumns(origin.getColumns());
			newLayout.setRows(origin.getRows());
			newLayout.setColumnDivisions(origin.getColumnDivisions());
			newLayout.setRowDivisions(origin.getRowDivisions());
		})(layout, newLayout);
		
	} else if(newLayout instanceof cpr.controls.layouts.VerticalLayout){
		(function(/* cpr.controls.layouts.VerticalLayout */ origin, /* cpr.controls.layouts.VerticalLayout */ newLayout) {
			_getCtrlPropertyList(origin).forEach(function(each){
				newLayout[each] = origin[each];
			});
		})(layout, newLayout);
	} else if(newLayout instanceof cpr.controls.layouts.FlowLayout){
		(function(/* cpr.controls.layouts.FlowLayout */ origin, /* cpr.controls.layouts.FlowLayout */ newLayout) {
			_getCtrlPropertyList(origin).forEach(function(each){
				newLayout[each] = origin[each];
			});
		})(layout, newLayout);
	} else {
		return null;
	}
	
	return newLayout;
}

/**
 * 동적으로 컨트롤의 property 를 리스트형태로 반환합니다.
 * @param {cpr.controls.UIControl} ctrl
 * @return {Array} property 항목 리스트
 */
function _getCtrlPropertyList(ctrl){	
	if (ctrl.value == null) ctrl.value = "";
	
	var objectToInspect;
	var result = [];
	
	for (objectToInspect = ctrl; objectToInspect !== null; objectToInspect = Object.getPrototypeOf(objectToInspect)) {
		result = result.concat(Object.getOwnPropertyNames(objectToInspect));
	}
	
	var vaDClnArr = ["dateValue"]; // 복사하지 않을 속성명 배열
	result = result.filter(function(each) {
		/*
		 * 1) _ 로 시작하는 내부 api 제거
		 * 2) Function 제거
		 * 3) vaDClnArr 에 해당되지 않은 속성
		 * 4) 난독화 된 속성 제거
		 */
		if (each.indexOf("_") === -1 && !(ctrl[each] instanceof Function) && vaDClnArr.indexOf(each) == -1 && each.indexOf("µ") == -1) return each;
	});
	
	result = _.uniq(result);
	
	return result;
}


/************************************************
 * SlidePaginition
 ************************************************/
/**
 * SlidePaginition
 * @param {SlideView} owner
 */
function SlidePaginition(owner) {
	this._owner = owner;
	this.control = new cpr.controls.Container();
	this.control.visible = false;
	this.control.userAttr("slide-page-item", "true");
	
	var layout = new cpr.controls.layouts.FlowLayout();
	layout.rightMargin = 0;
	layout.leftMargin = 0;
	layout.topMargin = 0;
	layout.bottomMargin = 0;
	layout.horizontalAlign = "center";
	layout.verticalAlign = "middle";
	this.control.setLayout(layout);
	
	if (owner.paginitionStyle == "text") {
		this._populatePageIndexerText();
	} else {
		this._populateButtons();
	}
};

/**
 * 슬라이드 paginitionStyle이 button 인 경우
 */
SlidePaginition.prototype._populateButtons = function() {
	var pageCount = Math.ceil(this._owner._originalChildren.length / this._owner.showCount);
	for (var idx = 0; idx < pageCount; idx++) {
		(function(idx) {
			var pageButton = new cpr.controls.Button();
			pageButton.fieldLabel = (idx+1)+"페이지";
			pageButton.style.addClass("slide-page-button");
			if (this._owner.paginitionClassName) pageButton.style.addClass(this._owner.paginitionClassName);
			pageButton.addEventListener("click", (function(e) {
				if (this._owner._activeAnimator) {
					this._owner._activeAnimator.stop();
					this._owner._activeAnimator = null;
				}
				this._owner.setActivePage(idx, this._owner.autoPlayDuration);
			}).bind(this));
			
			this.control.addChild(pageButton, {
				width: "20px",
				height: "20px",
				autoSize: "both"
			});
		}).bind(this)(idx);
	}
};

/**
 * 슬라이드 paginitionStyle이 text 인 경우
 */
SlidePaginition.prototype._populatePageIndexerText = function() {
	var pageCount = Math.ceil(this._owner._originalChildren.length / this._owner.showCount);
	var vcPix = new cpr.controls.PageIndexer();
	vcPix.navigationType = "text";
	vcPix.startPageIndex = this._owner.initialPage + 1;
	vcPix.pageRowCount = this._owner.showCount;
	vcPix.totalRowCount = this._owner._originalChildren.length;
	vcPix.visibleFirstButton = false;
	vcPix.visibleLastButton = false;
	vcPix.visibleNextButton = false;
	vcPix.visiblePrevButton = false;
	vcPix.style.addClass("slide-page-indxer");
	if (this._owner.paginitionClassName) vcPix.style.addClass(this._owner.paginitionClassName);
	
	this.control.addChild(vcPix, {
		width: "20px",
		height: "20px",
		autoSize: "both"
	});
};


/************************************************
 * slidify exports 출판
 ************************************************/
/**
 * @param {cpr.controls.Container} container
 */
exports.slidify = function(container) {
	return new SlideView(container);
};

exports.SlideView = SlideView;