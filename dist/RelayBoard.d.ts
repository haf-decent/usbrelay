/// <reference types="node" />
export declare enum RelayState {
    CLOSED = 0,
    OPEN = 1
}
export interface BoardProps {
    port: string;
    name?: string;
    test?: boolean;
}
export declare type StateArray = [
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState,
    RelayState
];
export declare class RelayBoard {
    _port: any;
    port: string;
    name: string;
    test: boolean;
    state: StateArray;
    constructor({ port, name, test }: BoardProps);
    _write(buffer: Buffer): Promise<unknown>;
    _validateRelay(relay: number): void;
    getState(): StateArray;
    setState(state: StateArray): Promise<{
        errors: string[];
        state: StateArray;
    }>;
    toggleOne(relay: number, command: RelayState): Promise<StateArray>;
    toggle(relays: number[], command: RelayState): Promise<{
        errors: string[];
        state: StateArray;
    }>;
    reset(command?: RelayState): Promise<StateArray>;
}
