import { type Level } from "./level.js";
export interface CavemanState {
    version: 1;
    level: Level;
    updatedAt: string;
    updatedBy: "v1" | "v2";
}
export declare function stateFilePath(): string;
export declare function readLevel(): Level;
export declare function writeLevel(level: Level, updatedBy: "v1" | "v2"): void;
export declare function watchLevel(callback: (level: Level) => void): () => void;
