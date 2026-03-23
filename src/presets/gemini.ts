import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const geminiPreset: Preset = {
  name: "gemini",
  files: readTemplateFiles("gemini"),
  merge: {
    ".gitignore": ".gemini/.env",
    ".devcontainer/devcontainer.json": {
      remoteEnv: {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        GEMINI_API_KEY: "${localEnv:GEMINI_API_KEY}",
      },
    },
  },
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
