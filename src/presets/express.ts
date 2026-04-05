import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const expressPreset: Preset = {
  name: "express",
  requires: ["typescript"],
  files: readTemplateFiles("express"),
  merge: {
    "package.json": {
      scripts: {
        "dev:api": "cd api && pnpm run dev",
        "test:api": "cd api && pnpm test",
        "build:api": "cd api && pnpm run build",
        "typecheck:api": "cd api && tsc --noEmit",
      },
    },
    "biome.json": {
      files: {
        includes: ["!**/api/dist/"],
      },
    },
    ".devcontainer/devcontainer.json": {
      forwardPorts: [3000],
    },
    "lefthook.yaml": {
      "pre-push": {
        commands: {
          "typecheck-api": { run: "cd api && tsc --noEmit" },
        },
      },
    },
  },
  markdown: {
    "agent-instructions": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **Backend**: Express (TypeScript, tsdown)",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "api/          -> Backend API (Express)",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "cd api && pnpm install    # Install API dependencies",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content:
          "pnpm run typecheck:api     # API TypeScript type check\npnpm run test:api          # Express tests (vitest)",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content: "cd api && pnpm test        # Run API tests",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content:
          "- Express: export `app` from app.ts, `app.listen()` only in index.ts\n- API tests: supertest with imported app instance",
      },
      {
        placeholder: "<!-- SECTION:PRE_PUSH_HOOKS -->",
        content: "typecheck-api (API tsc)",
      },
      {
        placeholder: "<!-- SECTION:GIT_WORKFLOW -->",
        content: "- Lefthook `pre-push` runs API TypeScript typecheck (`cd api && tsc --noEmit`)",
      },
    ],
    ".claude/rules/git-workflow.md": [
      {
        placeholder: "<!-- SECTION:GIT_WORKFLOW_PRE_PUSH -->",
        content: "typecheck-api",
      },
    ],
    ".claude/skills/lint-rules/SKILL.md": [
      {
        placeholder: "<!-- SECTION:LINT_RULES_TABLE -->",
        content: "| `api/**/*.ts` | `biome check --fix <files>` (root biome.json) |",
      },
      {
        placeholder: "<!-- SECTION:LINT_RULES_TYPECHECK -->",
        content:
          "## 型チェック（API）\n\n- 変更ファイルに `api/` 配下の TypeScript を含む場合は `cd api && tsc --noEmit` も実行する",
      },
    ],
    ".claude/skills/test/SKILL.md": [
      {
        placeholder: "<!-- SECTION:TEST_STEPS -->",
        content: "1. `cd api && pnpm test` で API テスト実行",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── api/                 # バックエンド API (Express)",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── api/package.json     # API 依存・スクリプト",
      },
      {
        placeholder: "<!-- SECTION:SETUP_STEPS -->",
        content: "1. `cd api && pnpm install`（API 依存パッケージ）",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "| `cd api && pnpm install` | API 依存パッケージインストール |",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "| `pnpm run typecheck:api` | API TypeScript 型チェック |",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content: "| `pnpm run test:api` | API テスト（vitest） |",
      },
      {
        placeholder: "<!-- SECTION:DEV_COMMANDS -->",
        content: "| `pnpm run dev:api` | API 開発サーバー起動（port 3000） |",
      },
    ],
  },
  ciSteps: {
    setupSteps: [
      { name: "Install API dependencies", run: "cd api && pnpm install --frozen-lockfile" },
    ],
    lintSteps: [{ name: "Typecheck (API tsc)", run: "cd api && tsc --noEmit" }],
    testSteps: [{ name: "Test (API vitest)", run: "cd api && pnpm test" }],
    buildSteps: [{ name: "Build (API)", run: "cd api && pnpm run build" }],
  },
  setupExtra: "cd api && pnpm install",
};
