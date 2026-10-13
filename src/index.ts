import type { Plugin } from "@opencode-ai/plugin";

import { createV1ServerHooks } from "./server/v1.js";
import { setupV2 } from "./server/v2.js";

const server: Plugin = async () => ({
  "experimental.chat.system.transform": createV1ServerHooks(),
});

// NOTE: Do NOT export anything else from the entry. OpenCode treats every
// named export as a plugin instance. v1 reads `id` + `server`; v2 reads `setup`.
const CavemanSimplifiedPlugin = {
  id: "opencode-caveman-simplified",
  server,
  setup: setupV2,
};

export default CavemanSimplifiedPlugin;
