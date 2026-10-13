interface TuiHostModule {
  run: (...args: unknown[]) => unknown;
}

const load = (name: string): Promise<TuiHostModule> =>
  import(name) as Promise<TuiHostModule>;

const CavemanTui = {
  id: "opencode-caveman-simplified",
  tui: async (api: unknown, options?: unknown, meta?: unknown): Promise<void> => {
    const host = await load("./tui-v1.js");
    await host.run(api, options, meta);
  },
  setup: async (ctx: unknown): Promise<unknown> => {
    const host = await load("./tui-v2.js");
    return host.run(ctx);
  },
};

export default CavemanTui;
