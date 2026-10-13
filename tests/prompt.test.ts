import { describe, expect, test } from "bun:test";

import { LEVELS } from "../src/core/level.js";
import { BEHAVIORS, CLARITY, buildSystemBlock } from "../src/core/prompt.js";

const ACTIVE = LEVELS.filter((level) => level !== "off");

describe("prompt", () => {
  test("off returns undefined", () => {
    expect(buildSystemBlock("off")).toBeUndefined();
  });

  test("every non-off level carries its marker, BEHAVIORS and CLARITY", () => {
    for (const level of ACTIVE) {
      const block = buildSystemBlock(level);
      expect(typeof block).toBe("string");
      expect(block).toContain(`[caveman:${level}]`);
      expect(block).toContain(BEHAVIORS);
      expect(block).toContain(CLARITY);
      expect(block!.length).toBeLessThan(4096);
    }
  });

  test("level blocks are distinct across levels", () => {
    const blocks = ACTIVE.map((level) => buildSystemBlock(level)!);
    expect(new Set(blocks).size).toBe(blocks.length);
  });

  test("each level names its own register", () => {
    expect(buildSystemBlock("lite")).toContain("Keep articles and full sentences");
    expect(buildSystemBlock("full")).toContain("Fragments OK");
    expect(buildSystemBlock("ultra")).toContain("Maximum compression");
    expect(buildSystemBlock("wenyan")).toContain("Classical Chinese");
  });

  test("whole prompt set stays compact", () => {
    const total = ACTIVE.reduce((sum, level) => sum + buildSystemBlock(level)!.length, 0);
    expect(total).toBeLessThan(4096);
  });
});
