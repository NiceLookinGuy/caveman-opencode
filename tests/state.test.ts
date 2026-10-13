import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { readLevel, stateFilePath, watchLevel, writeLevel } from "../src/core/state.js";

let dir: string;
let file: string;
let previousOverride: string | undefined;

beforeEach(() => {
  previousOverride = process.env.CAVEMAN_STATE_FILE;
  dir = mkdtempSync(path.join(tmpdir(), "caveman-state-"));
  file = path.join(dir, "nested", "caveman-simplified.json");
  process.env.CAVEMAN_STATE_FILE = file;
});

afterEach(() => {
  if (previousOverride === undefined) delete process.env.CAVEMAN_STATE_FILE;
  else process.env.CAVEMAN_STATE_FILE = previousOverride;
  rmSync(dir, { recursive: true, force: true });
});

describe("state", () => {
  test("missing file reads as default and never writes", () => {
    expect(readLevel()).toBe("full");
    expect(readdirSync(dir)).toEqual([]);
  });

  test("stateFilePath honors CAVEMAN_STATE_FILE", () => {
    expect(stateFilePath()).toBe(path.resolve(file));
  });

  test("write then read roundtrips, including the schema", () => {
    writeLevel("ultra", "v1");
    expect(readLevel()).toBe("ultra");

    const parsed = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    expect(parsed.version).toBe(1);
    expect(parsed.level).toBe("ultra");
    expect(parsed.updatedBy).toBe("v1");
    expect(new Date(parsed.updatedAt as string).toString()).not.toBe("Invalid Date");

    writeLevel("off", "v2");
    expect(readLevel()).toBe("off");
  });

  test("corrupt JSON reads as default without throwing", () => {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, "{ not json", "utf8");
    expect(readLevel()).toBe("full");
    expect(readLevel()).toBe("full");
  });

  test("unknown level reads as default", () => {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify({ version: 1, level: "wenyan-lite" }), "utf8");
    expect(readLevel()).toBe("full");
  });

  test("write leaves no temp files behind", () => {
    writeLevel("lite", "v2");
    expect(readdirSync(path.dirname(file))).toEqual([path.basename(file)]);
  });

  test("watchLevel fires immediately and after a write", async () => {
    const seen: string[] = [];
    const unwatch = watchLevel((level) => seen.push(level));
    expect(seen).toEqual(["full"]);

    const observed = new Promise<void>((resolve) => {
      const started = Date.now();
      const timer = setInterval(() => {
        if (seen.includes("lite") || Date.now() - started > 5000) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });

    writeLevel("lite", "v2");
    await observed;
    unwatch();

    expect(seen).toContain("lite");
  });
});
