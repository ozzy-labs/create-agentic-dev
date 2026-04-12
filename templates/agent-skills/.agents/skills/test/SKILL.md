---
name: test
description: Run all tests and report results
---

# test - Run All Tests

Run all tests and report the results.

## Workflow

<!-- SECTION:TEST_STEPS -->
1. Report a summary of all test results

## Next Actions

After reporting the summary, ask the user which action to take next. Adjust suggestions based on results:

**If all tests pass:**

- **Commit changes** - Read `.agents/skills/commit/SKILL.md` and follow its workflow
- **Create a PR** - Read `.agents/skills/pr/SKILL.md` and follow its workflow
- **Run commit and create PR** - Read `.agents/skills/ship/SKILL.md` and follow its workflow
- **Continue with additional changes** - End this skill

**If there are failures:**

- **Fix the failures** - After fixing, return to step 1 and re-run
- **Continue with additional changes** - End this skill
