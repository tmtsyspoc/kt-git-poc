/************************************************
 * K3-6.js
 * @프로그램설명 : [UX-04]상태·메시지 피드백 - 청구서 일괄 생성 처리상태 시연
 *
 * @작성일자 :  2026. 11. 10..
 * @작성자 : dyseo
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/
/** 처리상태 */
var STATUS_WAIT = "접수";
var STATUS_RUN = "처리중";
var STATUS_DONE = "완료";
var STATUS_FAIL = "실패";

/** 시연용 실패 사유 */
var FAIL_REASONS = ["고객 주소 정보 누락", "요금 산정 서버 응답 지연(Timeout)", "수신 이메일 형식 오류"];

/************************************************
 ** 글로벌 함수
 ************************************************/


/************************************************
 ** 파일내 로컬변수 선언
 ************************************************/
var util = createCommonUtil();

/** 처리 중 여부 (중복 실행 방지) */
var vbRunning = false;
/** 재시도 횟수 기록 (행 번호 -> 횟수). 시연에서는 재시도하면 성공 처리한다. */
var voTried = {};

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술
 ************************************************/

/**
 * 상태별 건수와 진행률을 갱신한다.
 */
function refreshSummary(){
	var vcDs = app.lookup("dsBill");
	var vnTotal = vcDs.getRowCount();
	var vnWait = vcDs.findAllRow("STATUS == '" + STATUS_WAIT + "'").length;
	var vnRun = vcDs.findAllRow("STATUS == '" + STATUS_RUN + "'").length;
	var vnDone = vcDs.findAllRow("STATUS == '" + STATUS_DONE + "'").length;
	var vnFail = vcDs.findAllRow("STATUS == '" + STATUS_FAIL + "'").length;

	app.lookup("pgrBill").value = vnTotal == 0 ? 0 : Math.round((vnDone + vnFail) * 100 / vnTotal);
	app.lookup("optSummary").value = "전체 " + vnTotal + "건 | 접수 " + vnWait + " | 처리중 " + vnRun + " | 완료 " + vnDone + " | 실패 " + vnFail;
	app.lookup("btnRetryAll").enabled = (vnFail > 0 && !vbRunning);
	app.lookup("btnRun").enabled = !vbRunning;
}

/**
 * 한 건의 상태를 변경한다.
 */
function setStatus(pnIdx, psStatus, psMsg){
	var vcDs = app.lookup("dsBill");
	vcDs.setValue(pnIdx, "STATUS", psStatus);
	vcDs.setValue(pnIdx, "MSG", psMsg);
	refreshSummary();
}

/**
 * 한 건을 처리한다. (서버 호출을 흉내내는 시연용 비동기 처리)
 * 최초 처리에서는 3건마다 1건이 실패하고, 재시도하면 성공한다.
 * @param {Number} pnIdx 처리할 행 인덱스
 * @param {Function} pfDone 처리 완료 콜백
 */
function processRow(pnIdx, pfDone){
	var vcDs = app.lookup("dsBill");
	var vsNo = vcDs.getValue(pnIdx, "NO");
	setStatus(pnIdx, STATUS_RUN, "청구서 생성 중...");

	setTimeout(function(){
		var vnTried = voTried[vsNo] || 0;
		voTried[vsNo] = vnTried + 1;
		var vbFail = (vnTried == 0 && Number(vsNo) % 3 == 0);
		if(vbFail){
			setStatus(pnIdx, STATUS_FAIL, FAIL_REASONS[Number(vsNo) % FAIL_REASONS.length] + " - 재시도하세요.");
		} else {
			setStatus(pnIdx, STATUS_DONE, vnTried > 0 ? "재시도 후 생성 완료" : "생성 완료");
		}
		pfDone();
	}, 400 + Math.floor(Math.random() * 400));
}

/**
 * 대상 행 인덱스 배열을 순차 처리한다.
 */
function processQueue(paIdx, pfFinish){
	if(paIdx.length == 0){
		pfFinish();
		return;
	}
	var vnIdx = paIdx.shift();
	processRow(vnIdx, function(){
		processQueue(paIdx, pfFinish);
	});
}

