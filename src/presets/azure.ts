import type { Preset } from "../types.js";

export const azurePreset: Preset = {
  name: "azure",
  files: {},
  merge: {
    ".mise.toml": {
      tools: {
        "pipx:azure-cli": "2",
      },
    },
    ".devcontainer/devcontainer.json": {
      mounts: [
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        "source=${localEnv:HOME}/.azure,target=/home/vscode/.azure,type=bind,consistency=cached",
      ],
    },
    ".mcp.json": {
      mcpServers: {
        azure: {
          command: "npx",
          args: ["-y", "@azure/mcp@latest", "server", "start"],
        },
      },
    },
  },
  markdown: {
    "CLAUDE.md": [
      {
        placeholder: "<!-- SECTION:TECH_STACK_MCP -->",
        content: "Azure",
      },
    ],
  },
};
