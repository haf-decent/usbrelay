const { SerialPort } = require("serialport");

import { RelayBoard, BoardProps, StateArray, RelayState } from "./RelayBoard";

interface GroupProps {
	boards?: BoardProps[],
	test?: boolean
}

export class RelayGroup {
	boards: RelayBoard[];
	test: boolean;

	static listPorts() {
		return SerialPort.list();
	}

	constructor({ boards = [], test = false }: GroupProps) {
		this.boards = [];

		this.test = test;

		this.assignBoards(boards);
	}

	_validateRelay(relay: number) {
		if (relay < 1) throw new Error(`Invalid relay number. Relays are numbered from 1 to (# of boards) * 16.`);
		const boardIndex = Math.ceil(relay / 16) - 1;
		if (boardIndex >= this.boards.length) throw new Error(`Invalid relay number: ${relay}. There are not enough boards initialized.`);

		return {
			boardIndex,
			relayIndex: (relay - 1) % 16 + 1
		}
	}

	assignBoards(boards: any[]) {
		for (const board of boards) {
			if (this.boards.find(({ port }) => port === board.port)) {
				console.warn(`Board with port '${board.port}' has already been initialized.`);
				continue;
			}
			this.boards.push(new RelayBoard({ ...board, test: this.test }));
		}
		return this.boards.length;
	}

	async findBoards() {
		const ports = await RelayGroup.listPorts() as any;
		return ports.filter(({
			vendorId,
			productId
		}: {
			vendorId: string,
			productId: string
		}) => vendorId === "1a86" && productId === "7523");
	}

	getStates() {
		return this.boards.map(board => board.getState());
	}

	async setStates(states: StateArray[] | RelayState[]) {
		if (Array.isArray(states[0])) {
			if (states.length !== this.boards.length) throw new Error(`A stateArray for each initialized board must be provided (${this.boards.length} boards =/= ${states.length} states)`);
		}
		else {
			states = (states as RelayState[]).reduce((arr, state, i) => {
				arr[ Math.floor(i / 16) ].push(state);
				return arr;
			}, this.boards.map(_ => new Array()) as StateArray[]);
		}

		const results = await Promise.all(states.map((state, i) => this.boards[i].setState(state as StateArray)));
		return results.reduce((result, { errors, state }) => {
			result.errors = [ ...result.errors, ...errors ];
			result.states.push(state);
			return result;
		}, { errors: [] as string[], states: [] as StateArray[] });
	}

	async toggleOne(relay: number, command: RelayState) {
		const { boardIndex, relayIndex } = this._validateRelay(relay);

		return this.boards[ boardIndex ].toggleOne(relayIndex, command);
	}

	async toggle(relays: number[] | number[][], command: RelayState) {
		if (Array.isArray(relays[0])) {
			if (relays.length !== this.boards.length) throw new Error(`An array of relays for each initialized board must be provided (${this.boards.length} boards =/= ${relays.length} relay arrays). If no relays are to be toggled on a certain board, provide an empty array.`);
		}
		else {
			relays = (relays as number[]).reduce((arr, relay) => {
				const { boardIndex, relayIndex } = this._validateRelay(relay);
				arr[ boardIndex ].push(relayIndex);
				return arr;
			}, this.boards.map(_ => new Array()) as number[][]);
		}

		const results = await Promise.all(relays.map((relayArr, i) => this.boards[i].toggle(relayArr as number[], command)));
		return results.reduce((result, { errors, state }) => {
			result.errors = [ ...result.errors, ...errors ];
			result.states.push(state);
			return result;
		}, { errors: [] as string[], states: [] as StateArray[] });
	}

	async reset(command?: RelayState) {
		return Promise.all(this.boards.map(board => board.reset(command)));
	}
}