/**
 * 처리 종료 후 결과를 안내한다. (포커스를 가져가지 않는 notify 사용)
 */
function finishRun(){
	vbRunning = false;
	refreshSummary();
	var vnFail = app.lookup("dsBill").findAllRow("STATUS == '" + STATUS_FAIL + "'").length;
	if(vnFail > 0){
		util.Msg.notify(app, "처리가 종료되었습니다. 실패 " + vnFail + "건은 재시도할 수 있습니다.", null, "WARNING");
	} else {
		util.Msg.notify(app, "모든 청구서 생성이 완료되었습니다.", null, "INFO");
	}
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시)
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 */
function onBodyLoad(e){
	refreshSummary();
}

/*
 * "청구서 일괄 생성" 버튼(btnRun)에서 click 이벤트 발생 시 호출.
 * 지정 건수만큼 접수 처리 후 순차적으로 생성한다.
 */
function onBtnRunClick(e){
	var btnRun = e.control;
	if(vbRunning){
		return;
	}
	var vnCnt = app.lookup("nbeCnt").value;
	if(ValueUtil.isNull(vnCnt) || vnCnt < 1){
		util.Msg.notify(app, "생성 건수를 입력하세요.", null, "WARNING");
		app.lookup("nbeCnt").focus();
		return;
	}

	var vcDs = app.lookup("dsBill");
	var vsMon = app.lookup("cmbMon").value;
	vcDs.clear();
	voTried = {};
	var vaIdx = [];
	for(var i = 1; i <= vnCnt; i++){
		vcDs.addRowData({
			NO: String(i),
			CUST: "고객" + (1000 + i),
			BILL_MON: vsMon,
			AMT: 20000 + i * 1700,
			STATUS: STATUS_WAIT,
			MSG: "접수되었습니다."
		});
		vaIdx.push(i - 1);
	}
	vbRunning = true;
	refreshSummary();
	util.Msg.notify(app, vnCnt + "건이 접수되었습니다. 처리를 시작합니다.");
	processQueue(vaIdx, finishRun);
}

/*
 * 그리드(grdBill)에서 cell-click 이벤트 발생 시 호출.
 * "재시도" 컬럼(6번)의 실패 건을 클릭하면 해당 건만 다시 처리한다.
 */
function onGrdBillCellClick(e){
	var grdBill = e.control;
	if(vbRunning || e.cellIndex != 6){
		return;
	}
	var vnIdx = e.rowIndex;
	if(vnIdx < 0 || app.lookup("dsBill").getValue(vnIdx, "STATUS") != STATUS_FAIL){
		return;
	}
	vbRunning = true;
	refreshSummary();
	processQueue([vnIdx], finishRun);
}

/*
 * "실패건 일괄 재시도" 버튼(btnRetryAll)에서 click 이벤트 발생 시 호출.
 */
function onBtnRetryAllClick(e){
	var btnRetryAll = e.control;
	if(vbRunning){
		return;
	}
	var vaRows = app.lookup("dsBill").findAllRow("STATUS == '" + STATUS_FAIL + "'");
	if(vaRows.length == 0){
		return;
	}
	var vaIdx = vaRows.map(function(voRow){
		return voRow.getIndex();
	});
	vbRunning = true;
	refreshSummary();
	util.Msg.notify(app, "실패 " + vaIdx.length + "건을 재시도합니다.");
	processQueue(vaIdx, finishRun);
}

/*
 * "초기화" 버튼(btnClear)에서 click 이벤트 발생 시 호출.
 */
function onBtnClearClick(e){
	var btnClear = e.control;
	if(vbRunning){
		util.Msg.notify(app, "처리 중에는 초기화할 수 없습니다.", null, "WARNING");
		return;
	}
	app.lookup("dsBill").clear();
	voTried = {};
	refreshSummary();
	app.lookup("optSummary").value = "대기 중입니다. [청구서 일괄 생성]을 눌러 시작하세요.";
}
