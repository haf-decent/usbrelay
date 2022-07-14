const assert = require("assert");
const { RelayGroup, RelayBoard, RelayState } = require("../dist/index.js");

const boards = [
	{ port: "/dev/usbRelay1", name: "foo" },
	{ port: "/dev/usbRelay2", name: "bar" },
	{ port: "/dev/usbRelay3", name: "baz" }
];
const group = new RelayGroup({
	test: true,
	boards
});

const board1 = new RelayBoard({
	test: true,
	...boards[0]
});

describe("Testing usbrelay...", function() {
	describe("Utility tests", function() {
		it("Displays available serialports", async function() {
			await RelayGroup.listPorts();
			assert(true);
		});
	});

	describe("Single board test", function() {
		afterEach(async function() {
			await group.reset();
		});

		it("Is the correct state after toggling relay 10", async function() {
			const state = await board1.toggleOne(10, RelayState.OPEN);
			assert.equal(state.join(""), "0000000001000000");
		});

		it("Is the correct state after toggling every other relay to OPEN", async function() {
			const { errors, state } = await board1.toggle([ 2, 4, 6, 8, 10, 12, 14, 16 ], RelayState.OPEN);
			assert.equal(errors.length, 0);
			assert.equal(state.join(""), "0101010101010101");
		});

		it("Is the correct state after setState every other relay to OPEN", async function() {
			const { errors, state } = await board1.setState([
				0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1
			]);
			assert.equal(errors.length, 0);
			assert.equal(state.join(""), "0101010101010101");
		});
	});

	describe("Group tests", function() {
		afterEach(async function() {
			await group.reset();
		});

		it("Is the correct state after using a flat state array to toggle the first and last relays of each board", async function() {
			const { errors, states } = await group.toggle([ 1, 16, 17, 32, 33, 48 ], RelayState.OPEN);
			assert.equal(errors.length, 0);
			assert.equal(
				states.map(state => state.join("")).join(""),
				"100000000000000110000000000000011000000000000001"
			);
		});

		it("Is the correct state after using an array of arrays to toggle the first and last relays of each board", async function() {
			const { errors, states } = await group.toggle([
				[ 1, 16 ],
				[ 1, 16 ],
				[ 1, 16 ]
			], RelayState.OPEN);
			assert.equal(errors.length, 0);
			assert.equal(
				states.map(state => state.join("")).join(""),
				"100000000000000110000000000000011000000000000001"
			);
		});

		it("Is the correct state after using setStates with a flat array to toggle the first and last relays of each board", async function() {
			const { errors, states } = await group.setStates([
				1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
				1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
				1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1
			]);
			assert.equal(errors.length, 0);
			assert.equal(
				states.map(state => state.join("")).join(""),
				"100000000000000110000000000000011000000000000001"
			);
		});

		it("Is the correct state after using setStates with a nested array to toggle the first and last relays of each board", async function() {
			const { errors, states } = await group.setStates([
				[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
				[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
				[ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ]
			]);
			assert.equal(errors.length, 0);
			assert.equal(
				states.map(state => state.join("")).join(""),
				"100000000000000110000000000000011000000000000001"
			);
		});

		it("Is the correct state after resetting to OPEN state", async function() {
			const states = await group.reset(RelayState.OPEN);
			assert.equal(
				states.map(state => state.join("")).join(""),
				"111111111111111111111111111111111111111111111111"
			);
		});
	});
});