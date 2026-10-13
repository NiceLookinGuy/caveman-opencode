import type { Plugin } from "@opencode-ai/plugin";
import { setupV2 } from "./server/v2.js";
declare const CavemanSimplifiedPlugin: {
    id: string;
    server: Plugin;
    setup: typeof setupV2;
};
export default CavemanSimplifiedPlugin;
