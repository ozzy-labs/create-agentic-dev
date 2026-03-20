# Development Guide

## Prerequisites

- Node.js >= 20 (recommended: 24)
- [pnpm](https://pnpm.io/) 10
- [mise](https://mise.jdx.dev/) (version management)

## Development Setup

```bash
git clone https://github.com/ozzy-3/create-agentic-dev.git
cd create-agentic-dev
mise install
pnpm install
```

## Development Workflow

```bash
pnpm run dev          # Watch mode build
pnpm run build        # Production build
pnpm test             # Run tests
pnpm run test:watch   # Watch mode tests
```

### Lint & Format

| Command | Description |
|---------|-------------|
| `pnpm run lint` | Biome check |
| `pnpm run lint:fix` | Biome check with auto-fix |
| `pnpm run lint:all` | All linters + typecheck + gitleaks |
| `pnpm run typecheck` | TypeScript type check |
| `pnpm run lint:md` | Markdown lint |
| `pnpm run lint:yaml` | YAML lint |
| `pnpm run lint:shell` | Shell lint |
| `pnpm run lint:toml` | TOML format check |
| `pnpm run lint:secrets` | Secret detection (Gitleaks) |

All code must pass `pnpm run lint:all` before committing.

## Testing

### Automated Tests

Tests are located in `tests/` and run with [vitest](https://vitest.dev/):

| Level | Target | Purpose |
|-------|--------|---------|
| Unit | `merge.ts` | Merge logic correctness for JSON, YAML, TOML, Markdown |
| Integration | `generator.ts` | Verify generated output for each preset combination |
| Snapshot | Generated file sets | Detect unintended changes in output |

Tests use an in-memory file writer (`createMemoryWriter`) so no disk I/O or cleanup is needed.

See [Testing Strategy](design.md#testing-strategy) in the design document for the full test matrix.

### Manual Verification

After making changes to the CLI or templates, verify the generated output by installing
the CLI locally with `pnpm link`:

1. Build the project:

   ```bash
   pnpm run build
   ```

2. Link the CLI globally:

   ```bash
   pnpm link --global
   ```

3. Generate a test project in a temporary directory:

   ```bash
   cd /tmp
   create-agentic-dev my-test-app
   ```

4. Verify the generated project:
   - Check that expected files exist
   - Review merged file contents (package.json, lefthook.yaml, CLAUDE.md, etc.)
   - Run `bash scripts/setup.sh` in the generated project if needed

5. Clean up when done:

   ```bash
   pnpm unlink --global create-agentic-dev
   rm -rf /tmp/my-test-app
   ```

> **Tip**: Test multiple preset combinations to ensure merge logic works correctly.
> See the [integration test matrix](design.md#testing-strategy) for representative patterns.

## Further Reading

- [Design Document](design.md) — Architecture, preset composition, and testing strategy
- [Preset Authoring Guide](preset-authoring.md) — How to add a new preset
- [Contributing](../CONTRIBUTING.md) — Branch conventions, PR process, and project structure
