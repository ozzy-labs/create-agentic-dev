# create-agentic-app

Scaffold an AI-agent-native development environment with interactive presets.

Companion to [agentic-dev-template](https://github.com/ozzy-labs/agentic-dev-template).

## Quick Start

```bash
npm create @ozzylabs/agentic-app my-app
cd my-app
bash scripts/setup.sh
```

## Wizard

The interactive wizard asks up to 9 questions in an app-first flow (some are
skipped when **Project type → Library** is chosen):

1. **Project name**
2. **Project type** — App (default) / Library (npm package)
3. **Frontend** — None / React + Vite / Next.js / Vue / Nuxt / SvelteKit / Astro
4. **Backend** — None / Hono / FastAPI / Express / Batch
5. **Cloud providers** — AWS / Azure / Google Cloud (multi-select)
6. **Infrastructure as Code** — CDK / CloudFormation / Terraform / Bicep (filtered by cloud)
7. **Language toolchains** — TypeScript / Python (excluding auto-resolved)
8. **Testing tools** — Playwright (multi-select)
9. **AI Agent tools** — Claude Code / Codex CLI / Gemini CLI / Amazon Q Developer / GitHub Copilot / Cline / Cursor (multi-select)

## Presets

29 composable presets across 9 layers. Each provides owned files + merge contributions
to shared files (package.json, .mise.toml, lefthook.yaml, VSCode, devcontainer,
README.md, CI workflow).

| Layer | Presets |
|-------|--------|
| Base | Always included (git hooks, linters, devcontainer) |
| Frontend | React + Vite, Next.js, Vue, Nuxt, SvelteKit, Astro |
| Backend | Hono, FastAPI, Express, Batch |
| App | Library (npm package — release-please, dist build, MIT LICENSE) |
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

## External Presets

Beyond the 28 built-in presets, `create-agentic-app` can load external preset
packages (e.g. `@ozzylabs/preset-*`) without modifying the CLI:

```bash
npm create @ozzylabs/agentic-app my-app -- --preset @ozzylabs/preset-foo
```

Or list them in `agentic-app.config.json` next to your project:

```json
{ "presets": ["@ozzylabs/preset-foo", "./local/preset"] }
```

See [docs/preset-authoring.md § External Preset Packages](docs/preset-authoring.md#external-preset-packages)
for the authoring guide and [`examples/preset-example`](examples/preset-example)
for a reference implementation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

To add a new preset, see [docs/preset-authoring.md](docs/preset-authoring.md).

## License

MIT
