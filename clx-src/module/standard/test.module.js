/************************************************
 * Test.module.js
 * Created at 2019. 12. 4. 오후 2:30:26.
 *
 * @author jeeeyul
 ************************************************/

/** 모듈 경로 */
var MODULE_PATH = "thirdparty/test";

/** 기본 테스트 케이스 제한 시간 */
var TIMEOUT = 45000;

globals.BUILD_IDENTIFIER = parseInt(cpr.core.Platform.INSTANCE.getVersion().split(".")[2]);
globals.runTest = runTest;
globals.RobotPlan = RobotPlan;
globals.nodeOf = nodeOf;
globals.runAndNext = runAndNext;
globals.delay = delay;
globals.areSameNumber = areSameNumber;

exports.setAutoRunTarget = setAutoRunTarget;

globals.runRobotPlan = runRobotPlan;

/** @type cpr.controls.EmbeddedApp */
var autoRunEmbeddedApp = null;

/** @type cpr.core.AppInstance */
var rootApp = null;

/** @type cpr.controls.Notifier */
var notifier = null;
cpr.events.EventBus.INSTANCE.addFilter("init", function(e) {
	var control = e.control;
	if (control instanceof cpr.core.AppInstance) {
		if (control.isRootAppInstance()) {
			rootApp = control;
		}
	}
});

function getNotifier() {
	if (notifier == null || notifier.disposed) {
		var wrap = new cpr.controls.Container();
		notifier = new cpr.controls.Notifier();
		wrap.addChild(notifier, {
			top: "0px",
			right: "0px",
			bottom: "0px",
			left: "0px"
		});
		rootApp.floatControl(wrap, {
			width: "300px",
			height: "40px",
			left: "calc(50% - 150px)",
			top: "calc(50% - 20px)"
		});
	}
	return notifier;
}

/**
 * @constructor
 * @param {TestSuite} parent
 * @param {Number} idx
 * @param {String} title
 * @param {()=>any} task
 * @param {any} expectedResult
 */
function TestCase(parent, idx, title, task, expectedResult) {
	this._parent = parent;
	this._idx = idx;
	this._title = title;
	this._task = task;
	this._expectedResult = expectedResult;
	this._actualResult = null;
	this._error = null;
}

TestCase.prototype = {
	run: function() {
		if (this._task.length === 1) {
			return this._runAsync();
		} else {
			return this._runSync();
		}
	},
	
	_getTestCode: function() {
		return getPrettyCode(this._task)
	},
	
	_runSync: function() {
		try {
			this._actualResult = this._task();
		} catch (e) {
			this._error = e;
		} finally {
			this.report();
		}
		return Promise.resolve();
	},
	
	_runAsync: function() {
		var timeoutID = -1;
		var didTimeout = false;
		var me = this;
		return new Promise(function(resolve, reject) {
			new Promise(function(callback) {
				timeoutID = setTimeout(function() {
					didTimeout = true;
					me._error = new Error("5초 이내에 테스트 결과가 도착하지 않았습니다.")
					me.report();
					resolve();
				}, TIMEOUT);
				me._task(callback)
			}).then(function(input) {
				if (didTimeout) {
					return;
				}
				clearTimeout(timeoutID);
				me._actualResult = input;
				me.report();
				resolve();
			}).catch(function(e) {
				if (didTimeout) {
					return;
				}
				clearTimeout(timeoutID);
				me._error = e;
				me.report();
				resolve();
			});
		});
	},
	
	report: function() {
		var msg = cpr.utils.Util.template("${icon} ${title}: ${message}", {
			icon: this.isSucceed() ? "[성공]" : "[실패]",
			title: this._title,
			message: this.getMessage()
		});
		var logView = this._parent.getLogViewer();
		logView.setResult(
			this._idx,
			this.isSucceed(),
			_toString(this._expectedResult),
			_toString(this._actualResult),
			this.getMessage()
		);
		console.log(msg);
	},
	
	isSucceed: function() {
		return this._error == null && compare(this._expectedResult, this._actualResult);
	},
	
	getTitle: function() {
		return this._title;
	},
	
	getMessage: function() {
		if (this.isSucceed()) {
			return "성공";
		} else if (this._error) {
			return this._error["message"] || JSON.stringify(this._error);
		} else {
			return cpr.utils.Util.template("기대 값은 <${expected}>인데 실제 얻은 값은 <${actual}> 입니다.", {
				expected: _toString(this._expectedResult),
				actual: _toString(this._actualResult)
			});
		}
	}
};

/**
 * @param {any} obj
 */
