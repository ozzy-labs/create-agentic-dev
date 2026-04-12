import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (batch)", () => {
  const answers = makeAnswers({ backend: "batch" });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes batch/worker owned files", () => {
    expect(result.hasFile("worker/src/index.ts")).toBe(true);
    expect(result.hasFile("worker/src/processor.ts")).toBe(true);
    expect(result.hasFile("worker/tests/processor.test.ts")).toBe(true);
    expect(result.hasFile("worker/tsconfig.json")).toBe(true);
    expect(result.hasFile("worker/package.json")).toBe(true);
    expect(result.hasFile(".claude/rules/batch.md")).toBe(true);
  });

  it("does not include Python files", () => {
    expect(result.hasFile("pyproject.toml")).toBe(false);
    expect(result.hasFile("uv.lock")).toBe(false);
  });

  it("merges worker scripts into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["dev:worker"]).toContain("pnpm run dev");
    expect(scripts["test:worker"]).toContain("pnpm test");
    expect(scripts["build:worker"]).toContain("pnpm run build");
    expect(scripts["typecheck:worker"]).toContain("tsc --noEmit");
  });

  it("adds worker/dist/ exclusion to biome.json", () => {
    const biome = result.readJson("biome.json") as Record<string, unknown>;
    const files = biome.files as Record<string, string[]>;
    expect(files.includes).toContain("!**/worker/dist/");
  });

  it("adds typecheck-worker hook to lefthook", () => {
    const hook = result.readYaml("lefthook.yaml") as Record<string, unknown>;
    const prePush = hook["pre-push"] as Record<string, unknown>;
    const pushCmds = prePush.commands as Record<string, unknown>;
    expect(pushCmds["typecheck-worker"]).toBeDefined();
  });

  it("adds Worker CI steps", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Install Worker dependencies");
    expect(stepNames).toContain("Typecheck (Worker tsc)");
    expect(stepNames).toContain("Test (Worker vitest)");
    expect(stepNames).toContain("Build (Worker)");
  });

  it("adds worker install to setup.sh", () => {
    const setup = result.readText("scripts/setup.sh");
    expect(setup).toContain("cd worker && pnpm install");
  });

  it("replaces {{projectName}} in worker package.json", () => {
    const workerPkg = result.readText("worker/package.json");
    expect(workerPkg).toContain("test-app-worker");
    expect(workerPkg).not.toContain("{{projectName}}");
  });

  it("generates pnpm-workspace.yaml with worker", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- worker");
  });

  it("expands AGENTS.md with batch/worker sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("Worker");
    expect(agents).toContain("worker/");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("expands README.md with batch/worker sections", () => {
    const readme = result.readText("README.md");
    expect(readme).toContain("worker/");
    expect(readme).not.toContain("<!-- SECTION:");
  });
});
