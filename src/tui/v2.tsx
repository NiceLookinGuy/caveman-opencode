import { createSignal } from "solid-js";
import type { Cleanup, Context as V2Context } from "@opencode/plugin/tui/plugin";

import { type Level, parseLevelArg } from "../core/level.js";
import { readLevel, watchLevel, writeLevel } from "../core/state.js";
import { HomeHint, LEVEL_OPTIONS, StatusBar } from "./shared-ui.js";

export function run(ctx: V2Context): Cleanup {
  const [level, setLevel] = createSignal<Level>(readLevel());

  const unwatch = watchLevel((next) => setLevel(next));

  const apply = (next: Level): void => {
    try {
      writeLevel(next, "v2");
      setLevel(next);
      ctx.ui.toast.show({
        variant: next === "off" ? "info" : "success",
        title: "Caveman",
        message: `Level: ${next}`,
      });
    } catch (error) {
      ctx.ui.toast.show({
        variant: "error",
        title: "Caveman",
        message: `Could not save level: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const openPicker = async (): Promise<void> => {
    const picked = await ctx.ui.dialog.select<Level>({
      title: "Caveman level",
      placeholder: "Filter levels",
      options: LEVEL_OPTIONS,
      current: level(),
    });
    if (picked) apply(picked);
  };

  const setFromInput = (input?: string): void => {
    const raw = typeof input === "string" ? input.trim() : "";
    const token = raw.replace(/^\/?caveman(?:-mode)?/i, "").trim();

    if (!token) {
      void openPicker();
      return;
    }

    const parsed = parseLevelArg(token);
    if (!parsed) {
      ctx.ui.toast.show({
        variant: "error",
        title: "Caveman",
        message: `unknown level "${token}" — valid: off lite full ultra wenyan`,
      });
      return;
    }

    apply(parsed);
  };

  const bar = ctx.ui.slot({
    append: "prompt.footer.status",
    render: () => <StatusBar level={level()} color={ctx.theme.text.muted} />,
  });

  const hint = ctx.ui.slot({
    append: "home.footer.status",
    render: () => <HomeHint level={level()} color={ctx.theme.text.muted} />,
  });

  ctx.keymap.layer(() => ({
    mode: "global",
    commands: [
      {
        id: "caveman.set",
        title: "Caveman level",
        description: "Set caveman level (off/lite/full/ultra/wenyan)",
        palette: true,
        slash: { name: "caveman", aliases: ["caveman-mode"], arguments: true },
        suggested: true,
        run: (input?: string) => {
          setFromInput(input);
        },
      },
    ],
  }));

  return () => {
    unwatch();
    bar();
    hint();
  };
}
