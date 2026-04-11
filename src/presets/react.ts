import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const reactPreset: Preset = {
  name: "react",
  requires: ["typescript"],
  files: readTemplateFiles("react"),
  merge: {
    ".gitignore": "# React + Vite\n!web/src/vite-env.d.ts",
    ".devcontainer/devcontainer.json": {
      forwardPorts: [5173],
    },
    "package.json": {
      scripts: {
        dev: "pnpm --filter web dev",
        build: "pnpm run build:web",
        "build:web": "pnpm --filter web build",
        preview: "pnpm --filter web preview",
      },
    },
  },
  markdown: {
    "agent-instructions": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **Frontend**: React 19 + Vite",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "web/          -> Frontend (React + Vite)",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "pnpm --filter web install # Install frontend dependencies",
      },
      {
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content: "pnpm --filter web test     # Run frontend tests",
      },
      {
        placeholder: "<!-- SECTION:CODING_CONVENTIONS -->",
        content: "- React: functional components with hooks, co-located tests in `web/tests/`",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── web/                 # フロントエンド (React + Vite)",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── web/package.json     # フロントエンド依存・スクリプト",
      },
      {
        placeholder: "<!-- SECTION:SETUP_COMMANDS -->",
        content: "| `pnpm --filter web install` | フロントエンド依存パッケージインストール |",
      },
      {
        placeholder: "<!-- SECTION:DEV_COMMANDS -->",
        content:
          "| `pnpm run build:web` | フロントエンドビルド |\n| `pnpm run dev` | Vite 開発サーバー起動 |",
      },
    ],
  },
  // No ciSteps needed — TypeScript's "Build" step runs `pnpm run build`,
  // which executes `pnpm run build:web` since React overrides the build script.
};
