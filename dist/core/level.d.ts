export declare const LEVELS: readonly ["off", "lite", "full", "ultra", "wenyan"];
export type Level = (typeof LEVELS)[number];
export declare const DEFAULT_LEVEL: Level;
export declare function isLevel(value: unknown): value is Level;
export declare function clampLevel(value: unknown): Level;
export declare function parseLevelArg(raw: unknown): Level | undefined;
