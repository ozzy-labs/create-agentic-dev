import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const sveltekitPreset: Preset = {
  name: "sveltekit",
  requires: ["typescript"],
  files: readTemplateFiles("sveltekit"),
  merge: {
    ".gitignore": "# SvelteKit\n.svelte-kit/",
    "biome.json": {
      files: { includes: ["!**/.svelte-kit/"] },
    },
    ".vscode/settings.json": {
      "search.exclude": { "**/.svelte-kit": true },
      "files.exclude": { "**/.svelte-kit": true },
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
        content: "- **Frontend**: SvelteKit (Svelte 5)",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "web/          -> Frontend (SvelteKit)",
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
          "- SvelteKit: file-based routing in `src/routes/`, shared logic in `src/lib/`, co-located tests in `web/tests/`",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── web/                 # フロントエンド (SvelteKit)",
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
          "| `pnpm run build:web` | フロントエンドビルド |\n| `pnpm run dev` | SvelteKit 開発サーバー起動 |",
      },
    ],
  },
};
