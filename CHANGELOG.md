# Changelog

## Unreleased

- Fix OpenCode 2 Git installs: the build script is now `build:dist`, not `build`. npm's git-dependency prepare step runs a nested `npm install` for any package with a `build` script, which fails inside the compiled OpenCode binary and caused `opencode plugin add github:NiceLookinGuy/opencode-caveman-simplified` to fail with `git dep preparation failed` (anomalyco/opencode#49704). Committed `dist/` output is unchanged.

## 1.0.0

- Reworked into `opencode-caveman-simplified`: one small OpenCode plugin (server half + TUI half) that works with OpenCode 1 and OpenCode 2.
- Five levels: `off`, `lite`, `full`, `ultra`, `wenyan`. Persisted to `~/.local/state/opencode/caveman-simplified.json` (`CAVEMAN_STATE_FILE` override, `XDG_STATE_HOME` respected, default `full`).
- Invisible injection into system prompt arrays only: v1 `experimental.chat.system.transform`; v2 session hooks `context`, `compaction`, `generate`, `title`. Marker `[caveman:` prevents double injection.
- TUI: `/caveman` opens a level picker; OpenCode 2 also accepts `/caveman off|lite|full|ultra|wenyan` directly. OpenCode 1 slash arguments are unsupported by the host — picker only.
- Status indicator: right-aligned `caveman <level>` bar plus home hint, using host theme tokens.
- Removed legacy skills, commands, instructions file, installers, and validation scripts.
