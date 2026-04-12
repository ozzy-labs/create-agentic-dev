/**
 * Instruction template builders for agent presets.
 *
 * All agent instruction files share common content. This module provides
 * builder functions that generate each variant from shared constants.
 *
 * Three builders:
 *  - buildAgentsMdInstruction() — Universal AGENTS.md (AAIF standard, SSOT)
 *  - buildEnglishInstruction()  — Fallback for agents that can't read AGENTS.md (Cline, Amazon Q)
 *  - buildClaudeInstruction()   — Slim CLAUDE.md (@AGENTS.md import + Claude-specific)
 */

// ---------------------------------------------------------------------------
// Shared content blocks
// ---------------------------------------------------------------------------

/** Linting tools list (indented, used inside Tech Stack). */
const LINTING_TOOLS = `  - shellcheck + shfmt (Shell)
  - mdformat + markdownlint-cli2 (Markdown)
  - yamlfmt + yamllint (YAML)
  - taplo (TOML)
  - dockerfmt + hadolint (Dockerfile)
  - actionlint (GitHub Actions)`;

/** Lint commands (used inside Key Commands code block). */
const LINT_COMMANDS = `pnpm run lint:md           # Markdown lint (markdownlint-cli2)
pnpm run lint:yaml         # YAML lint (yamllint)
pnpm run lint:shell        # Shell lint (shellcheck + shfmt check)
pnpm run lint:toml         # TOML format check (taplo)
pnpm run lint:docker       # Dockerfile lint (hadolint)
pnpm run lint:actions      # GitHub Actions lint (actionlint)
pnpm run lint:secrets      # Secret detection (Gitleaks)`;

/** Commit convention section body. */
const COMMIT_CONVENTION = `Conventional Commits required (enforced by commitlint):

\`\`\`text
<type>[optional scope]: <description>
\`\`\`

Types: \`feat\`, \`fix\`, \`docs\`, \`style\`, \`refactor\`, \`perf\`, \`test\`, \`build\`, \`ci\`, \`chore\`

Breaking changes: add \`!\` after type (e.g., \`feat!: ...\`) or \`BREAKING CHANGE:\` footer.`;

// ---------------------------------------------------------------------------
// Full English instruction template (shared by AGENTS.md and fallback files)
// ---------------------------------------------------------------------------

/**
 * Build a full English instruction template.
 *
 * @param title - Document title (e.g., "AGENTS.md", "Project Rules")
 * @param mcpConfigRef - MCP config reference (e.g., "per agent tool settings")
 * @param prefix - Optional prefix (e.g., YAML frontmatter for Cursor MDC)
 * @param mcpDefaultServers - Optional default MCP server names to hardcode before the placeholder
 */
export function buildEnglishInstruction(
  title: string,
  mcpConfigRef: string,
  prefix?: string,
  mcpDefaultServers?: string,
): string {
  const mcpServersPrefix = mcpDefaultServers ? `${mcpDefaultServers}` : "";
  return `${prefix ?? ""}# ${title}

## Project Overview

{{projectName}}: AI-agent-native development project.

## Tech Stack

- **Version management**: mise (\`.mise.toml\`), gh is managed via devcontainer feature
- **Tool policy**: Development tools are managed by mise (not in package.json devDependencies)
- **Linting/Formatting**:
${LINTING_TOOLS}
<!-- SECTION:TECH_STACK -->
- **Security scanning**: Gitleaks (secrets)
<!-- SECTION:TECH_STACK_LINTING -->
- **MCP servers**: ${mcpServersPrefix}<!-- SECTION:TECH_STACK_MCP --> — configured ${mcpConfigRef}
- **Git hooks**: lefthook (commit-msg: commitlint, pre-commit: linters + gitleaks, pre-push: <!-- SECTION:PRE_PUSH_HOOKS -->)

## Project Structure

\`\`\`text
scripts/      -> Shell scripts (setup, etc.)
docs/         -> Documentation (branch strategy, etc.)
<!-- SECTION:PROJECT_STRUCTURE -->
<!-- SECTION:INFRA_STRUCTURE -->
\`\`\`

## Key Commands

\`\`\`bash
# Setup
scripts/setup.sh          # Full environment setup
mise install               # Install all tools
<!-- SECTION:SETUP_COMMANDS -->

# Lint & Format
${LINT_COMMANDS}
<!-- SECTION:LINT_COMMANDS -->
# Test
<!-- SECTION:TEST_COMMANDS -->
\`\`\`

## Coding Conventions

- Indent: 2 spaces (JSON/YAML)
- Line endings: LF only
- All code must pass linters before committing
- YAML file extension: \`.yaml\` (not \`.yml\`, unless required by tools)
- Shell: must pass shellcheck and shfmt
- Dockerfile: must pass hadolint
- GitHub Actions: must pass actionlint
- Security: must pass Gitleaks secret detection
<!-- SECTION:CODING_CONVENTIONS -->

## Commit Convention

${COMMIT_CONVENTION}

## Branching

GitHub Flow: \`main\` + feature branches. **squash merge only**.
Branch naming: \`<type>/<short-description>\` (e.g., \`feat/add-auth\`, \`fix/login-error\`).
See [\`docs/branch-strategy.md\`](docs/branch-strategy.md) for details.

## Git Workflow

- Lefthook \`commit-msg\` hook validates Conventional Commits format
- Lefthook \`pre-commit\` runs linters (auto-fixes staged)
<!-- SECTION:GIT_WORKFLOW -->
- CI validates all linters on PRs
- Renovate manages dependency updates

<!-- SECTION:CD_SECTION -->
`;
}

// ---------------------------------------------------------------------------
// AGENTS.md (universal SSOT)
// ---------------------------------------------------------------------------

/** Build AGENTS.md — the universal instruction file (AAIF standard). */
export function buildAgentsMdInstruction(): string {
  return buildEnglishInstruction(
    "AGENTS.md",
    "per agent tool settings",
    undefined,
    "Context7 (docs), Fetch (web)",
  );
}

// ---------------------------------------------------------------------------
// Claude Code slim instruction builder
// ---------------------------------------------------------------------------

/** Build slim CLAUDE.md — imports @AGENTS.md and adds Claude-specific config. */
export function buildClaudeInstruction(): string {
  return `# CLAUDE.md

@AGENTS.md

## 基本ルール

- 日本語で応答する
- ユーザーへの確認には \`AskUserQuestion\` を使用する（テキスト出力で選択肢を列挙しない）
- 推奨案とその理由を提示する

## 環境

WSL2/Ubuntu 24.04 + VSCode。MCP サーバーは \`.mcp.json\` で設定。

## Skills

- \`/setup\` - 開発環境のフルセットアップを行う
- \`/implement\` - Issue または指示をもとに、ブランチ作成・実装を行う
- \`/lint\` - 全リンターを自動修正付きで実行し、結果を報告する
- \`/test\` - 全テストを実行し、結果を報告する
- \`/commit\` - 変更をステージし、Conventional Commits でコミットする（push はしない）
- \`/pr\` - 変更を push し、PR を作成・更新する
- \`/review\` - コード変更や PR をレビューし、問題点・改善案を報告する
- \`/ship\` - lint・テスト・コミット・PR 作成を一括実行する

### Skills の共通ルール

- スキル完了時のネクストアクション提案には \`AskUserQuestion\` を使用する（テキスト出力で選択肢を列挙しない）
- ネクストアクションはユーザーの確認なく実行しない
`;
}
