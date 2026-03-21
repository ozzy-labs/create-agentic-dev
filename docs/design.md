# Design Document

## Overview

`create-agentic-dev` is a CLI tool that scaffolds AI-agent-native development projects with interactive presets.

- **Distribution**: npm package (`npm create agentic-dev`)
- **Prompt library**: @clack/prompts
- **Architecture**: Preset Composition (composable presets merged into final project)
- **Relationship**: Companion to [agentic-dev-template](https://github.com/ozzy-3/agentic-dev-template)

## Wizard Selections

5 questions only. Only ask what fundamentally changes project structure.

| # | Question | Type | Options |
|---|----------|------|---------|
| 1 | Project name | Text input | — |
| 2 | Language toolchains | Multi-select | TypeScript / Python |
| 3 | Frontend app | Single-select | None / React + Vite / Next.js |
| 4 | Cloud providers | Multi-select | AWS / Azure |
| 5 | Infrastructure as Code | Multi-select | None / CDK / CloudFormation / Terraform / Bicep (filtered by selected cloud providers) |

## Presets

11 presets, mapped 1:1 to wizard selections.

| Preset | Trigger | Requires |
|--------|---------|----------|
| `base` | Always applied | — |
| `typescript` | Language: TypeScript | — |
| `python` | Language: Python | — |
| `react` | Frontend: React + Vite | `typescript` (forced) |
| `nextjs` | Frontend: Next.js | `typescript` (forced) |
| `aws` | Cloud: AWS | — |
| `azure` | Cloud: Azure | — |
| `cdk` | IaC: CDK (AWS) | `typescript` (forced) |
| `cloudformation` | IaC: CloudFormation (AWS) | — |
| `terraform` | IaC: Terraform (AWS, Azure) | — |
| `bicep` | IaC: Bicep (Azure) | — |

### プリセットレイヤー

| レイヤー | カテゴリ | 選択方式 | プリセット |
|---------|---------|---------|-----------|
| 0 | Base | 常に適用 | `base` |
| 1 | Language | 複数選択可 | `typescript`, `python` |
| 2 | Frontend | 単一選択（排他） | `react`, `nextjs` |
| 3 | Cloud | 複数選択可 | `aws`, `azure` |
| 4 | IaC | 複数選択可、Cloud に依存 | `cdk`, `cloudformation`, `terraform`, `bicep` |

**相互作用ルール:**

- **同レイヤー内**: プリセットは独立に合成される（競合しない設計が前提）。例外: Frontend は排他（単一選択）
- **レイヤー間依存**: プリセットの `requires` フィールドで番号が小さいレイヤーのプリセットを強制（例: CDK → TypeScript）
- **フィルタリング**: 番号が大きいレイヤーの選択肢は、番号が小さいレイヤーの選択に基づきフィルタされる（例: IaC の選択肢は選択された Cloud に依存）

**新プリセット追加時** は、いずれかのレイヤーに割り当てる。既存レイヤーに該当しない場合は、新レイヤーの追加とウィザードフローの更新を検討する。

Application order: `base → typescript → python → react → nextjs → aws → azure → cdk → cloudformation → terraform → bicep`

### Always Included (base)

| Category | Elements | Files |
|----------|----------|-------|
| Git | .gitignore, .gitattributes, EditorConfig, lefthook, commitlint, Gitleaks | `.gitignore`, `.gitattributes`, `.editorconfig`, `.commitlintrc.yaml` |
| Package management | mise, pnpm | `.mise.toml`, `package.json`, `pnpm-lock.yaml`, `.npmrc` |
| Shell | shellcheck, shfmt | via lefthook / CI |
| Markdown | markdownlint, mdformat | `.markdownlint-cli2.yaml`, `.mdformat.toml` |
| YAML | yamllint, yamlfmt | `.yamllint.yaml`, `.yamlfmt.yaml` |
| TOML | taplo | via lefthook / CI |
| GitHub Actions | actionlint | via lefthook / CI |
| Docker | devcontainer (common only), hadolint, dockerfmt, dclint | `.devcontainer/` (4 files), `.hadolint.yaml`, `.dockerignore` |
| Security | Trivy, Gitleaks | `trivy.yaml` |
| Claude Code | Skills, Rules, Settings | `.claude/` (skills, rules, settings.json) |
| GitHub | CI workflow, PR template, CODEOWNERS, rulesets | `.github/` |
| VSCode | Editor settings (common only), extensions (common only) | `.vscode/` |
| MCP | Context7, Fetch | `.mcp.json`, `.mcp.json.example` |
| Docs | CLAUDE.md, README.md, adding-tools.md, branch-strategy.md | `CLAUDE.md`, `README.md`, `docs/` |
| Scripts | setup, configure-repo, apply-rulesets | `scripts/` |
| Renovate | Dependency auto-update | `renovate.json` |

### Language Selection

**TypeScript** — adds:

| Element | Files |
|---------|-------|
| Biome (lint + format) | `biome.json` |
| tsconfig | `tsconfig.json` |
| Node.js devDeps | `package.json` (devDependencies) |
| Sample code | `src/index.ts` |
| Tests | `tests/index.test.ts` |
| VSCode: Biome formatter settings | `.vscode/settings.json` (merge) |
| VSCode: Biome extension | `.vscode/extensions.json` (merge) |
| devcontainer: Biome extension | `.devcontainer/devcontainer.json` (merge) |

**Python** — adds:

| Element | Files |
|---------|-------|
| Ruff (lint + format) | `pyproject.toml` |
| mypy (type check) | `pyproject.toml` |
| uv (package manager) | `uv.lock` |
| Tests | `tests/test_placeholder.py`, `tests/__init__.py` |
| VSCode: Ruff/mypy/Python settings | `.vscode/settings.json` (merge) |
| VSCode: Ruff, mypy, Python extensions | `.vscode/extensions.json` (merge) |
| devcontainer: Python extensions, uv-cache mount | `.devcontainer/devcontainer.json` (merge) |

### Frontend Selection (forces TypeScript)

**React + Vite** — adds: Vite + React dependencies, configuration, boilerplate

**Next.js** — adds: Next.js + React dependencies, App Router scaffold, configuration

### Cloud Provider Selection

**AWS** — adds:

| Element | Files |
|---------|-------|
| AWS CLI | via mise |
| MCP: AWS IaC | `.mcp.json` (auto-added) |
| devcontainer: ~/.aws mount | `.devcontainer/devcontainer.json` (merge) |

**Azure** — adds:

| Element | Files |
|---------|-------|
| Azure CLI | via mise (`pipx:azure-cli`) |
| MCP: Azure | `.mcp.json` (auto-added) |
| devcontainer: ~/.azure mount | `.devcontainer/devcontainer.json` (merge) |

### IaC Selection

**CDK** (AWS, forces TypeScript) — adds:

| Element | Files |
|---------|-------|
| CDK infrastructure | `infra/` (bin/app.ts, lib/app-stack.ts, test/, cdk.json, tsconfig.json, package.json) |
| cfn-lint | `.cfnlintrc.yaml` |
| cdk-nag | `infra/package.json` (dependency) |
| CD workflow | `.github/workflows/cd.yaml` |
| VSCode: cdk.out search exclude | `.vscode/settings.json` (merge) |
| VSCode: AWS Toolkit extension | `.vscode/extensions.json` (merge) |
| devcontainer: AWS Toolkit extension | `.devcontainer/devcontainer.json` (merge) |

**CloudFormation** — adds:

| Element | Files |
|---------|-------|
| CFn templates directory | `infra/` (template files) |
| cfn-lint | `.cfnlintrc.yaml` |
| CD workflow | `.github/workflows/cd.yaml` |

**Terraform** — adds:

| Element | Files |
|---------|-------|
| tflint | `.tflint.hcl` |
| terraform | via mise |
| CD workflow | `.github/workflows/cd.yaml` |

**Bicep** (Azure) — adds:

| Element | Files |
|---------|-------|
| Bicep templates directory | `infra/` (main.bicep) |
| bicepconfig.json | `bicepconfig.json` |
| CD workflow | `.github/workflows/cd.yaml` |
| VSCode: Bicep extension | `.vscode/extensions.json` (merge) |
| devcontainer: Bicep extension | `.devcontainer/devcontainer.json` (merge) |

## Preset Composition

### Each preset provides

1. **Owned files** — files exclusively owned by the preset (copied as-is)
2. **Merge contributions** — partial configs to merge into shared files

### Shared files (modified by multiple presets)

| Shared file | Modified by |
|-------------|-------------|
| `package.json` | base, typescript, python, react, nextjs, cdk, bicep |
| `.mise.toml` | base, typescript, python, aws, azure, cdk, cloudformation, terraform |
| `lefthook.yaml` | base, typescript, python |
| `.github/workflows/ci.yaml` | base, typescript, python, cdk, cloudformation, terraform, bicep |
| `.github/workflows/cd.yaml` | cdk, cloudformation, terraform, bicep |
| `.mcp.json` | base, aws, azure |
| `.vscode/settings.json` | typescript, python, nextjs, cdk |
| `.vscode/extensions.json` | typescript, python, cdk, bicep |
| `.devcontainer/devcontainer.json` | typescript, python, aws, azure, cdk, bicep |
| `CLAUDE.md` | all presets |
| `README.md` | all presets |

### Merge strategy by file type

| File type | Strategy |
|-----------|----------|
| JSON (`package.json`, `.mcp.json`, `.vscode/*.json`, `devcontainer.json`) | Deep merge. Arrays: unique union |
| YAML (`lefthook.yaml`, `ci.yaml`) | Deep merge. Arrays: unique union |
| TOML (`.mise.toml`) | Deep merge |
| Markdown (`CLAUDE.md`, `README.md`) | Template + section injection (exception: uses placeholder-based approach) |

### Preset interface

```typescript
interface Preset {
  name: string;
  requires?: string[];            // dependency presets (auto-resolved)
  files: Record<string, string>;  // owned files (path → content)
  merge: {                        // contributions to shared files
    'package.json'?: DeepPartial<PackageJson>;
    '.mise.toml'?: DeepPartial<MiseConfig>;
    'lefthook.yaml'?: DeepPartial<LefthookConfig>;
    // ...
  };
  markdown?: Record<string, MarkdownSection[]>;  // Markdown section injection
  ciSteps?: CiContribution;      // CI workflow contributions
  setupExtra?: string;           // Extra commands for setup.sh
}
```

## Dependency Chains

```text
React ──────→ TypeScript (forced)
Next.js ────→ TypeScript (forced)
CDK ────────→ TypeScript (forced)
           └→ cfn-lint + cdk-nag
           └→ CD workflow
CloudFormation → cfn-lint
              └→ CD workflow
Terraform ──→ tflint
           └→ CD workflow
AWS ────────→ AWS CLI
           └→ MCP: AWS IaC
           └→ ~/.aws mount
Azure ──────→ Azure CLI
           └→ MCP: Azure
           └→ ~/.azure mount
```

## Not Included (add manually later)

| Element | Reason |
|---------|--------|
| SQL (sqlfluff) | Many projects don't need it |
| MCP: GitHub / PostgreSQL / Playwright | Require project-specific credentials; documented in `.mcp.json.example` |

## Future Additions

| 要素 | レイヤー | 備考 |
|-----|---------|------|
| Google Cloud | 3 (Cloud) | 次に実装予定（#67） |
| マルチエージェント対応（Codex 等） | — | 保留。base プリセットから Claude Code 設定を分離する設計変更が前提 |
| バックエンドFW（Express, FastAPI 等） | — | 保留。モノレポ対応とテスト戦略の見直しが前提 |
| Vue / Nuxt | 2 (Frontend) | 必要になったら追加 |
| Remix | 2 (Frontend) | React メタフレームワーク。必要になったら追加 |

## Adding a New Preset

新プリセット追加時のチェックリスト:

1. **レイヤーの特定** — どのレイヤーに属するか？（[プリセットレイヤー](#プリセットレイヤー)参照）
2. **相互作用の確認** — 同レイヤー・異レイヤーの既存プリセットと競合しないか検証
3. **`PRESET_ORDER` への追加** — `src/generator.ts` のレイヤーグループ内の適切な位置に配置
4. **`WizardAnswers` の更新** — 必要に応じて `src/types.ts` のユニオン型に追加
5. **プリセットの実装** — `src/presets/<name>.ts` と `templates/<name>/`（必要な場合）を作成
6. **verify パターンの追加** — [テストパターン選定ルール](#テストパターン選定ルール)に従う
7. **本ドキュメントの更新** — Presets テーブル、レイヤーテーブル、共有ファイルテーブル、および関連する詳細セクション

## Project Structure

### Directory layout

```text
create-agentic-dev/
├── src/
│   ├── index.ts              # Entry point (CLI startup)
│   ├── cli.ts                # Wizard (@clack/prompts)
│   ├── generator.ts          # Composition engine (resolve → merge → output)
│   ├── merge.ts              # Per-filetype merge logic
│   ├── ci.ts                 # CI workflow builder
│   ├── setup.ts              # setup.sh template expansion
│   ├── utils.ts              # File I/O utilities (readTemplateFiles, writers)
│   ├── types.ts              # Type definitions (Preset interface, etc.)
│   └── presets/
│       ├── base.ts
│       ├── typescript.ts
│       ├── python.ts
│       ├── react.ts
│       ├── nextjs.ts
│       ├── aws.ts
│       ├── azure.ts
│       ├── cdk.ts
│       ├── cloudformation.ts
│       └── terraform.ts
├── templates/                # Owned files (copied as-is by presets)
│   ├── base/
│   │   ├── .gitignore
│   │   ├── .editorconfig
│   │   ├── lefthook.yaml
│   │   ├── .claude/
│   │   ├── .devcontainer/
│   │   ├── .github/
│   │   ├── .vscode/
│   │   ├── scripts/
│   │   └── ...
│   ├── typescript/
│   │   ├── biome.json
│   │   ├── tsconfig.json
│   │   ├── src/index.ts
│   │   └── tests/index.test.ts
│   ├── python/
│   │   ├── pyproject.toml
│   │   ├── tests/__init__.py
│   │   └── tests/test_placeholder.py
│   ├── react/
│   │   └── ...
│   ├── nextjs/
│   │   └── ...
│   ├── cdk/
│   │   ├── infra/
│   │   └── .cfnlintrc.yaml
│   ├── cloudformation/
│   │   ├── infra/
│   │   └── .cfnlintrc.yaml
│   └── terraform/
│       └── .tflint.hcl
├── tests/
├── docs/
│   └── design.md
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

- `src/presets/*.ts` — Preset **logic** (what to merge, what depends on what)
- `templates/*/` — Preset **file assets** (copied as-is to output)
- Separation of logic and templates: config file changes don't require code changes

### Build tool

**tsdown** (Rolldown/Rust-based). Successor to tsup, developed by the Vite/Vitest team.

### Dependencies

| Package | Purpose | Type |
|---------|---------|------|
| `@clack/prompts` | Wizard UI | dependencies |
| `deepmerge-ts` | Deep merge (TypeScript-first, type-safe) | dependencies |
| `yaml` | YAML read/write (comment-preserving round-trip) | dependencies |
| `smol-toml` | TOML read/write (fastest, TOML v1.1.0) | dependencies |
| `picocolors` | Terminal colors (smallest, fastest) | dependencies |
| `tsdown` | Build (Rolldown-based, successor to tsup) | devDependencies |
| `typescript` | Type checking | devDependencies |
| `vitest` | Testing | devDependencies |
| `@types/node` | Node.js type definitions | devDependencies |

No arg parser needed — only `process.argv[2]` for project name.

### package.json skeleton

```json
{
  "name": "create-agentic-dev",
  "version": "0.1.0",
  "description": "Scaffold an AI-agent-native development environment with interactive presets",
  "type": "module",
  "bin": {
    "create-agentic-dev": "./dist/index.js"
  },
  "files": [
    "dist",
    "templates"
  ],
  "engines": {
    "node": ">=20"
  }
}
```

`engines.node >= 20`: CLI users may not have Node 24. Generated projects specify Node 24 via mise.

### Execution flow

```text
npm create agentic-dev [my-app]
  │
  ├─ src/index.ts          # Get project name from process.argv
  ├─ src/cli.ts            # Run wizard with @clack/prompts
  │                          → { name, languages, frontend, iac }
  ├─ src/generator.ts      # 1. Resolve dependencies → preset list
  │                          2. Collect owned files from templates/
  │                          3. Deep merge shared files (JSON/YAML/TOML)
  │                          4. Build lint:all script dynamically
  │                          5. Expand Markdown templates
  │                          6. Build CI workflow (src/ci.ts)
  │                          7. Expand setup.sh template (src/setup.ts)
  │                          8. Write all files to output directory
  └─ Done message (next steps)
```

## Testing Strategy

### Test types

| Level | Target | Purpose |
|-------|--------|---------|
| Unit tests | `merge.ts`, preset definitions | Merge logic correctness, preset structure validation |
| Integration tests | `generator.ts` | Verify generated output for each preset combination |
| Snapshot tests | Generated file sets | Detect unintended changes in output |
| Verification tests | `verify.test.ts` | Validate preset isolation, shared file composition, JSON validity |

### Integration test matrix

Languages (3) × Frontend (3) × IaC (4) = 36 theoretical combinations.
After applying dependency constraints, **12 representative patterns** to test:

| # | Languages | Frontend | IaC | Notes |
|---|-----------|----------|-----|-------|
| 1 | TS | None | None | Minimal TS |
| 2 | Python | None | None | Minimal Python |
| 3 | TS + Python | None | None | Both languages |
| 4 | TS | React + Vite | None | Frontend (SPA) |
| 5 | TS | Next.js | None | Frontend (SSR) |
| 6 | TS | None | CDK | CDK |
| 7 | TS | None | CFn | CloudFormation |
| 8 | TS | None | Terraform | Terraform |
| 9 | TS + Python | React + Vite | CDK | Full config |
| 10 | Python | None | Terraform | Python + Terraform |
| 11 | Python | None | CFn | Python + CFn |
| 12 | — | None | None | Base only |

### Verification per pattern

1. Required files exist
2. Excluded files do not exist
3. Shared file contents are correct (merged dependencies, tools, scripts)
4. Snapshot matches (file list)

### Verification tests (`pnpm run verify`)

Cross-cutting validation across 8 representative patterns:

1. All generated JSON files are valid
2. Preset-specific settings appear only when the preset is active (preset isolation)
3. Shared files (VSCode, devcontainer, package.json) correctly compose contributions
4. `lint:all` dynamically includes all `lint:*` scripts
5. VSCode extensions and devcontainer extensions are consistent

**Required before committing** any change to presets, templates, or generator logic.

### テストパターン選定ルール

`verify.test.ts` に含めるパターンの選定ルール:

1. **単体カバレッジ**: 各プリセットが少なくとも1つのパターンに含まれること
2. **レイヤー内組み合わせ**: 同レイヤーの複数プリセットを選択するパターンを1つ以上含む（例: AWS + Azure）
3. **レイヤー間依存**: `requires` チェーンが発動するパターンを含む（例: CDK → TypeScript）
4. **最大構成**: 全レイヤーから選択するフルスタックパターンを1つ含む
5. **最小構成**: base only パターンを含む

**新プリセット追加時:**

- 同レイヤーの既存プリセットと同構造の場合（例: AWS/Azure と同列に GCP を追加）: verify パターンを1つ追加
- 新しいレイヤー間依存を導入する場合: その依存を検証するパターンを追加
- フルスタックパターンに新プリセットを含めるか検討する

### Test infrastructure

- **Virtual filesystem**: Generate into memory, not disk. Fast, no cleanup needed.
- **Test helper** (`GenerateResult`): `fileList()`, `hasFile()`, `readText()`, `readJson()`, `readYaml()`, `readToml()`
- **Framework**: vitest

## Distribution

### npm package

| Item | Value |
|------|-------|
| Package name | `create-agentic-dev` |
| Registry | npm public |
| Usage | `npm create agentic-dev` / `npx create-agentic-dev` |
| Release trigger | GitHub Release (tag `v*`) → auto publish |
| Provenance | Enabled (`--provenance`) for supply chain security |

### Versioning (semver)

| Change | Version |
|--------|---------|
| Tool version updates in presets | patch |
| New presets (e.g., Vue), template improvements | minor |
| Wizard selection changes, Preset interface changes | major |

### CI workflows

**ci.yaml** — on push / PR:

1. lint (Biome)
2. typecheck (tsc --noEmit)
3. test (vitest)
4. build (tsdown)

**release.yaml** — on GitHub Release published:

1. lint + typecheck + test + build
2. `npm publish --provenance --access public`
   - Requires `NPM_TOKEN` secret
   - Requires `id-token: write` permission (provenance)

### Release process

1. Update `version` in package.json and commit
2. Create GitHub Release (tag: `v0.1.0`, etc.)
3. release.yaml auto-publishes to npm

Future: automate with changesets or release-please when needed.
