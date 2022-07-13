const SerialPort = require("serialport");

import * as Commands from "./commands";

export enum RelayState {
	CLOSED = 0,
	OPEN = 1
}

export interface BoardProps {
	port: string,
	name?: string,
	test?: boolean
}

export type StateArray = [
	RelayState, RelayState, RelayState, RelayState,
	RelayState, RelayState, RelayState, RelayState,
	RelayState, RelayState, RelayState, RelayState,
	RelayState, RelayState, RelayState, RelayState
];

type ValueAllSettled<T> = {
	status: "fulfilled" | "rejected",
	value?: T,
	reason?: string
}

function testWrite(buffer: Buffer, cb: () => void) {
	console.log(`TEST MODE: Writing buffer: ${buffer}`);
	cb();
}

export class RelayBoard {
	_port: any;
	port: string;
	name: string;
	test: boolean;
	state: StateArray;

	constructor({ port, name = "", test = false }: BoardProps) {
		this._port = test
			? { write: testWrite }
			: new SerialPort(port, (err: Error) => { throw err });
		
		this.port = port;
		this.name = name;
		this.test = test;

		this.state = new Array(16).fill(RelayState.CLOSED) as StateArray;
	}

	_write(buffer: Buffer) {
		return new Promise((resolve, reject) => {
			this._port.write(buffer, (err: Error) => {
				if (err) return reject(err);
				return resolve(null);
			});
		});
	}

	_validateRelay(relay: number) {
		if (relay < 1 || relay > 16) throw new Error(`Invalid relay number: ${relay}`);
		
		return;
	}

	getState() {
		return this.state;
	}

	async setState(state: StateArray) {
		const results = await Promise.allSettled(state.map((s, i) => this._write(Commands.toggle[i][s]))) as ValueAllSettled<null>[];
		const errors: string[] = [];
		results.forEach(({ status, reason }, i) => {
			if (status === "fulfilled") this.state[i] = state[i];
			else errors.push(reason as string);
		});
		return {
			errors,
			state: this.getState()
		}
	}

	async toggleOne(relay: number, command: RelayState) {
		this._validateRelay(relay);

		await this._write(Commands.toggle[ relay - 1 ][ command ]);
		this.state[ relay - 1 ] = command;
		return this.getState();
	}

	async toggle(relays: number[], command: RelayState) {
		relays.forEach(relay => this._validateRelay(relay));

		const results = await Promise.allSettled(relays.map(r => this._write(Commands.toggle[r][ command ]))) as ValueAllSettled<null>[];
		const errors: string[] = [];
		results.forEach(({ status, reason }, i) => {
			if (status === "fulfilled") this.state[ relays[i] ] = command;
			else errors.push(reason as string);
		});
		return {
			errors,
			state: this.getState()
		}
	}

	async reset(command: RelayState) {
		const buffer = command === RelayState.CLOSED
			? Commands.resetOff
			: Commands.resetOn;
		await this._write(buffer);
		this.state = this.state.fill(command);

		return this.getState();
	}
}