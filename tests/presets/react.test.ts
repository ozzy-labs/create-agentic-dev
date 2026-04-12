import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (react)", () => {
  const answers = makeAnswers({ frontend: "react" });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes React owned files in web/", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("web/index.html")).toBe(true);
    expect(result.hasFile("web/src/main.tsx")).toBe(true);
    expect(result.hasFile("web/src/App.tsx")).toBe(true);
    expect(result.hasFile("web/src/App.css")).toBe(true);
    expect(result.hasFile("web/src/vite-env.d.ts")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
  });

  it("removes TypeScript sample files (replaced by web/)", () => {
    expect(result.hasFile("src/index.ts")).toBe(false);
    expect(result.hasFile("tests/index.test.ts")).toBe(false);
  });

  it("has React dependencies in web/package.json", () => {
    const pkg = result.readJson("web/package.json") as Record<string, unknown>;
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps.react).toBeDefined();
    expect(deps["react-dom"]).toBeDefined();
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.vite).toBeDefined();
    expect(devDeps["@vitejs/plugin-react"]).toBeDefined();
    expect(devDeps["@types/react"]).toBeDefined();
    expect(devDeps["@types/react-dom"]).toBeDefined();
  });

  it("root package.json has orchestration scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.build).toBe("pnpm run build:web");
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts.dev).toBe("pnpm --filter web dev");
    expect(scripts.preview).toBe("pnpm --filter web preview");
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.typescript).toBeDefined();
  });

  it("removes tsdown from devDependencies when not used in scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.tsdown).toBeUndefined();
  });

  it("adds port 5173 to devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const ports = dc.forwardPorts as number[];
    expect(ports).toContain(5173);
  });

  it("overrides tsconfig for React with web/ paths", () => {
    const tsconfig = result.readJson("tsconfig.json") as Record<string, unknown>;
    const compilerOptions = tsconfig.compilerOptions as Record<string, unknown>;
    expect(compilerOptions.module).toBe("ESNext");
    expect(compilerOptions.moduleResolution).toBe("bundler");
    expect(compilerOptions.jsx).toBe("react-jsx");
    const include = tsconfig.include as string[];
    expect(include).toContain("web/src");
    expect(include).toContain("web/tests");
    expect(include).not.toContain("src");
  });

  it("App.tsx imports App.css", () => {
    const appTsx = result.readText("web/src/App.tsx");
    expect(appTsx).toContain("./App.css");
  });

  it("has TypeScript CI steps (React uses TS build step via script override)", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Biome)");
    expect(stepNames).toContain("Typecheck (TypeScript)");
    expect(stepNames).toContain("Build");
    expect(stepNames).not.toContain("Build (Vite)");
  });

  it("generates pnpm-workspace.yaml with web", () => {
    expect(result.hasFile("pnpm-workspace.yaml")).toBe(true);
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
  });

  it("expands AGENTS.md with React sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("React");
    expect(agents).toContain("Vite");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("replaces {{projectName}} in React templates", () => {
    const html = result.readText("web/index.html");
    expect(html).toContain("test-app");
    expect(html).not.toContain("{{projectName}}");
  });
});
