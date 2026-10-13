import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  unwatchFile,
  watchFile,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

import { DEFAULT_LEVEL, clampLevel, isLevel, type Level } from "./level.js";

export interface CavemanState {
  version: 1;
  level: Level;
  updatedAt: string;
  updatedBy: "v1" | "v2";
}

export function stateFilePath(): string {
  const override = process.env.CAVEMAN_STATE_FILE;
  if (override) return path.resolve(override);

  const xdgStateHome = process.env.XDG_STATE_HOME;
  const base = xdgStateHome ? path.resolve(xdgStateHome) : path.join(homedir(), ".local", "state");
  return path.join(base, "opencode", "caveman-simplified.json");
}

interface CacheEntry {
  path: string;
  mtimeMs: number;
  level: Level;
}

let cache: CacheEntry | undefined;

export function readLevel(): Level {
  const file = stateFilePath();

  let mtimeMs = -1;
  try {
    mtimeMs = statSync(file).mtimeMs;
  } catch {
    cache = { path: file, mtimeMs, level: DEFAULT_LEVEL };
    return DEFAULT_LEVEL;
  }

  if (cache && cache.path === file && cache.mtimeMs === mtimeMs) return cache.level;

  let level: Level = DEFAULT_LEVEL;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as { level?: unknown } | null;
    level = clampLevel(parsed?.level);
  } catch {
    level = DEFAULT_LEVEL;
  }

  cache = { path: file, mtimeMs, level };
  return level;
}

export function writeLevel(level: Level, updatedBy: "v1" | "v2"): void {
  const file = stateFilePath();
  const safeLevel: Level = isLevel(level) ? level : DEFAULT_LEVEL;

  mkdirSync(path.dirname(file), { recursive: true });

  const payload: CavemanState = {
    version: 1,
    level: safeLevel,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;

  writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  try {
    renameSync(tmp, file);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (process.platform === "win32" && (code === "EEXIST" || code === "EPERM")) {
      try {
        unlinkSync(file);
      } catch {
        // target may not exist; rename below still decides
      }
      renameSync(tmp, file);
    } else {
      try {
        unlinkSync(tmp);
      } catch {
        // best-effort cleanup of the temp file
      }
      throw error;
    }
  }

  cache = undefined;
}

export function watchLevel(callback: (level: Level) => void): () => void {
  const file = stateFilePath();
  const listener = (): void => {
    callback(readLevel());
  };

  watchFile(file, { interval: 500 }, listener);
  callback(readLevel());

  return () => {
    unwatchFile(file, listener);
  };
}
