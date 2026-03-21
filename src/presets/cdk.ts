import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const cdkPreset: Preset = {
  name: "cdk",
  requires: ["typescript"],
  files: readTemplateFiles("cdk"),
  merge: {
    ".gitignore": "# CDK\ncdk.out/\ncdk.context.json\n!infra/**/*.d.ts",
    "package.json": {
      scripts: {
        "cdk:synth": "cd infra && npx cdk synth",
        "cdk:deploy": "cd infra && npx cdk deploy",
        "cdk:diff": "cd infra && npx cdk diff",
        "test:infra": "cd infra && pnpm test",
        "typecheck:infra": "cd infra && tsc --noEmit",
        "lint:cfn": "cfn-lint",
      },
    },
    ".mise.toml": {
      tools: {
        "npm:aws-cdk": "2",
        "pipx:cfn-lint": "1",
      },
    },
    ".vscode/settings.json": {
      "search.exclude": {
        "**/cdk.out": true,
      },
    },
    ".vscode/extensions.json": {
      recommendations: ["amazonwebservices.aws-toolkit-vscode"],
    },
    ".devcontainer/devcontainer.json": {
      customizations: {
        vscode: {
          extensions: ["amazonwebservices.aws-toolkit-vscode"],
        },
      },
    },
  },
  markdown: {
    "CLAUDE.md": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **IaC**: AWS CDK v2 (TypeScript)",
      },
      {
        placeholder: "<!-- SECTION:TECH_STACK_LINTING -->",
        content: "  - cfn-lint (CloudFormation)",
      },
      {
        placeholder: "<!-- SECTION:INFRA_STRUCTURE -->",
        content: "CDK (bin/, lib/, test/)",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "cd infra && pnpm install  # Install CDK dependencies",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content:
          "pnpm run typecheck:infra   # CDK TypeScript type check\npnpm run lint:cfn          # CloudFormation lint (cfn-lint)",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content: "pnpm run test:infra         # CDK infrastructure tests",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content: "- CDK: cdk-nag for security best practices",
      },
    ],
    ".claude/skills/lint-rules/SKILL.md": [
      {
        placeholder: "<!-- SECTION:LINT_RULES_TABLE -->",
        content: "| CloudFormation テンプレート | `cfn-lint <files>` |",
      },
    ],
    ".claude/skills/test/SKILL.md": [
      {
        placeholder: "<!-- SECTION:TEST_STEPS -->",
        content: "1. `cd infra && pnpm test` で CDK インフラテスト実行",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:INFRA_DIR_STRUCTURE -->",
        content: "CDK (bin/, lib/, test/)",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── .cfnlintrc.yaml      # cfn-lint 設定",
      },
      {
        placeholder: "<!-- SECTION:SETUP_STEPS -->",
        content: "1. `cd infra && pnpm install`（CDK 依存パッケージ）",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "| `cd infra && pnpm install` | CDK 依存パッケージインストール |",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content:
          "| `pnpm run typecheck:infra` | CDK TypeScript 型チェック |\n| `pnpm run lint:cfn` | CloudFormation リント |",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content:
          "| `pnpm run test:infra` | CDK インフラテスト |\n| `pnpm run cdk:synth` | CDK テンプレート合成 |\n| `pnpm run cdk:diff` | CDK 差分確認 |",
      },
    ],
  },
  ciSteps: {
    setupSteps: [
      { name: "Install infra dependencies", run: "cd infra && pnpm install --frozen-lockfile" },
      { name: "CDK synth", run: "cd infra && npx cdk synth" },
    ],
    lintSteps: [{ name: "Lint (cfn-lint)", run: "cfn-lint" }],
    testSteps: [{ name: "Test (CDK)", run: "cd infra && pnpm test" }],
  },
  setupExtra: "cd infra && pnpm install",
};
