import type { Preset } from "../types.js";

export const awsPreset: Preset = {
  name: "aws",
  files: {},
  merge: {
    ".mise.toml": {
      tools: {
        awscli: "2",
      },
    },
    ".devcontainer/devcontainer.json": {
      mounts: [
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        "source=${localEnv:HOME}/.aws,target=/home/vscode/.aws,type=bind,consistency=cached",
      ],
    },
  },
  mcpServers: {
    "aws-iac": {
      command: "uvx",
      args: ["awslabs.aws-iac-mcp@latest"],
      env: {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: MCP env variable syntax
        AWS_PROFILE: "${AWS_PROFILE:-default}",
        // biome-ignore lint/suspicious/noTemplateCurlyInString: MCP env variable syntax
        AWS_REGION: "${AWS_REGION:-ap-northeast-1}",
      },
    },
  },
  markdown: {
    "CLAUDE.md": [
      {
        placeholder: "<!-- SECTION:TECH_STACK_MCP -->",
        content: "AWS IaC",
      },
    ],
  },
};
