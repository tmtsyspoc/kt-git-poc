/************************************************
 * i11120_grid_jeeeyul.js
 * 버퍼 스토어를 사용하는 데이터셋의 그리드 바인딩(i11120) 테스트 화면.
 * 구성이 같은 그리드 두 개를 버퍼 스토어 데이터셋(dsLarge)과 일반 데이터셋(dsNormal)에 바인딩하여 비교한다.
 * 서브미션 응답은 Playwright page.route로 가로채므로 서버 데이터가 필요 없다.
 ************************************************/

var appConf = cpr.core.AppConfig.INSTANCE;
appConf.setControlValue("customscroll.minThumbSize", 32);

// 데이터셋이 만들어지기 전에 정책을 등록한다.
// info 속성 값이 "large"인 데이터셋(dsLarge)만 버퍼 스토어를 사용한다.
cpr.core.PolicyManager.INSTANCE.configure({
	"i11120": function(dataSet) {
		return dataSet.info == "large";
	}
});

/**
 * 서브미션별 마지막 전송 결과.
 * { [서브미션 id]: { events: string[], message: string, done: boolean } }
 */
var results = {};

function getResult(submission) {
	if (results[submission.id] == null) {
		results[submission.id] = { events: [], message: null, done: false };
	}
	return results[submission.id];
}

/** 서브미션별 응답 데이터셋. 진행 상태에 적재된 행 수를 표시할 때 쓴다 */
var targetDataSets = { smsLarge: "dsLarge", smsNormal: "dsNormal" };

/** 서브미션별 전송 시각. 진행 상태에 경과 시간을 표시할 때 쓴다 */
var startTimes = {};

/**
 * 서브미션별로 지금까지 받은 응답 크기. { [서브미션 id]: { received: number, total: number } }
 * 버퍼 스토어는 fetch 로, 일반 데이터셋은 문자열로 받으며 둘 다 받는 동안 적재하므로 수신과 적재를 나누지 않는다.
 */
var progressStates = {};

function send(submissionId) {
	delete results[submissionId];
	startTimes[submissionId] = Date.now();
	progressStates[submissionId] = { received: 0, total: 0 };
	showProgress.cancel();
	if (submissionId == "smsNormal") {
		var optResult2 = app.lookup("optResult2");
		optResult2.value = "";
		optResult2.userAttr("results", "");
	} else {
		var optResult = app.lookup("optResult");
		optResult.value = "";
		optResult.userAttr("results", "");
	}
	app.lookup(submissionId).send();
}

function formatMB(bytes) {
	return (bytes / 1048576).toFixed(1) + "MB";
}

/** "대상 상태: 내용 (경과 시간)" 형식의 한 줄. 진행 중, 완료, 실패와 엑셀 내보내기가 같은 형식을 쓴다 */
function statusLine(id, status, detail) {
	var elapsed = ((Date.now() - startTimes[id]) / 1000).toFixed(1);
	return id + " " + status + ": " + detail + " (" + elapsed + "초)";
}

/**
 * 진행 상태를 아웃풋에 표시한다. 진행 이벤트는 몇 ms 간격으로 몰려 오므로 100ms 에 한 번만 바꾼다.
 * 마지막 호출은 간격이 지난 뒤 반영되므로, 끝났을 때는 cancel 한 뒤 완료 줄을 쓴다.
 */
var showProgress = _.throttle(function(id, status, detail) {
	if (id == "smsNormal") app.lookup("optResult2").value = statusLine(id, status, detail);
	else app.lookup("optResult").value = statusLine(id, status, detail);
}, 100);

/** 받은 크기와 적재된 행 수. 전체 크기를 알면(압축하지 않은 응답) 비율도 붙인다 */
function submissionDetail(submission, done) {
	var state = progressStates[submission.id] || { received: 0, total: 0 };
	var size = formatMB(state.received);
	if (!done && state.total > 0) {
		size += " / " + formatMB(state.total) + " (" + Math.floor(state.received / state.total * 100) + "%)";
	}
	return size + ", 행 " + app.lookup(targetDataSets[submission.id]).getRowCount().toLocaleString();
}

/*
 * 서브미션에서 submit-success 이벤트 발생 시 호출.
 * 통신이 성공하면 발생합니다.
 */
function onSubmissionSubmitSuccess(e) {
	getResult(e.control).events.push(e.type);
}

/*
 * 서브미션에서 submit-error 이벤트 발생 시 호출.
 * 통신 중 문제가 생기면 발생합니다.
 */
function onSubmissionSubmitError(e) {
	var result = getResult(e.control);
	result.events.push(e.type);
	result.message = e.message;
}

/*
 * 서브미션에서 submit-done 이벤트 발생 시 호출.
 * 응답처리가 모두 종료되면 발생합니다.
 */
