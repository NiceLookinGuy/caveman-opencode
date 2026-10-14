# Changelog

## 1.0.0

- Reworked into `opencode-caveman-simplified`: one small OpenCode plugin (server half + TUI half) that works with OpenCode 1 and OpenCode 2.
- Five levels: `off`, `lite`, `full`, `ultra`, `wenyan`. Persisted to `~/.local/state/opencode/caveman-simplified.json` (`CAVEMAN_STATE_FILE` override, `XDG_STATE_HOME` respected, default `full`).
- Invisible injection into system prompt arrays only: v1 `experimental.chat.system.transform`; v2 session hooks `context`, `compaction`, `generate`, `title`. Marker `[caveman:` prevents double injection.
- TUI: `/caveman` opens a level picker; OpenCode 2 also accepts `/caveman off|lite|full|ultra|wenyan` directly. OpenCode 1 slash arguments are unsupported by the host — picker only.
- Status indicator: right-aligned `caveman <level>` bar plus home hint, using host theme tokens.
- Removed legacy skills, commands, instructions file, installers, and validation scripts.
