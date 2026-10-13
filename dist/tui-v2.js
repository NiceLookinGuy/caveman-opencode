// src/tui/v2.tsx
import { createSignal } from "solid-js";

// src/core/level.ts
var LEVELS = ["off", "lite", "full", "ultra", "wenyan"];
var DEFAULT_LEVEL = "full";
function isLevel(value) {
  return typeof value === "string" && LEVELS.includes(value);
}
function clampLevel(value) {
  return isLevel(value) ? value : DEFAULT_LEVEL;
}
function parseLevelArg(raw) {
  if (typeof raw !== "string") return void 0;
  const token = raw.trim().toLowerCase();
  return isLevel(token) ? token : void 0;
}

// src/core/state.ts
import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  unwatchFile,
  watchFile,
  writeFileSync
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
function stateFilePath() {
  const override = process.env.CAVEMAN_STATE_FILE;
  if (override) return path.resolve(override);
  const xdgStateHome = process.env.XDG_STATE_HOME;
  const base = xdgStateHome ? path.resolve(xdgStateHome) : path.join(homedir(), ".local", "state");
  return path.join(base, "opencode", "caveman-simplified.json");
}
var cache;
function readLevel() {
  const file = stateFilePath();
  let mtimeMs = -1;
  try {
    mtimeMs = statSync(file).mtimeMs;
  } catch {
    cache = { path: file, mtimeMs, level: DEFAULT_LEVEL };
    return DEFAULT_LEVEL;
  }
  if (cache && cache.path === file && cache.mtimeMs === mtimeMs) return cache.level;
  let level = DEFAULT_LEVEL;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    level = clampLevel(parsed?.level);
  } catch {
    level = DEFAULT_LEVEL;
  }
  cache = { path: file, mtimeMs, level };
  return level;
}
function writeLevel(level, updatedBy) {
  const file = stateFilePath();
  const safeLevel = isLevel(level) ? level : DEFAULT_LEVEL;
  mkdirSync(path.dirname(file), { recursive: true });
  const payload = {
    version: 1,
    level: safeLevel,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy
  };
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}
`, "utf8");
  try {
    renameSync(tmp, file);
  } catch (error) {
    const code = error.code;
    if (process.platform === "win32" && (code === "EEXIST" || code === "EPERM")) {
      try {
        unlinkSync(file);
      } catch {
      }
      renameSync(tmp, file);
    } else {
      try {
        unlinkSync(tmp);
      } catch {
      }
      throw error;
    }
  }
  cache = void 0;
}
function watchLevel(callback) {
  const file = stateFilePath();
  const listener = () => {
    callback(readLevel());
  };
  watchFile(file, { interval: 500 }, listener);
  callback(readLevel());
  return () => {
    unwatchFile(file, listener);
  };
}

// src/tui/shared-ui.tsx
import { jsx } from "@opentui/solid/jsx-runtime";
var LEVEL_OPTIONS = [
  {
    title: "off",
    value: "off",
    description: "Normal prose. No caveman injection."
  },
  {
    title: "lite",
    value: "lite",
    description: "Terse. No filler, pleasantries, or hedging. Full sentences kept."
  },
  {
    title: "full",
    value: "full",
    description: "Caveman terse. Drop articles, fragments OK, short synonyms."
  },
  {
    title: "ultra",
    value: "ultra",
    description: "Maximum compression. Abbreviations, arrows, bare fragments."
  },
  {
    title: "wenyan",
    value: "wenyan",
    description: "Classical Chinese register (\u6587\u8A00\u6587). Maximum terseness."
  }
];
function StatusBar(props) {
  if (props.level === "off") return null;
  return /* @__PURE__ */ jsx("box", { width: "100%", flexDirection: "row", justifyContent: "flex-end", children: /* @__PURE__ */ jsx("text", { fg: props.color, children: `caveman ${props.level}` }) });
}
function HomeHint(props) {
  return /* @__PURE__ */ jsx("text", { fg: props.color, children: `caveman: ${props.level} \u2014 /caveman` });
}

// src/tui/v2.tsx
import { jsx as jsx2 } from "@opentui/solid/jsx-runtime";
function run(ctx) {
  const [level, setLevel] = createSignal(readLevel());
  const unwatch = watchLevel((next) => setLevel(next));
  const apply = (next) => {
    try {
      writeLevel(next, "v2");
      setLevel(next);
      ctx.ui.toast.show({
        variant: next === "off" ? "info" : "success",
        title: "Caveman",
        message: `Level: ${next}`
      });
    } catch (error) {
      ctx.ui.toast.show({
        variant: "error",
        title: "Caveman",
        message: `Could not save level: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };
  const openPicker = async () => {
    const picked = await ctx.ui.dialog.select({
      title: "Caveman level",
      placeholder: "Filter levels",
      options: LEVEL_OPTIONS,
      current: level()
    });
    if (picked) apply(picked);
  };
  const setFromInput = (input) => {
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
        message: `unknown level "${token}" \u2014 valid: off lite full ultra wenyan`
      });
      return;
    }
    apply(parsed);
  };
  const bar = ctx.ui.slot({
    append: "prompt.footer.status",
    render: () => /* @__PURE__ */ jsx2(StatusBar, { level: level(), color: ctx.theme.text.muted })
  });
  const hint = ctx.ui.slot({
    append: "home.footer.status",
    render: () => /* @__PURE__ */ jsx2(HomeHint, { level: level(), color: ctx.theme.text.muted })
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
        run: (input) => {
          setFromInput(input);
        }
      }
    ]
  }));
  return () => {
    unwatch();
    bar();
    hint();
  };
}
export {
  run
};
