import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const codexPreset: Preset = {
  name: "codex",
  files: readTemplateFiles("codex"),
  merge: {
    ".devcontainer/devcontainer.json": {
      remoteEnv: {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        OPENAI_API_KEY: "${localEnv:OPENAI_API_KEY}",
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
