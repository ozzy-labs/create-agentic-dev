import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const reactPreset: Preset = {
  name: "react",
  requires: ["typescript"],
  files: readTemplateFiles("react"),
  merge: {
    ".gitignore": "# React + Vite\n!src/vite-env.d.ts",
    "tsconfig.json": {
      compilerOptions: {
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
      },
    },
    "package.json": {
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      devDependencies: {
        vite: "^6.0.0",
        "@vitejs/plugin-react": "^4.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
      },
    },
  },
  markdown: {
    "CLAUDE.md": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **Frontend**: React 19 + Vite",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "src/          -> Source code",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── src/                 # ソースコード",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content:
          "├── vite.config.ts       # Vite 設定\n├── index.html           # HTML エントリポイント",
      },
    ],
  },
  // No ciSteps needed — TypeScript's "Build" step runs `pnpm run build`,
  // which executes `vite build` since React overrides the build script.
};
