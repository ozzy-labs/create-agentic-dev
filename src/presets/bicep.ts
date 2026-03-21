import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const bicepPreset: Preset = {
  name: "bicep",
  files: readTemplateFiles("bicep"),
  merge: {
    "package.json": {
      scripts: {
        "lint:bicep":
          "find infra -name '*.bicep' -exec az bicep build --file {} --stdout ; > /dev/null",
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
        placeholder: "<!-- SECTION:INFRA_STRUCTURE -->",
        content: "Bicep",
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
        placeholder: "<!-- SECTION:INFRA_DIR_STRUCTURE -->",
        content: "Bicep",
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
      {
        name: "Lint (Bicep)",
        run: "find infra -name '*.bicep' -exec az bicep build --file {} --stdout ; > /dev/null",
      },
    ],
  },
};
