import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const cdkPreset: Preset = {
  name: "cdk",
  requires: ["typescript"],
  files: readTemplateFiles("cdk"),
  merge: {
    "package.json": {
      scripts: {
        "cdk:synth": "cd infra && npx cdk synth",
        "cdk:deploy": "cd infra && npx cdk deploy",
        "cdk:diff": "cd infra && npx cdk diff",
        "test:infra": "cd infra && pnpm test",
        "lint:cfn": "cfn-lint",
      },
    },
    ".mise.toml": {
      tools: {
        awscli: "2",
        "npm:aws-cdk": "2",
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
        content: "- **IaC**: AWS CDK v2 (TypeScript)",
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
        content: "infra/        -> CDK infrastructure (bin/, lib/, test/)",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "cd infra && pnpm install  # Install CDK dependencies",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "pnpm run lint:cfn          # CloudFormation lint (cfn-lint)",
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
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content:
          "├── infra/               # CDK インフラストラクチャ\n│   ├── bin/             # CDK アプリエントリポイント\n│   ├── lib/             # スタック定義\n│   └── test/            # インフラテスト",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── .cfnlintrc.yaml      # cfn-lint 設定",
      },
      {
        placeholder: "<!-- SECTION:SETUP_STEPS -->",
        content: "4. `cd infra && pnpm install`（CDK 依存パッケージ）",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "| `cd infra && pnpm install` | CDK 依存パッケージインストール |",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "| `pnpm run lint:cfn` | CloudFormation リント |",
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
