export interface V1TransformInput {
    sessionID?: string;
    model?: unknown;
}
export interface V1TransformOutput {
    system: string[];
}
export declare function createV1ServerHooks(): (input: V1TransformInput, output: V1TransformOutput) => Promise<void>;
