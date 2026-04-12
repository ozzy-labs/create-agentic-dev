---
name: setup
description: Set up the development environment with all required tools and dependencies
---

# setup - Development Environment Setup

Set up the development environment from scratch, installing all required tools and dependencies.

## Workflow

1. Run `mise trust && mise install` to install all project tools
2. Run `pnpm install` to install Node.js dependencies (this also configures Git hooks automatically)
3. Run `uv sync` to install Python dependencies (skip if no `pyproject.toml` exists)
4. Run `cd infra && pnpm install` to install CDK dependencies (skip if no `infra/` directory exists)
5. Report the result of each step to the user

## Next Actions

After reporting completion, ask the user which action to take next:

- **Start implementing** - Read `.agents/skills/implement/SKILL.md` and follow its workflow
- **Run linters** - Read `.agents/skills/lint/SKILL.md` and follow its workflow
