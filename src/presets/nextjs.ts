import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const nextjsPreset: Preset = {
  name: "nextjs",
  requires: ["typescript"],
  files: readTemplateFiles("nextjs"),
  merge: {
    ".gitignore": "# Next.js\n.next/\nout/\n!next-env.d.ts",
    "biome.json": {
      files: { includes: ["!**/.next/"] },
    },
    ".vscode/settings.json": {
      "search.exclude": { "**/.next": true },
      "files.exclude": { "**/.next": true },
    },
    "tsconfig.json": {
      compilerOptions: {
        lib: ["dom", "dom.iterable", "esnext"],
        jsx: "preserve",
        module: "ESNext",
        moduleResolution: "bundler",
        noEmit: true,
        incremental: true,
        plugins: [{ name: "next" }],
        allowJs: true,
      },
      include: ["next-env.d.ts", ".next/types/**/*.ts"],
      exclude: [".next"],
    },
    "package.json": {
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        next: "^15.0.0",
      },
      devDependencies: {
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
      },
    },
  },
  markdown: {
    "CLAUDE.md": [
      {
        placeholder: "<!-- SECTION:TECH_STACK -->",
        content: "- **Frontend**: Next.js 15 (App Router)",
      },
      {
        placeholder: "<!-- SECTION:PROJECT_STRUCTURE -->",
        content: "src/app/      -> Next.js App Router pages",
      },
    ],
    "README.md": [
      {
        placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
        content: "├── src/app/             # Next.js App Router ページ",
      },
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── next.config.ts       # Next.js 設定",
      },
    ],
  },
  // No ciSteps needed — TypeScript's "Build" step runs `pnpm run build`,
  // which executes `next build` since Next.js overrides the build script.
};
