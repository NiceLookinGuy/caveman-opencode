import type { Level } from "./level.js";
export declare const BEHAVIORS = "Commit messages: Conventional Commits; imperative subject \u226450 chars, no trailing period; body only for non-obvious why/BREAKING. Review comments: one line per finding \u2014 L<line>: bug|risk|nit|q: problem. fix. Memory-file writes (AGENTS.md, todos, notes): drop filler, preserve code/URLs/paths/commands/numbers exactly; back up original as <file>.original.md before overwriting. Summaries/compactions: keep facts+identifiers, drop filler.";
export declare const CLARITY = "Security warnings, destructive/irreversible confirmations, multi-step sequences: full clear prose, then resume terse.";
export declare function buildSystemBlock(level: Level): string | undefined;
