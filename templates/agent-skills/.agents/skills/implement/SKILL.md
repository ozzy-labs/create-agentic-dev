---
name: implement
description: Create a feature branch and implement changes based on a GitHub issue or text instruction
---

# implement - Branch Creation and Implementation from Issue or Instruction

Parse a GitHub issue or direct instruction, create a feature branch, plan the implementation, and execute code changes.

## Workflow

### Step 1: Parse Input and Gather Requirements

Parse `$ARGUMENTS` to determine what to implement.

**If an issue number is provided** (`#N` or a plain number):

1. Run `gh issue view <N>` to fetch the issue content
2. Extract requirements from the title, body, and labels
3. Present the understood requirements to the user for confirmation

**If a text instruction is provided:**

- Use it directly as the requirement

**If no arguments are provided:**

- Ask the user: "What should be implemented? (Issue number or description)"

**On `gh` CLI errors:**

- Authentication error: Instruct the user to run `gh auth login` and abort
- Issue not found: Ask the user to verify the issue number and abort

### Step 2: Create Branch

1. Run `git status` and `git branch --show-current` to check the current state
2. Determine a branch name in `<type>/<slug>` format based on the requirements
   - Examples: `feat/add-auth`, `fix/cdk-synth-error`
3. Run `git checkout -b <branch-name>` to create the branch

**If already on a feature branch:**

- Ask the user whether to continue working on the current branch

### Step 3: Implementation Plan

1. Investigate the codebase to understand the existing structure:
   - Identify related files
   - Understand existing implementation patterns
   - Assess the scope of impact
2. Present the implementation plan to the user:

```markdown
## Implementation Plan

### Changes
1. `src/index.ts` - Add routing to entry point
2. `infra/lib/app-stack.ts` - Define Lambda function resource
3. `tests/test_handler.py` - Add handler tests

### Impact
- Adds resources to existing AppStack (no impact on existing functionality)

Approve?
```

3. Wait for user approval before proceeding: "Implement this plan", "Modify the plan", or "Cancel"

**Important:** Do not begin code changes without plan approval.

### Step 4: Implementation

Execute code changes according to the approved plan:

1. **Code changes:** Implement the planned modifications
2. **Test creation:** Create tests as needed
3. **Progress reports:** Briefly report completion of each file change

If the plan needs to change during implementation, consult the user.

### Step 5: Completion Report and Next Actions

Report implementation completion:

```text
Implementation complete:
  Branch: feat/add-auth
  Changed files:
    M src/index.ts
    A infra/lib/auth-stack.ts
    A tests/test_auth.py
```

Then ask the user which action to take next:

- **Run lint, test, commit, and create PR** - Read `.agents/skills/ship/SKILL.md` and follow its workflow
- **Run linters only** - Read `.agents/skills/lint/SKILL.md` and follow its workflow
- **Continue with additional changes** - End this skill

## Important Notes

- **Never read or stage `.env` files**
- **If `gh` CLI is not authenticated, display the error and abort**
- **Do not begin code changes without plan approval**
- **When adding or changing linters/formatters, follow the checklist in [`docs/adding-tools.md`](../../../docs/adding-tools.md)**
