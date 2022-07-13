const { list } = require("serialport");

import { RelayBoard, BoardProps, StateArray, RelayState } from "./RelayBoard";

interface GroupProps {
	boards?: BoardProps[],
	test?: boolean
}

export class RelayGroup {
	boards: RelayBoard[];
	test: boolean;

	static listPorts() {
		return new Promise((resolve, reject) => {
			list((error: Error, ports: any) => {
				if (error) return reject(error);
				return resolve(ports);
			});
		});
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

	async setStates(states: StateArray[]) {
		if (states.length !== this.boards.length) throw new Error(`A stateArray for each initialized board must be provided (${this.boards.length} boards =/= ${states.length} states)`);

		const results = await Promise.all(states.map((state, i) => this.boards[i].setState(state)));
		return results.reduce((result, { errors, state }) => {
			result.errors.push(errors);
			result.states.push(state);
			return result;
		}, { errors: [] as string[][], states: [] as StateArray[] });
	}

	async toggleOne(relay: number, command: RelayState) {
		const { boardIndex, relayIndex } = this._validateRelay(relay);

		return this.boards[ boardIndex ].toggleOne(relayIndex, command);
	}

	async toggle(relays: number[] | number[][], command: RelayState) {
		if (relays[0] && Array.isArray(relays[0]) && relays.length !== this.boards.length) throw new Error(`An array of relays for each initialized board must be provided (${this.boards.length} boards =/= ${relays.length} relay arrays). If no relays are to be toggled on a certain board, provide an empty array.`);
		else {
			relays = (relays as number[]).reduce((arr, relay) => {
				const { boardIndex, relayIndex } = this._validateRelay(relay);
				arr[ boardIndex ].push(relayIndex);
				return arr;
			}, this.boards.map(_ => ([])) as number[][]);
		}

		const results = await Promise.all(relays.map((relayArr, i) => this.boards[i].toggle(relayArr, command)));
		return results.reduce((result, { errors, state }) => {
			result.errors.push(errors);
			result.states.push(state);
			return result;
		}, { errors: [] as string[][], states: [] as StateArray[] });
	}

	async reset(command: RelayState) {
		return Promise.all(this.boards.map(board => board.reset(command)));
	}
}