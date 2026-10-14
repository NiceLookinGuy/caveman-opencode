#!/bin/sh
# opencode-caveman-simplified installer for OpenCode 1.
#
# Adds the plugin spec to both config files OpenCode 1 reads:
#   - opencode.json (or opencode.jsonc): server half
#   - tui.json: TUI half
# under ${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}.
#
# Notes:
#   - Idempotent: a re-run detects the spec and makes no changes.
#   - Backups: every existing file the installer opens is copied to <file>.bak
#     before any write. An existing .bak is overwritten on each run.
#   - JSONC-safe: commented configs (// and /* */, trailing commas) are updated
#     by targeted text insertion; comments are preserved byte for byte.
#   - Missing files are created as {"plugin": ["<spec>"]}.
#   - Requires node (checked below).
#
# Exit codes: 0 = installed or already installed; 1 = failure.

set -u

spec="opencode-caveman-simplified@git+https://github.com/NiceLookinGuy/opencode-caveman-simplified"
config_dir="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

if ! command -v node >/dev/null 2>&1; then
  fail "node is required to update OpenCode config files; install Node.js and re-run"
fi

if ! mkdir -p "$config_dir"; then
  fail "cannot create config directory: $config_dir"
fi

if [ -f "$config_dir/opencode.json" ]; then
  opencode_target="$config_dir/opencode.json"
elif [ -f "$config_dir/opencode.jsonc" ]; then
  opencode_target="$config_dir/opencode.jsonc"
else
  opencode_target="$config_dir/opencode.json"
fi
tui_target="$config_dir/tui.json"

node_program=$(cat <<'NODE'
'use strict'

const fs = require('fs')

const [mode, target, spec] = process.argv.slice(2)
const marker = 'opencode-caveman-simplified'

function die(message) {
  console.error('ERROR: ' + message)
  process.exit(1)
}

function stripComments(content) {
  let result = ''
  let index = 0
  let inString = false
  let escaped = false
  while (index < content.length) {
    const character = content[index]
    if (inString) {
      result += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      index += 1
      continue
    }
    if (character === '"') {
      inString = true
      result += character
      index += 1
      continue
    }
    if (character === '/' && content[index + 1] === '/') {
      while (index < content.length && content[index] !== '\n') index += 1
      continue
    }
    if (character === '/' && content[index + 1] === '*') {
      const close = content.indexOf('*/', index + 2)
      if (close === -1) {
        result += ' '
        index = content.length
      } else {
        index = close + 2
      }
      continue
    }
    result += character
    index += 1
  }
  return result
}

function stripTrailingCommas(content) {
  let result = ''
  let inString = false
  let escaped = false
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]
    if (inString) {
      result += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      continue
    }
    if (character === '"') {
      inString = true
      result += character
      continue
    }
    if (character === ',') {
      let next = index + 1
      while (next < content.length && /\s/.test(content[next])) next += 1
      if (content[next] === '}' || content[next] === ']') continue
    }
    result += character
  }
  return result
}

function minimalContent() {
  return JSON.stringify({ plugin: [spec] }, null, 2) + '\n'
}

