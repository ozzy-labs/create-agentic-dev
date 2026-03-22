import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const fastapiPreset: Preset = {
  name: "fastapi",
  requires: ["python"],
  files: readTemplateFiles("fastapi"),
  merge: {
    "package.json": {
      scripts: {
        "dev:api": "cd api && uv run uvicorn src.main:app --reload --port 8000",
        "test:api": "cd api && uv run pytest",
        "lint:api": "cd api && ruff check . && ruff format --check .",
      },
    },
    ".devcontainer/devcontainer.json": {
      forwardPorts: [8000],
    },
    "lefthook.yaml": {
      "pre-commit": {
        commands: {
          "ruff-format-api": {
            glob: "api/**/*.py",
            run: "cd api && ruff format {staged_files}",
            stage_fixed: true,
          },
          "ruff-check-api": {
            glob: "api/**/*.py",
            run: "cd api && ruff check --fix {staged_files}",
            stage_fixed: true,
          },
        },
      },
      "pre-push": {
        commands: {
          "mypy-api": { run: "cd api && uv run mypy ." },
        },
      },
    },
  },
  markdown: {
    "CLAUDE.md": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **Backend**: FastAPI (Python, uvicorn)",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "api/          -> Backend API (FastAPI)",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "cd api && uv sync         # Install API dependencies",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content:
          "pnpm run lint:api          # Ruff check (API)\npnpm run test:api          # FastAPI tests (pytest)",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content: "cd api && uv run pytest    # Run API tests",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content:
          "- FastAPI: Pydantic models for request/response, `Depends()` for DI\n- API tests: httpx.AsyncClient with ASGITransport",
      },
      {
        placeholder: "<!-- SECTION:PRE_PUSH_HOOKS -->",
        content: "mypy-api (API)",
      },
      {
        placeholder: "<!-- SECTION:GIT_WORKFLOW -->",
        content: "- Lefthook `pre-push` runs API mypy type check (`cd api && uv run mypy .`)",
      },
    ],
    ".claude/rules/git-workflow.md": [
      {
        placeholder: "<!-- SECTION:PRE_COMMIT_TOOLS -->",
        content: "  - Ruff (API)",
      },
      {
        placeholder: "<!-- SECTION:GIT_WORKFLOW_PRE_PUSH -->",
        content: "mypy-api",
      },
    ],
    ".claude/skills/lint-rules/SKILL.md": [
      {
        placeholder: "<!-- SECTION:LINT_RULES_TABLE -->",
        content:
          "| `api/**/*.py` | `cd api && ruff format <files>` → `cd api && ruff check --fix <files>` |",
      },
      {
        placeholder: "<!-- SECTION:LINT_RULES_TYPECHECK -->",
        content:
          "## 型チェック（API）\n\n- 変更ファイルに `api/` 配下の Python を含む場合は `cd api && uv run mypy .` も実行する",
      },
    ],
    ".claude/skills/test/SKILL.md": [
      {
        placeholder: "<!-- SECTION:TEST_STEPS -->",
        content: "1. `cd api && uv run pytest` で API テスト実行",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── api/                 # バックエンド API (FastAPI)",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── api/pyproject.toml   # API 依存・ツール設定",
      },
      {
        placeholder: "<!-- SECTION:SETUP_STEPS -->",
        content: "1. `cd api && uv sync`（API 依存パッケージ）",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "| `cd api && uv sync` | API 依存パッケージインストール |",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content: "| `pnpm run lint:api` | API Ruff チェック |",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content:
          "| `pnpm run test:api` | API テスト（pytest） |\n| `pnpm run dev:api` | API 開発サーバー起動（port 8000） |",
      },
    ],
  },
  ciSteps: {
    setupSteps: [{ name: "Install API dependencies", run: "cd api && uv sync" }],
    lintSteps: [
      { name: "Lint (API Ruff)", run: "cd api && ruff check . && ruff format --check ." },
      { name: "Typecheck (API mypy)", run: "cd api && uv run mypy ." },
    ],
    testSteps: [{ name: "Test (API pytest)", run: "cd api && uv run pytest" }],
  },
  setupExtra: "cd api && uv sync",
};
