import type { Preset } from "../types.js";
import { DEFAULT_MCP_SERVERS } from "./shared.js";

export const geminiPreset: Preset = {
  name: "gemini",
  mcpConfigPath: { path: ".gemini/settings.json", format: "json" },
  files: {
    ".gemini/settings.json": `${JSON.stringify({ context: { fileName: "AGENTS.md" } }, null, 2)}\n`,
  },
  merge: {
    ".gitignore": ".gemini/.env",
    ".devcontainer/devcontainer.json": {
      remoteEnv: {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        GEMINI_API_KEY: "${localEnv:GEMINI_API_KEY}",
      },
    },
  },
  mcpServers: { ...DEFAULT_MCP_SERVERS },
  markdown: {
    "agent-instructions": [],
    "README.md": [],
  },
};
