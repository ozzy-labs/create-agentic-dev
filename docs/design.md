# Design Document

## Overview

`create-agentic-dev` is a CLI tool that scaffolds AI-agent-native development projects with interactive presets.

- **Distribution**: npm package (`npm create @ozzylabs/agentic-dev`)
- **Prompt library**: @clack/prompts
- **Architecture**: Preset Composition (composable presets merged into final project)
- **Relationship**: Companion to [agentic-dev-template](https://github.com/ozzy-3/agentic-dev-template)

## Wizard Selections

7 questions. App-first flow: application frameworks first, then infrastructure, then agents.

| # | Question | Type | Options |
|---|----------|------|---------|
| 1 | Project name | Text input | — |
| 2 | Frontend app | Single-select | None / React + Vite / Next.js |
| 3 | Backend app | Single-select | None / FastAPI / Express |
| 4 | Cloud providers | Multi-select | AWS / Azure / Google Cloud |
| 5 | Infrastructure as Code | Multi-select | None / CDK / CloudFormation / Terraform / Bicep (filtered by selected cloud providers) |
| 6 | Language toolchains (complement) | Multi-select | TypeScript / Python (auto-resolved languages are excluded) |
| 7 | AI Agent tools | Multi-select | Claude Code / Codex CLI / Gemini CLI / Amazon Q Developer / GitHub Copilot / Cline / Cursor |

Language は FW 選択で自動解決された言語を除外して表示する。全言語が自動解決済みならスキップする。

## Presets

24 presets, mapped 1:1 to wizard selections.

| Preset | Trigger | Requires |
|--------|---------|----------|
| `base` | Always applied | — |
| `typescript` | Language: TypeScript | — |
| `python` | Language: Python | — |
| `react` | Frontend: React + Vite | `typescript` (forced) |
| `nextjs` | Frontend: Next.js | `typescript` (forced) |
| `vue` | Frontend: Vue 3 + Vite | `typescript` (forced) |
| `nuxt` | Frontend: Nuxt 3 | `typescript` (forced) |
| `fastapi` | Backend: FastAPI | `python` (forced) |
| `express` | Backend: Express | `typescript` (forced) |
| `batch` | Backend: Batch/Worker | `typescript` (forced) |
| `aws` | Cloud: AWS | — |
| `azure` | Cloud: Azure | — |
| `gcp` | Cloud: Google Cloud | — |
| `cdk` | IaC: CDK (AWS) | `typescript` (forced) |
| `cloudformation` | IaC: CloudFormation (AWS) | — |
| `terraform` | IaC: Terraform (AWS, Azure, Google Cloud) | — |
| `bicep` | IaC: Bicep (Azure) | — |
| `claude-code` | Agent: Claude Code | — |
| `codex` | Agent: Codex CLI | — |
| `gemini` | Agent: Gemini CLI | — |
| `amazon-q` | Agent: Amazon Q Developer | — |
| `copilot` | Agent: GitHub Copilot | — |
| `cline` | Agent: Cline | — |
| `cursor` | Agent: Cursor | — |

### プリセットレイヤー

| レイヤー | カテゴリ | 選択方式 | プリセット |
|---------|---------|---------|-----------|
| 0 | Base | 常に適用 | `base` |
| 1 | Frontend | 単一選択（排他） | `react`, `nextjs`, `vue`, `nuxt` |
| 2 | Backend | 単一選択（排他） | `fastapi`, `express`, `batch` |
| 3 | Cloud | 複数選択可 | `aws`, `azure`, `gcp` |
| 4 | IaC | 複数選択可、Cloud に依存 | `cdk`, `cloudformation`, `terraform`, `bicep` |
| 5 | Language (complement) | 複数選択可 | `typescript`, `python` |
| 6 | Agent | 複数選択可 | `claude-code`, `codex`, `gemini`, `amazon-q`, `copilot`, `cline`, `cursor` |

**相互作用ルール:**

- **同レイヤー内**: プリセットは独立に合成される（競合しない設計が前提）。例外: Frontend / Backend は排他（単一選択）
- **レイヤー間依存**: プリセットの `requires` フィールドで言語レイヤーのプリセットを強制（例: CDK → TypeScript、FastAPI → Python）
- **フィルタリング**: IaC の選択肢は選択された Cloud に基づきフィルタされる
- **Language complement**: FW（Frontend / Backend / IaC）で自動解決された言語を除外して表示。全言語が解決済みならスキップ

**新プリセット追加時** は、いずれかのレイヤーに割り当てる。既存レイヤーに該当しない場合は、新レイヤーの追加とウィザードフローの更新を検討する。

Application order: `base → typescript → python → react → nextjs → vue → nuxt → fastapi → express → batch → aws → azure → gcp → cdk → cloudformation → terraform → bicep → claude-code → codex → gemini → amazon-q → copilot → cline → cursor`

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
| Docker | devcontainer (common only), hadolint, dockerfmt | `.devcontainer/` (4 files), `.hadolint.yaml`, `.dockerignore` |
| Security | Gitleaks | via lefthook / CI |
| GitHub | CI workflow, PR template, CODEOWNERS, rulesets | `.github/` |
| VSCode | Editor settings (common only), extensions (common only) | `.vscode/` |
| MCP | `.mcp.json.example` (reference only) | `.mcp.json.example` |
| Docs | README.md, adding-tools.md, branch-strategy.md | `README.md`, `docs/` |
| Scripts | setup, configure-repo, apply-rulesets | `scripts/` |
| Renovate | Dependency auto-update | `renovate.json` |

### Agent Selection

**Claude Code** — adds:

| Element | Files |
|---------|-------|
| CLAUDE.md (instruction file) | `CLAUDE.md` (template with section injection) |
| Skills (10 skills) | `.claude/skills/` (setup, implement, lint, test, commit, pr, review, ship, commit-conventions, lint-rules) |
| Rules | `.claude/rules/git-workflow.md` |
| Settings | `.claude/settings.json` (permissions) |
| MCP servers (Context7, Fetch) | `.mcp.json` (via mcpServers) |
| devcontainer: Claude credential mounts | `.devcontainer/devcontainer.json` (merge) |
| .gitignore | `.claude/settings.local.json` |

**Codex CLI** — adds:

| Element | Files |
|---------|-------|
| AGENTS.md (instruction file) | `AGENTS.md` (template with section injection) |
| MCP servers (Context7, Fetch) | via agent's MCP config |
| devcontainer: OpenAI API key env | `.devcontainer/devcontainer.json` (merge) |

**Gemini CLI** — adds:

| Element | Files |
|---------|-------|
| GEMINI.md (instruction file) | `GEMINI.md` (template with section injection) |
| MCP servers (Context7, Fetch) | via agent's MCP config |
| .gitignore | `.gemini/.env` |
| devcontainer: Gemini API key env | `.devcontainer/devcontainer.json` (merge) |

**Amazon Q Developer** — adds:

| Element | Files |
|---------|-------|
| Project rules (instruction file) | `.amazonq/rules/project.md` (template with section injection) |
| MCP servers (Context7, Fetch) | via agent's MCP config |

**GitHub Copilot** — adds:

| Element | Files |
|---------|-------|
| Copilot instructions (instruction file) | `.github/copilot-instructions.md` (template with section injection) |
| MCP servers (Context7, Fetch) | via agent's MCP config |

**Cline** — adds:

| Element | Files |
|---------|-------|
| Project rules (instruction file) | `.clinerules/project.md` (template with section injection) |
| MCP servers (Context7, Fetch) | Not generated (Cline manages MCP via VS Code UI) |

**Cursor** — adds:

| Element | Files |
|---------|-------|
| Project rules (instruction file, MDC format) | `.cursor/rules/project.mdc` (YAML frontmatter + Markdown with section injection) |
| MCP servers (Context7, Fetch) | `.cursor/mcp.json` (via mcpServers) |

Agent プリセットは `mcpServers` フィールドで MCP サーバーを定義する。Generator が全プリセットの MCP サーバーを収集し、Agent の設定ファイルに出力する。

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

**React + Vite** — adds: Vite + React dependencies, configuration, boilerplate in `web/`

**Next.js** — adds: Next.js + React dependencies, App Router scaffold, configuration in `web/`

### Backend Selection

**FastAPI** (forces Python) — adds:

| Element | Files |
|---------|-------|
| FastAPI + uvicorn | `api/pyproject.toml` |
| App entrypoint | `api/src/main.py`, `api/src/__init__.py` |
| Tests (httpx + pytest-asyncio) | `api/tests/test_main.py`, `api/tests/__init__.py` |
| Ruff FAST plugin | `api/pyproject.toml` |
| Agent rules | `.claude/rules/fastapi.md` |
| devcontainer: port 8000 | `.devcontainer/devcontainer.json` (merge) |

**Express** (forces TypeScript) — adds:

| Element | Files |
|---------|-------|
| Express app | `api/src/index.ts`, `api/src/app.ts` |
| Tests (supertest + vitest) | `api/tests/app.test.ts` |
| tsconfig (API) | `api/tsconfig.json` |
| Package (API) | `api/package.json` |
| Agent rules | `.claude/rules/express.md` |

### ディレクトリ構造パターン

FW 選択に応じてプロジェクト構造が変わる。`infra/` は常にルート直下。

| Selection | Structure | Workspace |
|-----------|-----------|-----------|
| FW なし | flat `src/` | なし |
| Frontend のみ | `web/` | pnpm-workspace |
| Backend のみ (FastAPI) | `api/` | なし（Python/uv） |
| Backend のみ (Express) | `api/` | pnpm-workspace |
| Frontend + FastAPI | `web/` + `api/` | pnpm-workspace（web のみ） |
| Frontend + Express | `web/` + `api/` | pnpm-workspace（web + api） |

**Workspace ルール:**

- `web/`（React / Next.js）→ pnpm workspace に含める
- `api/`（Express）→ pnpm workspace に含める
- `api/`（FastAPI）→ uv で管理、pnpm workspace に含めない
- `infra/`（CDK）→ pnpm workspace に含めない（独立した npm パッケージとして `cd infra && npm install` で管理）
- `biome.json` はルートに配置（全サブディレクトリで共有）
- 各サブディレクトリは独自の `package.json`（or `pyproject.toml`）とテストを持つ

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

**Google Cloud** — adds:

| Element | Files |
|---------|-------|
| gcloud CLI | via mise |
| MCP: Google Cloud | `.mcp.json` (auto-added) |
| devcontainer: ~/.config/gcloud mount | `.devcontainer/devcontainer.json` (merge) |

### IaC Selection

**CDK** (AWS, forces TypeScript) — adds:

| Element | Files |
|---------|-------|
| CDK infrastructure | `infra/` (bin/app.ts, lib/app-stack.ts, test/, cdk.json, tsconfig.json, package.json) |
| cfn-lint | `.cfnlintrc.yaml` |
| cdk-nag | `infra/package.json` (dependency) |
| CD workflow | `.github/workflows/cd-cdk.yaml` |
| VSCode: cdk.out search exclude | `.vscode/settings.json` (merge) |
| VSCode: AWS Toolkit extension | `.vscode/extensions.json` (merge) |
| devcontainer: AWS Toolkit extension | `.devcontainer/devcontainer.json` (merge) |

**CloudFormation** — adds:

| Element | Files |
|---------|-------|
| CFn templates directory | `infra/` (template files) |
| cfn-lint | `.cfnlintrc.yaml` (merge) |
| CD workflow | `.github/workflows/cd-cloudformation.yaml` |

**Terraform** — adds:

| Element | Files |
|---------|-------|
| tflint | `.tflint.hcl` (dynamically generated based on cloud selection) |
| terraform | via mise |
| CD workflows | `.github/workflows/cd-terraform-{cloud}.yaml` (dynamically generated per selected cloud) |

**Bicep** (Azure) — adds:

| Element | Files |
|---------|-------|
| Bicep templates directory | `infra/` (main.bicep) |
| bicepconfig.json | `bicepconfig.json` |
| CD workflow | `.github/workflows/cd-bicep.yaml` |
| VSCode: Bicep extension | `.vscode/extensions.json` (merge) |
| devcontainer: Bicep extension | `.devcontainer/devcontainer.json` (merge) |

## Preset Composition

### Each preset provides

1. **Owned files** — files exclusively owned by the preset (copied as-is)
2. **Merge contributions** — partial configs to merge into shared files

### Shared files (modified by multiple presets)

| Shared file | Modified by |
|-------------|-------------|
| `package.json` | base, typescript, python, react, nextjs, vue, nuxt, fastapi, express, batch, cdk, bicep |
| `.mise.toml` | base, typescript, python, aws, azure, gcp, cdk, cloudformation, terraform |
| `lefthook.yaml` | base, typescript, python, fastapi, express, batch, cdk |
| `pnpm-workspace.yaml` | react, nextjs, vue, nuxt, express, batch (auto-generated when workspace packages exist) |
| `.github/workflows/ci.yaml` | base, typescript, python, fastapi, express, batch, cdk, cloudformation, terraform, bicep |
| `.github/workflows/cd-*.yaml` | cdk, cloudformation, terraform, bicep (each preset owns its own CD workflow) |
| `.mcp.json` | base, aws, azure, gcp |
| `.vscode/settings.json` | typescript, python, nextjs, nuxt, cdk |
| `.vscode/extensions.json` | typescript, python, cdk, bicep |
| `.devcontainer/devcontainer.json` | typescript, python, fastapi, express, aws, azure, gcp, cdk, terraform, bicep, claude-code, codex, gemini |
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
  conditionalDevDeps?: string[]; // devDeps removed if unused by scripts
}
```

## Dependency Chains

```text
React ──────→ TypeScript (forced)
Next.js ────→ TypeScript (forced)
FastAPI ────→ Python (forced)
Express ────→ TypeScript (forced)
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
GCP ────────→ gcloud CLI
           └→ MCP: Google Cloud
           └→ ~/.config/gcloud mount
