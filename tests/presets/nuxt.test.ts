import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (nuxt)", () => {
  const answers = makeAnswers({ frontend: "nuxt" });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes Nuxt owned files in web/", () => {
    expect(result.hasFile("web/nuxt.config.ts")).toBe(true);
    expect(result.hasFile("web/src/app.vue")).toBe(true);
    expect(result.hasFile("web/src/pages/index.vue")).toBe(true);
    expect(result.hasFile("web/src/index.ts")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
  });

  it("removes TypeScript sample files (replaced by web/)", () => {
    expect(result.hasFile("src/index.ts")).toBe(false);
    expect(result.hasFile("tests/index.test.ts")).toBe(false);
  });

  it("has Nuxt dependencies in web/package.json", () => {
    const pkg = result.readJson("web/package.json") as Record<string, unknown>;
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps.nuxt).toBeDefined();
    expect(deps.vue).toBeDefined();
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps["vue-tsc"]).toBeDefined();
  });

  it("root package.json has orchestration scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.build).toBe("pnpm run build:web");
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts.dev).toBe("pnpm --filter web dev");
    expect(scripts.start).toBe("pnpm --filter web start");
  });

  it("adds .nuxt and .output to .gitignore", () => {
    const gitignore = result.readText(".gitignore");
    expect(gitignore).toContain(".nuxt/");
    expect(gitignore).toContain(".output/");
  });

  it("adds .nuxt and .output exclusions to biome.json", () => {
    const biome = result.readJson("biome.json") as Record<string, unknown>;
    const files = biome.files as Record<string, string[]>;
    expect(files.includes).toContain("!**/.nuxt/");
    expect(files.includes).toContain("!**/.output/");
  });

  it("adds .nuxt and .output to VSCode search/file excludes", () => {
    const settings = result.readJson(".vscode/settings.json") as Record<string, unknown>;
    const searchExclude = settings["search.exclude"] as Record<string, boolean>;
    expect(searchExclude["**/.nuxt"]).toBe(true);
    expect(searchExclude["**/.output"]).toBe(true);
  });

  it("overrides tsconfig for Nuxt with web/ paths", () => {
    const tsconfig = result.readJson("tsconfig.json") as Record<string, unknown>;
    const compilerOptions = tsconfig.compilerOptions as Record<string, unknown>;
    expect(compilerOptions.module).toBe("ESNext");
    expect(compilerOptions.moduleResolution).toBe("bundler");
    expect(compilerOptions.jsx).toBe("preserve");
    const include = tsconfig.include as string[];
    expect(include).toContain("web/src");
    expect(include).toContain("web/tests");
    expect(include).not.toContain("src");
  });

  it("generates pnpm-workspace.yaml with web", () => {
    expect(result.hasFile("pnpm-workspace.yaml")).toBe(true);
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
  });

  it("expands AGENTS.md with Nuxt sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("Nuxt");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("replaces {{projectName}} in Nuxt templates", () => {
    const pkg = result.readText("web/package.json");
    expect(pkg).toContain("test-app");
    expect(pkg).not.toContain("{{projectName}}");
  });
});
