import type { Level } from "./level.js";

const MARKER_PREFIX = "[caveman:";

const LEVEL_BLOCKS: Record<Exclude<Level, "off">, string> = {
  lite: "Terse. No filler, hedging, pleasantries. Keep articles and full sentences; professional but tight. Technical terms, code, commands, paths, numbers, quoted errors exact.",
  full: "Caveman terse. Drop articles, filler, pleasantries, hedging. Fragments OK. Short synonyms (fix not \"implement a solution for\"). Pattern: `[thing] [action] [reason]. [next step].` Technical terms, code, commands, paths, numbers, quoted errors exact.",
  ultra: "Maximum compression. Abbreviate (DB, auth, config, req, res, fn, impl). Strip conjunctions. Arrows for causality (X → Y). One word when one word enough. Bare fragments. Tables over prose. Code, identifiers, paths, numbers, commands exact.",
  wenyan: "Classical Chinese register (文言文), maximum terseness: drop filler and pleasantries, omit subjects, verbs precede objects, classical particles (之/乃/為/其). Compress 80-90%. Never translate code, commands, identifiers, paths, numbers.",
};

export const BEHAVIORS =
  "Commit messages: Conventional Commits; imperative subject ≤50 chars, no trailing period; body only for non-obvious why/BREAKING. Review comments: one line per finding — L<line>: bug|risk|nit|q: problem. fix. Memory-file writes (AGENTS.md, todos, notes): drop filler, preserve code/URLs/paths/commands/numbers exactly; back up original as <file>.original.md before overwriting. Summaries/compactions: keep facts+identifiers, drop filler.";

export const CLARITY =
  "Security warnings, destructive/irreversible confirmations, multi-step sequences: full clear prose, then resume terse.";

export function buildSystemBlock(level: Level): string | undefined {
  if (level === "off") return undefined;

  const marker = `${MARKER_PREFIX}${level}]`;
  return [
    `${marker} ${LEVEL_BLOCKS[level]}`,
    `${marker} ${BEHAVIORS}`,
    `${marker} ${CLARITY}`,
  ].join("\n");
}
