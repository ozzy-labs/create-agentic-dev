import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const cloudformationPreset: Preset = {
  name: "cloudformation",
  files: readTemplateFiles("cloudformation"),
  merge: {
    "package.json": {
      scripts: {
        "lint:cfn": "cfn-lint",
      },
    },
    ".mise.toml": {
      tools: {
        awscli: "2",
        "pipx:cfn-lint": "1",
      },
    },
    ".mcp.json": {
      mcpServers: {
        "aws-iac": {
          command: "uvx",
          args: ["awslabs.aws-iac-mcp@latest"],
        },
      },
    },
  },
  markdown: {
    "CLAUDE.md": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **IaC**: AWS CloudFormation",
      },
      {
        placeholder: "<!-- SECTION:TECH_STACK_LINTING -->",
        content: "  - cfn-lint (CloudFormation)",
      },
      {
        placeholder: "<!-- SECTION:TECH_STACK_MCP -->",
        content: "- **MCP servers**: AWS IaC — configured in `.mcp.json`",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "infra/        -> CloudFormation templates",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "pnpm run lint:cfn          # CloudFormation lint (cfn-lint)",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content: "- CloudFormation: must pass cfn-lint",
      },
    ],
    ".claude/skills/lint-rules/SKILL.md": [
      {
        placeholder: "<!-- SECTION:LINT_RULES_TABLE -->",
        content: "| CloudFormation テンプレート | `cfn-lint <files>` |",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── infra/               # CloudFormation テンプレート",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── .cfnlintrc.yaml      # cfn-lint 設定",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "| `pnpm run lint:cfn` | CloudFormation リント |",
      },
    ],
  },
  ciSteps: {
    lintSteps: [{ name: "Lint (cfn-lint)", run: "cfn-lint" }],
  },
};
