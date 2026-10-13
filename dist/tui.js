// src/tui/router.ts
var load = (name) => import(name);
var CavemanTui = {
  id: "opencode-caveman-simplified",
  tui: async (api, options, meta) => {
    const host = await load("./tui-v1.js");
    await host.run(api, options, meta);
  },
  setup: async (ctx) => {
    const host = await load("./tui-v2.js");
    return host.run(ctx);
  }
};
var router_default = CavemanTui;
export {
  router_default as default
};
