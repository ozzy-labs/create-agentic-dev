import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const terraformPreset: Preset = {
  name: "terraform",
  files: readTemplateFiles("terraform"),
  merge: {
    ".gitignore":
      "# Terraform\n.terraform/\n*.tfstate\n*.tfstate.*\ncrash.log\noverride.tf\noverride.tf.json\n*_override.tf\n*_override.tf.json\n.terraformrc\nterraform.rc",
    "package.json": {
      scripts: {
        "lint:tf": "terraform fmt -check -recursive && tflint",
      },
    },
    ".mise.toml": {
      tools: {
        terraform: "1",
        tflint: "0.55",
      },
    },
    ".vscode/extensions.json": {
      recommendations: ["hashicorp.terraform"],
    },
    ".devcontainer/devcontainer.json": {
      customizations: {
        vscode: {
          extensions: ["hashicorp.terraform"],
        },
      },
    },
  },
  markdown: {
    "CLAUDE.md": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **IaC**: Terraform",
      },
      {
        placeholder: "<!-- SECTION:TECH_STACK_LINTING -->",
        content: "  - tflint (Terraform)",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "*.tf          -> Terraform configuration files",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "pnpm run lint:tf           # Terraform fmt + tflint",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content: "- Terraform: must pass `terraform fmt` and tflint",
      },
    ],
    ".claude/skills/lint-rules/SKILL.md": [
      {
        placeholder: "<!-- SECTION:LINT_RULES_TABLE -->",
        content: "| `*.tf` | `terraform fmt <files>` → `tflint` |",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── *.tf                 # Terraform 設定ファイル",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── .tflint.hcl          # tflint 設定",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "| `pnpm run lint:tf` | Terraform フォーマット + tflint |",
      },
      {
        placeholder: "<!-- SECTION:CD_SECTION -->",
        content:
          "| `AWS_ROLE_ARN` | デプロイ用 IAM ロール ARN（OIDC 認証） |\n| `AWS_REGION` | AWS リージョン（例: `ap-northeast-1`） |",
      },
    ],
  },
  ciSteps: {
    lintSteps: [{ name: "Lint (Terraform)", run: "terraform fmt -check -recursive && tflint" }],
  },
};
