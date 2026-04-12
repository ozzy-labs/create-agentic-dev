---
name: lint-rules
description: Linter and formatter command reference table by file extension. Referenced by other skills.
---

# lint-rules - Linter and Formatter Command Reference

This is a reference skill. It is not invoked directly by the user; other skills read this file when running linters.

## Command Table by Extension

Run the appropriate linters and formatters in auto-fix mode based on the file extensions of changed files:

| Extension / File | Command |
|------------------|---------|
| `.sh` | `shellcheck <files>` then `shfmt -w <files>` |
| `.toml` | `taplo format <files>` |
| `.md` | `markdownlint-cli2 <files>` |
| `.yaml`, `.yml` | `yamlfmt <files>` then `yamllint -c .yamllint.yaml <files>` |
| `Dockerfile*` | `dockerfmt <files>` then `hadolint --failure-threshold warning <files>` |
| `.github/workflows/*.yaml` | `actionlint` |

## Security Scan

- Run `gitleaks detect --no-banner` for secret detection

## Handling Results

**When auto-fixes are applied:**

- Report the fixed files to the user
- Fixes are already applied to the working tree; proceed to the next step

**When there are unfixable errors:**

- Report the errors to the user
- Abort the calling skill
- **Do not manually fix code** (accept auto-fixes from linters/formatters, but leave decisions about type errors and similar issues to the user)
