import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";

const distEntry = new URL("../dist/index.js", import.meta.url);
const distTuiEntry = new URL("../dist/tui.js", import.meta.url);

interface BuiltPlugin {
  id?: unknown;
  server?: (input: unknown, options?: unknown) => Promise<Record<string, unknown>>;
  setup?: unknown;
}

interface BuiltTui {
  id?: unknown;
  tui?: unknown;
  setup?: unknown;
}

describe("dist exports", () => {
  test("dist bundle exists (build must run before tests)", () => {
    expect(existsSync(distEntry)).toBe(true);
  });

  test("default export is the dual-host plugin object", async () => {
    const mod = (await import(distEntry.href)) as { default?: BuiltPlugin };

    expect(mod.default).toBeDefined();
    expect(mod.default?.id).toBe("opencode-caveman-simplified");
    expect(typeof mod.default?.server).toBe("function");
    expect(typeof mod.default?.setup).toBe("function");
  });

  test("entry exports nothing but default (host treats named exports as plugins)", async () => {
    const mod = (await import(distEntry.href)) as Record<string, unknown>;
    expect(Object.keys(mod)).toEqual(["default"]);
  });

  test("default export owns exactly id, server, setup", async () => {
    const mod = (await import(distEntry.href)) as { default?: BuiltPlugin };
    expect(Object.keys(mod.default ?? {}).sort()).toEqual(["id", "server", "setup"]);
  });

  test("v1 server returns the system transform hook", async () => {
    const mod = (await import(distEntry.href)) as { default: BuiltPlugin };
    const hooks = await mod.default.server!(undefined);
    expect(typeof hooks["experimental.chat.system.transform"]).toBe("function");
  });
});

describe("dist tui exports", () => {
  test("dist tui bundle exists (build must run before tests)", () => {
    expect(existsSync(distTuiEntry)).toBe(true);
  });

  test("default export is the dual-host tui module", async () => {
    const mod = (await import(distTuiEntry.href)) as { default?: BuiltTui };

    expect(mod.default).toBeDefined();
    expect(mod.default?.id).toBe("opencode-caveman-simplified");
    expect(typeof mod.default?.tui).toBe("function");
    expect(typeof mod.default?.setup).toBe("function");
  });

  test("tui entry exports nothing but default (host treats named exports as plugins)", async () => {
    const mod = (await import(distTuiEntry.href)) as Record<string, unknown>;
    expect(Object.keys(mod)).toEqual(["default"]);
  });

  test("tui default export owns exactly id, tui, setup", async () => {
    const mod = (await import(distTuiEntry.href)) as { default?: BuiltTui };
    expect(Object.keys(mod.default ?? {}).sort()).toEqual(["id", "setup", "tui"]);
  });
});
