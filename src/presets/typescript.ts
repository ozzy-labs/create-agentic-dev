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
        vitest: "^3.0.0",
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
        content: "src/          -> TypeScript source code\ntests/        -> Test files (vitest)",
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
          "# Test\npnpm test                  # Run tests (vitest)\npnpm run test:watch        # Watch mode tests",
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
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content:
          "├── src/                 # TypeScript ソースコード\n├── tests/               # テスト（vitest）",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content:
          "├── biome.json           # Biome 設定\n├── tsconfig.json        # TypeScript 設定",
      },
      {
        placeholder: "<!-- SECTION:SETUP_STEPS -->",
        content: "3. `pnpm install`（Node.js 依存パッケージ）",
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
          "### テスト\n\n| コマンド | 説明 |\n|---------|------|\n| `pnpm test` | テスト実行（vitest） |\n| `pnpm run test:watch` | ウォッチモードテスト |",
      },
    ],
  },
  ciSteps: {
    lintSteps: [{ name: "Lint (Biome)", run: "biome check ." }],
    testSteps: [{ name: "Test", run: "pnpm test" }],
    buildSteps: [
      { name: "Typecheck", run: "tsc --noEmit" },
      { name: "Build", run: "pnpm run build" },
    ],
  },
};
