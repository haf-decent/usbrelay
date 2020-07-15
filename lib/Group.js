'use strict';

const { list } = require('serialport');
var Board = require('./Board.js');

module.exports = Group;

function Group({ test = false, ports = [] } = {}) {
    this.boards = [];
    this.ports = [];
    this.nBoards = 0;
    this.test = test;
    
    this.assignBoards(ports);
}

Group.prototype.listPorts = function() {
    return new Promise((resolve, reject) => {
        list((error, ports) => {
            if (error) return reject(error);
            return resolve(ports);
        });
    });
}

Group.prototype.findBoards = function() {
    return this.listPorts().then(ports => ports.filter(port => port.vendorId == '1a86' && port.productId == '7523'));
}

Group.prototype.assignBoards = function(ports) {
    for (let p of ports) {
        p.test = this.test;
        this.ports.push(p.port);
        this.boards.push(new Board(p));
    }
    
    this.nBoards = this.boards.length;
    return this.nBoards;
}

Group.prototype.getStates = function() {
    return this.boards.map(b => b.getState());
}

Group.prototype.setStates = function(stateArray) {
    if (!this.nBoards) return new Promise((resolve, reject) => reject(new Error(`No boards have been initialized`)));
    
    if (!(Array.isArray(stateArray) && stateArray.length)) {
        return new Promise((resolve, reject) => reject(new Error('stateArray must be a non-empty array')));
    }
    if (stateArray.length == 16 * this.nBoards) {
        stateArray = this.boards.map((_, i) => stateArray.slice(16 * i, 16 * (i + 1)));
    }
    else if (stateArray.length != this.nBoards) {
        return new Promise((resolve, reject) => reject(new Error(`stateArray must have as many arrays as there are boards (${this.nBoards})`)));
    }
    
    return Promise.all(this.boards.map((board, i) => board.setState(stateArray[i])))
        .then(results => {
            const errors = [], states = [];
            results.forEach(result => {
                errors.push(result.errors);
                states.push(result.state);
            });
            return { errors, states }
        });
}

Group.prototype.toggleOne = function(relay, command) {
    if (!this.nBoards) return new Promise((resolve, reject) => reject(new Error(`No boards have been initialized`)));
    
    return this.boards[ Math.ceil(relay / 16) - 1 ].toggleOne((relay - 1) % 16 + 1, command);
}

Group.prototype.toggle = function(toToggle, command) {
    if (!this.nBoards) return new Promise((resolve, reject) => reject(new Error(`No boards have been initialized`)));

    if (!(Array.isArray(toToggle) && toToggle.length)) {
        return new Promise((resolve, reject) => reject(new Error('toToggle must be an array of relay numbers')));
    }
    if (Array.isArray(toToggle[0])) {
        if (toToggle.length != this.nBoards) {
            return new Promise((resolve, reject) => reject(new Error(`toToggle array of arrays must have as many arrays as boards initialized (${this.nBoards})`)));
        }
    }
    else {
        var temp = this.boards.map(_ => []);
        toToggle.forEach(relay => temp[ Math.ceil(relay / 16) - 1 ].push((relay - 1) % 16 + 1));
        toToggle = temp;
    }

    return Promise.all(this.boards.map((board, i) => toToggle[i].length ? board.toggle(toToggle[i], command): new Promise(resolve => resolve({ errors: [], state: board.state }))))
        .then(results => {
            const errors = [], states = [];
            results.forEach(result => {
                errors.push(result.errors);
                states.push(result.state);
            });
            return { errors, states }
        });
}

Group.prototype.reset = function() {
    if (!this.nBoards) return new Promise((resolve, reject) => reject(new Error(`No boards have been initialized`)));
    
    return Promise.all(this.boards.map(board => board.reset()));
}