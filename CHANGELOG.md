# Changelog

## 0.3.0

- Replaced the Claude-coupled compression transport (Anthropic SDK / `claude` CLI) with a provider-agnostic one: direct OpenAI-compatible HTTP via `CAVEMAN_API_KEY`, `CAVEMAN_MODEL`, and optional `CAVEMAN_BASE_URL`, or `opencode run` inheriting any provider configured in opencode.
- Added timeouts for LLM calls (300s HTTP, 600s subprocess) and API-key-safe error messages.
- Documented the fork and the provider-agnostic transport in the README and skill docs.

## Unreleased

- Documented global default activation after install.
- Added `CAVEMAN_OPENCODE_DEFAULT_LEVEL` install-time override for `lite`, `full`, `ultra`, `wenyan`, `wenyan-lite`, and `wenyan-ultra`.
- Accepted trailing commas in existing OpenCode configuration without changing comma-like text inside JSON strings.
- Added functional install/uninstall tests for POSIX and Windows PowerShell environments.
- Replaced the Windows `Expand-Archive` dependency with .NET ZIP extraction for hosts where `Microsoft.PowerShell.Archive` cannot load.
- Enforced LF endings for shell scripts and workflow files across Windows and POSIX checkouts.

## 0.2.0

- Added package validation script for OpenCode config, command metadata, skill metadata, installer coverage, and Python syntax.
- Added GitHub Actions workflow to run package validation on push and pull requests.
- Standardized compression command docs on `/caveman-compress <filepath>`.
- Added one-line remote install and uninstall support for Windows, macOS, and Linux.

## 0.1.0

- Initial OpenCode-focused Caveman package.
- Added OpenCode commands for caveman mode, help, review, commit, and compression.
- Added OpenCode skills under `.opencode/skills/`.
- Added Windows and POSIX install/uninstall scripts.
- Added repo-local `opencode.json` for testing.
- Preserved MIT license and upstream Caveman attribution.
