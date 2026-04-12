import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (vue)", () => {
  const answers = makeAnswers({ frontend: "vue" });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes Vue owned files in web/", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("web/index.html")).toBe(true);
    expect(result.hasFile("web/src/main.ts")).toBe(true);
    expect(result.hasFile("web/src/App.vue")).toBe(true);
    expect(result.hasFile("web/src/index.ts")).toBe(true);
    expect(result.hasFile("web/env.d.ts")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
  });

  it("removes TypeScript sample files (replaced by web/)", () => {
    expect(result.hasFile("src/index.ts")).toBe(false);
    expect(result.hasFile("tests/index.test.ts")).toBe(false);
  });

  it("has Vue dependencies in web/package.json", () => {
    const pkg = result.readJson("web/package.json") as Record<string, unknown>;
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps.vue).toBeDefined();
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.vite).toBeDefined();
    expect(devDeps["@vitejs/plugin-vue"]).toBeDefined();
    expect(devDeps["vue-tsc"]).toBeDefined();
  });

  it("root package.json has orchestration scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.build).toBe("pnpm run build:web");
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts.dev).toBe("pnpm --filter web dev");
    expect(scripts.preview).toBe("pnpm --filter web preview");
  });

  it("removes tsdown from devDependencies when not used in scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.tsdown).toBeUndefined();
  });

  it("overrides tsconfig for Vue with web/ paths", () => {
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

  it("has TypeScript CI steps (Vue uses TS build step via script override)", () => {
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

  it("expands AGENTS.md with Vue sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("Vue");
    expect(agents).toContain("Vite");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("replaces {{projectName}} in Vue templates", () => {
    const html = result.readText("web/index.html");
    expect(html).toContain("test-app");
    expect(html).not.toContain("{{projectName}}");
  });
});
