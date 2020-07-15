'use strict';

const SerialPort = require('serialport');

const startCmd = '0x3A,0x46,0x45,0x30,0x35,0x30,0x30,0x30,';
const endCmd = ',0x0D,0x0A';
// const statusCmd = Buffer.from(('0x3A,0x46,0x45,0x30,0x31,0x30,0x30,0x32,0x30,0x30,0x30,0x30,0x30,0x46,0x46' + endCmd).split(','));
const resetCmd = Buffer.from(('0x3A,0x46,0x45,0x30,0x46,0x30,0x30,0x30,0x30,0x30,0x30,0x31,0x30,0x30,0x32,0x30,0x30,0x30,0x30,0x45,0x31' + endCmd).split(','));
const commands = [
    {on: '0x30,0x46,0x46,0x30,0x30,0x46,0x45', off: '0x30,0x30,0x30,0x30,0x30,0x46,0x44'},
    {on: '0x31,0x46,0x46,0x30,0x30,0x46,0x44', off: '0x31,0x30,0x30,0x30,0x30,0x46,0x43'},
    {on: '0x32,0x46,0x46,0x30,0x30,0x46,0x43', off: '0x32,0x30,0x30,0x30,0x30,0x46,0x42'},
    {on: '0x33,0x46,0x46,0x30,0x30,0x46,0x42', off: '0x33,0x30,0x30,0x30,0x30,0x46,0x41'},
    {on: '0x34,0x46,0x46,0x30,0x30,0x46,0x41', off: '0x34,0x30,0x30,0x30,0x30,0x46,0x39'},
    {on: '0x35,0x46,0x46,0x30,0x30,0x46,0x39', off: '0x35,0x30,0x30,0x30,0x30,0x46,0x38'},
    {on: '0x36,0x46,0x46,0x30,0x30,0x46,0x38', off: '0x36,0x30,0x30,0x30,0x30,0x46,0x37'},
    {on: '0x37,0x46,0x46,0x30,0x30,0x46,0x37', off: '0x37,0x30,0x30,0x30,0x30,0x46,0x36'},
    {on: '0x38,0x46,0x46,0x30,0x30,0x46,0x36', off: '0x38,0x30,0x30,0x30,0x30,0x46,0x35'},
    {on: '0x39,0x46,0x46,0x30,0x30,0x46,0x35', off: '0x39,0x30,0x30,0x30,0x30,0x46,0x34'},
    {on: '0x41,0x46,0x46,0x30,0x30,0x46,0x34', off: '0x41,0x30,0x30,0x30,0x30,0x46,0x33'},
    {on: '0x42,0x46,0x46,0x30,0x30,0x46,0x33', off: '0x42,0x30,0x30,0x30,0x30,0x46,0x32'},
    {on: '0x43,0x46,0x46,0x30,0x30,0x46,0x32', off: '0x43,0x30,0x30,0x30,0x30,0x46,0x31'},
    {on: '0x44,0x46,0x46,0x30,0x30,0x46,0x31', off: '0x44,0x30,0x30,0x30,0x30,0x46,0x30'},
    {on: '0x45,0x46,0x46,0x30,0x30,0x46,0x30', off: '0x45,0x30,0x30,0x30,0x30,0x46,0x46'},
    {on: '0x46,0x46,0x46,0x30,0x30,0x46,0x46', off: '0x46,0x30,0x30,0x30,0x30,0x46,0x45'}
].map(r => ({
    on: Buffer.from((startCmd + r.on + endCmd).split(',')), 
    off: Buffer.from((startCmd + r.off + endCmd).split(','))
}));

const validCmds = {
    on: [ 'on', '1', 1, true ],
    off: [ 'off', '0', 0, false ]
};

function testWrite(buffer, callback) {
    if (!buffer) return callback(new Error(`Invalid buffer: ${buffer}`));
    callback(null);
}

module.exports = Board;

function Board({ port = null, test = false, name = null } = {}) {
    if (!port) throw new Error('No port specified');
    this._port = test ? { write: testWrite }: new SerialPort(port);
    
//    this.getState()
    this.state = Array.from({ length: 16 }, _ => 0);
    this.name = name;
}

Board.prototype.getState = function() {
    // return new Promise((resolve, reject) => {
    //     this._port.write(statusCmd, (error, result) => {
    //         if (error) return reject(error);
    //         this.state = result;
    //     });
    // });
    
    return this.state;
}

Board.prototype.setState = function(stateArray) {
    return new Promise((resolve, reject) => {
        if (!(Array.isArray(stateArray) && stateArray.length == 16)) {
            return reject(new Error(`State array must be an array with 16 entries`));
        }
        
        var invalid = [];
        stateArray = stateArray.map(s => {
            if (validCmds.on.includes(s)) return 'on';
            if (validCmds.off.includes(s)) return 'off';
            invalid.push(s);
            return null;
        });
        if (invalid.length) return reject(new Error(`Invalid state(s) in state array: ${invalid}`));

        var errors = [], 
            tried = 0;
        stateArray.forEach((s, i) => {
            this._port.write(commands[i][s], error => {
                if (error) errors.push({ relay: i + 1, error });
                else this.state[i] = s == 'on' ? 1: 0;

                if (++tried == stateArray.length) return resolve({ errors, state: this.state });
            });
        });
    });
}

Board.prototype.toggleOne = function(relay, command) {
    return new Promise((resolve, reject) => {
        if (relay < 1 || relay > 16) return reject(new Error(`Invalid relay: ${relay}`));

        if (validCmds.on.includes(command)) command = 'on';
        else if (validCmds.off.includes(command)) command = 'off';
        else return reject(new Error(`Invalid command: ${command}`));

        this._port.write(commands[ relay - 1 ][ command ], error => {
            if (error) return reject(error);
            this.state[ relay - 1 ] = command == 'on' ? 1: 0;
            return resolve(this.state);
        });
    });
}

Board.prototype.toggle = function(toToggle, command) {
    return new Promise((resolve, reject) => {
        if (!(Array.isArray(toToggle) && toToggle.length)) {
            return reject(new Error('Function toggle requires an array of relay numbers'));
        }

        var invalid = toToggle.filter(t => t < 1 && t > 16);
        if (invalid.length) return reject(new Error(`Invalid relays: ${invalid}`));
        
        if (validCmds.on.includes(command)) command = 'on';
        else if (validCmds.off.includes(command)) command = 'off';
        else return reject(new Error(`Invalid command: ${command}`));
        
        var errors = [], 
            tried = 0;
        toToggle.forEach(relay => {
            this._port.write(commands[ relay - 1 ][ command ], error => {
                if (error) errors.push({ relay: relay, error });
                else this.state[ relay - 1 ] = command == "on" ? 1: 0;
                
                if (++tried == toToggle.length) return resolve({ errors, state: this.state });
            });
        });
    });
}

Board.prototype.reset = function() {
    return new Promise((resolve, reject) => {
        this._port.write(resetCmd, error => {
            if (error) return reject(error);
            this.state = this.state.map(_ => 0);
            return resolve(this.state);
        });
    });
}