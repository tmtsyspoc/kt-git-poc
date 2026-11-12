/**
 * 
 *//**
 *  excelExportwokrer.js
 */


self.onmessage = function (e) {
	// url 경로
    var actionUrl = e.data.actionUrl; 
    var start = e.data.start;
    // 헤더정보
    var headers = e.data.headers;
    // 컬럼넓이
    var columnWidths = e.data.columnWidths;
    //그리드 데이터개수
    var dataSize = e.data.dataSize;
    var totalRows = e.data.totalRows;
 	 var arrayBuffer = e.data.data; // ✅ ArrayBuffer 받기

    // ✅ ArrayBuffer를 Uint8Array로 변환
    var uint8Array = new Uint8Array(arrayBuffer);

    // ✅ Uint8Array를 문자열로 변환
    var decoder = new TextDecoder();
    var jsonData = decoder.decode(uint8Array);

    // ✅ JSON 파싱하여 원래 배열 복원
    var data = JSON.parse(jsonData); // `[[],[],[]]` 형태의 데이터 복원
    
    if (!data || data.length === 0) {
        console.log("모든 데이터 전송 완료!");
        self.postMessage({ type: "done" });
        return;
    }

    var isLastSend = start + dataSize >= totalRows;
    var isFirstSend = start == 0;

    var payload = { data: data, isLastSend: isLastSend, isFirstSend: isFirstSend };
    
    if (isFirstSend) {
        payload.headers = headers;
        payload.columnWidths = columnWidths;
    }

    fetch(actionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Server error: " + response.status);
        }
        return response.blob();
    })
    .then(blob => {
        console.log(start + " 번째부터" + (start + dataSize) + "번째까지 데이터 전송 완료");

        if (!isLastSend) {
            self.postMessage({
                type: "next",
                start: start + dataSize
            });
        } else {
            self.postMessage({
                type: "download",
                blob: blob
            });
        }
    });
     // 메모리 해제
    jsonData = null;
    data = null;
    
    
};