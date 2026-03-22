import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const basePreset: Preset = {
  name: "base",
  files: readTemplateFiles("base"),
  merge: {
    "package.json": {
      name: "{{projectName}}",
      version: "0.0.0",
      private: true,
      type: "module",
      packageManager: "pnpm@10.32.1",
      engines: { node: ">=24" },
      scripts: {
        prepare: "lefthook install",
        "lint:md": "markdownlint-cli2 '**/*.md' '#**/node_modules'",
        "lint:yaml": "yamllint -c .yamllint.yaml .",
        "lint:shell":
          "shellcheck scripts/*.sh .devcontainer/*.sh && shfmt -d scripts/ .devcontainer/",
        "lint:toml": "taplo format --check ./*.toml",
        "lint:docker": "hadolint --failure-threshold warning .devcontainer/Dockerfile",
        "lint:actions": "actionlint",
        "lint:secrets": "gitleaks detect --no-banner",
      },
      devDependencies: {
        "@commitlint/cli": "^20.0.0",
        "@commitlint/config-conventional": "^20.0.0",
      },
    },
    ".mise.toml": {
      tools: {
        node: "24",
        pnpm: "10",
        pipx: "1",
        shellcheck: "0.11",
        shfmt: "3",
        taplo: "0.10",
        "npm:markdownlint-cli2": "0.21",
        "pipx:yamllint": "1",
        "pipx:mdformat": "1",
        yamlfmt: "0.21",
        "github:reteps/dockerfmt": "0.3",
        hadolint: "2",
        actionlint: "1",
        gitleaks: "8",
        lefthook: "2",
      },
    },
    "lefthook.yaml": {
      "commit-msg": {
        commands: {
          commitlint: { run: "npx commitlint --edit {1}" },
        },
      },
      "pre-commit": {
        parallel: true,
        commands: {
          shellcheck: { glob: "**/*.sh", run: "shellcheck {staged_files}" },
          shfmt: { glob: "**/*.sh", run: "shfmt -w {staged_files}", stage_fixed: true },
          taplo: { glob: "**/*.toml", run: "taplo format {staged_files}", stage_fixed: true },
          markdownlint: { glob: "**/*.md", run: "markdownlint-cli2 {staged_files}" },
          yamlfmt: {
            glob: "**/*.{yaml,yml}",
            run: "yamlfmt {staged_files}",
            stage_fixed: true,
          },
          yamllint: {
            glob: "**/*.{yaml,yml}",
            run: "yamllint -c .yamllint.yaml {staged_files}",
          },
          dockerfmt: {
            glob: "Dockerfile*",
            run: "dockerfmt -w {staged_files}",
            stage_fixed: true,
          },
          hadolint: { glob: "Dockerfile*", run: "hadolint {staged_files}" },
          actionlint: { glob: ".github/workflows/*.{yaml,yml}", run: "actionlint" },
          gitleaks: { run: "gitleaks protect --staged --no-banner" },
        },
      },
    },
  },
  mcpServers: {
    context7: {
      command: "npx",
      args: ["-y", "@upstash/context7-mcp@latest"],
    },
    fetch: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch"],
    },
  },
  markdown: {
    "CLAUDE.md": [],
    "README.md": [],
  },
  ciSteps: {
    setupSteps: [
      {
        name: "pnpm cache",
        uses: "actions/cache@5a3ec84eff668545956fd18022155c47e93e2684",
        with: {
          path: "~/.local/share/pnpm/store",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression
          key: "pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression
          "restore-keys": "pnpm-${{ runner.os }}-",
        },
      },
      { name: "Install dependencies", run: "pnpm install --frozen-lockfile" },
    ],
    lintSteps: [
      { name: "Lint (Markdown)", run: "markdownlint-cli2 '**/*.md' '#**/node_modules'" },
      { name: "Lint (YAML)", run: "yamllint -c .yamllint.yaml ." },
      {
        name: "Lint (Shell)",
        run: "shellcheck scripts/*.sh .devcontainer/*.sh && shfmt -d scripts/ .devcontainer/",
      },
      { name: "Lint (TOML)", run: "taplo format --check ./*.toml" },
      {
        name: "Lint (Dockerfile)",
        run: "hadolint --failure-threshold warning .devcontainer/Dockerfile",
      },
      { name: "Lint (GitHub Actions)", run: "actionlint" },
      { name: "Security (Gitleaks)", run: "gitleaks detect --no-banner" },
    ],
  },
};
