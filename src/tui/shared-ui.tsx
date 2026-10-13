import type { RGBA } from "@opentui/core";

import type { Level } from "../core/level.js";

export interface LevelOption {
  title: string;
  value: Level;
  description: string;
}

export const LEVEL_OPTIONS: LevelOption[] = [
  {
    title: "off",
    value: "off",
    description: "Normal prose. No caveman injection.",
  },
  {
    title: "lite",
    value: "lite",
    description: "Terse. No filler, pleasantries, or hedging. Full sentences kept.",
  },
  {
    title: "full",
    value: "full",
    description: "Caveman terse. Drop articles, fragments OK, short synonyms.",
  },
  {
    title: "ultra",
    value: "ultra",
    description: "Maximum compression. Abbreviations, arrows, bare fragments.",
  },
  {
    title: "wenyan",
    value: "wenyan",
    description: "Classical Chinese register (文言文). Maximum terseness.",
  },
];

export interface StatusBarProps {
  level: Level;
  color: RGBA;
}

export function StatusBar(props: StatusBarProps) {
  if (props.level === "off") return null;

  return (
    <box width="100%" flexDirection="row" justifyContent="flex-end">
      <text fg={props.color}>{`caveman ${props.level}`}</text>
    </box>
  );
}

export interface HomeHintProps {
  level: Level;
  color: RGBA;
}

export function HomeHint(props: HomeHintProps) {
  return <text fg={props.color}>{`caveman: ${props.level} — /caveman`}</text>;
}
