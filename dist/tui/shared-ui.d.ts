import type { RGBA } from "@opentui/core";
import type { Level } from "../core/level.js";
export interface LevelOption {
    title: string;
    value: Level;
    description: string;
}
export declare const LEVEL_OPTIONS: LevelOption[];
export interface StatusBarProps {
    level: Level;
    color: RGBA;
}
export declare function StatusBar(props: StatusBarProps): any;
export interface HomeHintProps {
    level: Level;
    color: RGBA;
}
export declare function HomeHint(props: HomeHintProps): any;
