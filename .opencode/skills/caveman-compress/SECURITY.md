# Security

## Snyk High Risk Rating

`caveman-compress` receives a Snyk High Risk rating due to static analysis heuristics. This document explains what the skill does and does not do.

### What triggers the rating

1. **subprocess usage**: When no API key is configured, the skill falls back to the `opencode` CLI via `subprocess.run()`. The subprocess call uses a fixed argument list — no shell interpolation occurs. User file content is passed via stdin, not as a shell argument. Output is parsed as newline-delimited JSON events; the response text is the only thing used.

2. **File read/write**: The skill reads the file the user explicitly points it at, compresses it, and writes the result back to the same path. A `.original.md` backup is saved alongside it. No files outside the user-specified path are read or written.

### What the skill does NOT do

- Does not execute user file content as code
- Does not make network requests except to the LLM provider endpoint (either the configured OpenAI-compatible endpoint or, in fallback mode, the `opencode` CLI using the user's existing opencode provider configuration)
- Does not access files outside the path the user provides
- Does not use shell=True or string interpolation in subprocess calls
- Does not collect or transmit any data beyond the file being compressed

### Provider configuration

The skill is provider-agnostic:

- `CAVEMAN_API_KEY` + `CAVEMAN_MODEL` (+ optional `CAVEMAN_BASE_URL`): direct OpenAI-compatible HTTP call using only the Python standard library (`urllib`). Works with OpenAI, Anthropic's compatibility endpoint, OpenRouter, Groq, Ollama, LM Studio, vLLM, or any OpenAI-compatible gateway. Both request and response use fixed URLs and JSON bodies; the API key is sent only as an `Authorization` header to the configured base URL.
- Without those variables: falls back to `opencode run --format json`, which uses the provider, model, and authentication (API key, OAuth, or managed connection) already configured in the user's opencode installation.

`CAVEMAN_MODEL` overrides the model for both transports (`provider/model` form for the opencode fallback).

### Refusals and limits

- Filenames or paths that look like they contain secrets or PII (`.env`, `id_rsa`, `~/.ssh/`, `credentials.*`, key material, etc.) are refused before the file is read or any request is made.
- Files larger than 500KB are rejected before any API call is made.
- HTTP calls time out after 300s; `opencode run` after 600s.

### Reporting a vulnerability

If you believe you've found a genuine security issue, please open a GitHub issue with the label `security`.
