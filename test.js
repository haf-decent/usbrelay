'use strict';

const {USBrelay, Board} = require('./index.js');

var ports = ['/dev/test1', '/dev/test2', '/dev/test3'];
var group = new USBrelay({
    test: true,
    ports: ports
});

//group.toggleOne(18, "on", (err) => {
//    if (err) console.log(err);
//    else console.log(group.getStates());
//});

group.toggle([1,5,10,11,19,26,28,33,47], "on", (errors, success) => {
    if (errors) console.log(errors);
    else console.log(group.getStates());
});

//group.toggle([[1,5,10,11],[3,10,12],[1,15]], "on", (errors, success) => {
//    if (errors) console.log(errors);
//    else console.log(group.getStates());
//});

//group.setStates([[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[],[]], (errors, success) => {
//    if (errors) return console.log(errors);
//    console.log(group.getStates());
//});

//var states = Array.from({length: 48}, (el, i) => i%2);
//group.setStates(states, (errors, success) => {
//    if (errors) return console.log(errors);
//    console.log(group.getStates());
//    group.resetAll((errors, success) => {
//        if (errors) return console.log(errors);
//        console.log(group.getStates());
//    });
//});