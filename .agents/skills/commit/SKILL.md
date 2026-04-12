---
name: commit
description: Stage changes and create a Conventional Commits compliant commit
---

# commit - Stage and Commit

Stage changes and create a commit following Conventional Commits. This skill does not push or create a PR.

## Workflow

### Step 1: Check Current State

Run the following commands to understand the current state:

- `git status` to list changed files
- `git diff` to review unstaged changes
- `git diff --staged` to review staged changes
- `git log --oneline -5` to review recent commit history

**If there are no changes:** Inform the user that there is nothing to commit and end.

Present the list of changed files to the user:

```text
Changed files:
  M src/index.ts
  A infra/lib/new-stack.ts
  M tests/test_placeholder.py
```

### Step 2: Stage and Commit

1. **Stage files:** Add changed files individually with `git add <file>`. Never stage `.env` files
2. **Generate commit message:** Read `.agents/skills/commit-conventions/SKILL.md` and follow its rules to generate the message
3. **Execute commit:** Run `git commit -m "<message>"`
   - Lefthook hooks (commitlint on commit-msg, linters on pre-commit) run automatically

### Step 3: Completion Report

Report the result:

```text
Done:
  Commit: abc1234 feat: add authentication
```

## Next Actions

After reporting completion, ask the user which action to take next:

- **Run tests** - Read `.agents/skills/test/SKILL.md` and follow its workflow
- **Create a PR** - Read `.agents/skills/pr/SKILL.md` and follow its workflow
- **Run lint, test, commit, and create PR** - Read `.agents/skills/ship/SKILL.md` and follow its workflow
- **Continue with additional changes** - End this skill
