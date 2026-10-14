<div align="center">

# opencode-caveman-simplified

### Terse AI responses for OpenCode. One small plugin, two hosts, five levels.

[![GitHub stars](https://img.shields.io/github/stars/NiceLookinGuy/opencode-caveman-simplified?style=social)](https://github.com/NiceLookinGuy/opencode-caveman-simplified/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/NiceLookinGuy/opencode-caveman-simplified?style=social)](https://github.com/NiceLookinGuy/opencode-caveman-simplified/fork)
[![MIT License](https://img.shields.io/github/license/NiceLookinGuy/opencode-caveman-simplified)](LICENSE)
[![Issues](https://img.shields.io/github/issues/NiceLookinGuy/opencode-caveman-simplified)](https://github.com/NiceLookinGuy/opencode-caveman-simplified/issues)

**why use many token when few do trick**

[Install](#install) · [Usage](#usage) · [Levels](#levels) · [How it works](#how-it-works) · [Credits](#credits)

</div>

---

## What is this?

`opencode-caveman-simplified` is one small OpenCode plugin that makes the agent answer terse. It injects a short caveman instruction block into the session system prompt, invisible to the conversation, at one of five levels: `off`, `lite`, `full`, `ultra`, `wenyan`.

What it is not:

- No skills, no commands, no Python, no LLM compression pipeline.
- No visible session messages. The model never sees a fake user turn; the injection rides in the system prompt array.
- Not the full multi-agent Caveman repository. This is a focused plugin that works with both OpenCode 1 and OpenCode 2.

It is a rework of the `caveman-opencode` packaging chain (see [Credits](#credits)), rebuilt as a plugin for both OpenCode 1 and OpenCode 2.

## Install

### OpenCode 2

```bash
opencode plugin add github:NiceLookinGuy/opencode-caveman-simplified
```

The package ships two halves: a server plugin (`id`, `server`, `setup`) and a TUI plugin (`id`, `tui`, `setup`), both resolved from the package entry points.

### OpenCode 1

Run the installer. It adds the plugin spec to both config files for you:

```bash
curl -fsSL https://raw.githubusercontent.com/NiceLookinGuy/opencode-caveman-simplified/main/install-opencode.sh | sh
```

Or clone this repo and run it locally:

```bash
./install-opencode.sh
```

The script targets `${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}`, is idempotent (a re-run detects the spec and changes nothing), backs up each modified file to `<file>.bak`, and preserves comments in JSONC configs (`opencode.jsonc` or a commented `opencode.json`).

**Or manually** (other platforms, Windows): add the plugin spec to **both** config files. OpenCode 1 loads the server half from `opencode.json` and the TUI half from `tui.json`, so both are required to get injection and the level picker:

```json
// ~/.config/opencode/opencode.json
{
  "plugin": ["opencode-caveman-simplified@git+https://github.com/NiceLookinGuy/opencode-caveman-simplified"]
}
```

```json
// ~/.config/opencode/tui.json
{
  "plugin": ["opencode-caveman-simplified@git+https://github.com/NiceLookinGuy/opencode-caveman-simplified"]
}
```

Git installs run the committed `dist/` output. No build step on the user machine.

Restart OpenCode after installing.

## Usage

```text
/caveman
```

Opens the level picker. Pick a level, done.

On OpenCode 2 you can also pass the level directly:

```text
/caveman off
/caveman lite
/caveman full
/caveman ultra
/caveman wenyan
```

OpenCode 1 note: the host does not support slash arguments for plugin commands, so the picker is the only switch path there. One extra keypress, same result.

The level is global: one file, shared across sessions and projects. The TUI writes it; every session (including headless) reads it.

State file:

```text
~/.local/state/opencode/caveman-simplified.json
```

`XDG_STATE_HOME` is respected. Override the full path with `CAVEMAN_STATE_FILE`. Missing or unreadable file means default: `full`.

## Levels

| Level | Behavior | Example ("Why component re-render?") |
|-------|----------|--------------------------------------|
| `off` | No injection at all. Normal OpenCode prose. | "Your component re-renders because you create a new object reference each render." |
| `lite` | Terse. No filler, hedging, pleasantries. Articles and full sentences stay. | "Your component re-renders because you create a new object reference each render. Wrap it in `useMemo`." |
| `full` | Classic caveman. Drop articles, fragments OK, short synonyms. | "New object ref each render. Inline object prop = new ref = re-render. Wrap in `useMemo`." |
| `ultra` | Maximum compression. Abbreviations, arrows for causality, bare fragments. | "Inline obj prop → new ref → re-render. `useMemo`." |
| `wenyan` | Classical Chinese register (文言文), maximum terseness. | "物出新參照，致重繪。useMemo Wrap之。" |

Code, commands, identifiers, paths, numbers, quoted errors, security warnings, destructive confirmations, and multi-step sequences stay exact at every level. Compression never touches them.

## Display

While a level is active, the TUI shows a small right-aligned `caveman <level>` element:

- OpenCode 1: bottom bar (`app_bottom` slot) plus a hint on the home prompt (`home_prompt_right`).
- OpenCode 2: prompt footer status (`prompt.footer.status` slot) plus a home footer hint (`home.footer.status`).

Honest note: neither TUI exposes a true right column to plugins. A right-aligned element in an existing bar is the closest available; on wide terminals it reads as a right rail. The right-aligned status bar is hidden when the level is `off`; the home-screen hint always shows the current state (including `caveman: off — /caveman`).

## How it works

One JSON file holds the level. Both hosts read it on every request; the TUI watches it with `fs.watchFile` (500 ms) so changes apply live and across instances.

Injection is per-host, always into system prompt arrays only:

- OpenCode 1: `experimental.chat.system.transform` appends a `[caveman:<level>]` block to `output.system`.
- OpenCode 2: registers four session hooks — `context`, `compaction`, `generate`, `title` — and appends `{ type: "text", text }` parts to `input.system`.

Every injected line carries a `[caveman:` marker. If the marker is already present, injection is skipped, so hooks cannot double up. `off` injects nothing.

Because the block is system content, it applies to primary agents, subagents, compaction prompts, and title generation in the same session. Nothing is added to the message history, so the conversation stays clean.

Token cost while active: three short marker lines in the system context (the level rule, behavior rules, clarity rules). At `ultra` that is a rounding error against the tokens saved. At `off` it is zero.

## Compatibility

- OpenCode 1 `>= 1.17.6` (plugin keymap layers, slots, `experimental.chat.system.transform`).
- OpenCode 2 plugin API (beta). Hooks and TUI context may shift between betas; pin a revision if you need stability.
- Works alongside orchestration plugins. Example: `opencode-hard-orchestration` Commander with a task+question-only tool gate keeps working — caveman injection is session-level system content, requires no tools, and does not touch the tool list.
- Switching levels needs the TUI (or a manual edit of the state file). Headless/CI sessions just read the state.

## Migrating from a legacy caveman install

The old package installed skills, commands, and an instructions file. Remove those before switching:

1. Remove the caveman entry from `instructions` in your OpenCode config, e.g. `~/.config/opencode/AGENTS.caveman.md`.
2. Delete legacy skills (e.g. `~/.config/opencode/skills/caveman*`) and commands (e.g. `~/.config/opencode/commands/caveman*.md`) if present.
3. Remove old plugin entries pointing at the legacy package from `opencode.json` (and `tui.json` on OpenCode 1).
4. Install this plugin (see [Install](#install)) and restart.

Legacy state does not carry over. New state starts at `full` unless you set it.

## Uninstall

- OpenCode 2: remove the plugin spec (`opencode plugin remove` in your CLI, or drop the entry).
- OpenCode 1: remove the spec from both `opencode.json` and `tui.json`.
- Optional: delete `~/.local/state/opencode/caveman-simplified.json`.

## Development

```bash
bun install
bun run typecheck   # tsc --noEmit, TUI files included
bun run build       # esbuild bundles + tsc declarations into dist/
bun test            # bun test
sh scripts/test-install.sh  # installer tests against temp config dirs
```

Notes:

- `dist/` is committed. Git installs run committed output; nothing is built on the user machine.
- CI (`.github/workflows/validate.yml`) runs typecheck, build, tests, then checks `git diff --exit-code dist` for reproducibility.
- Local dev inside this repo: `opencode.json` points at `./index.js` (server half) and `tui.json` at `./tui.js` (TUI half), both root shims over `dist/`. Run `bun run build` first.
- TUI halves are lazy-loaded from `dist/tui.js`, so the router entry stays importable without `@opentui/*` installed.

## Credits

Fork chain:

1. [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) — original Caveman concept, prompts, and compression logic.
2. [anthonystepvoy/caveman-opencode](https://github.com/anthonystepvoy/caveman-opencode) — first OpenCode packaging.
3. [NiceLookinGuy/opencode-caveman-simplified](https://github.com/NiceLookinGuy/opencode-caveman-simplified) — this plugin rework, supporting OpenCode 1 and OpenCode 2.

Upstream attribution is preserved in [NOTICE.md](NOTICE.md).

## License

MIT. See [LICENSE](LICENSE).
