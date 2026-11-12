/************************************************
 * K9-2.js
 * @프로그램설명 : 중복 요청 방지 및 재시도 통제 시연 (클라이언트 전용)
 *                 가상 API는 setTimeout, 서버 처리 내역은 sessionStorage의 가상 처리 원장으로 대체한다.
 *
 * @작성일자 :  2026. 11. 5..
 * @작성자 : dyseo
 *
 * @수정이력 : 수정일자 (수정자) 수정내용
 ************************************************/

/************************************************
 ** 글로벌 변수, 상수변수
 ************************************************/
var STORAGE_KEY = "K9-2.duplicateControl.v4";
var DEBOUNCE_MS = 3000;
var RESPONSE_DELAY_MS = 3000;
var MAX_LOG_COUNT = 200;

/************************************************
 ** 글로벌 함수
 ************************************************/


/************************************************
 ** 파일내 로컬변수 선언
 ************************************************/
var util = createCommonUtil();

/** 새로고침 후에도 유지하는 시연 상태 */
var moState = null;
/** 마지막 클릭 시각 (디바운스 판단용) */
var mnLastClickTime = 0;
/** 응답 대기 타이머 목록 */
var maTimers = [];

/************************************************
 ** 사용자 정의 자바스크립트 함수를 기술
 ************************************************/

/**
 * 거래 고유키를 새로 만든다.
 * @return {String}
 */
function createTranKey() {
	return "TXN-" + moment().format("YYYYMMDDHHmmssSSS") + "-" + Math.floor(1000 + Math.random() * 9000);
}

/**
 * 새 거래의 초기 상태를 만든다.
 * @param {Boolean} pbUseTranKey 거래 고유키 사용 여부
 * @return {Object}
 */
function createState(pbUseTranKey) {
	return {
		tranKey: createTranKey(),
		click: 0,
		block: 0,
		send: 0,
		process: 0,
		ledger: {},
		pending: [],
		status: "대기 중",
		logs: [],
		useTranKey: pbUseTranKey === true
	};
}

/**
 * 저장된 상태를 읽는다. 없거나 읽을 수 없으면 null을 반환한다.
 * @return {Object}
 */
function readState() {
	try {
		return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
	} catch (ex) {
		return null;
	}
}

function saveState() {
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(moState));
	} catch (ex) {
		// 저장소를 쓸 수 없으면 새로고침 단계만 재현되지 않으므로 나머지 시연은 계속한다.
	}
}

/**
 * @return {Boolean} 거래 고유키 체크 여부
 */
function isTranKeyOn() {
	return app.lookup("chkTranKey").checked;
}

/**
 * @param {String} psMessage
 * @param {String} psClassName? 로그 줄에 적용할 클래스
 */
function writeLog(psMessage, psClassName) {
	moState.logs.unshift({
		text: moment().format("HH:mm:ss.SSS") + "  " + psMessage,
		className: psClassName
	});
	if (moState.logs.length > MAX_LOG_COUNT) {
		moState.logs.length = MAX_LOG_COUNT;
	}
}

/**
 * 로그를 줄별 서식이 적용된 표시 표현식으로 만든다.
 * Output은 줄바꿈 문자를 공백으로 표시하므로 줄마다 block으로 나눈다.
 * @return {String}
 */
function createLogExpression() {
	if (moState.logs.length === 0) {
		return "''";
	}
	return moState.logs.map(function(poLog) {
		var vsClass = poLog.className ? "['" + poLog.className + "'], " : "";
		return "sstr('" + poLog.text + "', " + vsClass + "{display: 'block'})";
	}).join(" + ");
}

/**
 * 상태를 저장하고 화면에 반영한다.
 */
function refreshScreen() {
	moState.useTranKey = isTranKeyOn();
	saveState();
	app.lookup("optClick").value = String(moState.click);
	app.lookup("optBlock").value = String(moState.block);
	app.lookup("optSend").value = String(moState.send);
	app.lookup("optProcess").value = String(moState.process);
	app.lookup("optTranKey").value = moState.tranKey;
	app.lookup("optStatus").value =  moState.status;
	app.lookup("optLog").displayExp = createLogExpression();
	app.lookup("btnNewTran").enabled = moState.pending.length === 0;
}

/**
 * @param {String} psReason 차단 사유
 */
function blockRequest(psReason) {
	moState.block++;
	writeLog("차단","text-point");
	refreshScreen();
}

/**
 * 가상 서버 처리. 응답 완료 시점에 호출되며, 처리 내역에 있는 키는 다시 처리하지 않고 기존 결과를 돌려준다.
 * @param {String} psKey 거래 고유키
 * @return {{orderNo: String, reused: Boolean}}
 */
