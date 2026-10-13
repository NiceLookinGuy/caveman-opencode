export const LEVELS = ["off", "lite", "full", "ultra", "wenyan"] as const;

export type Level = (typeof LEVELS)[number];

export const DEFAULT_LEVEL: Level = "full";

export function isLevel(value: unknown): value is Level {
  return typeof value === "string" && (LEVELS as readonly string[]).includes(value);
}

export function clampLevel(value: unknown): Level {
  return isLevel(value) ? value : DEFAULT_LEVEL;
}

export function parseLevelArg(raw: unknown): Level | undefined {
  if (typeof raw !== "string") return undefined;
  const token = raw.trim().toLowerCase();
  return isLevel(token) ? token : undefined;
}
