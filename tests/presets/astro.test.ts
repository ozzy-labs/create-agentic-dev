import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (astro)", () => {
  const answers = makeAnswers({ frontend: "astro" });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes Astro owned files in web/", () => {
    expect(result.hasFile("web/astro.config.ts")).toBe(true);
    expect(result.hasFile("web/src/pages/index.astro")).toBe(true);
    expect(result.hasFile("web/src/layouts/Layout.astro")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
  });

  it("removes TypeScript sample files (replaced by web/)", () => {
    expect(result.hasFile("src/index.ts")).toBe(false);
    expect(result.hasFile("tests/index.test.ts")).toBe(false);
  });

  it("has Astro dependencies in web/package.json", () => {
    const pkg = result.readJson("web/package.json") as Record<string, unknown>;
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps.astro).toBeDefined();
  });

  it("root package.json has orchestration scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.build).toBe("pnpm run build:web");
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts.dev).toBe("pnpm --filter web dev");
    expect(scripts.preview).toBe("pnpm --filter web preview");
  });

  it("generates pnpm-workspace.yaml with web", () => {
    expect(result.hasFile("pnpm-workspace.yaml")).toBe(true);
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
  });

  it("adds port 4321 to devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const ports = dc.forwardPorts as number[];
    expect(ports).toContain(4321);
  });

  it("expands AGENTS.md with Astro sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("Astro");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("replaces {{projectName}} in templates", () => {
    const page = result.readText("web/src/pages/index.astro");
    expect(page).toContain("test-app");
    expect(page).not.toContain("{{projectName}}");
  });
});
