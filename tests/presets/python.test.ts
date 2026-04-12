import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (python)", () => {
  const answers = makeAnswers({ languages: ["python"] });
  const result = generate(answers);

  it("includes Python owned files", () => {
    expect(result.hasFile("pyproject.toml")).toBe(true);
    expect(result.hasFile("uv.lock")).toBe(true);
    expect(result.hasFile("tests/__init__.py")).toBe(true);
    expect(result.hasFile("tests/test_placeholder.py")).toBe(true);
  });

  it("merges Python tools into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.python).toBe("3.12");
    expect(toml.tools.uv).toBe("0.7");
    expect(toml.tools["pipx:ruff"]).toBe("0.11");
    expect(toml.tools["pipx:mypy"]).toBe("1");
  });

  it("merges Python scripts into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["lint:python"]).toContain("ruff");
    expect(scripts["lint:mypy"]).toContain("mypy");
  });

  it("merges ruff and mypy hooks into lefthook.yaml", () => {
    const hook = result.readYaml("lefthook.yaml") as Record<string, unknown>;
    const preCommit = hook["pre-commit"] as Record<string, unknown>;
    const preCommitCmds = preCommit.commands as Record<string, unknown>;
    expect(preCommitCmds["ruff-format"]).toBeDefined();
    expect(preCommitCmds["ruff-check"]).toBeDefined();

    const prePush = hook["pre-push"] as Record<string, unknown>;
    const prePushCmds = prePush.commands as Record<string, unknown>;
    expect(prePushCmds.mypy).toBeDefined();
  });

  it("adds Python CI steps", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Ruff)");
    expect(stepNames).toContain("Typecheck (mypy)");
    expect(stepNames).toContain("Test (pytest)");
    expect(stepNames).toContain("Install Python dependencies");
  });

  it("adds uv sync to setup.sh", () => {
    const setup = result.readText("scripts/setup.sh");
    expect(setup).toContain("uv sync");
  });

  it("pyproject.toml includes pytest in dependency-groups", () => {
    const pyproject = result.readText("pyproject.toml");
    expect(pyproject).toContain("[dependency-groups]");
    expect(pyproject).toContain("pytest");
  });

  it("expands AGENTS.md with Python sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("Python");
    expect(agents).toContain("Ruff");
    expect(agents).toContain("mypy");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("merges Python settings into VSCode settings", () => {
    const settings = result.readJson(".vscode/settings.json") as Record<string, unknown>;
    expect(settings["mypy-type-checker.importStrategy"]).toBe("fromEnvironment");
    const pySettings = settings["[python]"] as Record<string, unknown>;
    expect(pySettings["editor.defaultFormatter"]).toBe("charliermarsh.ruff");
    expect(settings["editor.defaultFormatter"]).toBeUndefined();
    expect(settings["[javascript]"]).toBeUndefined();
  });

  it("merges Python extensions into VSCode extensions", () => {
    const ext = result.readJson(".vscode/extensions.json") as Record<string, string[]>;
    expect(ext.recommendations).toContain("charliermarsh.ruff");
    expect(ext.recommendations).toContain("ms-python.mypy-type-checker");
    expect(ext.recommendations).toContain("ms-python.python");
    expect(ext.recommendations).not.toContain("biomejs.biome");
  });

  it("merges Python extensions and uv-cache mount into devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const customizations = dc.customizations as Record<string, Record<string, string[]>>;
    expect(customizations.vscode.extensions).toContain("charliermarsh.ruff");
    expect(customizations.vscode.extensions).toContain("ms-python.python");
    expect(customizations.vscode.extensions).not.toContain("biomejs.biome");
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes("uv-cache"))).toBe(true);
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(false);
  });

  it("does not include TypeScript files", () => {
    expect(result.hasFile("biome.json")).toBe(false);
    expect(result.hasFile("tsconfig.json")).toBe(false);
  });
});