function processOnVirtualServer(psKey) {
	var voRecord = moState.ledger[psKey];
	if (voRecord) {
		return { orderNo: voRecord.orderNo, reused: true };
	}
	var vsOrderNo = "ORD-" + moment().format("HHmmssSSS");
	moState.ledger[psKey] = { orderNo: vsOrderNo };
	moState.process++;
	return { orderNo: vsOrderNo, reused: false };
}

/**
 * 응답 대기를 끝내고 거래를 처리한 뒤 결과를 화면에 반영한다.
 * @param {{key: String, dueAt: Number}} poRequest moState.pending의 요청
 */
function completeRequest(poRequest) {
	moState.pending.splice(moState.pending.indexOf(poRequest), 1);

	var vsKey = poRequest.key;
	var voResult = processOnVirtualServer(vsKey);
	if (voResult.reused) {
		moState.status = "기존 결과 반환: 주문번호 " + voResult.orderNo + " (신규 처리 없음)";
		writeLog("기존 결과 반환 " + vsKey + " / " + voResult.orderNo);
	} else {
		moState.status = "개통 완료: 주문번호 " + voResult.orderNo;
		writeLog("신규 처리 완료 " + vsKey + " / " + voResult.orderNo, "text-primary");
	}
	if (moState.pending.length === 0) {
		mnLastClickTime = 0;
	}
	refreshScreen();
}

/**
 * 요청의 응답 예정 시각에 맞춰 완료 타이머를 건다. 새로고침 후에는 남은 시간만큼만 기다린다.
 * @param {{key: String, dueAt: Number}} poRequest moState.pending의 요청
 */
function scheduleResponse(poRequest) {
	var vnTimer = setTimeout(function() {
		maTimers.splice(maTimers.indexOf(vnTimer), 1);
		completeRequest(poRequest);
	}, Math.max(poRequest.dueAt - Date.now(), 0));
	maTimers.push(vnTimer);
}

/**
 * 가상 API를 호출한다. 거래 고유키가 꺼져 있으면 요청마다 다른 거래로 처리된다.
 */
function sendTransaction() {
	var vsKey = isTranKeyOn() ? moState.tranKey : createTranKey();
	var voRequest = { key: vsKey, dueAt: Date.now() + RESPONSE_DELAY_MS };

	moState.send++;
	moState.pending.push(voRequest);
	moState.status = "응답 대기 중";
	writeLog("전송 " + vsKey, "text-success");
	refreshScreen();
	scheduleResponse(voRequest);
}

/**
 * 클릭을 판단하고 통과하면 전송한다.
 * 첫 클릭은 즉시 보내고, 연속된 클릭은 마지막 클릭 후 DEBOUNCE_MS가 지날 때까지 무시한다.
 */
function requestOpening() {
	moState.click++;

	var vnNow = Date.now();
	var vbDebounced = vnNow - mnLastClickTime < DEBOUNCE_MS;
	mnLastClickTime = vnNow;

	if (vbDebounced) {
		blockRequest("디바운스");
		return;
	}
	sendTransaction();
}

function clearTimers() {
	maTimers.forEach(function(pnTimer) {
		clearTimeout(pnTimer);
	});
	maTimers = [];
}

/************************************************
 ** 자동으로 생성되는 이벤트 자바스크립트 함수를 배치
 ** (이벤트 생성시 자동으로 스크립트 함수 하위에 표시)
 ************************************************/

/*
 * 루트 컨테이너에서 load 이벤트 발생 시 호출.
 * 저장된 시연 상태를 복원하고, 응답 대기 중이던 요청은 이어서 기다린다.
 */
function onBodyLoad(e) {
	moState = readState() || createState();
	app.lookup("chkTranKey").checked = moState.useTranKey === true;
	refreshScreen();
	moState.pending.forEach(function(poRequest) {
		scheduleResponse(poRequest);
	});
}

/*
 * 루트 컨테이너에서 unload 이벤트 발생 시 호출.
 * 대기 중인 응답 타이머를 해제한다.
 */
function onBodyUnload(e) {
	clearTimers();
}

/*
 * "개통 요청" 버튼(btnCreateCode)에서 click 이벤트 발생 시 호출.
 */
function onBtnCreateCodeClick(e) {
	requestOpening();
}

/*
 * "새 거래" 버튼(btnNewTran)에서 click 이벤트 발생 시 호출.
 * 거래 고유키 체크 상태는 유지하고 카운터·처리 원장을 초기화한 뒤 새 거래 고유키를 발급한다.
 */
function onBtnNewTranClick(e) {
	clearTimers();
	mnLastClickTime = 0;
	moState = createState(isTranKeyOn());
	writeLog("새 거래 시작 " + moState.tranKey);
	refreshScreen();
}

