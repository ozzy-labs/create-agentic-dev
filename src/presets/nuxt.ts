import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const nuxtPreset: Preset = {
  name: "nuxt",
  requires: ["typescript"],
  files: readTemplateFiles("nuxt"),
  merge: {
    ".gitignore": "# Nuxt\n.nuxt/\n.output/",
    "biome.json": {
      files: { includes: ["!**/.nuxt/", "!**/.output/"] },
    },
    ".vscode/settings.json": {
      "search.exclude": { "**/.nuxt": true, "**/.output": true },
      "files.exclude": { "**/.nuxt": true, "**/.output": true },
    },
    "package.json": {
      scripts: {
        dev: "pnpm --filter web dev",
        build: "pnpm run build:web",
        "build:web": "pnpm --filter web build",
        start: "pnpm --filter web start",
      },
    },
  },
  markdown: {
    "agent-instructions": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **Frontend**: Nuxt 3 (Vue 3)",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "web/          -> Frontend (Nuxt 3)",
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
          "- Nuxt: Composition API with `<script setup>`, file-based routing in `src/pages/`, co-located tests in `web/tests/`",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── web/                 # フロントエンド (Nuxt 3)",
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
        placeholder: "<!-- SECTION:TEST_COMMANDS -->",
        content:
          "| `pnpm run build:web` | フロントエンドビルド |\n| `pnpm run dev` | Nuxt 開発サーバー起動 |",
      },
    ],
  },
  // No ciSteps needed — TypeScript's "Build" step runs `pnpm run build`,
  // which executes `pnpm run build:web` since Nuxt overrides the build script.
};
