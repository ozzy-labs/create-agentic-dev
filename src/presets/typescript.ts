import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const typescriptPreset: Preset = {
  name: "typescript",
  files: readTemplateFiles("typescript"),
  merge: {
    "package.json": {
      scripts: {
        build: "tsdown",
        typecheck: "tsc --noEmit",
        test: "vitest run",
        "test:watch": "vitest",
        dev: "tsdown --watch",
        lint: "biome check",
        "lint:fix": "biome check --write",
      },
      devDependencies: {
        typescript: "^5.0.0",
        "@types/node": "^22.0.0",
        vitest: "^4.0.0",
        tsdown: "^0.12.0",
      },
    },
    ".mise.toml": {
      tools: {
        "npm:@biomejs/biome": "2",
      },
    },
    "lefthook.yaml": {
      "pre-commit": {
        commands: {
          biome: {
            glob: "*.{ts,tsx,js,jsx,json,jsonc}",
            run: "biome check --write {staged_files}",
            stage_fixed: true,
          },
        },
      },
      "pre-push": {
        commands: {
          typecheck: { run: "tsc --noEmit" },
        },
      },
    },
  },
  markdown: {
    "CLAUDE.md": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: '- **Language**: TypeScript (ESM, strict mode, `"type": "module"`)',
      },
      {
        placeholder: "<!-- SECTION:TECH_STACK_LINTING -->",
        content: "  - Biome (TypeScript/JavaScript/JSON)",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "src/          -> Source code\ntests/        -> Tests",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "pnpm install              # Install dependencies",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content:
          "pnpm run lint              # Biome check\npnpm run lint:fix          # Biome check with auto-fix\npnpm run typecheck         # TypeScript type check",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content:
          "pnpm test                  # Run tests (vitest)\npnpm run test:watch        # Watch mode tests",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content:
          '- TypeScript: ESM (`"type": "module"`), strict mode, NodeNext module resolution\n- Use `import type` for type-only imports (verbatimModuleSyntax enabled)\n- Max line width: 100 (Biome)',
      },
      {
        placeholder: "<!-- SECTION:PRE_PUSH_HOOKS -->",
        content: "typecheck (tsc)",
      },
      {
        placeholder: "<!-- SECTION:GIT_WORKFLOW -->",
        content: "- Lefthook `pre-push` runs TypeScript typecheck (`tsc --noEmit`)",
      },
    ],
    ".claude/skills/test/SKILL.md": [
      {
        placeholder: "<!-- SECTION:TEST_STEPS -->",
        content: "1. `pnpm test` で TypeScript テスト実行（vitest）",
      },
    ],
    ".claude/rules/git-workflow.md": [
      {
        placeholder: "<!-- SECTION:PRE_COMMIT_TOOLS -->",
        content: ", Biome",
      },
      {
        placeholder: "<!-- SECTION:GIT_WORKFLOW_PRE_PUSH -->",
        content: "typecheck",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── src/                 # ソースコード\n├── tests/               # テスト",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content:
          "├── biome.json           # Biome 設定\n├── tsconfig.json        # TypeScript 設定",
      },
      {
        placeholder: "<!-- SECTION:SETUP_STEPS -->",
        content: "1. `pnpm install`（Node.js 依存パッケージ）",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "| `pnpm install` | Node.js 依存パッケージインストール |",
      },
      {
        placeholder: "<!-- SECTION:LINT_COMMANDS -->",
        content:
          "| `pnpm run lint` | Biome チェック |\n| `pnpm run lint:fix` | Biome チェック（自動修正） |\n| `pnpm run typecheck` | TypeScript 型チェック |",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content:
          "| `pnpm test` | テスト実行（vitest） |\n| `pnpm run test:watch` | ウォッチモードテスト |",
      },
    ],
  },
  ciSteps: {
    lintSteps: [{ name: "Lint (Biome)", run: "biome check ." }],
    testSteps: [{ name: "Test", run: "pnpm test" }],
    buildSteps: [
      { name: "Typecheck (TypeScript)", run: "tsc --noEmit" },
      { name: "Build", run: "pnpm run build" },
    ],
  },
};
