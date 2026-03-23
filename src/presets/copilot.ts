import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const copilotPreset: Preset = {
  name: "copilot",
  files: readTemplateFiles("copilot"),
  merge: {},
  mcpServers: {
    context7: {
      command: "npx",
      args: ["-y", "@upstash/context7-mcp@latest"],
    },
    fetch: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch"],
    },
  },
  markdown: {
    "agent-instructions": [],
    "README.md": [],
  },
};
