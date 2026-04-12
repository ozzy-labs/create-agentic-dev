import type { Preset } from "../types.js";
import { DEFAULT_MCP_SERVERS } from "./shared.js";

export const copilotPreset: Preset = {
  name: "copilot",
  mcpConfigPath: { path: ".copilot/mcp-config.json", format: "json" },
  files: {},
  merge: {
    ".mise.toml": {
      tools: {
        "npm:@github/copilot": "latest",
      },
    },
  },
  mcpServers: { ...DEFAULT_MCP_SERVERS },
  markdown: {
    "agent-instructions": [],
    "README.md": [],
  },
};
