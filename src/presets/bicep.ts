import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const bicepPreset: Preset = {
  name: "bicep",
  files: readTemplateFiles("bicep"),
  merge: {
    "package.json": {
      scripts: {
        "lint:bicep": "az bicep build --file infra/main.bicep --stdout > /dev/null",
      },
    },
    ".mise.toml": {
      tools: {
        "pipx:azure-cli": "2",
      },
    },
    ".vscode/extensions.json": {
      recommendations: ["ms-azuretools.vscode-bicep"],
    },
    ".devcontainer/devcontainer.json": {
      customizations: {
        vscode: {
          extensions: ["ms-azuretools.vscode-bicep"],
        },
      },
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
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **IaC**: Azure Bicep",
      },
      {
        placeholder: "<!-- SECTION:TECH_STACK_LINTING -->",
        content: "  - az bicep build (Bicep)",
      },
      {
        placeholder: "<!-- SECTION:TECH_STACK_MCP -->",
        content: "- **MCP servers**: Azure — configured in `.mcp.json`",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "infra/        -> Bicep infrastructure templates",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "pnpm run lint:bicep        # Bicep lint (az bicep build)",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content: "- Bicep: must pass `az bicep build`",
      },
    ],
    ".claude/skills/lint-rules/SKILL.md": [
      {
        placeholder: "<!-- SECTION:LINT_RULES_TABLE -->",
        content: "| Bicep テンプレート | `az bicep build --file <file>` |",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── infra/               # Bicep インフラストラクチャテンプレート",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── bicepconfig.json     # Bicep リンター設定",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "| `pnpm run lint:bicep` | Bicep リント |",
      },
    ],
  },
  ciSteps: {
    lintSteps: [
      { name: "Lint (Bicep)", run: "az bicep build --file infra/main.bicep --stdout > /dev/null" },
    ],
  },
};
