import { buildSystemBlock } from "../core/prompt.js";
import { readLevel } from "../core/state.js";

export type V2HookKind = "context" | "compaction" | "generate" | "title";

const HOOK_KINDS: readonly V2HookKind[] = ["context", "compaction", "generate", "title"];
const MARKER = "[caveman:";

export interface V2SystemPart {
  type: string;
  text: string;
}

export interface V2HookInput {
  system?: V2SystemPart[];
}

export interface V2Registration {
  dispose: () => Promise<void> | void;
}

export interface V2SessionLike {
  hook: (
    kind: V2HookKind,
    callback: (input: V2HookInput) => void,
  ) => Promise<V2Registration>;
}

export interface V2ContextLike {
  session: V2SessionLike;
}

function applyBlock(input: V2HookInput | undefined): void {
  const block = buildSystemBlock(readLevel());
  if (!block) return;

  const system = input?.system;
  if (!Array.isArray(system)) return;
  if (system.some((part) => typeof part?.text === "string" && part.text.includes(MARKER))) return;

  system.push({ type: "text", text: block });
}

async function disposeAll(registrations: V2Registration[]): Promise<void> {
  await Promise.allSettled(
    registrations.map((registration) => Promise.resolve().then(() => registration.dispose())),
  );
}

export async function setupV2(contextInput: unknown): Promise<() => Promise<void>> {
  const context = contextInput as Partial<V2ContextLike> | null | undefined;
  const session = context?.session;
  if (!session || typeof session.hook !== "function") return async () => {};

  const registrations: V2Registration[] = [];
  try {
    for (const kind of HOOK_KINDS) {
      registrations.push(await session.hook(kind, applyBlock));
    }
  } catch (error) {
    await disposeAll(registrations);
    throw error;
  }

  return () => disposeAll(registrations);
}
