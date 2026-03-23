# GEMINI.md

## Project Overview

{{projectName}}: AI-agent-native development project.

## Tech Stack

- **Version management**: mise (`.mise.toml`), gh is managed via devcontainer feature
- **Tool policy**: Development tools are managed by mise (not in package.json devDependencies)
- **Linting/Formatting**:
  - shellcheck + shfmt (Shell)
  - mdformat + markdownlint-cli2 (Markdown)
  - yamlfmt + yamllint (YAML)
  - taplo (TOML)
  - dockerfmt + hadolint (Dockerfile)
  - actionlint (GitHub Actions)
<!-- SECTION:TECH_STACK -->
- **Security scanning**: Gitleaks (secrets)
<!-- SECTION:TECH_STACK_LINTING -->
- **MCP servers**: <!-- SECTION:TECH_STACK_MCP --> — configured in `.gemini/settings.json`
- **Git hooks**: lefthook (commit-msg: commitlint, pre-commit: linters + gitleaks, pre-push: <!-- SECTION:PRE_PUSH_HOOKS -->)

## Project Structure

```text
scripts/      -> Shell scripts (setup, etc.)
docs/         -> Documentation (branch strategy, etc.)
<!-- SECTION:PROJECT_STRUCTURE -->
<!-- SECTION:INFRA_STRUCTURE -->
```

## Key Commands

```bash
# Setup
scripts/setup.sh          # Full environment setup
mise install               # Install all tools
<!-- SECTION:SETUP_COMMANDS -->

# Lint & Format
pnpm run lint:md           # Markdown lint (markdownlint-cli2)
pnpm run lint:yaml         # YAML lint (yamllint)
pnpm run lint:shell        # Shell lint (shellcheck + shfmt check)
pnpm run lint:toml         # TOML format check (taplo)
pnpm run lint:docker       # Dockerfile lint (hadolint)
pnpm run lint:actions      # GitHub Actions lint (actionlint)
pnpm run lint:secrets      # Secret detection (Gitleaks)
<!-- SECTION:LINT_COMMANDS -->
# Test
<!-- SECTION:TEST_COMMANDS -->
```

## Coding Conventions

- Indent: 2 spaces (JSON/YAML)
- Line endings: LF only
- All code must pass linters before committing
- YAML file extension: `.yaml` (not `.yml`, unless required by tools)
- Shell: must pass shellcheck and shfmt
- Dockerfile: must pass hadolint
- GitHub Actions: must pass actionlint
- Security: must pass Gitleaks secret detection
<!-- SECTION:CODING_CONVENTIONS -->

## Commit Convention

Conventional Commits required (enforced by commitlint):

```text
<type>[optional scope]: <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

Breaking changes: add `!` after type (e.g., `feat!: ...`) or `BREAKING CHANGE:` footer.

## Branching

GitHub Flow: `main` + feature branches. **squash merge only**.
Branch naming: `<type>/<short-description>` (e.g., `feat/add-auth`, `fix/login-error`).
See [`docs/branch-strategy.md`](docs/branch-strategy.md) for details.

## Git Workflow

- Lefthook `commit-msg` hook validates Conventional Commits format
- Lefthook `pre-commit` runs linters (auto-fixes staged)
- CI validates all linters on PRs
- Renovate manages dependency updates

<!-- SECTION:CD_SECTION -->
