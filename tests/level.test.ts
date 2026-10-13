import { describe, expect, test } from "bun:test";

import { DEFAULT_LEVEL, LEVELS, clampLevel, isLevel, parseLevelArg } from "../src/core/level.js";

describe("levels", () => {
  test("LEVELS is the canonical ordered set", () => {
    expect([...LEVELS]).toEqual(["off", "lite", "full", "ultra", "wenyan"]);
    expect(DEFAULT_LEVEL).toBe("full");
  });

  test("isLevel accepts only exact level tokens", () => {
    for (const level of LEVELS) expect(isLevel(level)).toBe(true);

    const rejects: unknown[] = ["", "bogus", "FULL", "wenyan-lite", " full", 42, null, undefined, {}, []];
    for (const value of rejects) expect(isLevel(value)).toBe(false);
  });

  test("clampLevel falls back to full for garbage", () => {
    for (const level of LEVELS) expect(clampLevel(level)).toBe(level);
    expect(clampLevel("garbage")).toBe("full");
    expect(clampLevel(undefined)).toBe("full");
    expect(clampLevel(7)).toBe("full");
    expect(clampLevel({ level: "ultra" })).toBe("full");
  });

  test("parseLevelArg trims, lowercases, rejects non-exact tokens", () => {
    expect(parseLevelArg("  FULL ")).toBe("full");
    expect(parseLevelArg("WenYan")).toBe("wenyan");
    expect(parseLevelArg("off")).toBe("off");
    expect(parseLevelArg("lite")).toBe("lite");
    expect(parseLevelArg("ultra")).toBe("ultra");
    expect(parseLevelArg("wenyan-lite")).toBeUndefined();
    expect(parseLevelArg("full!")).toBeUndefined();
    expect(parseLevelArg("")).toBeUndefined();
    expect(parseLevelArg(undefined)).toBeUndefined();
    expect(parseLevelArg(null)).toBeUndefined();
    expect(parseLevelArg(3)).toBeUndefined();
  });
});
