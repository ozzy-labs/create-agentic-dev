---
name: review
description: Review code changes or a pull request and report issues with severity levels
---

# review - Code Review

Review code changes or a pull request and report issues, improvements, and suggestions.

## Workflow

### Step 1: Parse Input

Parse `$ARGUMENTS` to determine the review target:

- **If a PR number is provided** (`#N` or a plain number):
  - Run `gh pr diff <N>` to fetch the diff
  - Run `gh pr view <N>` to fetch the PR description
- **If no arguments are provided:**
  - Run `git diff` to get working tree changes
  - If no changes, run `git diff main...HEAD` to get branch diff
  - If still no changes, inform the user there is nothing to review and end

### Step 2: Gather Context

Read surrounding code for files included in the diff to understand intent and impact:

- Review the full functions/classes that were changed
- Check import sources and export consumers
- Check whether test files exist for the changed code
- Identify related documentation files (CLAUDE.md, README.md, SKILL.md, JSDoc/docstrings, etc.)

### Step 3: Perform Review

Analyze the diff from the following perspectives:

- **Correctness:** Logic errors, edge cases, off-by-one errors
- **Security:** Injection vulnerabilities, authentication/authorization flaws, secret exposure
- **Performance:** Unnecessary loops, N+1 queries, memory leaks
- **Coding conventions:** Alignment with the project's coding standards
- **Tests:** Presence and adequacy of test coverage
- **Documentation consistency:**
  - Whether code changes are accurately reflected in documentation (CLAUDE.md, README.md, SKILL.md, etc.)
  - Whether documentation descriptions (commands, APIs, configuration, structure) match the actual implementation
  - Whether new, changed, or removed features/commands are reflected in documentation
  - Whether code comments and JSDoc/docstrings are consistent with the implementation
  - When linters/formatters are added or changed, whether all items in the [`docs/adding-tools.md`](../../../docs/adding-tools.md) checklist have been updated

### Step 4: Report

Present findings in the following format:

#### Summary

Provide an overall assessment in 1-2 sentences.

#### Issues

Classify findings into 3 severity levels:

- **Critical** - Must fix (bugs, security vulnerabilities)
- **Warning** - Should fix (performance issues, convention violations)
- **Info** - Optional improvements (refactoring, readability)

Each issue includes:

```text
[Critical] filename:line-number
  Problem: <description of the issue>
  Reason: <why this is a problem>
  Suggestion: <specific fix recommendation>
```

#### Improvement Suggestions

For larger improvement suggestions, include concrete code examples.

#### Conclusion

Summarize the issue counts:

```text
Review results:
  Critical: 0
  Warning:  2
  Info:     1
```

**For PR reviews:** Post the full report (Summary through Conclusion) as a comment on the PR using `gh pr comment <N> --body "<report>"`. Also display the report in the agent output (output to both).

### Step 5: Next Actions

Ask the user which action to take next. Adjust suggestions based on findings:

**For PR reviews:**

- **Fix the issues** (when issues exist) - Fix code based on the findings. After fixing, ask again:
  - **Re-review** - Return to Step 1
  - **Commit and push** - Read `.agents/skills/commit/SKILL.md`, follow its workflow, then read `.agents/skills/pr/SKILL.md` and follow its workflow
  - **Continue with additional changes** - End this skill
- **Proceed as-is** - End this skill

**For local change reviews:**

- **Fix the issues** (when issues exist) - Fix code based on the findings. After fixing, ask again:
  - **Re-review** - Return to Step 1
  - **Run lint, test, commit, and create PR** - Read `.agents/skills/ship/SKILL.md` and follow its workflow
  - **Continue with additional changes** - End this skill
- **Run lint, test, commit, and create PR** - Read `.agents/skills/ship/SKILL.md` and follow its workflow
- **Proceed as-is** - End this skill