```

## Not Included (add manually later)

| Element | Reason |
|---------|--------|
| SQL (sqlfluff) | Many projects don't need it |
| MCP: GitHub / PostgreSQL / Playwright | Require project-specific credentials; documented in `.mcp.json.example` |

## Future Additions

| 要素 | レイヤー | 備考 |
|-----|---------|------|
| Remix | 1 (Frontend) | React メタフレームワーク。必要になったら追加 |

## Adding a New Preset

新プリセット追加時のチェックリスト:

1. **レイヤーの特定** — どのレイヤーに属するか？（[プリセットレイヤー](#プリセットレイヤー)参照）
2. **相互作用の確認** — 同レイヤー・異レイヤーの既存プリセットと競合しないか検証
3. **`PRESET_ENTRIES` への追加** — `src/presets/index.ts` のレイヤーグループ内の適切な位置に配置
4. **`WizardAnswers` の更新** — 必要に応じて `src/types.ts` のユニオン型に追加
5. **プリセットの実装** — `src/presets/<name>.ts` と `templates/<name>/`（必要な場合）を作成
6. **テストの追加** — [テストパターン選定ルール](#テストパターン選定ルール)に従い、Layer A/B/C にテストを追加
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
│       ├── index.ts          # Preset registry (PRESET_ENTRIES, ALL_PRESETS, PRESET_ORDER)
│       ├── shared.ts         # Shared constants (DEFAULT_MCP_SERVERS)
│       ├── base.ts
│       ├── typescript.ts
│       ├── python.ts
│       ├── react.ts
│       ├── nextjs.ts
│       ├── vue.ts
│       ├── nuxt.ts
│       ├── fastapi.ts
│       ├── express.ts
│       ├── batch.ts
│       ├── aws.ts
│       ├── azure.ts
│       ├── gcp.ts
│       ├── cdk.ts
│       ├── cloudformation.ts
│       ├── terraform.ts
│       ├── bicep.ts
│       ├── claude-code.ts
│       ├── codex.ts
│       ├── gemini.ts
│       ├── amazon-q.ts
│       ├── copilot.ts
│       ├── cline.ts
│       └── cursor.ts
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
│   │   └── web/...
│   ├── nextjs/
│   │   └── web/...
│   ├── fastapi/
│   │   ├── api/src/
│   │   ├── api/tests/
│   │   ├── api/pyproject.toml
│   │   └── .claude/rules/fastapi.md
│   ├── express/
│   │   ├── api/src/
│   │   ├── api/tests/
│   │   ├── api/package.json
│   │   ├── api/tsconfig.json
│   │   └── .claude/rules/express.md
│   ├── cdk/
│   │   └── infra/
│   ├── cloudformation/
│   │   └── infra/
│   ├── terraform/
│   │   └── .github/workflows/cd-terraform.yaml
│   ├── claude-code/
│   │   ├── .claude/
│   │   └── CLAUDE.md
│   ├── codex/
│   │   └── AGENTS.md
│   ├── gemini/
│   │   └── GEMINI.md
│   ├── amazon-q/
│   │   └── .amazonq/rules/project.md
│   ├── copilot/
│   │   └── .github/copilot-instructions.md
│   ├── cline/
│   │   └── .clinerules/project.md
│   └── cursor/
│       └── .cursor/rules/project.mdc
├── tests/
├── docs/
│   ├── design.md
│   ├── development.md
│   ├── preset-authoring.md
│   ├── adding-tools.md
│   └── branch-strategy.md
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
| `@biomejs/biome` | Linter / Formatter | devDependencies |
| `@commitlint/cli` | Commit message validation | devDependencies |
| `@commitlint/config-conventional` | Commitlint config | devDependencies |
| `@types/node` | Node.js type definitions | devDependencies |
| `tsdown` | Build (Rolldown-based, successor to tsup) | devDependencies |
| `typescript` | Type checking | devDependencies |
| `vitest` | Testing | devDependencies |

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
    "node": ">=22"
  }
}
```

