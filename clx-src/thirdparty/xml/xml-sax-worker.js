importScripts('sax/sax.min.js');

self.onmessage = (e) => {
    let message = e.data;
    switch (message.type) {
        case "parse": {
            var cnt = 0;
            var buffer = message.data;
            const decoder = new TextDecoder();
            var src = decoder.decode(buffer);

            // 초기 변수 설정
            var rows = [];
            var row = {};
            var colName = "";
            var knownText = "";
            var dataSetId;
            var condition = message.condition.split(",");
            var batchSize = 500;

            var dataGroups = {
                "subPfCovRlrBcVo": [[], [], []],
                "subCovInspe": [[], [], []],
            };

            // 데이터 전송 함수
            var sendBatch = function (data, dataId, submitId, appId, num) {
                if (data.length > batchSize) {
                    var batch = data.splice(0, batchSize);
                    self.postMessage({
                        type: "rows",
                        data: batch,
                        dataId: dataId,
                        submitId: submitId,
                        appId: appId,
                        num: num,
                    });
                }
            };

            // SAX 파서 인스턴스 생성
            var parser = sax.parser(true);

            parser.onopentag = function (node) {
                switch (node.name) {
                    case "Row":
                        row = {}; 
                        break;
                    case "Col":
                       colName = node.attributes.id; 
                        break;
                    case "Dataset":
                       dataSetId = node.attributes.id; 
                        break;
                }
            };

            parser.onclosetag = function (tagName) {
                switch (tagName) {
                    case "Row":
                        if (condition != "" && dataGroups[message.submitId]) {
                            var group = dataGroups[message.submitId];
                            var value = row[condition[0]];
                            switch (value) {
                                case condition[1]:
                                    group[0].push(row);
                                    sendBatch(group[0], dataSetId, message.submitId, message.appId, 1);
                                    break;
                                case condition[2]:
                                    group[1].push(row);
                                    sendBatch(group[1], dataSetId, message.submitId, message.appId, 2);
                                    break;
                                case condition[3]:
                                    group[2].push(row);
                                    sendBatch(group[2], dataSetId, message.submitId, message.appId, 3);
                                    break;
                                default:
                                    break;
                            }
                        } else {
                            rows.push(row);
                            sendBatch(rows, dataSetId, message.submitId, message.appId);
                        }
                        break;
                    case "Col":
                        if (row && colName) row[colName] = knownText;
                        break;
                }
            };

            parser.ontext = function (text) {
                if (text && text.trim()) knownText = text.trim();
            };

            parser.onend = function () {
                // 남은 데이터 전송
                if (rows.length > 0) {
                    self.postMessage({
                        type: "rows",
                        data: rows,
                        isDone: true,
                        dataId: dataSetId,
                        submitId: message.submitId,
                        appId: message.appId,
                    });
                }

                var submitIds = Object.keys(dataGroups);

                if (condition != "") {
                    for (var idx = 0; idx < submitIds.length; idx++) {
                        var submitId = submitIds[idx];
                        var groups = dataGroups[submitId];
                        if (message.submitId == submitId) {
                            for (var j = 0; j < groups.length; j++) {
                                var group = groups[j];
                                if (group.length > 0) {
                                    self.postMessage({
                                        type: "rows",
                                        data: group,
                                        dataId: dataSetId,
                                        submitId: message.submitId,
                                        appId: message.appId,
                                        num: j + 1,
                                    });
                                }
                            }
                        }
                    }
                }

                // 종료 메시지
                self.postMessage({
                    type: "end",
                    appId: message.appId,
                    submitId: message.submitId,
                    dataId: dataSetId,
                });
            };

            // sax.js파서사용
            parser.write(src).close();
            break;
        }
        default:
            break;
    }
};
