# create-agentic-dev

Scaffold an AI-agent-native development environment with interactive presets.

Companion to [agentic-dev-template](https://github.com/ozzy-labs/agentic-dev-template).

## Quick Start

```bash
npm create @ozzylabs/agentic-dev my-app
cd my-app
bash scripts/setup.sh
```

## Wizard

The interactive wizard asks 8 questions in an app-first flow:

1. **Project name**
2. **Frontend** — None / React + Vite / Next.js / Vue / Nuxt / SvelteKit / Astro
3. **Backend** — None / Hono / FastAPI / Express / Batch
4. **Cloud providers** — AWS / Azure / Google Cloud (multi-select)
5. **Infrastructure as Code** — CDK / CloudFormation / Terraform / Bicep (filtered by cloud)
6. **Language toolchains** — TypeScript / Python (excluding auto-resolved)
7. **Testing tools** — Playwright (multi-select)
8. **AI Agent tools** — Claude Code / Codex CLI / Gemini CLI / Amazon Q Developer / GitHub Copilot / Cline / Cursor (multi-select)

## Presets

28 composable presets across 8 layers. Each provides owned files + merge contributions
to shared files (package.json, .mise.toml, lefthook.yaml, VSCode, devcontainer,
README.md, CI workflow).

| Layer | Presets |
|-------|--------|
| Base | Always included (git hooks, linters, devcontainer) |
| Frontend | React + Vite, Next.js, Vue, Nuxt, SvelteKit, Astro |
| Backend | Hono, FastAPI, Express, Batch |
| Cloud | AWS, Azure, Google Cloud |
| IaC | CDK, CloudFormation, Terraform, Bicep |
| Language | TypeScript, Python |
| Testing | Playwright |
| Agent | Claude Code, Codex CLI, Gemini CLI, Amazon Q Developer, GitHub Copilot, Cline, Cursor |

See [docs/design.md](docs/design.md) for the full preset details and dependency chains.

## What You Get

Every generated project includes:

- **Claude Code integration** — CLAUDE.md, skills (/setup, /implement, /lint, /test, /commit, /pr, /review, /ship), MCP servers
- **Git hooks** — commitlint (commit-msg), linters + Gitleaks (pre-commit), typecheck (pre-push)
- **CI workflow** — All linters + tests + build on push/PR
- **Dev Container** — VSCode devcontainer with preset-specific tools, extensions, and mounts
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

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

To add a new preset, see [docs/preset-authoring.md](docs/preset-authoring.md).

## License

MIT
