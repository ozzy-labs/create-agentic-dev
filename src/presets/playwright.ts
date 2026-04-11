import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const playwrightPreset: Preset = {
  name: "playwright",
  requires: ["typescript"],
  files: readTemplateFiles("playwright"),
  merge: {
    ".gitignore": "# Playwright\nplaywright-report/\nblob-report/\ntest-results/",
    "package.json": {
      scripts: {
        "test:e2e": "cd e2e && pnpm test",
      },
    },
  },
  markdown: {
    "agent-instructions": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **E2E Testing**: Playwright",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "e2e/          -> E2E tests (Playwright)",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content:
          "cd e2e && pnpm install    # Install E2E test dependencies\nnpx playwright install    # Install browsers",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content: "pnpm run test:e2e          # Run E2E tests (Playwright)",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content: "- Playwright: tests in `e2e/`, use Page Object Model for complex pages",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── e2e/                 # E2E テスト (Playwright)",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── e2e/package.json     # E2E テスト依存・スクリプト",
      },
      {
        placeholder: "<!-- SECTION:SETUP_STEPS -->",
        content:
          "1. `cd e2e && pnpm install`（E2E テスト依存パッケージ）\n1. `npx playwright install`（ブラウザインストール）",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content:
          "| `cd e2e && pnpm install` | E2E テスト依存パッケージインストール |\n| `npx playwright install` | Playwright ブラウザインストール |",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content: "| `pnpm run test:e2e` | E2E テスト（Playwright） |",
      },
    ],
  },
  mcpServers: {
    playwright: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
  },
  ciSteps: {
    setupSteps: [
      { name: "Install E2E dependencies", run: "cd e2e && pnpm install --frozen-lockfile" },
      {
        name: "Install Playwright browsers",
        run: "cd e2e && npx playwright install --with-deps chromium",
      },
    ],
    testSteps: [{ name: "Test (E2E Playwright)", run: "cd e2e && pnpm test" }],
  },
  setupExtra: "cd e2e && pnpm install && npx playwright install",
};
