export type V2HookKind = "context" | "compaction" | "generate" | "title";
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
    hook: (kind: V2HookKind, callback: (input: V2HookInput) => void) => Promise<V2Registration>;
}
export interface V2ContextLike {
    session: V2SessionLike;
}
export declare function setupV2(contextInput: unknown): Promise<() => Promise<void>>;