function runMerge() {
  let content
  try {
    content = fs.readFileSync(target, 'utf8')
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      fs.writeFileSync(target, minimalContent())
      console.log('created')
      process.exit(0)
    }
    die('cannot read ' + target + ': ' + error.message)
  }

  if (content.trim() === '') {
    fs.copyFileSync(target, target + '.bak')
    fs.writeFileSync(target, minimalContent())
    console.log('created')
    process.exit(0)
  }

  fs.copyFileSync(target, target + '.bak')

  let strict = false
  let parsed = null
  try {
    parsed = JSON.parse(content)
    strict = true
  } catch (error) {
    strict = false
  }

  if (strict) {
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      die(target + ' is not a JSON object; refusing to edit')
    }
    if (parsed.plugin === undefined) {
      parsed.plugin = [spec]
    } else if (!Array.isArray(parsed.plugin)) {
      die(target + ' has a "plugin" value that is not an array; refusing to edit')
    } else if (
      parsed.plugin.some(function (entry) {
        return typeof entry === 'string' && entry.indexOf(marker) !== -1
      })
    ) {
      console.log('already')
      process.exit(0)
    } else {
      parsed.plugin.push(spec)
    }
    fs.writeFileSync(target, JSON.stringify(parsed, null, 2) + '\n')
    console.log('updated')
    process.exit(0)
  }

  // Commented / trailing-comma JSONC: preserve the original text and insert
  // only the spec string (targeted text insertion; no parse-and-reprint).
  let index = 0
  let depth = 0
  let firstBrace = -1
  let lastTopLevelKey = null
  let pluginKeySeen = false
  let pluginArray = null
  const stack = []

  while (index < content.length) {
    const character = content[index]

    if (character === '/' && content[index + 1] === '/') {
      const newline = content.indexOf('\n', index)
      index = newline === -1 ? content.length : newline + 1
      continue
    }

    if (character === '/' && content[index + 1] === '*') {
      const close = content.indexOf('*/', index + 2)
      if (close === -1) die(target + ' has an unterminated block comment')
      index = close + 2
      continue
    }

    if (character === '"') {
      let end = index + 1
      let escaped = false
      while (end < content.length) {
        const current = content[end]
        if (escaped) escaped = false
        else if (current === '\\') escaped = true
        else if (current === '"') break
        end += 1
      }
      if (end >= content.length) die(target + ' has an unterminated string')

      let lookahead = end + 1
      while (lookahead < content.length) {
        const next = content[lookahead]
        if (next === ' ' || next === '\t' || next === '\r' || next === '\n') {
          lookahead += 1
          continue
        }
        if (next === '/' && content[lookahead + 1] === '/') {
          const newline = content.indexOf('\n', lookahead)
          lookahead = newline === -1 ? content.length : newline + 1
          continue
        }
        if (next === '/' && content[lookahead + 1] === '*') {
          const close = content.indexOf('*/', lookahead + 2)
          lookahead = close === -1 ? content.length : close + 2
          continue
        }
        break
      }

      if (depth === 1 && content[lookahead] === ':') {
        lastTopLevelKey = content.slice(index + 1, end)
        if (lastTopLevelKey === 'plugin') pluginKeySeen = true
      }

      index = end + 1
      continue
    }

    if (character === '{') {
      depth += 1
      stack.push({ type: '{' })
      if (firstBrace === -1) firstBrace = index
      lastTopLevelKey = null
      index += 1
      continue
    }

    if (character === '[') {
      const isPluginArray = depth === 1 && lastTopLevelKey === 'plugin'
      depth += 1
      stack.push({ type: '[', plugin: isPluginArray })
      if (isPluginArray) pluginArray = { start: index, end: -1 }
      lastTopLevelKey = null
      index += 1
      continue
    }

    if (character === '}' || character === ']') {
      const top = stack.pop()
      if (!top || (character === '}' && top.type !== '{') || (character === ']' && top.type !== '[')) {
        die(target + ' has unbalanced brackets; refusing to edit')
      }
      if (character === ']' && top.plugin && pluginArray) pluginArray.end = index
      depth -= 1
      lastTopLevelKey = null
      index += 1
      continue
    }

    if (character === ',' && depth === 1) lastTopLevelKey = null
    index += 1
  }

  if (stack.length > 0) die(target + ' has unbalanced brackets; refusing to edit')
  if (firstBrace === -1) die(target + ' is not a JSON object; refusing to edit')

  if (pluginArray && pluginArray.end !== -1) {
    const inner = content.slice(pluginArray.start + 1, pluginArray.end)
    if (inner.indexOf(marker) !== -1) {
      console.log('already')
      process.exit(0)
    }
    const significant = stripComments(inner).replace(/\s+/g, '')
    let updated
    if (significant === '') {
      updated =
        content.slice(0, pluginArray.start + 1) +
        '\n    "' + spec + '"\n  ' +
        content.slice(pluginArray.start + 1)
    } else {
      const last = significant[significant.length - 1]
      const insertion = (last === ',' ? ' ' : ', ') + '"' + spec + '"'
      updated = content.slice(0, pluginArray.end) + insertion + content.slice(pluginArray.end)
    }
    fs.writeFileSync(target, updated)
    console.log('updated')
    process.exit(0)
  }

  if (pluginKeySeen) die(target + ' has a "plugin" value that is not an array; refusing to edit')

  const insertion = '\n  "plugin": [\n    "' + spec + '"\n  ],'
  const updated = content.slice(0, firstBrace + 1) + insertion + content.slice(firstBrace + 1)
  fs.writeFileSync(target, updated)
  console.log('updated')
}

function runCheck() {
  let content
  try {
    content = fs.readFileSync(target, 'utf8')
  } catch (error) {
    die('cannot read ' + target + ': ' + error.message)
  }
  if (content.trim() === '') die(target + ' is empty')
  if (content.indexOf(spec) === -1) die(target + ' does not contain the plugin spec')
  try {
    JSON.parse(content)
    return
  } catch (error) {
    // fall through: commented/trailing-comma JSONC is validated tolerantly
  }
  try {
    JSON.parse(stripTrailingCommas(stripComments(content)))
  } catch (error) {
    die(target + ' is not valid JSON/JSONC after update: ' + error.message)
  }
}

if (mode === 'check') runCheck()
else runMerge()
NODE
)

merge_target() {
  target="$1"
  merge_status=$(printf '%s' "$node_program" | node - merge "$target" "$spec") || exit 1
  case "$merge_status" in
    created) echo "created $target" ;;
    updated) echo "updated $target (backup: $target.bak)" ;;
    already) echo "already installed in $target" ;;
    *) fail "unexpected merge result for $target: $merge_status" ;;
  esac
}

validate_target() {
  target="$1"
  if [ "${target##*.}" = "json" ]; then
    if node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "$target" >/dev/null 2>&1; then
      return 0
    fi
  fi
  printf '%s' "$node_program" | node - check "$target" "$spec" || fail "validation failed for $target"
}

merge_target "$opencode_target"
merge_target "$tui_target"

validate_target "$opencode_target"
validate_target "$tui_target"

echo ""
echo "Plugin spec: $spec"
echo "Config dir:  $config_dir"
echo "Next steps: restart the OpenCode TUI, then use /caveman to pick a level."
