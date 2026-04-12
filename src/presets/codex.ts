import type { Preset } from "../types.js";
import { DEFAULT_MCP_SERVERS } from "./shared.js";

export const codexPreset: Preset = {
  name: "codex",
  mcpConfigPath: { path: ".codex/config.toml", format: "toml" },
  files: {},
  merge: {
    ".mise.toml": {
      tools: {
        "npm:@openai/codex": "latest",
      },
    },
    ".devcontainer/devcontainer.json": {
      remoteEnv: {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        OPENAI_API_KEY: "${localEnv:OPENAI_API_KEY}",
      },
    },
  },
  mcpServers: { ...DEFAULT_MCP_SERVERS },
  markdown: {
    "agent-instructions": [],
    "README.md": [],
  },
};
