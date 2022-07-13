"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayBoard = exports.RelayState = void 0;
var SerialPort = require("serialport");
var Commands = __importStar(require("./commands"));
var RelayState;
(function (RelayState) {
    RelayState[RelayState["CLOSED"] = 0] = "CLOSED";
    RelayState[RelayState["OPEN"] = 1] = "OPEN";
})(RelayState = exports.RelayState || (exports.RelayState = {}));
function testWrite(buffer, cb) {
    console.log("TEST MODE: Writing buffer: ".concat(buffer));
    cb();
}
var RelayBoard = /** @class */ (function () {
    function RelayBoard(_a) {
        var port = _a.port, _b = _a.name, name = _b === void 0 ? "" : _b, _c = _a.test, test = _c === void 0 ? false : _c;
        this._port = test
            ? { write: testWrite }
            : new SerialPort(port, function (err) { throw err; });
        this.port = port;
        this.name = name;
        this.test = test;
        this.state = new Array(16).fill(RelayState.CLOSED);
    }
    RelayBoard.prototype._write = function (buffer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._port.write(buffer, function (err) {
                if (err)
                    return reject(err);
                return resolve(null);
            });
        });
    };
    RelayBoard.prototype._validateRelay = function (relay) {
        if (relay < 1 || relay > 16)
            throw new Error("Invalid relay number: ".concat(relay));
        return;
    };
    RelayBoard.prototype.getState = function () {
        return this.state;
    };
    RelayBoard.prototype.setState = function (state) {
        return __awaiter(this, void 0, void 0, function () {
            var results, errors;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.allSettled(state.map(function (s, i) { return _this._write(Commands.toggle[i][s]); }))];
                    case 1:
                        results = _a.sent();
                        errors = [];
                        results.forEach(function (_a, i) {
                            var status = _a.status, reason = _a.reason;
                            if (status === "fulfilled")
                                _this.state[i] = state[i];
                            else
                                errors.push(reason);
                        });
                        return [2 /*return*/, {
                                errors: errors,
                                state: this.getState()
                            }];
                }
            });
        });
    };
    RelayBoard.prototype.toggleOne = function (relay, command) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._validateRelay(relay);
                        return [4 /*yield*/, this._write(Commands.toggle[relay - 1][command])];
                    case 1:
                        _a.sent();
                        this.state[relay - 1] = command;
                        return [2 /*return*/, this.getState()];
                }
            });
        });
    };
    RelayBoard.prototype.toggle = function (relays, command) {
        return __awaiter(this, void 0, void 0, function () {
            var results, errors;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        relays.forEach(function (relay) { return _this._validateRelay(relay); });
                        return [4 /*yield*/, Promise.allSettled(relays.map(function (r) { return _this._write(Commands.toggle[r][command]); }))];
                    case 1:
                        results = _a.sent();
                        errors = [];
                        results.forEach(function (_a, i) {
                            var status = _a.status, reason = _a.reason;
                            if (status === "fulfilled")
                                _this.state[relays[i]] = command;
                            else
                                errors.push(reason);
                        });
                        return [2 /*return*/, {
                                errors: errors,
                                state: this.getState()
                            }];
                }
            });
        });
    };
    RelayBoard.prototype.reset = function (command) {
        return __awaiter(this, void 0, void 0, function () {
            var buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        buffer = command === RelayState.CLOSED
                            ? Commands.resetOff
                            : Commands.resetOn;
                        return [4 /*yield*/, this._write(buffer)];
                    case 1:
                        _a.sent();
                        this.state = this.state.fill(command);
                        return [2 /*return*/, this.getState()];
                }
            });
        });
    };
    return RelayBoard;
}());
exports.RelayBoard = RelayBoard;
