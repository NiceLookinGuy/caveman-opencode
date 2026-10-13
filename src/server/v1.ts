import { buildSystemBlock } from "../core/prompt.js";
import { readLevel } from "../core/state.js";

export interface V1TransformInput {
  sessionID?: string;
  model?: unknown;
}

export interface V1TransformOutput {
  system: string[];
}

const MARKER = "[caveman:";

export function createV1ServerHooks(): (
  input: V1TransformInput,
  output: V1TransformOutput,
) => Promise<void> {
  return async (_input, output) => {
    const block = buildSystemBlock(readLevel());
    if (!block) return;

    const system = output?.system;
    if (!Array.isArray(system)) return;
    if (system.some((entry) => typeof entry === "string" && entry.includes(MARKER))) return;

    system.push(block);
  };
}
