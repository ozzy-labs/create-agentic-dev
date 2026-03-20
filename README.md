# create-agentic-dev

Scaffold an AI-agent-native development environment with interactive presets.

Companion to [agentic-dev-template](https://github.com/ozzy-3/agentic-dev-template).

## Quick Start

```bash
npm create agentic-dev my-app
cd my-app
bash scripts/setup.sh
```

## Wizard

The interactive wizard asks 4 questions to configure your project:

| # | Question | Options |
|---|----------|---------|
| 1 | Project name | Text input |
| 2 | Languages | TypeScript / Python (multi-select) |
| 3 | Frontend framework | None / React (Vite) |
| 4 | Infrastructure as Code | None / AWS CDK / CloudFormation / Terraform |

## Presets

| Preset | Trigger | Includes |
|--------|---------|----------|
| **base** | Always | Git hooks (lefthook, commitlint), linters (shellcheck, markdownlint, yamllint, taplo, hadolint, actionlint), Gitleaks, devcontainer, Claude Code skills, MCP servers |
| **typescript** | Language: TypeScript | Biome, tsconfig, vitest, tsdown |
| **python** | Language: Python | Ruff, mypy, uv, pytest |
| **react** | Frontend: React | Vite, React 19 (forces TypeScript) |
| **cdk** | IaC: AWS CDK | CDK v2, cfn-lint, cdk-nag (forces TypeScript) |
| **cloudformation** | IaC: CloudFormation | cfn-lint, template scaffold |
| **terraform** | IaC: Terraform | tflint, terraform fmt |

Presets are composable: each provides owned files + merge contributions to shared files
(package.json, .mise.toml, lefthook.yaml, CLAUDE.md, README.md, CI workflow).

## What You Get

Every generated project includes:

- **Claude Code integration** — CLAUDE.md, skills (/setup, /implement, /lint, /test, /commit, /pr, /review, /ship), MCP servers
- **Git hooks** — commitlint (commit-msg), linters + Gitleaks (pre-commit), typecheck (pre-push)
- **CI workflow** — All linters + tests + build on push/PR
- **Dev Container** — VSCode devcontainer with all tools pre-installed
- **Renovate** — Automated dependency updates

## Development

See [docs/development.md](docs/development.md) for setup instructions, commands, and testing guide.

## Architecture

- `src/presets/*.ts` — Preset logic (merge contributions, dependencies)
- `templates/*/` — Preset file assets (copied as-is to output)
- `src/generator.ts` — Composition engine (resolve → merge → output)
- `src/merge.ts` — Per-filetype merge logic (JSON, YAML, TOML, Markdown)

See [docs/design.md](docs/design.md) for the full design document.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

To add a new preset, see [docs/preset-authoring.md](docs/preset-authoring.md).

## License

MIT
