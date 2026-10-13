// src/core/prompt.ts
var MARKER_PREFIX = "[caveman:";
var LEVEL_BLOCKS = {
  lite: "Terse. No filler, hedging, pleasantries. Keep articles and full sentences; professional but tight. Technical terms, code, commands, paths, numbers, quoted errors exact.",
  full: 'Caveman terse. Drop articles, filler, pleasantries, hedging. Fragments OK. Short synonyms (fix not "implement a solution for"). Pattern: `[thing] [action] [reason]. [next step].` Technical terms, code, commands, paths, numbers, quoted errors exact.',
  ultra: "Maximum compression. Abbreviate (DB, auth, config, req, res, fn, impl). Strip conjunctions. Arrows for causality (X \u2192 Y). One word when one word enough. Bare fragments. Tables over prose. Code, identifiers, paths, numbers, commands exact.",
  wenyan: "Classical Chinese register (\u6587\u8A00\u6587), maximum terseness: drop filler and pleasantries, omit subjects, verbs precede objects, classical particles (\u4E4B/\u4E43/\u70BA/\u5176). Compress 80-90%. Never translate code, commands, identifiers, paths, numbers."
};
var BEHAVIORS = "Commit messages: Conventional Commits; imperative subject \u226450 chars, no trailing period; body only for non-obvious why/BREAKING. Review comments: one line per finding \u2014 L<line>: bug|risk|nit|q: problem. fix. Memory-file writes (AGENTS.md, todos, notes): drop filler, preserve code/URLs/paths/commands/numbers exactly; back up original as <file>.original.md before overwriting. Summaries/compactions: keep facts+identifiers, drop filler.";
var CLARITY = "Security warnings, destructive/irreversible confirmations, multi-step sequences: full clear prose, then resume terse.";
function buildSystemBlock(level) {
  if (level === "off") return void 0;
  const marker = `${MARKER_PREFIX}${level}]`;
  return [
    `${marker} ${LEVEL_BLOCKS[level]}`,
    `${marker} ${BEHAVIORS}`,
    `${marker} ${CLARITY}`
  ].join("\n");
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

// src/core/level.ts
var LEVELS = ["off", "lite", "full", "ultra", "wenyan"];
var DEFAULT_LEVEL = "full";
function isLevel(value) {
  return typeof value === "string" && LEVELS.includes(value);
}
function clampLevel(value) {
  return isLevel(value) ? value : DEFAULT_LEVEL;
}

// src/core/state.ts
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

// src/server/v1.ts
var MARKER = "[caveman:";
function createV1ServerHooks() {
  return async (_input, output) => {
    const block = buildSystemBlock(readLevel());
    if (!block) return;
    const system = output?.system;
    if (!Array.isArray(system)) return;
    if (system.some((entry) => typeof entry === "string" && entry.includes(MARKER))) return;
    system.push(block);
  };
}

// src/server/v2.ts
var HOOK_KINDS = ["context", "compaction", "generate", "title"];
var MARKER2 = "[caveman:";
function applyBlock(input) {
  const block = buildSystemBlock(readLevel());
  if (!block) return;
  const system = input?.system;
  if (!Array.isArray(system)) return;
  if (system.some((part) => typeof part?.text === "string" && part.text.includes(MARKER2))) return;
  system.push({ type: "text", text: block });
}
async function disposeAll(registrations) {
  await Promise.allSettled(
    registrations.map((registration) => Promise.resolve().then(() => registration.dispose()))
  );
}
async function setupV2(contextInput) {
  const context = contextInput;
  const session = context?.session;
  if (!session || typeof session.hook !== "function") return async () => {
  };
  const registrations = [];
  try {
    for (const kind of HOOK_KINDS) {
      registrations.push(await session.hook(kind, applyBlock));
    }
  } catch (error) {
    await disposeAll(registrations);
    throw error;
  }
  return () => disposeAll(registrations);
}

// src/index.ts
var server = async () => ({
  "experimental.chat.system.transform": createV1ServerHooks()
});
var CavemanSimplifiedPlugin = {
  id: "opencode-caveman-simplified",
  server,
  setup: setupV2
};
var index_default = CavemanSimplifiedPlugin;
export {
  index_default as default
};