function _toString(obj) {
	if (obj === null) {
		return "null";
	} else if (obj === undefined) {
		return "undefined";
	} else if (obj instanceof cpr.geometry.Dimension) {
		return [obj.width, obj.height].join(", ")
	} else if (obj instanceof cpr.geometry.Rectangle) {
		return [obj.x, obj.y, obj.width, obj.height].join(", ")
	} else {
		return String(obj);
	}
}

/**
 * @constructor
 */
function TestSuite() {
	/** @type TestCase[] */
	this._cases = [];
	this._pointer = 0;
	
	/** @type udc.test.TestLog */
	this._logViewer = null;
}

/**
 * 테스트 케이스를 추가합니다.
 * @param {String} title 테스트 케이스 이름.
 * @param {((any)=>void)=>any} task 테스트 함수. 
 * 	테스트 함수가 인자 없이 값을 바로 리턴하는 경우, 해당 값이 테스트 결과로 취급됩니다.
 * 	테스트 함수가 인자를 가진 경우 테스트 결과를 콜백하는 함수로 취급됩니다. 
 * @param {any} expectedResult 기대 테스트 결과 값.
 */
TestSuite.prototype.addTest = function(title, task, expectedResult) {
	var idx = this._cases.length;
	this._cases.push(new TestCase(this, idx, title, task, expectedResult));
	return this;
};

/**
 * 로봇 기반 테스트를 추가 합니다.
 * @param {String} title 테스트 제목.
 * @param {(RobotPlan)=>void} planner 로봇 동작 계획 작성기.
 * @param {()=>any} evaluator 로봇 동작 완료후 값을 측정하는 함수.
 * @param {any} expectedResult 기대되는 측정 값.
 */
TestSuite.prototype.addRobotTest = function(title, planner, evaluator, expectedResult) {
	var idx = this._cases.length;
	
	/**
	 * @param {(any)=>void} cb
	 */
	function task(cb) {
		var plan = new RobotPlan();
		planner(plan);
		if (cpr.utils.Util.isNullOrEmpty(plan._promises)) {
			throw new cpr.exceptions.IllegalStateException("로봇 계획이 작성되지 않았습니다.");
		}
		runRobotPlan(plan).then(function(input) {
			cb(evaluator());
		});
	}
	
	var testCase = new TestCase(this, idx, title, task, expectedResult);
	testCase._getTestCode = function() {
		var code = [
			"// 로봇 제어 계획",
			String(planner),
			"",
			"// 평가 함수",
			String(evaluator)
		].join("\n");
		return getPrettyCode(code);
	};
	this._cases.push(testCase);
	
	return this;
}

TestSuite.prototype.getLogViewer = function() {
	if (!this._logViewer) {
		this._logViewer = new udc.test.TestLogViewer();
		this._logViewer.style.addClass("test-log-viewer");
		
		var targetAppInstance = cpr.core.Platform.INSTANCE.getAllRunningAppInstances().find(function(app) {
			return app.isRootAppInstance();
		});
		
		if (autoRunEmbeddedApp) {
			targetAppInstance = autoRunEmbeddedApp.getEmbeddedAppInstance();
		}
		
		targetAppInstance.floatControl(this._logViewer, {
			"top": "0px",
			"right": "0px",
			"bottom": "0px",
			"left": "0px"
		});
	}
	return this._logViewer;
}

/**
 * 테스트 슈트를 실행합니다.
 */
TestSuite.prototype.run = function() {
	var me = this;
	
	// 코드 포매터 라이브러리 로드.
	var resourceLoader = new cpr.core.ResourceLoader();
	resourceLoader.addScript(MODULE_PATH + "/Object.assign.polyfill.js");
	resourceLoader.addScript(MODULE_PATH + "/formatter.min.js");
	resourceLoader.load().then(function() {
		// 로그뷰에 테스트 목록 전달.
		var logView = me.getLogViewer();
		me._cases.forEach(function(each) {
			logView.addTest(each.getTitle(), each._getTestCode());
		});
		
		// 테스트 시작 함수 예약.
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(me._runNext.bind(me));
		delete me;
	});
}

/**
 * 다음 테스트 케이스를 실행합니다.
 */
TestSuite.prototype._runNext = function() {
	var current = this._cases[this._pointer++];
	if (current) {
		current.run().then(this._runNext.bind(this));
	} else {
		this._didFinish();
	}
};

/**
 * 모든 테스트 케이스 수행 후 처리 코드.
 */
