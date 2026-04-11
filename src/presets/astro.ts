import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const astroPreset: Preset = {
  name: "astro",
  requires: ["typescript"],
  files: readTemplateFiles("astro"),
  merge: {
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
        content: "- **Frontend**: Astro",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "web/          -> Frontend (Astro)",
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
        content:
          "- Astro: file-based routing in `src/pages/`, layouts in `src/layouts/`, co-located tests in `web/tests/`",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── web/                 # フロントエンド (Astro)",
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
          "| `pnpm run build:web` | フロントエンドビルド |\n| `pnpm run dev` | Astro 開発サーバー起動 |",
      },
    ],
  },
};
