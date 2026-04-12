---
name: pr
description: Push committed changes and create or update a pull request
---

# pr - Push and Create PR

Push committed changes to the remote and create or update a pull request.

**This skill handles PR creation only.** Review is offered as a next action after completion.

## Workflow

### Step 1: Check Current State

Run the following commands to understand the current state:

- `git branch --show-current` to check the current branch
- `git status` to check for uncommitted changes
- `git log --oneline origin/<branch>..HEAD 2>/dev/null || git log --oneline -5` to check for unpushed commits

**If on the main branch:** Warn that pushing directly to main is not allowed. Suggest creating a feature branch with the implement skill or manually with `git checkout -b <branch>`, then end.

**If there are uncommitted changes:** Suggest committing first with the commit skill, then end.

**If there are no commits to push:** Inform the user that there are no commits to push and end.

### Step 2: Push and Create PR

1. Run `git push -u origin <branch>` to push to the remote
2. Create or update the PR:
   - Run `gh pr view` to check for an existing PR
   - **If no existing PR:** Run `gh pr create --title "<title>" --body "<body>"` to create a new PR. Use the first line of the most recent commit message as the title
   - **If a PR already exists:** Push only (the PR updates automatically)
3. Report the PR URL to the user

PR body format:

```markdown
## Summary

- <bullet points describing the changes>

Closes #N <!-- Only when originating from an issue. Infer issue number from branch name or commits -->

## Test plan

- [ ] TypeScript tests pass
- [ ] Python tests pass
- [ ] CDK tests pass
```

### Step 3: Completion Report

Report the results:

```text
Done:
  Branch: feat/add-auth
  PR: https://github.com/owner/repo/pull/123
```

## Next Actions

After reporting completion, ask the user which action to take next:

- **Review the PR** - Read `.agents/skills/review/SKILL.md` and follow its workflow
- **Merge the PR** - Run `gh pr merge --squash --delete-branch` and report the result
