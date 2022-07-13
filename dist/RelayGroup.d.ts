import { RelayBoard, BoardProps, StateArray, RelayState } from "./RelayBoard";
interface GroupProps {
    boards?: BoardProps[];
    test?: boolean;
}
export declare class RelayGroup {
    boards: RelayBoard[];
    test: boolean;
    static listPorts(): Promise<unknown>;
    constructor({ boards, test }: GroupProps);
    _validateRelay(relay: number): {
        boardIndex: number;
        relayIndex: number;
    };
    assignBoards(boards: any[]): number;
    findBoards(): Promise<any>;
    getStates(): StateArray[];
    setStates(states: StateArray[]): Promise<{
        errors: string[][];
        states: StateArray[];
    }>;
    toggleOne(relay: number, command: RelayState): Promise<StateArray>;
    toggle(relays: number[] | number[][], command: RelayState): Promise<{
        errors: string[][];
        states: StateArray[];
    }>;
    reset(command: RelayState): Promise<StateArray[]>;
}
export {};
