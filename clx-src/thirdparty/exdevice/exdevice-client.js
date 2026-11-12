var exdevice;
(function (exdevice) {
    var Connector = /** @class */ (function () {
        function Connector(portNumber, portRange) {
            this._connected = false;
            this._state = exdevice.State.CLOSED;
            this._handlers = {};
            this._port = portNumber != null && portNumber > 0 ? portNumber : Connector.DEFAULT_PORT;
            this._portRange = portRange != null && portRange > 0 ? portRange : Connector.DEFAULT_RANGE;
        }
        Object.defineProperty(Connector.prototype, "onmessage", {
            set: function (messageHandler) {
                this._messageHandler = messageHandler;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Connector.prototype, "onready", {
            set: function (readyHandler) {
                this._readyHandler = readyHandler;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Connector.prototype, "onerror", {
            set: function (errorHandler) {
                this._errorHandler = errorHandler;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Connector.prototype, "onclose", {
            set: function (closeHandler) {
                this._closeHandler = closeHandler;
            },
            enumerable: false,
            configurable: true
        });
        Connector.prototype.getState = function () {
            return this._state;
        };
        Connector.prototype.isConnected = function () {
            return this._connected;
        };
        Connector.prototype.connect = function () {
            var _this = this;
            if (this.isConnected()) {
                console.log("already connected");
                if (this._readyHandler) {
                    this._readyHandler(this);
                }
                return;
            }
            var _tryCnt = 0;
            var _scanPort = this._port;
            this._state = exdevice.State.CONNECTING;
            this._connected = false;
            var portScan = function (time) {
                _tryCnt++;
                var retryConnection = function () {
                    if (_tryCnt >= _this._portRange) {
                        console.log("port scan fail");
                        _this._state = exdevice.State.CLOSED;
                        _this._connected = false;
                        if (_this._errorHandler) {
                            _this._errorHandler(_this._createExDeviceError("connection fail", null, null));
                        }
                        return;
                    }
                    _scanPort++;
                    window.requestAnimationFrame(portScan);
                };
                console.log("try connect " + _scanPort);
                _this._ws = new WebSocket("wss://127.0.0.1:" + _scanPort);
                _this._ws.onopen = function (ev) {
                    console.log("open : " + _scanPort);
                    var req = { service: "eXDeviceInfo", requestKey: "1", param: {} };
                    _this._ws.send(JSON.stringify(req));
                };
                _this._ws.onmessage = function (ev) {
                    try {
                        console.log(ev.data);
                        var res = JSON.parse(ev.data);
                        if (res["return"]["name"] == "eXDevicePlus") {
                            _this._setupConnection();
                            return;
                        }
                    }
                    catch (err) {
                        console.log("other app");
                        try {
                            _this._ws.close();
                        }
                        catch (er) { }
                        retryConnection();
                    }
                };
                _this._ws.onerror = function (ev) {
                    console.log("error occur");
                    try {
                        _this._ws.close();
                    }
                    catch (er) { }
                    retryConnection();
                };
            };
            portScan(0);
        };
        Connector.prototype.send = function (serviceId, param, handler, once) {
            var _this = this;
            if (once === void 0) { once = false; }
            if (this._state != exdevice.State.OPEN) {
                throw new Error("eXDevice+ is not connected");
            }
            var reqKey = this._createRequestKey();
            var request = {
                service: serviceId,
                requestKey: reqKey,
                param: param
            };
            if (once === true) {
                this._handlers[reqKey] = function (response) {
                    handler(response);
                    delete _this._handlers[reqKey];
                };
            }
            else {
                this._handlers[reqKey] = handler;
            }
            var requestTxt = JSON.stringify(request);
            this._ws.send(requestTxt);
            return reqKey;
        };
        Connector.prototype.removeHandler = function (reqKey) {
            delete this._handlers[reqKey];
        };
        Connector.prototype.removeAllHandlers = function () {
            this._handlers = {};
        };
        Connector.prototype.close = function () {
            if (this.isConnected()) {
                this._state = exdevice.State.CLOSING;
                this._connected = false;
                this._ws.close();
            }
        };
        Connector.prototype._setupConnection = function () {
            var _this = this;
            this._ws.onmessage = function (ev) {
                _this._onMessage.apply(_this, [ev]);
            };
            this._ws.onerror = function (ev) {
                _this._onError.apply(_this, [ev]);
            };
            this._ws.onclose = function (ev) {
                _this._onClose.apply(_this, [ev]);
            };
            this._state = exdevice.State.OPEN;
            this._connected = true;
            if (this._readyHandler) {
                this._readyHandler(this);
            }
        };
        Connector.prototype._onMessage = function (ev) {
            var data = ev.data;
            if (data == null || data == "") {
                return;
            }
            try {
                var handler = void 0;
                var returnMsg = JSON.parse(data);
                var reqKey = returnMsg.requestKey;
                if (reqKey) {
                    handler = this._handlers[reqKey];
                    if (handler) {
                        handler(returnMsg);
                    }
                }
            }
            catch (err) {
                if (this._errorHandler) {
                    this._errorHandler(this._createExDeviceError(null, ev, err));
                }
                else {
                    console.log(err);
                }
            }
            if (this._messageHandler) {
                this._messageHandler(ev.data);
            }
        };
        Connector.prototype._onError = function (ev) {
            if (this._errorHandler) {
                this._errorHandler(this._createExDeviceError("Websocket error", ev, null));
            }
            else {
                console.log(ev);
            }
        };
        Connector.prototype._onClose = function (ev) {
            this._state = exdevice.State.CLOSED;
            this._connected = false;
            if (this._closeHandler) {
                this._closeHandler(this);
            }
            this._handlers = {};
        };
        Connector.prototype._createRequestKey = function () {
            return this._createRandomStr() + "-" + this._createRandomStr() + "-" + this._createRandomStr();
        };
        Connector.prototype._createRandomStr = function () {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        };
        Connector.prototype._createExDeviceError = function (errMsg, errEv, errExcep) {
            return {
                message: errMsg,
                event: errEv,
                exception: errExcep
            };
        };
        /**
         * 기본 eXDevice+ 접속 포트
         */
        Connector.DEFAULT_PORT = 13440;
        /**
         * 기본 eXDevice+ 포트 범위
         */
        Connector.DEFAULT_RANGE = 10;
        return Connector;
    }());
    exdevice.Connector = Connector;
})(exdevice || (exdevice = {}));
var exdevice;
(function (exdevice) {
    var State;
    (function (State) {
        State["CLOSED"] = "closed";
        State["CONNECTING"] = "connecting";
        State["OPEN"] = "open";
        State["CLOSING"] = "closing";
    })(State = exdevice.State || (exdevice.State = {}));
})(exdevice || (exdevice = {}));

//# sourceMappingURL=exdevice-client.js.map
