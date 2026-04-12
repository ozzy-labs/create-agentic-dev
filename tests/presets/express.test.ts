import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (express)", () => {
  const answers = makeAnswers({ backend: "express" });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes Express owned files", () => {
    expect(result.hasFile("api/src/app.ts")).toBe(true);
    expect(result.hasFile("api/src/index.ts")).toBe(true);
    expect(result.hasFile("api/tests/app.test.ts")).toBe(true);
    expect(result.hasFile("api/tsconfig.json")).toBe(true);
    expect(result.hasFile("api/package.json")).toBe(true);
    expect(result.hasFile(".claude/rules/express.md")).toBe(true);
  });

  it("does not include Python files", () => {
    expect(result.hasFile("pyproject.toml")).toBe(false);
    expect(result.hasFile("uv.lock")).toBe(false);
  });

  it("merges Express scripts into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["dev:api"]).toContain("pnpm run dev");
    expect(scripts["test:api"]).toContain("pnpm test");
    expect(scripts["build:api"]).toContain("pnpm run build");
    expect(scripts["typecheck:api"]).toContain("tsc --noEmit");
  });

  it("merges TypeScript tools into .mise.toml (via TypeScript preset)", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
  });

  it("adds port 3000 to devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const ports = dc.forwardPorts as number[];
    expect(ports).toContain(3000);
  });

  it("adds api/dist/ exclusion to biome.json", () => {
    const biome = result.readJson("biome.json") as Record<string, unknown>;
    const files = biome.files as Record<string, string[]>;
    expect(files.includes).toContain("!**/api/dist/");
  });

  it("adds typecheck-api hook to lefthook", () => {
    const hook = result.readYaml("lefthook.yaml") as Record<string, unknown>;
    const prePush = hook["pre-push"] as Record<string, unknown>;
    const pushCmds = prePush.commands as Record<string, unknown>;
    expect(pushCmds["typecheck-api"]).toBeDefined();
  });

  it("adds API CI steps", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Install API dependencies");
    expect(stepNames).toContain("Typecheck (API tsc)");
    expect(stepNames).toContain("Test (API vitest)");
    expect(stepNames).toContain("Build (API)");
  });

  it("adds API install to setup.sh", () => {
    const setup = result.readText("scripts/setup.sh");
    expect(setup).toContain("cd api && pnpm install");
  });

  it("replaces {{projectName}} in API package.json", () => {
    const apiPkg = result.readText("api/package.json");
    expect(apiPkg).toContain("test-app-api");
    expect(apiPkg).not.toContain("{{projectName}}");
  });

  it("generates pnpm-workspace.yaml with api (Express uses pnpm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- api");
  });

  it("expands AGENTS.md with Express sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("Express");
    expect(agents).toContain("api/");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("expands README.md with Express sections", () => {
    const readme = result.readText("README.md");
    expect(readme).toContain("Express");
    expect(readme).toContain("api/");
    expect(readme).not.toContain("<!-- SECTION:");
  });
});
