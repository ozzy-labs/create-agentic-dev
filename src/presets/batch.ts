import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const batchPreset: Preset = {
  name: "batch",
  requires: ["typescript"],
  files: readTemplateFiles("batch"),
  merge: {
    "package.json": {
      scripts: {
        "dev:worker": "cd worker && pnpm run dev",
        "test:worker": "cd worker && pnpm test",
        "build:worker": "cd worker && pnpm run build",
        "typecheck:worker": "cd worker && tsc --noEmit",
      },
    },
    "biome.json": {
      files: {
        includes: ["!**/worker/dist/"],
      },
    },
    "lefthook.yaml": {
      "pre-push": {
        commands: {
          "typecheck-worker": { run: "cd worker && tsc --noEmit" },
        },
      },
    },
  },
  markdown: {
    "agent-instructions": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **Backend**: Batch/Worker (TypeScript, tsdown)",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "worker/       -> Batch/Worker processing",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "cd worker && pnpm install # Install worker dependencies",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content:
          "pnpm run typecheck:worker  # Worker TypeScript type check\npnpm run test:worker       # Worker tests (vitest)",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content: "cd worker && pnpm test     # Run worker tests",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content:
          "- Worker: define job types with explicit interfaces, entrypoint in index.ts delegates to processor modules\n- Worker tests: test processor functions in isolation",
      },
      {
        placeholder: "<!-- SECTION:PRE_PUSH_HOOKS -->",
        content: "typecheck-worker (Worker tsc)",
      },
      {
        placeholder: "<!-- SECTION:GIT_WORKFLOW -->",
        content:
          "- Lefthook `pre-push` runs Worker TypeScript typecheck (`cd worker && tsc --noEmit`)",
      },
    ],
    ".claude/rules/git-workflow.md": [
      {
        placeholder: "<!-- SECTION:GIT_WORKFLOW_PRE_PUSH -->",
        content: "typecheck-worker",
      },
    ],
    ".claude/skills/lint-rules/SKILL.md": [
      {
        placeholder: "<!-- SECTION:LINT_RULES_TABLE -->",
        content: "| `worker/**/*.ts` | `biome check --fix <files>` (root biome.json) |",
      },
      {
        placeholder: "<!-- SECTION:LINT_RULES_TYPECHECK -->",
        content:
          "## 型チェック（Worker）\n\n- 変更ファイルに `worker/` 配下の TypeScript を含む場合は `cd worker && tsc --noEmit` も実行する",
      },
    ],
    ".claude/skills/test/SKILL.md": [
      {
        placeholder: "<!-- SECTION:TEST_STEPS -->",
        content: "1. `cd worker && pnpm test` で Worker テスト実行",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── worker/              # バッチ/ワーカー処理",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── worker/package.json  # Worker 依存・スクリプト",
      },
      {
        placeholder: "<!-- SECTION:SETUP_STEPS -->",
        content: "1. `cd worker && pnpm install`（Worker 依存パッケージ）",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "| `cd worker && pnpm install` | Worker 依存パッケージインストール |",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "| `pnpm run typecheck:worker` | Worker TypeScript 型チェック |",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content:
          "| `pnpm run test:worker` | Worker テスト（vitest） |\n| `pnpm run dev:worker` | Worker 開発モード（tsx watch） |",
      },
    ],
  },
  ciSteps: {
    setupSteps: [
      { name: "Install Worker dependencies", run: "cd worker && pnpm install --frozen-lockfile" },
    ],
    lintSteps: [{ name: "Typecheck (Worker tsc)", run: "cd worker && tsc --noEmit" }],
    testSteps: [{ name: "Test (Worker vitest)", run: "cd worker && pnpm test" }],
    buildSteps: [{ name: "Build (Worker)", run: "cd worker && pnpm run build" }],
  },
  setupExtra: "cd worker && pnpm install",
};
