---
name: lint
description: Run all linters and formatters with auto-fix, then report results
---

# lint - Run All Linters

Run all linters and formatters with auto-fix enabled and report the results.

## Workflow

1. Run `git status` to identify changed files. If there are no changes, target the entire project
2. Read `.agents/skills/lint-rules/SKILL.md` and follow the command table and typecheck rules to run the appropriate linters, formatters, and type checks for the target files
3. Report a summary of all results

## Next Actions

After reporting the summary, ask the user which action to take next. Adjust suggestions based on results:

**If all checks pass:**

- **Run tests** - Read `.agents/skills/test/SKILL.md` and follow its workflow
- **Commit changes** - Read `.agents/skills/commit/SKILL.md` and follow its workflow
- **Run test, commit, and create PR** - Read `.agents/skills/ship/SKILL.md` and follow its workflow
- **Continue with additional changes** - End this skill

**If there are errors:**

- **Fix the errors** - After fixing, return to step 1 and re-run
- **Continue with additional changes** - End this skill
