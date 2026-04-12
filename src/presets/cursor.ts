import type { Preset } from "../types.js";
import { DEFAULT_MCP_SERVERS } from "./shared.js";

export const cursorPreset: Preset = {
  name: "cursor",
  mcpConfigPath: { path: ".cursor/mcp.json", format: "json" },
  files: {},
  merge: {},
  mcpServers: { ...DEFAULT_MCP_SERVERS },
  markdown: {
    "agent-instructions": [],
    "README.md": [],
  },
};
