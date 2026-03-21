import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const pythonPreset: Preset = {
  name: "python",
  files: readTemplateFiles("python"),
  merge: {
    "package.json": {
      scripts: {
        "lint:python": "ruff check . && ruff format --check .",
        "lint:mypy": "uv run mypy tests/",
      },
    },
    ".mise.toml": {
      tools: {
        python: "3.12",
        uv: "0.7",
        "pipx:ruff": "0.11",
        "pipx:mypy": "1",
      },
    },
    ".vscode/settings.json": {
      "mypy-type-checker.importStrategy": "fromEnvironment",
      "[python]": {
        "editor.defaultFormatter": "charliermarsh.ruff",
        "editor.codeActionsOnSave": {
          "source.fixAll.ruff": "explicit",
          "source.organizeImports.ruff": "explicit",
        },
      },
    },
    ".vscode/extensions.json": {
      recommendations: ["charliermarsh.ruff", "ms-python.mypy-type-checker", "ms-python.python"],
    },
    ".devcontainer/devcontainer.json": {
      customizations: {
        vscode: {
          extensions: ["charliermarsh.ruff", "ms-python.mypy-type-checker", "ms-python.python"],
        },
      },
      mounts: ["source=agentic-dev-uv-cache,target=/home/vscode/.cache/uv,type=volume"],
    },
    "lefthook.yaml": {
      "pre-commit": {
        commands: {
          "ruff-format": {
            glob: "*.py",
            run: "ruff format {staged_files}",
            stage_fixed: true,
          },
          "ruff-check": {
            glob: "*.py",
            run: "ruff check --fix {staged_files}",
            stage_fixed: true,
          },
        },
      },
      "pre-push": {
        commands: {
          mypy: { run: "uv run mypy tests/" },
        },
      },
    },
  },
  markdown: {
    "CLAUDE.md": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **Language**: Python 3.12+ (uv)",
      },
      {
        placeholder: "<!-- SECTION:TECH_STACK_LINTING -->",
        content: "  - Ruff (Python lint + format)\n  - mypy (Python type check)",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "tests/        -> Tests",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "uv sync                   # Install Python dependencies",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content:
          "pnpm run lint:python       # Ruff check\npnpm run lint:mypy         # mypy type check",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content: "uv run pytest              # Run Python tests",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content:
          "- Python: 3.12+, type hints required, Ruff for lint + format\n- Max line width: 100 (Ruff)",
      },
      {
        placeholder: "<!-- SECTION:PRE_PUSH_HOOKS -->",
        content: "mypy",
      },
      {
        placeholder: "<!-- SECTION:GIT_WORKFLOW -->",
        content: "- Lefthook `pre-push` runs mypy type check (`uv run mypy tests/`)",
      },
    ],
    ".claude/skills/lint-rules/SKILL.md": [
      {
        placeholder: "<!-- SECTION:LINT_RULES_TABLE -->",
        content: "| `.py` | `ruff format <files>` → `ruff check --fix <files>` |",
      },
      {
        placeholder: "<!-- SECTION:LINT_RULES_TYPECHECK -->",
        content:
          "## 型チェック\n\n- 変更ファイルに Python を含む場合は `uv run mypy tests/` も実行する",
      },
    ],
    ".claude/skills/test/SKILL.md": [
      {
        placeholder: "<!-- SECTION:TEST_STEPS -->",
        content: "1. `uv run pytest` で Python テスト実行",
      },
    ],
    ".claude/rules/git-workflow.md": [
      {
        placeholder: "<!-- SECTION:PRE_COMMIT_TOOLS -->",
        content: "  - Ruff",
      },
      {
        placeholder: "<!-- SECTION:GIT_WORKFLOW_PRE_PUSH -->",
        content: "mypy",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── tests/               # テスト",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content:
          "├── pyproject.toml       # Python プロジェクト設定（Ruff, mypy）\n├── uv.lock              # uv ロックファイル",
      },
      {
        placeholder: "<!-- SECTION:SETUP_STEPS -->",
        content: "1. `uv sync`（Python 依存パッケージ）",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "| `uv sync` | Python 依存パッケージインストール |",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content:
          "| `pnpm run lint:python` | Ruff チェック |\n| `pnpm run lint:mypy` | mypy 型チェック |",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content: "| `uv run pytest` | Python テスト実行 |",
      },
    ],
  },
  ciSteps: {
    setupSteps: [
      {
        name: "uv cache",
        uses: "actions/cache@5a3ec84eff668545956fd18022155c47e93e2684",
        with: {
          path: "~/.cache/uv",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression
          key: "uv-${{ runner.os }}-${{ hashFiles('uv.lock') }}",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression
          "restore-keys": "uv-${{ runner.os }}-",
        },
      },
      { name: "Install Python dependencies", run: "uv sync" },
    ],
    lintSteps: [
      { name: "Lint (Ruff)", run: "ruff check . && ruff format --check ." },
      { name: "Typecheck (mypy)", run: "uv run mypy tests/" },
    ],
    testSteps: [{ name: "Test (pytest)", run: "uv run pytest" }],
  },
  setupExtra: "uv sync",
};
