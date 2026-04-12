import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (sveltekit)", () => {
  const answers = makeAnswers({ frontend: "sveltekit" });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes SvelteKit owned files in web/", () => {
    expect(result.hasFile("web/svelte.config.js")).toBe(true);
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("web/src/app.html")).toBe(true);
    expect(result.hasFile("web/src/routes/+page.svelte")).toBe(true);
    expect(result.hasFile("web/src/lib/index.ts")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
  });

  it("removes TypeScript sample files (replaced by web/)", () => {
    expect(result.hasFile("src/index.ts")).toBe(false);
    expect(result.hasFile("tests/index.test.ts")).toBe(false);
  });

  it("has SvelteKit dependencies in web/package.json", () => {
    const pkg = result.readJson("web/package.json") as Record<string, unknown>;
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps.svelte).toBeDefined();
    expect(deps["@sveltejs/kit"]).toBeDefined();
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.vite).toBeDefined();
  });

  it("root package.json has orchestration scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.build).toBe("pnpm run build:web");
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts.dev).toBe("pnpm --filter web dev");
    expect(scripts.preview).toBe("pnpm --filter web preview");
  });

  it("adds .svelte-kit/ to .gitignore", () => {
    const gitignore = result.readText(".gitignore");
    expect(gitignore).toContain(".svelte-kit/");
  });

  it("excludes .svelte-kit/ from biome.json", () => {
    const biome = result.readJson("biome.json") as Record<string, unknown>;
    const files = biome.files as Record<string, string[]>;
    expect(files.includes).toContain("!**/.svelte-kit/");
  });

  it("adds port 5173 to devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const ports = dc.forwardPorts as number[];
    expect(ports).toContain(5173);
  });

  it("generates pnpm-workspace.yaml with web", () => {
    expect(result.hasFile("pnpm-workspace.yaml")).toBe(true);
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
  });

  it("expands AGENTS.md with SvelteKit sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("SvelteKit");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("replaces {{projectName}} in templates", () => {
    const appHtml = result.readText("web/src/app.html");
    expect(appHtml).toContain("test-app");
    expect(appHtml).not.toContain("{{projectName}}");
  });
});
