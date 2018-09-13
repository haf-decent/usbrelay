'use strict';

const {USBrelay, Board} = require('./index.js');

//var Board = require('./Board.js');
//
//var board1 = new Board({
//    test: true,
//    port: '/dev/test'
//});
//
//board1.toggle([12, 14], "on", (errors, success) => {
//    console.log(success.length + ' relays successfully toggled on');
//    if (success.length) console.log(success);
//    if (errors) console.log(errors);
//    console.log(board1.getState());
//    board1.setState([0,1,1,1,0,1,0,1,1,1,0,0,1,0,1,1], (errors, success) => {
//        if (errors) console.log(errors);
//        else {
//            console.log(board1.getState());
//            board1.reset((err) => {
//                if (err) console.log(err);
//                else console.log(board1.getState());
//            });
//        }
//    });
//});

var USBrelay = require('./USBrelay.js');

var ports = ['/dev/test1', '/dev/test2', '/dev/test3'];
var group = new USBrelay({
    test: true,
    ports: ports
});

//group.toggleOne(18, "on", (err) => {
//    if (err) console.log(err);
//    else console.log(group.getState());
//});

group.toggle([1,5,10,11,19,26,28,33,47], (errors, success) => {
    if (errors) console.log(errors);
    else console.log(group.getState());
})