function onSubmissionSubmitDone(e) {
	var submission = e.control;
	var result = getResult(submission);
	result.events.push(e.type);
	result.done = true;
	// 밀려 있는 진행 상태 표시가 완료 줄을 덮어쓰지 않도록 취소한다
	showProgress.cancel();
	if (submission.id == "smsNormal") {
		var optResult2 = app.lookup("optResult2");
		// 테스트는 사용자 속성 results 의 JSON 을 읽어 확인한다
		optResult2.userAttr("results", JSON.stringify(results));
		if (result.message != null) {
			optResult2.value = statusLine(submission.id, "실패", result.message);
		} else {
			optResult2.value = statusLine(submission.id, "완료", submissionDetail(submission, true));
		}
	} else {
		var optResult = app.lookup("optResult");
		// 테스트는 사용자 속성 results 의 JSON 을 읽어 확인한다
		optResult.userAttr("results", JSON.stringify(results));
		if (result.message != null) {
			optResult.value = statusLine(submission.id, "실패", result.message);
		} else {
			optResult.value = statusLine(submission.id, "완료", submissionDetail(submission, true));
		}
	}
	
}

/*
 * 서브미션에서 submit-progress 이벤트 발생 시 호출.
 * 서버로 부터 일정 크기의 데이터를 전송받았을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSubmissionSubmitProgress(e) {
	var state = progressStates[e.control.id];
	if (state) {
		state.received = e.loaded;
		// 압축(gzip) 응답은 전체 크기를 알 수 없어 total 이 0 이다
		state.total = e.total;
	}
	showProgress(e.control.id, "조회 중", submissionDetail(e.control, false));
}

/*
 * 서브미션에서 submit-load-progress 이벤트 발생 시 호출.
 * 서버로 부터 수신된 데이터가 응답 데이터컨트롤에 부분적으로 적재되었을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSubmissionSubmitLoadProgress(e) {
	showProgress(e.control.id, "조회 중", submissionDetail(e.control, false));
}

/*
 * "버퍼 스토어 데이터셋 조회" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnLargeClick(e) {
	send("smsLarge");
}

/*
 * "일반 데이터셋 조회" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnNormalClick(e) {
	send("smsNormal");
}

/*
 * 서브미션에서 submit-load-progress 이벤트 발생 시 호출.
 * 서버로 부터 수신된 데이터가 응답 데이터컨트롤에 부분적으로 적재되었을 때 발생합니다. 하나의 응답에 대해 여러 번 발생할 수 있습니다.
 */
function onSmsLargeSubmitLoadProgress(e) {
	var smsLarge = e.control;
	app.lookup("grdLarge").redraw();
}

/**
 * 그리드를 엑셀(XLSX)로 내보낸다. i11120_grid_jeeeyul.module.js 의 exportGridToXLSX 를 쓴다.
 * 진행 상태와 결과는 아웃풋에 표시한다. Shift 를 누르고 클릭하면 파일 저장 대화상자로 디스크에 바로 쓴다(Chrome, Edge).
 */
function exportGrid(gridId, fileName, useFilePicker) {
	startTimes[gridId] = Date.now();
	showProgress.cancel();
	app.lookup("optResult").value = "";
	var job = exportGridToXLSX(app.lookup(gridId), {
		fileName: fileName,
		useFilePicker: useFilePicker,
		onProgress: function(p) {
			var detail = "행 " + p.processedRows.toLocaleString() + " / " + p.totalRows.toLocaleString() + " (" + Math.floor(p.ratio * 100) + "%)";
			if (p.sheetCount > 1) {
				detail += ", 시트 " + p.sheet + "/" + p.sheetCount;
			}
			showProgress(gridId, p.phase == "finalize" ? "엑셀 마무리 중" : "엑셀 쓰는 중", detail);
		}
	});
	job.done.then(function(blob) {
		showProgress.cancel();
		app.lookup("optResult").value = statusLine(gridId, "엑셀 완료", blob ? formatMB(blob.size) : "파일에 저장");
	}, function(error) {
		showProgress.cancel();
		app.lookup("optResult").value = statusLine(gridId, "엑셀 실패", error && error.message || error);
	});
}

/*
 * "버퍼 스토어 엑셀 내보내기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnExportLargeClick(e) {
	exportGrid("grdLarge", "i11120_large.xlsx", e.shiftKey === true);
}

/*
 * "일반 데이터셋 엑셀 내보내기" 버튼에서 click 이벤트 발생 시 호출.
 * 사용자가 컨트롤을 클릭할 때 발생하는 이벤트.
 */
function onBtnExportNormalClick(e) {
	exportGrid("grdNormal", "i11120_normal.xlsx", e.shiftKey === true);
}