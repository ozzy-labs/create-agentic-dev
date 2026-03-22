# Contributing

Thank you for your interest in contributing to `create-agentic-dev`!

## Getting Started

For development setup, commands, and testing guide, see [docs/development.md](docs/development.md).

## Branch & Commit Conventions

- **Branching**: GitHub Flow — create feature branches from `main`
- **Branch naming**: `<type>/<short-description>` (e.g., `feat/add-vue`, `fix/merge-bug`)
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (enforced by commitlint)
- **Merge**: Squash merge only

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure `pnpm run lint:all` and `pnpm test` pass
4. Open a PR using the provided template
5. PRs are squash-merged after review

## Project Structure

```text
src/              # CLI source code
src/presets/      # Preset logic (merge contributions, dependencies)
templates/        # Preset file assets (copied as-is to output)
tests/            # Test files
docs/             # Design docs, guides
```

See [docs/design.md](docs/design.md) for the full architecture and design decisions.

## Adding a New Preset

1. Create `templates/<preset>/` with owned files
2. Create `src/presets/<preset>.ts` implementing the `Preset` interface
3. Register it in `src/generator.ts` (`ALL_PRESETS` and `PRESET_ORDER`)
4. Add tests following the 3-layer strategy:
   - Layer A: `tests/presets/<preset>.test.ts` (unit)
   - Layer B: `tests/pairwise.test.ts` (cross-layer pairs, if needed)
   - Layer C: `tests/smoke.test.ts` (representative patterns, if needed)
5. Update `docs/design.md` with the new preset details
