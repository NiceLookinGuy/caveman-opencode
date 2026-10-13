import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");
const require = createRequire(import.meta.url);

function resolveTscBin() {
  const pkgJsonPath = require.resolve("typescript/package.json");
  return path.join(path.dirname(pkgJsonPath), "bin", "tsc");
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: repoRoot, stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) return resolve();
      const detail = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`${command} ${args.join(" ")} failed with ${detail}`));
    });
  });
}

function entryPath(relative) {
  return path.join(repoRoot, relative);
}

async function bundle(entry, outfile, options = {}) {
  await build({
    entryPoints: [entryPath(entry)],
    outfile: entryPath(outfile),
    bundle: true,
    format: "esm",
    platform: "node",
    packages: "external",
    sourcemap: false,
    logLevel: "warning",
    ...options,
  });
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await bundle("src/index.ts", "dist/index.js");

// TUI entries are owned by Build B. Bundle whatever exists; skip the rest so
// this script keeps working before those files land.
if (existsSync(entryPath("src/tui/router.ts"))) {
  await bundle("src/tui/router.ts", "dist/tui.js", {
    external: ["./tui-v1.js", "./tui-v2.js"],
  });
} else {
  console.warn("[build] skip src/tui/router.ts (not present yet)");
}

const tuiEntries = [
  ["src/tui/v1.tsx", "dist/tui-v1.js"],
  ["src/tui/v2.tsx", "dist/tui-v2.js"],
];

for (const [entry, outfile] of tuiEntries) {
  if (!existsSync(entryPath(entry))) {
    console.warn(`[build] skip ${entry} (not present yet)`);
    continue;
  }
  await bundle(entry, outfile, { jsx: "automatic", jsxImportSource: "@opentui/solid" });
}

await run(process.execPath, [resolveTscBin(), "-p", "tsconfig.build.json"]);
