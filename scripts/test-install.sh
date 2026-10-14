#!/bin/sh
# Tests for install-opencode.sh.
#
# Every case runs the installer with OPENCODE_CONFIG_DIR pointed at a throwaway
# temp directory. The real OpenCode config directory (if any) is snapshotted
# before and after the run; the tests fail if it changes.
#
# Usage: sh scripts/test-install.sh

set -u

repo=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
installer="$repo/install-opencode.sh"
spec="opencode-caveman-simplified@git+https://github.com/NiceLookinGuy/opencode-caveman-simplified"
failed=0

command -v node >/dev/null 2>&1 || { echo "ERROR: node is required to run these tests" >&2; exit 1; }
[ -f "$installer" ] || { echo "ERROR: installer not found: $installer" >&2; exit 1; }

tmp_root=$(mktemp -d "${TMPDIR:-/tmp}/caveman-install-test.XXXXXX") || { echo "ERROR: mktemp failed" >&2; exit 1; }
cleanup() { rm -rf "$tmp_root"; }
trap cleanup EXIT INT TERM

real_config="${HOME:-/nonexistent}/.config/opencode"

snapshot_config() {
  node -e '
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const root = process.argv[1]
if (!fs.existsSync(root)) {
  process.stdout.write("absent")
  process.exit(0)
}
const lines = []
const walk = (dir) => {
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name)
    const stats = fs.lstatSync(full)
    if (stats.isDirectory()) walk(full)
    else if (stats.isFile()) lines.push(full + " " + crypto.createHash("sha1").update(fs.readFileSync(full)).digest("hex"))
    else lines.push(full + " " + stats.mode)
  }
}
walk(root)
process.stdout.write(lines.join("\n"))
' "$real_config"
}

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; failed=$((failed + 1)); }

check_status() {
  expected=$1
  actual=$2
  label=$3
  if [ "$actual" -eq "$expected" ]; then
    pass "$label"
  else
    fail "$label (expected exit $expected, got $actual)"
  fi
}

check_contains() {
  file=$1
  needle=$2
  label=$3
  if [ -f "$file" ] && node -e 'const fs=require("fs");process.exit(fs.readFileSync(process.argv[1],"utf8").includes(process.argv[2])?0:1)' "$file" "$needle" 2>/dev/null; then
    pass "$label"
  else
    fail "$label"
  fi
}

check_not_contains() {
  file=$1
  needle=$2
  label=$3
  if [ -f "$file" ] && node -e 'const fs=require("fs");process.exit(fs.readFileSync(process.argv[1],"utf8").includes(process.argv[2])?1:0)' "$file" "$needle" 2>/dev/null; then
    pass "$label"
  else
    fail "$label"
  fi
}

check_valid_json() {
  file=$1
  label=$2
  if [ -f "$file" ] && node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$file" 2>/dev/null; then
    pass "$label"
  else
    fail "$label"
  fi
}

check_valid_jsonc() {
  file=$1
  label=$2
  if [ -f "$file" ] && node - "$file" >/dev/null 2>&1 <<'NODE'
const fs = require("fs")
let content = fs.readFileSync(process.argv[2], "utf8")

function stripComments(value) {
  let result = ""
  let index = 0
  let inString = false
  let escaped = false
  while (index < value.length) {
    const character = value[index]
    if (inString) {
      result += character
      if (escaped) escaped = false
      else if (character === "\\") escaped = true
      else if (character === '"') inString = false
      index += 1
      continue
    }
    if (character === '"') { inString = true; result += character; index += 1; continue }
    if (character === "/" && value[index + 1] === "/") {
      while (index < value.length && value[index] !== "\n") index += 1
      continue
    }
    if (character === "/" && value[index + 1] === "*") {
      const close = value.indexOf("*/", index + 2)
      index = close === -1 ? value.length : close + 2
      continue
    }
    result += character
    index += 1
  }
  return result
}

function stripTrailingCommas(value) {
  let result = ""
  let inString = false
  let escaped = false
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (inString) {
      result += character
      if (escaped) escaped = false
      else if (character === "\\") escaped = true
      else if (character === '"') inString = false
      continue
    }
    if (character === '"') { inString = true; result += character; continue }
    if (character === ",") {
      let next = index + 1
      while (next < value.length && /\s/.test(value[next])) next += 1
      if (value[next] === "}" || value[next] === "]") continue
    }
    result += character
  }
  return result
}

JSON.parse(stripTrailingCommas(stripComments(content)))
NODE
  then
    pass "$label"
  else
    fail "$label"
  fi
}

check_spec_count() {
  file=$1
  expected=$2
  label=$3
  count=$(node -e 'const fs=require("fs");const c=fs.readFileSync(process.argv[1],"utf8");process.stdout.write(String(c.split(process.argv[2]).length-1))' "$file" "$spec" 2>/dev/null)
  if [ "$count" = "$expected" ]; then
    pass "$label"
  else
    fail "$label (expected $expected, got ${count:-none})"
  fi
}

check_file_matches() {
  left=$1
  right=$2
  label=$3
  if [ -f "$left" ] && [ -f "$right" ] && cmp -s "$left" "$right"; then
    pass "$label"
  else
    fail "$label"
  fi
}

real_before=$(snapshot_config)

