import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (nextjs)", () => {
  const answers = makeAnswers({ frontend: "nextjs" });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes Next.js owned files in web/", () => {
    expect(result.hasFile("web/next.config.ts")).toBe(true);
    expect(result.hasFile("web/src/app/layout.tsx")).toBe(true);
    expect(result.hasFile("web/src/app/page.tsx")).toBe(true);
    expect(result.hasFile("web/src/app/page.module.css")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
  });

  it("removes TypeScript sample files (replaced by web/)", () => {
    expect(result.hasFile("src/index.ts")).toBe(false);
    expect(result.hasFile("tests/index.test.ts")).toBe(false);
  });

  it("has Next.js dependencies in web/package.json", () => {
    const pkg = result.readJson("web/package.json") as Record<string, unknown>;
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps.react).toBeDefined();
    expect(deps["react-dom"]).toBeDefined();
    expect(deps.next).toBeDefined();
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps["@types/react"]).toBeDefined();
    expect(devDeps["@types/react-dom"]).toBeDefined();
  });

  it("root package.json has orchestration scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.build).toBe("pnpm run build:web");
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts.dev).toBe("pnpm --filter web dev");
    expect(scripts.start).toBe("pnpm --filter web start");
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.typescript).toBeDefined();
  });

  it("removes tsdown from devDependencies when not used in scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.tsdown).toBeUndefined();
  });

  it("overrides tsconfig for Next.js with web/ paths", () => {
    const tsconfig = result.readJson("tsconfig.json") as Record<string, unknown>;
    const compilerOptions = tsconfig.compilerOptions as Record<string, unknown>;
    expect(compilerOptions.jsx).toBe("preserve");
    expect(compilerOptions.module).toBe("ESNext");
    expect(compilerOptions.moduleResolution).toBe("bundler");
    expect(compilerOptions.allowJs).toBe(true);
    expect(compilerOptions.noEmit).toBe(true);
    expect(compilerOptions.incremental).toBe(true);
    const lib = compilerOptions.lib as string[];
    expect(lib).toContain("dom");
    const plugins = compilerOptions.plugins as Array<Record<string, string>>;
    expect(plugins).toContainEqual({ name: "next" });
    const include = tsconfig.include as string[];
    expect(include).toContain("web/next-env.d.ts");
    expect(include).toContain("web/.next/types/**/*.ts");
    expect(include).toContain("web/src");
    expect(include).not.toContain("src");
  });

  it("has TypeScript CI steps (Next.js uses TS build step via script override)", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Biome)");
    expect(stepNames).toContain("Typecheck (TypeScript)");
    expect(stepNames).toContain("Build");
  });

  it("generates pnpm-workspace.yaml with web", () => {
    expect(result.hasFile("pnpm-workspace.yaml")).toBe(true);
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
  });

  it("expands AGENTS.md with Next.js sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("Next.js");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("replaces {{projectName}} in Next.js templates", () => {
    const layout = result.readText("web/src/app/layout.tsx");
    expect(layout).toContain("test-app");
    expect(layout).not.toContain("{{projectName}}");
  });

  it("adds .next/ to .gitignore and preserves next-env.d.ts", () => {
    const gitignore = result.readText(".gitignore");
    expect(gitignore).toContain(".next/");
    expect(gitignore).toContain("out/");
    expect(gitignore).toContain("!next-env.d.ts");
  });

  it("adds .next/ to biome.json includes exclusion", () => {
    const biome = result.readJson("biome.json") as Record<string, unknown>;
    const files = biome.files as Record<string, string[]>;
    expect(files.includes).toContain("!**/.next/");
  });

  it("adds .next to VSCode search and files exclude", () => {
    const settings = result.readJson(".vscode/settings.json") as Record<string, unknown>;
    const searchExclude = settings["search.exclude"] as Record<string, boolean>;
    const filesExclude = settings["files.exclude"] as Record<string, boolean>;
    expect(searchExclude["**/.next"]).toBe(true);
    expect(filesExclude["**/.next"]).toBe(true);
  });

  it("does not include React+Vite specific files", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(false);
    expect(result.hasFile("web/index.html")).toBe(false);
    expect(result.hasFile("web/src/App.tsx")).toBe(false);
    expect(result.hasFile("web/src/vite-env.d.ts")).toBe(false);
  });
});
