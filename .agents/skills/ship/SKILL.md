---
name: ship
description: Run lint, test, commit, and create PR in a single integrated pipeline
---

# ship - Lint, Test, Commit, and PR Pipeline

Run lint, test, commit, and PR creation sequentially as an integrated pipeline.

If any step fails, abort and report the error.

**Important:** When reading child skill files, execute **only their workflow steps**. Ignore any "Next Actions" sections in the child skills.

## Workflow

### Step 1: Lint

Read `.agents/skills/lint/SKILL.md` and follow its workflow to run all linters and formatters.

**On failure:** Report the errors and suggest fixing them, then re-running this skill. Abort.

### Step 2: Test

Read `.agents/skills/test/SKILL.md` and follow its workflow to run all tests.

**On failure:** Report the failures and suggest fixing them, then re-running this skill. Abort.

### Step 3: Commit

Read `.agents/skills/commit/SKILL.md` and follow the staging and commit workflow (ignore its "Next Actions" section).

**If there are no changes:** If there are already unpushed commits, proceed to Step 4. Otherwise, end.

### Step 4: PR

Push and create a PR:

1. Run `git branch --show-current` to check the current branch
2. Run `git push -u origin <branch>` to push to the remote
3. Run `gh pr view` to check for an existing PR
   - **If no existing PR:** Run `gh pr create --title "<title>" --body "<body>"` to create a new PR. Use the first line of the most recent commit message as the title
   - **If a PR already exists:** Push only (the PR updates automatically)
4. Record the PR URL

### Step 5: Completion Report

Report the results:

```text
Done:
  Commit: abc1234 feat: add authentication
  Branch: feat/add-auth
  PR: https://github.com/owner/repo/pull/123
```

## Next Actions

After reporting completion, ask the user which action to take next:

- **Review the PR** - Read `.agents/skills/review/SKILL.md` and follow its workflow
- **Merge the PR** - Run `gh pr merge --squash --delete-branch` and report the result