`engines.node >= 22`: CLI users may not have Node 24. Generated projects specify Node 24 via mise.

### Execution flow

```text
npm create @ozzylabs/agentic-dev [my-app]
  │
  ├─ src/index.ts          # Get project name from process.argv
  ├─ src/cli.ts            # Run wizard with @clack/prompts
  │                          → { name, frontend, backend, clouds, iac, languages }
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

### 3層テスト戦略

プリセット数の増加に伴い、組み合わせ爆発を防ぐため3層構造でテストする。

| Layer | Name | Scope | Growth |
|-------|------|-------|--------|
| A | Preset unit | 各プリセット単体（base + requires のみ） | O(n) |
| B | Pairwise | レイヤー間の重要ペア | O(edges) |
| C | Smoke | 代表パターン（少数） | 固定 |

**Layer A** — `tests/presets/*.test.ts`

各プリセットを base + requires のみで generate し、owned files / merge / markdown / ciSteps を検証。

**Layer B** — `tests/pairwise.test.ts`

重要なレイヤー間ペアの共有ファイルマージを検証:

- React + CDK（web/ + infra/ の共存）
- React + FastAPI（web/ + api/、workspace 構成）
- React + Express（web/ + api/、両方 pnpm workspace）
- Express + CDK（api/ + infra/ の共存）
- TypeScript + Python（言語の共存）

**Layer C** — `tests/smoke.test.ts`（= `pnpm run verify`）

代表パターンで JSON validity, VSCode/devcontainer consistency, preset isolation を検証。

### Smoke test patterns

| # | Language | Frontend | Backend | Cloud | IaC | Notes |
|---|---------|----------|---------|-------|-----|-------|
| 1 | — | — | — | — | — | Base only |
| 2 | TS | — | — | — | — | Minimal TS |
| 3 | Python | — | — | — | — | Minimal Python |
| 4 | TS + Python | — | — | — | — | Both languages |
| 5 | (auto) | React | — | — | — | Frontend SPA |
| 6 | (auto) | Next.js | — | — | — | Frontend SSR |
| 7 | (auto) | — | FastAPI | — | — | Backend (Python) |
| 8 | (auto) | — | Express | — | — | Backend (TS) |
| 9 | (auto) | — | — | AWS | CDK | IaC (CDK) |
| 10 | Python | — | — | — | CFn | IaC (CFn) |
| 11 | — | — | — | — | Terraform | IaC (multi-cloud) |
| 12 | — | — | — | Azure | Bicep | IaC (Bicep) |
| 13 | (auto) | React | FastAPI | AWS | CDK | Full config (monorepo) |
| 14 | (auto) | React | Express | AWS | CDK | Full config (all TS workspace) |

### Verification per pattern

1. All generated JSON files are valid
2. Preset-specific settings appear only when the preset is active (preset isolation)
3. Shared files (VSCode, devcontainer, package.json) correctly compose contributions
4. `lint:all` dynamically includes all `lint:*` scripts
5. VSCode extensions and devcontainer extensions are consistent
6. Directory structure matches expected pattern (flat / web/ / api/ / web+api/)
7. pnpm-workspace.yaml contains correct packages

**Required before committing** any change to presets, templates, or generator logic.

### テストパターン選定ルール

**Layer A (preset unit):**

- 各プリセットに1つのテストファイル（`tests/presets/<name>.test.ts`）
- base + requires のみで generate し、owned files と merge contributions を検証

**Layer B (pairwise):**

- 新しいレイヤー間依存やディレクトリ共存パターンを導入する場合にペアを追加
- 同レイヤー内の組み合わせ（例: AWS + Azure）も重要なペアとして検証

**Layer C (smoke):**

1. **単体カバレッジ**: 各プリセットが少なくとも1つのパターンに含まれること
2. **レイヤー内組み合わせ**: 同レイヤーの複数プリセットを選択するパターンを1つ以上含む
3. **レイヤー間依存**: `requires` チェーンが発動するパターンを含む（例: CDK → TypeScript）
4. **最大構成**: 全レイヤーから選択するフルスタックパターンを含む
5. **最小構成**: base only パターンを含む

**新プリセット追加時:**

- Layer A: テストファイルを1つ追加
- Layer B: 既存プリセットとの重要なペアを追加
- Layer C: 同レイヤーの既存プリセットと同構造なら smoke パターンを1つ追加。新しい依存を導入するなら検証パターンを追加

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
| Usage | `npm create @ozzylabs/agentic-dev` / `npx @ozzylabs/create-agentic-dev` |
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

**release-please.yaml** — on push to main:

1. Conventional Commits を解析してバージョンバンプと CHANGELOG を自動生成
2. Release PR を作成・更新
3. Release PR マージ時に GitHub Release を作成 → release.yaml が npm publish を実行

### Release process

1. Conventional Commits で main にマージ
2. release-please が Release PR を自動作成（CHANGELOG + version bump）
3. Release PR をマージ → GitHub Release 作成 → release.yaml が npm publish
