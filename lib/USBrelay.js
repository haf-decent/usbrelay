'use strict';

const {list} = require('serialport');
var Board = require('./Board.js');

module.exports = USBrelay;

function USBrelay(options) {
    this.boards = [];
    this.ports = [];
    this.nBoards = 0;
    if (options.test) this.test = true;
    
    if (options.ports) this.assignBoards(options.ports);
}

USBrelay.prototype.listPorts = list;

USBrelay.prototype.findBoards = function(callback) {
    this.listPorts((err, result) => {
        if (err) return callback(err);
        callback(
            null, 
            result.filter(port => port.vendorId == "1a86" && port.productId == "7523")
        );
    });
}

USBrelay.prototype.assignBoards = function(ports) {
    if (!(Array.isArray(ports) && ports.length))
        throw new Error('Ports must be a non-empty array');
    
    for (var p of ports) {
        var options = {port: p};
        if (this.test) options.test = true;
        
        this.ports.push(p)
        this.boards.push(new Board(options));
    }
    
    this.nBoards = this.boards.length;
}

USBrelay.prototype.getState = function() {
    var states = Array.from({length: this.nBoards});
    this.boards.forEach((b, i) => states[i] = b.getState());
    return states;
}

USBrelay.prototype.toggleOne = function(relay, command, callback) {
    if (!this.nBoards) 
        return callback(new Error('No boards have been initialized'));
    
    if (relay < 1 || relay > this.nBoards*16) 
        return callback(new Error('Invalid relay: ' + relay));
    
    this.boards[Math.ceil(relay/16) - 1].toggleOne((relay-1)%16 + 1, command, callback);
}

USBrelay.prototype.toggle = function(toToggle, command, callback) {
    if (!this.nBoards) 
        return callback(new Error('No boards have been initialized'));
    
    if (!(Array.isArray(toToggle) && toToggle.length)) 
        return callback(new Error('Function toggle requires an array of relay numbers'));
    
    var invalid = toToggle.filter(t => t < 1 || t > this.nBoards*16);
    if (invalid.length) 
        return callback(new Error('Invalid relay(s): ' + invalid));
    
    var nToggle = Array.from({length: this.nBoards}, el => []);
    toToggle.forEach(t => nToggle[Math.ceil(t/16) - 1].push((t-1)%16 + 1));
    
    var toCheck = nToggle.filter(arr => arr.length).length;
    var nErrors = [],
        nSuccess = [],
        tried = 0;
    nToggle.forEach((arr, i) => {
        if (arr.length) this.boards[i].toggle(arr, command, (errors, success) => {
            tried++;
            if (errors) nErrors.push({board: i, errors: errors});
            if (success && success.length) nSuccess.push({board: i, success: success});
            
            if (tried == toCheck) nErrors.length ? callback(nErrors, nSuccess): callback(null, nSuccess);
        });
    });
}

USBrelay.prototype.resetAll = function(callback) {
    if (!this.nBoards) return callback(new Error('No boards have been initialized'));
    
    var success = [], 
        errors = [], 
        tried = 0;
    this.boards.forEach((b, i) => b.reset((err) => {
        tried++
        if (err) errors.push({board: i, "error": err});
        else success.push(i);
        
        if (tried == this.nBoards) errors.length ? callback(errors, success): callback(null, success);
    }));
}