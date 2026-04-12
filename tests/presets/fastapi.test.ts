import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (fastapi)", () => {
  const answers = makeAnswers({ backend: "fastapi" });
  const result = generate(answers);

  it("forces Python preset inclusion", () => {
    expect(result.hasFile("pyproject.toml")).toBe(true);
    expect(result.hasFile("uv.lock")).toBe(true);
  });

  it("includes FastAPI owned files", () => {
    expect(result.hasFile("api/src/main.py")).toBe(true);
    expect(result.hasFile("api/src/__init__.py")).toBe(true);
    expect(result.hasFile("api/tests/test_main.py")).toBe(true);
    expect(result.hasFile("api/tests/__init__.py")).toBe(true);
    expect(result.hasFile("api/pyproject.toml")).toBe(true);
    expect(result.hasFile(".claude/rules/fastapi.md")).toBe(true);
  });

  it("does not include TypeScript files", () => {
    expect(result.hasFile("biome.json")).toBe(false);
    expect(result.hasFile("tsconfig.json")).toBe(false);
  });

  it("merges FastAPI scripts into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["dev:api"]).toContain("uvicorn");
    expect(scripts["test:api"]).toContain("pytest");
    expect(scripts["lint:api"]).toContain("ruff");
  });

  it("merges Python tools into .mise.toml (via Python preset)", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.python).toBe("3.12");
    expect(toml.tools.uv).toBe("0.7");
  });

  it("adds port 8000 to devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const ports = dc.forwardPorts as number[];
    expect(ports).toContain(8000);
  });

  it("adds API ruff hooks to lefthook", () => {
    const hook = result.readYaml("lefthook.yaml") as Record<string, unknown>;
    const preCommit = hook["pre-commit"] as Record<string, unknown>;
    const cmds = preCommit.commands as Record<string, unknown>;
    expect(cmds["ruff-format-api"]).toBeDefined();
    expect(cmds["ruff-check-api"]).toBeDefined();
    const prePush = hook["pre-push"] as Record<string, unknown>;
    const pushCmds = prePush.commands as Record<string, unknown>;
    expect(pushCmds["mypy-api"]).toBeDefined();
  });

  it("adds API CI steps", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Install API dependencies");
    expect(stepNames).toContain("Lint (API Ruff)");
    expect(stepNames).toContain("Typecheck (API mypy)");
    expect(stepNames).toContain("Test (API pytest)");
  });

  it("adds API install to setup.sh", () => {
    const setup = result.readText("scripts/setup.sh");
    expect(setup).toContain("cd api && uv sync");
  });

  it("replaces {{projectName}} in API pyproject.toml", () => {
    const apiPkg = result.readText("api/pyproject.toml");
    expect(apiPkg).toContain("test-app-api");
    expect(apiPkg).not.toContain("{{projectName}}");
  });

  it("does not generate pnpm-workspace.yaml (FastAPI uses uv, not pnpm)", () => {
    expect(result.hasFile("pnpm-workspace.yaml")).toBe(false);
  });

  it("expands AGENTS.md with FastAPI sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("FastAPI");
    expect(agents).toContain("api/");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("expands README.md with FastAPI sections", () => {
    const readme = result.readText("README.md");
    expect(readme).toContain("FastAPI");
    expect(readme).toContain("api/");
    expect(readme).not.toContain("<!-- SECTION:");
  });
});
