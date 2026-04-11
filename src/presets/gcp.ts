import type { Preset } from "../types.js";

export const gcpPreset: Preset = {
  name: "gcp",
  files: {},
  merge: {
    ".mise.toml": {
      tools: {
        gcloud: "2",
      },
    },
    ".devcontainer/devcontainer.json": {
      mounts: [
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        "source=${localEnv:HOME}/.config/gcloud,target=/home/vscode/.config/gcloud,type=bind,consistency=cached",
      ],
    },
  },
  mcpServers: {
    "google-cloud": {
      command: "npx",
      args: ["-y", "@google-cloud/gcloud-mcp"],
    },
  },
  markdown: {
    "agent-instructions": [
      {
        placeholder: "<!-- SECTION:TECH_STACK_MCP -->",
        content: "Google Cloud",
      },
    ],
  },
};
