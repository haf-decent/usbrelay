'use strict';

const { list } = require('serialport');
var Board = require('./Board.js');

module.exports = USBrelay;

function USBrelay({ test = false, ports = [] }) {
    this.boards = [];
    this.ports = [];
    this.nBoards = 0;
    this.test = test;
    
    if (ports.length) this.assignBoards(ports);
}

USBrelay.prototype.listPorts = list;

USBrelay.prototype.findBoards = function(callback) {
    this.listPorts((err, result) => {
        if (err) return callback(err);
        callback(null, result.filter(port => port.vendorId == "1a86" && port.productId == "7523"));
    });
}

USBrelay.prototype.assignBoards = function(ports) {
    if (!(Array.isArray(ports) && ports.length)) {
        throw new Error('Ports must be a non-empty array');
    }
    
    for (var port of ports) {
        this.ports.push(port)
        this.boards.push(new Board({ port, test: this.test }));
    }
    
    this.nBoards = this.boards.length;
    return this.nBoards;
}

USBrelay.prototype.getStates = function() {
    return this.boards.map(b => b.getStates());
}

USBrelay.prototype.setStates = function(stateArray, callback) {
    if (!(Array.isArray(stateArray) && stateArray.length)) {
        return callback(new Error('stateArray must be a non-empty array'));
    }
    
    if (Array.isArray(stateArray[0]) && stateArray.length != this.nBoards) {
        return callback(new Error(`Invalid stateArray length - stateArray must contain as many arrays as there are initialized boards (${this.nBoards} in this case)`));
    }
    else {
        if (stateArray.length != 16 * this.nBoards) {
            return callback(new Error(`Invalid stateArray length - stateArray must describe the state of each relay of each initialized board (${16 * this.nBoards} relays in this case)`));
        }
        
        stateArray = this.boards.map((_, i) => stateArray.slice(16 * i, 16 * (i + 1)));
    }
    
    var toCheck = stateArray.filter(arr => arr.length).length;
    if (!toCheck) return callback(new Error('No states specified'));
    
    var nErrors = [],
        nSuccess = [],
        tried = 0;
    stateArray.forEach((arr, i) => {
        if (arr.length) this.boards[i].setState(arr, (errors, success) => {
            tried++;
            if (errors) nErrors.push({ board: i, errors });
            if (success && success.length) nSuccess.push({ board: i, success });
            
            if (tried == toCheck) callback(nErrors, nSuccess);
        });
    });
}

USBrelay.prototype.toggleOne = function(relay, command, callback) {
    if (!this.nBoards) return callback(new Error('No boards have been initialized'));
    
    if (relay < 1 || relay > this.nBoards * 16) {
        return callback(new Error(`Invalid relay: ${relay}`));
    }
    
    this.boards[ Math.ceil(relay / 16) - 1 ].toggleOne((relay - 1) % 16 + 1, command, callback);
}

USBrelay.prototype.toggle = function(toToggle, command, callback) {
    if (!(Array.isArray(toToggle) && toToggle.length)) {
        return callback(new Error('Function toggle requires an array of relay numbers'));
    }
    
    if (Array.isArray(toToggle[0]) && toToggle.length != this.nBoards) {
        return callback(new Error(`Invalid stateArray length - stateArray must contain as many arrays as there are initialized boards (${this.nBoards} in this case)`));
    }
    else {
        // toToggle = this.boards.map((_, i) => toToggle.filter(t => t > 16 * i && t <= 16 * (i + 1)).map(t => (t - 1) % 16 + 1));
        var temp = this.boards.map(_ => []);
        toToggle.forEach(t => temp[ Math.ceil(t / 16) - 1 ].push((t - 1) % 16 + 1));
        toToggle = temp;
    }
    
    var toCheck = toToggle.filter(arr => arr.length).length;
    if (!toCheck) return callback(new Error('No relays specified'));
    
    var nErrors = [],
        nSuccess = [],
        tried = 0;
    toToggle.forEach((arr, i) => {
        if (arr.length) this.boards[i].toggle(arr, command, (errors, success) => {
            tried++;
            if (errors) nErrors.push({ board: i, errors });
            if (success && success.length) nSuccess.push({ board: i, success });
            
            if (tried == toCheck) callback(nErrors, nSuccess);
        });
    });
}

USBrelay.prototype.resetAll = function(callback) {
    if (!this.nBoards) return callback(new Error('No boards have been initialized'));
    
    var success = [], 
        errors = [], 
        tried = 0;
    this.boards.forEach((b, i) => b.reset((error) => {
        tried++
        if (err) errors.push({ board: i, error });
        else success.push(i);
        
        if (tried == this.nBoards) callback(errors, success);
    }));
}