TestSuite.prototype._didFinish = function() {
	var succeed = this._cases.every(function(each) {
		return each.isSucceed();
	});
	
	// 모든 테스트가 성공한 경우.
	if (succeed) {
		console.log("모든 테스트가 성공 함.");
		
		if (autoRunEmbeddedApp) {
			var successEvent = new cpr.events.CEvent("test-success");
			autoRunEmbeddedApp.getEmbeddedAppInstance().dispatchEvent(successEvent);
		} else {
			getNotifier().info("모든 테스트 성공");
		}
	}
	
	// 테스트 실패가 존재하는 경우.
	else {
		var faild = this._cases.filter(function(each) {
			return each.isSucceed() == false;
		});
		var msg = faild.length + "개의 테스트 실패";
		console.error(msg);
		getNotifier().danger(msg + ", 콘솔 확인 요망.");
		
		// 로그뷰를 강제로 표시함.
		this.getLogViewer().show();
		
		if (autoRunEmbeddedApp) {
			var failEvent = new cpr.events.CEvent("test-fail");
			autoRunEmbeddedApp.getEmbeddedAppInstance().dispatchEvent(failEvent);
		}
	}
};

//// Robot 플래너
/**
 * @constructor
 */
function RobotPlan() {
	/** @type {(()=>Promise<void>)[]} */
	this._promises = [];
}

/**
 * 컨트롤을 클릭합니다.
 * 
 * @param {cpr.controls.UIControl} control 클릭할 컨트롤.
 * @param {cpr.preview.TargetingOptions} options? 컨트롤 내의 정확한 위치 옵션.
 */
RobotPlan.prototype.click = function(control, options) {
	this._promises.push(function() {
		return eb6Preview.testRobot.click(control, options);
	});
	return this;
};

/**
 * 더블 클릭을 수행합니다.
 * 
 * @param {cpr.controls.UIControl} control 더블 클릭할 컨트롤.
 * @param {cpr.preview.TargetingOptions} options? 컨트롤 내의 정확한 위치 옵션.
 */
RobotPlan.prototype.doubleClick = function(control, options) {
	this._promises.push(function() {
		return eb6Preview.testRobot.doubleClick(control, options);
	});
	return this;
};

/**
 * 컨트롤위로 마우스 포인터를 이동시킵니다.
 * 
 * @param {cpr.controls.UIControl} control 포인터를 이동시킬 컨트롤
 * @param {cpr.preview.TargetingOptions} options? 컨트롤 내의 정확한 위치 옵션.
 */
RobotPlan.prototype.mouseMove = function(control, options) {
	this._promises.push(function() {
		return eb6Preview.testRobot.mouseMove(control, options);
	});
	return this;
};


/**
 * 특정 시간동안 시간을 지연합니다.
 * @param {Number} time 지연 시간. (단위: 밀리초)
 */
RobotPlan.prototype.delay = function(time) {
	this._promises.push(function() {
		return eb6Preview.testRobot.delay(time);
	});
	return this;
};

/**
 * 텍스트를 타이핑 합니다.
 * @param {String} text 타이핑할 텍스트.
 * @param {cpr.preview.KeyboardOptions} options? 타이핑 옵션.
 * @return {RobotPlan}
 * 
 * @alt
 * 특정 키를 타이핑 합니다.
 * @param {cpr.preview.RobotKeyCode} code 키 코드.
 * @param {cpr.preview.KeyboardOptions} options? 타이핑 옵션.
 * @return {RobotPlan}
 */
RobotPlan.prototype.type = function(text, options) {
	this._promises.push(function() {
		return eb6Preview.testRobot.type(text, options);
	});
	return this;
};

/**
 * 
 * @param {Number} amount
 * @param {cpr.preview.KeyboardOptions} options
 */
RobotPlan.prototype.wheel = function(amount, options) {
	this._promises.push(function() {
		return eb6Preview.testRobot.wheel(amount, options);
	});
	return this;
};

/**
 * 마우스 드래그 앤 드롭을 수행합니다.
 * @param {cpr.controls.UIControl} from 드래그 시작 컨트롤.
 * @param {cpr.controls.UIControl} to 드래그 종료 컨트롤.
 * @param {from?:cpr.preview.TargetingOptions, to?: cpr.preview.TargetingOptions} options? 세부 타게팅 옵션.
 */
RobotPlan.prototype.drag = function(from, to, options) {
	this._promises.push(function() {
		return eb6Preview.testRobot.drag(from, to, options);
	});
	return this;
};

/**
 * 로봇 문맥 내에서 코드를 실행 합니다.
 * @param {Function} task 실행할 코드 블록. 
 * 	이 함수가 인자를 가진 경우 콜백으로 취급합니다.
 *  이 함수의 반환 값이 프로미스인 경우 해당 프로미스가 채워질 때 다음 테스트 동작을 수행합니다.
 * 
 * @returns {RobotPlan}
 */
