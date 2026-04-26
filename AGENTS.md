# AGENTS.md

## Project Overview

`create-agentic-app`: CLI tool that scaffolds AI-agent-native development projects with interactive presets. Companion to [agentic-dev-template](https://github.com/ozzy-labs/agentic-dev-template).

## Tech Stack

- **Runtime**: Node.js 24 (ESM)
- **Package manager**: pnpm 10
- **Version management**: mise (`.mise.toml`)
- **Build**: tsdown (Rolldown-based)
- **Test**: vitest
- **Linting/Formatting**:
  - Biome (TS/JS/JSON)
  - shellcheck + shfmt (Shell)
  - markdownlint-cli2 + mdformat (Markdown)
  - yamlfmt + yamllint (YAML)
  - taplo (TOML)
  - actionlint (GitHub Actions)
- **Security**: Gitleaks (secrets)
- **Git hooks**: lefthook (commit-msg: commitlint, pre-commit: linters + gitleaks, pre-push: typecheck)

## Project Structure

```text
src/              -> CLI source code
src/presets/      -> Preset logic (merge contributions, dependencies)
templates/        -> Preset file assets (copied as-is to output)
tests/            -> Test files
docs/             -> Design docs, guides
scripts/          -> Shell scripts
```

## Key Commands

```bash
# Development
pnpm install               # Install dependencies
pnpm run dev               # Watch mode build
pnpm run build             # Production build
pnpm test                  # Run tests
pnpm run test:watch        # Watch mode tests
pnpm run verify            # Verify generated output (required before commit)

# Lint & Format
pnpm run lint              # Biome check
pnpm run lint:fix          # Biome check with auto-fix
pnpm run lint:all          # All linters + typecheck + gitleaks
pnpm run typecheck         # TypeScript type check
pnpm run lint:md           # Markdown lint
pnpm run lint:yaml         # YAML lint
pnpm run lint:shell        # Shell lint
pnpm run lint:toml         # TOML format check
pnpm run lint:secrets      # Secret detection (Gitleaks)
```

## Coding Conventions

- TypeScript: ESM (`"type": "module"`), strict mode, NodeNext module resolution
- Use `import type` for type-only imports (verbatimModuleSyntax enabled)
- Indent: 2 spaces (TS/JS/JSON/YAML)
- Line endings: LF only
- Max line width: 100 (Biome)
- All code must pass `pnpm run lint:all` before committing
- Shell: must pass shellcheck and shfmt
- YAML file extension: `.yaml` (not `.yml`, unless required by tools)

## Verification (Required)

Any code change **must** pass the following checks before reporting completion:

1. `pnpm run build` — Build succeeds
2. `pnpm test` — All tests pass (includes verify)
3. `pnpm run typecheck` — Type check passes

Fix any errors on the spot and ensure all pass before reporting.

`pnpm run verify` runs only the verification tests that validate generated output across all preset combinations: JSON validity, preset isolation, correct composition of shared files (VSCode, devcontainer, package.json), and extension consistency.

## Architecture

- **Preset Composition**: Each preset provides owned files + merge contributions to shared files
- **Merge strategy**: JSON/YAML deep merge, TOML deep merge, Markdown template + section injection
- **Dependency chains**: React/CDK force TypeScript; IaC presets auto-add related tools
- See `docs/design.md` for full design document

## Commit Convention

Conventional Commits required (enforced by commitlint):

```text
<type>[optional scope]: <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

<!-- begin: @ozzylabs/skills -->

## Available Skills

- `commit` — 変更をステージし、Conventional Commits でコミットする。プッシュや PR 作成は行わない。
- `commit-conventions` — Conventional Commits のメッセージ生成ルール（Type/Scope 判定表、フォーマット）。他スキルから参照される。
- `drive` — Issue から実装・PR 作成・セルフレビュー・修正を自動で回し、merge-ready な PR を出す。Issue 番号またはテキスト指示を受け取る。オプションでマージまで実行可能。
- `implement` — Issue または指示をもとに、ブランチ作成・実装計画・コード変更を行う。Issue 番号またはテキスト指示を受け取る。
- `lint` — 全リンターを自動修正付きで実行し、結果を報告する。コード品質チェック、フォーマット、型チェック、セキュリティスキャンを含む。
- `lint-rules` — 拡張子別リンター・フォーマッターのコマンド対応表と型チェックルール。他スキルから参照される。
- `pr` — コミット済みの変更をリモートにプッシュし、PR を作成・更新する。
- `review` — コード変更や PR をレビューし、問題点・改善案を報告する。PR 番号または空（ワーキングツリー）を受け取る。
- `ship` — lint・コミット・PR 作成を一括実行する。変更に対して lint → コミット → PR 作成を順に実行する統合パイプライン。
- `test` — ビルド・テスト・型チェックを実行し、結果を報告する。

<!-- end: @ozzylabs/skills -->

## Branching

GitHub Flow: `main` + feature branches. **squash merge only**.
Branch naming: `<type>/<short-description>` (e.g., `feat/add-wizard`, `fix/merge-bug`).
See [`docs/branch-strategy.md`](docs/branch-strategy.md) for full details.