# --- case A: fresh install -------------------------------------------------
case_a="$tmp_root/a"
mkdir -p "$case_a"
output=$(OPENCODE_CONFIG_DIR="$case_a" sh "$installer" 2>&1)
status=$?
check_status 0 "$status" "case A: installer exits 0 on fresh install"
check_valid_json "$case_a/opencode.json" "case A: opencode.json created and valid JSON"
check_valid_json "$case_a/tui.json" "case A: tui.json created and valid JSON"
check_contains "$case_a/opencode.json" "$spec" "case A: opencode.json contains plugin spec"
check_contains "$case_a/tui.json" "$spec" "case A: tui.json contains plugin spec"
check_spec_count "$case_a/opencode.json" 1 "case A: exactly one spec entry in opencode.json"
check_spec_count "$case_a/tui.json" 1 "case A: exactly one spec entry in tui.json"
if [ -e "$case_a/opencode.json.bak" ] || [ -e "$case_a/tui.json.bak" ]; then
  fail "case A: no backups expected for created files"
else
  pass "case A: no backups for created files"
fi

# --- case B: existing commented JSONC --------------------------------------
case_b="$tmp_root/b"
mkdir -p "$case_b"
cat > "$case_b/opencode.jsonc" <<'FIXTURE'
{
  // existing server plugins
  "plugin": [
    "some-other-plugin@1.0.0", // keep me
  ],
  "theme": "dark" /* trailing block comment */
}
FIXTURE
cp "$case_b/opencode.jsonc" "$case_b/opencode.jsonc.orig"

output=$(OPENCODE_CONFIG_DIR="$case_b" sh "$installer" 2>&1)
status=$?
check_status 0 "$status" "case B: installer exits 0 with commented jsonc"
if [ -e "$case_b/opencode.json" ]; then
  fail "case B: opencode.json must not be created when opencode.jsonc exists"
else
  pass "case B: opencode.json not created when opencode.jsonc exists"
fi
check_contains "$case_b/opencode.jsonc" "$spec" "case B: spec added to opencode.jsonc"
check_contains "$case_b/opencode.jsonc" "some-other-plugin@1.0.0" "case B: existing plugin entry preserved"
check_contains "$case_b/opencode.jsonc" "// existing server plugins" "case B: line comment preserved"
check_contains "$case_b/opencode.jsonc" "// keep me" "case B: inline comment preserved"
check_contains "$case_b/opencode.jsonc" "/* trailing block comment */" "case B: block comment preserved"
check_valid_jsonc "$case_b/opencode.jsonc" "case B: opencode.jsonc remaining valid JSONC"
check_spec_count "$case_b/opencode.jsonc" 1 "case B: exactly one spec entry in opencode.jsonc"
check_file_matches "$case_b/opencode.jsonc.orig" "$case_b/opencode.jsonc.bak" "case B: backup matches original"
check_valid_json "$case_b/tui.json" "case B: tui.json created and valid JSON"
check_contains "$case_b/tui.json" "$spec" "case B: tui.json contains plugin spec"

# --- case C: re-run is idempotent ------------------------------------------
case_c="$tmp_root/c"
mkdir -p "$case_c"
cp "$case_b/opencode.jsonc" "$case_c/opencode.jsonc"
cp "$case_b/tui.json" "$case_c/tui.json"
cp "$case_c/opencode.jsonc" "$case_c/opencode.jsonc.before"
cp "$case_c/tui.json" "$case_c/tui.json.before"

output=$(OPENCODE_CONFIG_DIR="$case_c" sh "$installer" 2>&1)
status=$?
check_status 0 "$status" "case C: re-run exits 0"
case "$output" in
  *"already installed"*) pass "case C: reports already installed" ;;
  *) fail "case C: expected 'already installed' in output" ;;
esac
check_spec_count "$case_c/opencode.jsonc" 1 "case C: no duplicate spec in opencode.jsonc"
check_spec_count "$case_c/tui.json" 1 "case C: no duplicate spec in tui.json"
check_file_matches "$case_c/opencode.jsonc.before" "$case_c/opencode.jsonc" "case C: opencode.jsonc unchanged on re-run"
check_file_matches "$case_c/tui.json.before" "$case_c/tui.json" "case C: tui.json unchanged on re-run"

# --- case D: malformed file fails cleanly ----------------------------------
case_d="$tmp_root/d"
mkdir -p "$case_d"
printf '{"plugin": [\n' > "$case_d/opencode.json"
printf '{"plugin": ["other-plugin"]}\n' > "$case_d/tui.json"
cp "$case_d/opencode.json" "$case_d/opencode.json.orig"
cp "$case_d/tui.json" "$case_d/tui.json.orig"

output=$(OPENCODE_CONFIG_DIR="$case_d" sh "$installer" 2>&1)
status=$?
if [ "$status" -ne 0 ]; then
  pass "case D: malformed config exits non-zero"
else
  fail "case D: malformed config should exit non-zero"
fi
check_file_matches "$case_d/opencode.json.orig" "$case_d/opencode.json" "case D: malformed file left untouched"
if [ -f "$case_d/opencode.json.bak" ] && cmp -s "$case_d/opencode.json.orig" "$case_d/opencode.json.bak"; then
  pass "case D: backup of original malformed file exists"
else
  fail "case D: backup of original malformed file exists"
fi
check_not_contains "$case_d/opencode.json" "$spec" "case D: spec not written to malformed file"
check_file_matches "$case_d/tui.json.orig" "$case_d/tui.json" "case D: tui.json untouched after failure"

# --- real config guard ------------------------------------------------------
real_after=$(snapshot_config)
if [ "$real_before" = "$real_after" ]; then
  pass "real config untouched (temp dirs only): $real_config"
else
  fail "real config changed during tests: $real_config"
fi

if [ "$failed" -eq 0 ]; then
  echo "All install script tests passed."
  exit 0
fi
echo "FAILED: $failed test(s)" >&2
exit 1