RobotPlan.prototype.runCode = function(task) {
	this._promises.push(function() {
		return new Promise(function(resolve, reject) {
			if (task.length === 1) {
				task(function() {
					resolve();
				});
			} else {
				var result = task();
				if (result instanceof Promise) {
					result.then(resolve);
				} else {
					resolve();
				}
			}
		});
	});
	
	return this;
};

/**
 * 테스트 케이스를 작성하고 실행합니다.
 * @param {(test: TestSuite)=>void} test 테스트 정의 함수.
 */
function runTest(test) {
	var suite = new TestSuite();
	test(suite);
	suite.run();
};

//// 유틸리티

function compare(a, b) {
	if (a && typeof a["equals"] == "function") {
		return a["equals"](b);
	} else if (a instanceof Array && b instanceof Array) {
		if (a.length != b.length) {
			return false;
		}
		
		for (var i = 0; i < a.length; i++) {
			if (compare(a[i], b[i]) == false) {
				return false;
			}
		}
		
		return true;
	} else {
		return a == b;
	}
}

/**
 * 가능한경우 함수의 소스코드를 보기좋게 포맷하여 반환합니다.
 * @param {Function} fn 소스코드를 얻을 함수.
 */
function getPrettyCode(fn) {
	var originalCode = String(fn);
	
	// 포매터가 로드된 경우.
	if (window["_formatCode"]) {
		return (window["_formatCode"])(originalCode, {
			indent_with_tabs: false,
			indent_size: 2
		});
	}
	
	// 포매터가 로드되지 않은 경우 원본 소스 사용.
	else {
		return originalCode;
	}
}

/**
 * 
 * @param {cpr.controls.EmbeddedApp} ea
 */
function setAutoRunTarget(ea) {
	autoRunEmbeddedApp = ea;
};

/**
 * @param {RobotPlan} robotPlan
 */
function runRobotPlan(robotPlan) {
	return new Promise(function(resolve, reject) {
		var idx = 0;
		
		function runNext() {
			var currentFactory = robotPlan._promises[idx];
			if (currentFactory) {
				currentFactory().then(function(input) {
					idx++;
					runNext();
				});
			} else {
				resolve();
			}
		}
		
		runNext();
	});
};

/**
 * 특정 컨트롤에 대한 DOM 노드를 얻습니다. 테스트 목적으로만 사용 가능합니다.
 * @param {cpr.controls.UIControl} control
 * @return {HTMLDivElement}
 */
function nodeOf(control) {
	var selector = cpr.utils.Util.template("[id='uuid-${uuid}']", control);
	return document.querySelector(selector);
}

/**
 * UI를 변경하는 코드를 실행하고, 다음 렌더링 프레임에 리졸브되는 프로미스 객체를 반환합니다.
 * @param {()=>void} task
 */
function runAndNext(task) {
	task();
	return new Promise(function(resolve, reject) {
		cpr.core.DeferredUpdateManager.INSTANCE.asyncExec(resolve);
	});
}

/**
 * 특정 밀리세컨드 뒤에 리졸브되는 프로미스를 만듭니다.
 * @param {number} mills
 */
function delay(mills) {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, mills);
	});
}

/**
 * 두 숫자가 일치하는지 확인 합니다.
 * @param {Number} a 비교할 숫자 1.
 * @param {Number} b 비교할 숫자 2.
 * @param {Number} tolerance 허용 오차.
 */
function areSameNumber(a, b, tolerance) {
	return Math.abs(a - b) <= tolerance;
}

globals.borderChange = function(vcCtrl) {
	var borderChange = function() {
		var vnLength = arguments.length;
		for (var i = 0; i < (vnLength*2); i++) doSetTimeBorder(vcCtrl, (i * 50), arguments[i%vnLength]);
			
	}
	
	var vsBorder = vcCtrl.style.border == undefined ? "" : vcCtrl.style.border;
	borderChange("#e2544b 3px solid", "#f19c40 1px solid", "#b455b5 3px solid", "#3993e2 1px solid", "#11c966 3px solid", "#2b26a8 3px solid", "#b70fae 1px solid", "#a1ff71 3px solid", vsBorder);
}

/**
 * 컨트롤에 테두리 스타일 적용
 * @param {cpr.controls.UIControl | HTMLElement} vcCtrl
 * @param {Number} vnTime
 * @param {String} vsBorder
 */
function doSetTimeBorder(vcCtrl, vnTime, vsBorder) {
	setTimeout(function() {
		if(vcCtrl==null) return;
		
		if (vcCtrl && vcCtrl.style && vcCtrl.style.css) vcCtrl.style.css("border", vsBorder);
		else vcCtrl.style.border = vsBorder;
	}, vnTime);
}