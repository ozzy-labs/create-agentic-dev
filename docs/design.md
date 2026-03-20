# Design Document

## Overview

`create-agentic-dev` is a CLI tool that scaffolds AI-agent-native development projects with interactive presets.

- **Distribution**: npm package (`npm create agentic-dev`)
- **Prompt library**: @clack/prompts
- **Architecture**: Preset Composition (composable presets merged into final project)
- **Relationship**: Companion to [agentic-dev-template](https://github.com/ozzy-3/agentic-dev-template)

## Wizard Selections

4 questions only. Only ask what fundamentally changes project structure.

| # | Question | Type | Options |
|---|----------|------|---------|
| 1 | Project name | Text input | — |
| 2 | Languages | Multi-select | TypeScript / Python |
| 3 | Frontend framework | Single-select | None / React (Vite) |
| 4 | Infrastructure as Code | Single-select | None / AWS CDK / CloudFormation / Terraform |

## Presets

7 presets, mapped 1:1 to wizard selections.

| Preset | Trigger | Requires |
|--------|---------|----------|
| `base` | Always applied | — |
| `typescript` | Language: TypeScript | — |
| `python` | Language: Python | — |
| `react` | Frontend: React | `typescript` (forced) |
| `cdk` | IaC: AWS CDK | `typescript` (forced) |
| `cloudformation` | IaC: CloudFormation | — |
| `terraform` | IaC: Terraform | — |

Application order: `base → typescript → python → react → cdk / cloudformation / terraform`

### Always Included (base)

| Category | Elements | Files |
|----------|----------|-------|
| Git | .gitignore, .gitattributes, EditorConfig, lefthook, commitlint, Gitleaks | `.gitignore`, `.gitattributes`, `.editorconfig`, `lefthook.yaml`, `.commitlintrc.yaml` |
| Package management | mise, pnpm | `.mise.toml`, `package.json`, `pnpm-lock.yaml`, `.npmrc` |
| Shell | shellcheck, shfmt | via lefthook / CI |
| Markdown | markdownlint, mdformat | `.markdownlint-cli2.yaml`, `.mdformat.toml` |
| YAML | yamllint, yamlfmt | `.yamllint.yaml`, `.yamlfmt.yaml` |
| TOML | taplo | via lefthook / CI |
| GitHub Actions | actionlint | via lefthook / CI |
| Docker | devcontainer, hadolint, dockerfmt, dclint | `.devcontainer/` (4 files), `.hadolint.yaml`, `.dockerignore` |
| Security | Trivy, Gitleaks | `trivy.yaml` |
| Claude Code | Skills, Rules, Settings | `.claude/` (skills, rules, settings.json) |
| GitHub | CI workflow, PR template, CODEOWNERS, rulesets | `.github/` |
| VSCode | Editor settings, extensions | `.vscode/` |
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

**Python** — adds:

| Element | Files |
|---------|-------|
| Ruff (lint + format) | `pyproject.toml` |
| mypy (type check) | `pyproject.toml` |
| uv (package manager) | `uv.lock` |
| Tests | `tests/test_placeholder.py`, `tests/__init__.py` |

### Frontend Selection (forces TypeScript)

**React (Vite)** — adds: Vite + React dependencies, configuration, boilerplate

### IaC Selection

**AWS CDK** (forces TypeScript) — adds:

| Element | Files |
|---------|-------|
| CDK infrastructure | `infra/` (bin/app.ts, lib/app-stack.ts, test/, cdk.json, tsconfig.json, package.json) |
| cfn-lint | `.cfnlintrc.yaml` |
| cdk-nag | `infra/package.json` (dependency) |
| CD workflow | `.github/workflows/cd.yaml` |
| MCP: AWS IaC | `.mcp.json` (auto-added) |

**CloudFormation** — adds:

| Element | Files |
|---------|-------|
| CFn templates directory | `infra/` (template files) |
| cfn-lint | `.cfnlintrc.yaml` |
| CD workflow | `.github/workflows/cd.yaml` |
| MCP: AWS IaC | `.mcp.json` (auto-added) |

**Terraform** — adds:

| Element | Files |
|---------|-------|
| tflint | `.tflint.hcl` |
| terraform | via mise |
| CD workflow | `.github/workflows/cd.yaml` |
| MCP: AWS IaC | `.mcp.json` (auto-added) |

## Preset Composition

### Each preset provides

1. **Owned files** — files exclusively owned by the preset (copied as-is)
2. **Merge contributions** — partial configs to merge into shared files

### Shared files (modified by multiple presets)

| Shared file | Modified by |
|-------------|-------------|
| `package.json` | base, typescript, react, cdk |
| `.mise.toml` | base, typescript, python, cdk, cloudformation, terraform |
| `lefthook.yaml` | base, typescript, python |
| `.github/workflows/ci.yaml` | base, typescript, python, cdk, cloudformation, terraform |
| `.github/workflows/cd.yaml` | cdk, cloudformation, terraform |
| `.mcp.json` | base, cdk, cloudformation, terraform |
| `CLAUDE.md` | all presets |
| `README.md` | all presets |

### Merge strategy by file type

| File type | Strategy |
|-----------|----------|
| JSON (`package.json`, `.mcp.json`) | Deep merge. Arrays: unique union |
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
}
```

## Dependency Chains

```text
React ──────→ TypeScript (forced)
AWS CDK ────→ TypeScript (forced)
           └→ cfn-lint + cdk-nag
           └→ CD workflow
           └→ MCP: AWS IaC
