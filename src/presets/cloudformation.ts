import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const cloudformationPreset: Preset = {
  name: "cloudformation",
  files: readTemplateFiles("cloudformation"),
  merge: {
    "package.json": {
      scripts: {
        "lint:cfn": "cfn-lint infra/template.yaml",
      },
    },
    ".mise.toml": {
      tools: {
        "pipx:cfn-lint": "1",
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
        placeholder: "<!-- SECTION:INFRA_STRUCTURE -->",
        content: "CloudFormation",
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
        placeholder: "<!-- SECTION:INFRA_DIR_STRUCTURE -->",
        content: "CloudFormation",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── .cfnlintrc.yaml      # cfn-lint 設定",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "| `pnpm run lint:cfn` | CloudFormation リント |",
      },
      {
        placeholder: "<!-- SECTION:CD_SECTION -->",
        content:
          "| `AWS_ROLE_ARN` | デプロイ用 IAM ロール ARN（OIDC 認証） |\n| `AWS_REGION` | AWS リージョン（例: `ap-northeast-1`） |",
      },
    ],
  },
  ciSteps: {
    lintSteps: [{ name: "Lint (cfn-lint)", run: "cfn-lint infra/template.yaml" }],
  },
};
