import { createSignal } from "solid-js";
import type { PluginOptions } from "@opencode-ai/plugin";
import type {
  TuiDialogSelectOption,
  TuiPluginApi,
  TuiPluginMeta,
} from "@opencode-ai/plugin/tui";

import type { Level } from "../core/level.js";
import { readLevel, watchLevel, writeLevel } from "../core/state.js";
import { HomeHint, LEVEL_OPTIONS, StatusBar } from "./shared-ui.js";

export async function run(
  api: TuiPluginApi,
  _options?: PluginOptions,
  _meta?: TuiPluginMeta,
): Promise<void> {
  const [level, setLevel] = createSignal<Level>(readLevel());

  const unwatch = watchLevel((next) => setLevel(next));
  api.lifecycle.onDispose(unwatch);

  const apply = (next: Level): void => {
    try {
      writeLevel(next, "v1");
      setLevel(next);
      api.ui.toast({
        variant: next === "off" ? "info" : "success",
        title: "Caveman",
        message: `Level: ${next}`,
      });
    } catch (error) {
      api.ui.toast({
        variant: "error",
        title: "Caveman",
        message: `Could not save level: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const openPicker = (): void => {
    const DialogSelect = api.ui.DialogSelect;
    api.ui.dialog.replace(() => (
      <DialogSelect
        title="Caveman level"
        placeholder="Filter levels"
        options={LEVEL_OPTIONS}
        current={level()}
        onSelect={(option: TuiDialogSelectOption<Level>) => {
          apply(option.value);
          api.ui.dialog.clear();
        }}
      />
    ));
  };

  api.slots.register({
    slots: {
      app_bottom: (ctx) => (
        <StatusBar level={level()} color={ctx.theme.current.textMuted} />
      ),
      home_prompt_right: (ctx) => (
        <HomeHint level={level()} color={ctx.theme.current.textMuted} />
      ),
    },
  });

  api.keymap.registerLayer({
    commands: [
      {
        name: "caveman.set",
        title: "Caveman level",
        desc: "Set caveman level (off/lite/full/ultra/wenyan)",
        category: "Plugin",
        namespace: "palette",
        slashName: "caveman",
        slashAliases: ["caveman-mode"],
        suggested: true,
        run: () => {
          openPicker();
        },
      },
    ],
  });
}
