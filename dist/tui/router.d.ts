declare const CavemanTui: {
    id: string;
    tui: (api: unknown, options?: unknown, meta?: unknown) => Promise<void>;
    setup: (ctx: unknown) => Promise<unknown>;
};
export default CavemanTui;