CloudFormation → cfn-lint
              └→ CD workflow
              └→ MCP: AWS IaC
Terraform ──→ tflint
           └→ CD workflow
           └→ MCP: AWS IaC
```

## Not Included (add manually later)

| Element | Reason |
|---------|--------|
| SQL (sqlfluff) | Many projects don't need it |
| MCP: GitHub / PostgreSQL / Playwright | Require project-specific credentials; documented in `.mcp.json.example` |

## Future Additions

| Element | Notes |
|---------|-------|
| Vue | Frontend framework option, to be added when needed |
| Next.js / Remix | React meta-frameworks; out of scope (app architecture, not dev tooling) |

## Project Structure

### Directory layout

```text
create-agentic-dev/
├── src/
│   ├── index.ts              # Entry point (CLI startup)
│   ├── cli.ts                # Wizard (@clack/prompts)
│   ├── generator.ts          # Composition engine (resolve → merge → output)
│   ├── merge.ts              # Per-filetype merge logic
│   ├── types.ts              # Type definitions (Preset interface, etc.)
│   └── presets/
│       ├── base.ts
│       ├── typescript.ts
│       ├── python.ts
│       ├── react.ts
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
  │                          3. Deep merge shared files
  │                          4. Expand Markdown templates
  │                          5. Write all files to output directory
  └─ Done message (next steps)
```

## Testing Strategy

### Test types

| Level | Target | Purpose |
|-------|--------|---------|
| Unit tests | `merge.ts`, preset definitions | Merge logic correctness, preset structure validation |
| Integration tests | `generator.ts` | Verify generated output for each preset combination |
| Snapshot tests | Generated file sets | Detect unintended changes in output |

### Integration test matrix

Languages (3) × Frontend (2) × IaC (4) = 24 theoretical combinations.
After applying dependency constraints, **10 representative patterns** to test:

| # | Languages | Frontend | IaC | Notes |
|---|-----------|----------|-----|-------|
| 1 | TS | None | None | Minimal TS |
| 2 | Python | None | None | Minimal Python |
| 3 | TS + Python | None | None | Both languages |
| 4 | TS | React | None | Frontend |
| 5 | TS | None | CDK | CDK |
| 6 | TS | None | CFn | CloudFormation |
| 7 | TS | None | Terraform | Terraform |
| 8 | TS + Python | React | CDK | Full config |
| 9 | Python | None | Terraform | Python + Terraform |
| 10 | Python | None | CFn | Python + CFn |

### Verification per pattern

1. Required files exist
2. Excluded files do not exist
3. Shared file contents are correct (merged dependencies, tools, scripts)
4. Snapshot matches (file list)

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
