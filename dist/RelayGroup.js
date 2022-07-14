"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayGroup = void 0;
var SerialPort = require("serialport").SerialPort;
var RelayBoard_1 = require("./RelayBoard");
var RelayGroup = /** @class */ (function () {
    function RelayGroup(_a) {
        var _b = _a.boards, boards = _b === void 0 ? [] : _b, _c = _a.test, test = _c === void 0 ? false : _c;
        this.boards = [];
        this.test = test;
        this.assignBoards(boards);
    }
    RelayGroup.listPorts = function () {
        return SerialPort.list();
    };
    RelayGroup.prototype._validateRelay = function (relay) {
        if (relay < 1)
            throw new Error("Invalid relay number. Relays are numbered from 1 to (# of boards) * 16.");
        var boardIndex = Math.ceil(relay / 16) - 1;
        if (boardIndex >= this.boards.length)
            throw new Error("Invalid relay number: ".concat(relay, ". There are not enough boards initialized."));
        return {
            boardIndex: boardIndex,
            relayIndex: (relay - 1) % 16 + 1
        };
    };
    RelayGroup.prototype.assignBoards = function (boards) {
        var _loop_1 = function (board) {
            if (this_1.boards.find(function (_a) {
                var port = _a.port;
                return port === board.port;
            })) {
                console.warn("Board with port '".concat(board.port, "' has already been initialized."));
                return "continue";
            }
            this_1.boards.push(new RelayBoard_1.RelayBoard(__assign(__assign({}, board), { test: this_1.test })));
        };
        var this_1 = this;
        for (var _i = 0, boards_1 = boards; _i < boards_1.length; _i++) {
            var board = boards_1[_i];
            _loop_1(board);
        }
        return this.boards.length;
    };
    RelayGroup.prototype.findBoards = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ports;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, RelayGroup.listPorts()];
                    case 1:
                        ports = _a.sent();
                        return [2 /*return*/, ports.filter(function (_a) {
                                var vendorId = _a.vendorId, productId = _a.productId;
                                return vendorId === "1a86" && productId === "7523";
                            })];
                }
            });
        });
    };
    RelayGroup.prototype.getStates = function () {
        return this.boards.map(function (board) { return board.getState(); });
    };
    RelayGroup.prototype.setStates = function (states) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (Array.isArray(states[0])) {
                            if (states.length !== this.boards.length)
                                throw new Error("A stateArray for each initialized board must be provided (".concat(this.boards.length, " boards =/= ").concat(states.length, " states)"));
                        }
                        else {
                            states = states.reduce(function (arr, state, i) {
                                arr[Math.floor(i / 16)].push(state);
                                return arr;
                            }, this.boards.map(function (_) { return new Array(); }));
                        }
                        return [4 /*yield*/, Promise.all(states.map(function (state, i) { return _this.boards[i].setState(state); }))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.reduce(function (result, _a) {
                                var errors = _a.errors, state = _a.state;
                                result.errors = __spreadArray(__spreadArray([], result.errors, true), errors, true);
                                result.states.push(state);
                                return result;
                            }, { errors: [], states: [] })];
                }
            });
        });
    };
    RelayGroup.prototype.toggleOne = function (relay, command) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, boardIndex, relayIndex;
            return __generator(this, function (_b) {
                _a = this._validateRelay(relay), boardIndex = _a.boardIndex, relayIndex = _a.relayIndex;
                return [2 /*return*/, this.boards[boardIndex].toggleOne(relayIndex, command)];
            });
        });
    };
    RelayGroup.prototype.toggle = function (relays, command) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (Array.isArray(relays[0])) {
                            if (relays.length !== this.boards.length)
                                throw new Error("An array of relays for each initialized board must be provided (".concat(this.boards.length, " boards =/= ").concat(relays.length, " relay arrays). If no relays are to be toggled on a certain board, provide an empty array."));
                        }
                        else {
                            relays = relays.reduce(function (arr, relay) {
                                var _a = _this._validateRelay(relay), boardIndex = _a.boardIndex, relayIndex = _a.relayIndex;
                                arr[boardIndex].push(relayIndex);
                                return arr;
                            }, this.boards.map(function (_) { return new Array(); }));
                        }
                        return [4 /*yield*/, Promise.all(relays.map(function (relayArr, i) { return _this.boards[i].toggle(relayArr, command); }))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.reduce(function (result, _a) {
                                var errors = _a.errors, state = _a.state;
                                result.errors = __spreadArray(__spreadArray([], result.errors, true), errors, true);
                                result.states.push(state);
                                return result;
                            }, { errors: [], states: [] })];
                }
            });
        });
    };
    RelayGroup.prototype.reset = function (command) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(this.boards.map(function (board) { return board.reset(command); }))];
            });
        });
    };
    return RelayGroup;
}());
exports.RelayGroup = RelayGroup;
