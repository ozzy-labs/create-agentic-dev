---
name: commit-conventions
description: Conventional Commits message generation rules. Referenced by other skills.
---

# commit-conventions - Commit Message Generation Rules

Follow Conventional Commits 1.0.0 (enforced by commitlint).

This is a reference skill. It is not invoked directly by the user; other skills read this file when generating commit messages.

## Type Detection

| Change | Type |
|--------|------|
| New feature | `feat` |
| Bug fix | `fix` |
| Documentation only | `docs` |
| Formatting (no behavior change) | `style` |
| Refactoring | `refactor` |
| Performance improvement | `perf` |
| Adding or updating tests | `test` |
| Build system or dependencies | `build` |
| CI/CD configuration | `ci` |
| Other | `chore` |

## Scope Rules

When changes are concentrated in a specific directory, add a scope:

- `infra/` -> `(infra)`
- `scripts/` -> `(scripts)`
- `.github/workflows/` -> `(ci)`
- `.agents/skills/` -> `(skills)`

If `src/` has subdirectories, use a more specific scope. If changes span multiple directories, omit the scope.

## Message Format

- First line: `type[(scope)]: description` (target 50 characters)
- For multiple logical changes, add a body for additional context
- Breaking changes: add `!` after the type (e.g., `feat!: remove legacy api`)

## General Rules

- **Never force push**
- **Never read or stage `.env` files** (exclude from `git add`)
- **Do not add `Co-Authored-By` to commit messages** (personal project)
