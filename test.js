'use strict';

const { USBrelay, Board } = require('./index.js');

var ports = [
    { port: '/dev/usbRelay1', name: 'foo' },
    { port: '/dev/usbRelay2', name: 'bar' },
    { port: '/dev/usbRelay3', name: 'baz' }
];
var group = new USBrelay({
    test: true,
    ports: ports
});

var board1 = new Board({
    test: true,
    port: ports[0]
});

// toggleOne and reset
// board1.toggleOne(10, 'on')
//     .then(state => {
//         console.log(`toggled state:\n${state}`);

//         return board1.reset();
//     })
//     .then(state => console.log(`reset state:\n${state}`))
//     .catch(err => console.log(err));

// async await and toggle with single array and reset
(async function() {
    let { errors, states } = await group.toggle([ 1, 5, 10, 11, 19, 26, 28, 33, 47 ], 'on');
    if (errors.find(arr => arr.length)) throw new Error(errors);

    console.log(`Toggled states: ${states.map(state => '\n' + state)}`);

    states = await group.reset();
    console.log(`Reset states: ${states.map(state => '\n' + state)}`);
})().catch(err => console.log(err));

// toggle with array of arrays
// group.toggle([[ 1, 5, 10, 11 ], [ 3, 10, 12 ], [ 1, 15 ]], 'on')
//     .then(({ errors, states }) => {
//         if (errors.find(arr => arr.length)) throw new Error(`Error(s) during toggle: ${errors}`);

//         console.log(states);
//     })
//     .catch(err => console.log(err));

// setStates with single array (outer) and array of arrays (inner)
// const stateArray = Array.from({ length: 48 }, (_, i) => i % 2) // every other turned 'on'
// group.setStates(stateArray)
//     .then(({ errors, states}) => {
//         if (errors.find(arr => arr.length)) throw new Error(`Error(s) during setStates: ${errors}`);

//         console.log(`EveryOther states: ${states.map(state => '\n' + state)}`);
//         // flip the states of the first board (states is array of arrays)
//         states[0] = states[0].map(val => 1 - val);
//         return group.setStates(states);
//     })
//     .then(({ errors, states }) => {
//         if (errors.find(arr => arr.length)) throw new Error(`Error(s) during setStates: ${errors}`);

//         console.log(`Flipped states: ${states.map(state => '\n' + state)}`);
//     })
//     .catch(err => console.log(err));