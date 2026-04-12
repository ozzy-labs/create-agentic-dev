import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (base only)", () => {
  const answers = makeAnswers();
  const result = generate(answers);

  it("generates base owned files", () => {
    expect(result.hasFile(".gitignore")).toBe(true);
    expect(result.hasFile(".editorconfig")).toBe(true);
    expect(result.hasFile(".commitlintrc.yaml")).toBe(true);
    expect(result.hasFile(".devcontainer/Dockerfile")).toBe(true);
    expect(result.hasFile(".vscode/settings.json")).toBe(true);
    expect(result.hasFile(".github/CODEOWNERS")).toBe(true);
    expect(result.hasFile("docs/adding-tools.md")).toBe(true);
    expect(result.hasFile("docs/branch-strategy.md")).toBe(true);
    expect(result.hasFile(".hadolint.yaml")).toBe(true);
    expect(result.hasFile("renovate.json")).toBe(true);
    expect(result.hasFile(".mcp.json.example")).toBe(true);
  });

  it("generates merged package.json with base scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    expect(pkg.name).toBe("test-app");
    expect(pkg.type).toBe("module");
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.prepare).toBe("lefthook install");
    expect(scripts["lint:yaml"]).toContain("yamllint");
    expect(scripts["lint:secrets"]).toContain("gitleaks");
  });

  it("generates merged .mise.toml with base tools", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.node).toBe("24");
    expect(toml.tools.pnpm).toBe("10");
    expect(toml.tools.shellcheck).toBe("0.11");
    expect(toml.tools.lefthook).toBe("2");
  });

  it("generates merged lefthook.yaml with base hooks", () => {
    const hook = result.readYaml("lefthook.yaml") as Record<string, unknown>;
    const preCommit = hook["pre-commit"] as Record<string, unknown>;
    const commands = preCommit.commands as Record<string, unknown>;
    expect(commands.shellcheck).toBeDefined();
    expect(commands.gitleaks).toBeDefined();
    expect(commands.markdownlint).toBeDefined();
  });

  it("includes trivy.yaml config file", () => {
    expect(result.hasFile("trivy.yaml")).toBe(true);
  });

  it("merges trivy tool into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.trivy).toBe("0.62");
  });

  it("merges lint:trivy script into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["lint:trivy"]).toContain("trivy fs");
  });

  it("includes lint:trivy at end of lint:all", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["lint:all"]).toContain("lint:trivy");
    expect(scripts["lint:all"].indexOf("lint:secrets")).toBeLessThan(
      scripts["lint:all"].indexOf("lint:trivy"),
    );
  });

  it("generates CI workflow", () => {
    expect(result.hasFile(".github/workflows/ci.yaml")).toBe(true);
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    expect(ci.name).toBe("CI");
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Install dependencies");
    expect(stepNames).toContain("Lint (Markdown)");
    expect(stepNames).toContain("Security (Gitleaks)");
    expect(stepNames).toContain("Security (Trivy)");
  });

  it("generates setup.sh", () => {
    expect(result.hasFile("scripts/setup.sh")).toBe(true);
    const setup = result.readText("scripts/setup.sh");
    expect(setup).toContain("mise trust");
    expect(setup).toContain("mise install");
    expect(setup).toContain("pnpm install");
  });

  it("replaces {{projectName}} in templates", () => {
    const readme = result.readText("README.md");
    expect(readme).toContain("# test-app");
    expect(readme).not.toContain("{{projectName}}");

    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("@AGENTS.md");
    expect(claude).not.toContain("{{projectName}}");

    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("test-app");
    expect(agents).not.toContain("{{projectName}}");
  });

  it("generates CLAUDE.md with expanded placeholders", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).not.toContain("<!-- SECTION:PRE_PUSH_HOOKS -->");
    expect(claude).not.toContain("<!-- SECTION:GIT_WORKFLOW -->");
  });

  it("generates git-workflow.md without leftover placeholders", () => {
    const gw = result.readText(".claude/rules/git-workflow.md");
    expect(gw).not.toContain("<!-- SECTION:");
    expect(gw).not.toContain("Biome");
    expect(gw).not.toContain("Ruff");
    expect(gw).not.toContain("pre-push");
  });

  it("generates test skill without preset-specific steps", () => {
    const skill = result.readText(".agents/skills/test/SKILL.md");
    expect(skill).not.toContain("<!-- SECTION:");
    expect(skill).not.toContain("vitest");
    expect(skill).not.toContain("pytest");
    expect(skill).not.toContain("infra");
  });

  it("generates VSCode settings with common settings only", () => {
    const settings = result.readJson(".vscode/settings.json") as Record<string, unknown>;
    expect(settings["editor.formatOnSave"]).toBe(true);
    expect(settings["files.eol"]).toBe("\n");
    expect(settings["editor.defaultFormatter"]).toBeUndefined();
    expect(settings["editor.codeActionsOnSave"]).toBeUndefined();
    expect(settings["[javascript]"]).toBeUndefined();
    expect(settings["[python]"]).toBeUndefined();
    expect(settings["search.exclude"]).toBeUndefined();
    expect(settings["mypy-type-checker.importStrategy"]).toBeUndefined();
  });

  it("generates VSCode extensions with common extensions only", () => {
    const ext = result.readJson(".vscode/extensions.json") as Record<string, string[]>;
    expect(ext.recommendations).toContain("EditorConfig.EditorConfig");
    expect(ext.recommendations).toContain("timonwong.shellcheck");
    expect(ext.recommendations).not.toContain("biomejs.biome");
    expect(ext.recommendations).not.toContain("charliermarsh.ruff");
    expect(ext.recommendations).not.toContain("amazonwebservices.aws-toolkit-vscode");
  });

  it("generates devcontainer with common extensions only", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const customizations = dc.customizations as Record<string, Record<string, string[]>>;
    const extensions = customizations.vscode.extensions;
    expect(extensions).toContain("EditorConfig.EditorConfig");
    expect(extensions).not.toContain("biomejs.biome");
    expect(extensions).not.toContain("charliermarsh.ruff");
    expect(extensions).not.toContain("amazonwebservices.aws-toolkit-vscode");
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(false);
    expect(mounts.some((m: string) => m.includes("uv-cache"))).toBe(false);
    expect(mounts.some((m: string) => m.includes("pnpm-store"))).toBe(true);
    expect(mounts.some((m: string) => m.includes(".claude"))).toBe(true);
  });

  it("does not generate .mcp.json or CLAUDE.md without agent selection", () => {
    const noAgent = generate(makeAnswers({ agents: [] }));
    expect(noAgent.hasFile(".mcp.json")).toBe(false);
    expect(noAgent.hasFile("CLAUDE.md")).toBe(false);
    expect(noAgent.hasFile(".claude/settings.json")).toBe(false);
  });

  it("base only has no TypeScript/Python specific files", () => {
    expect(result.hasFile("biome.json")).toBe(false);
    expect(result.hasFile("tsconfig.json")).toBe(false);
    expect(result.hasFile("pyproject.toml")).toBe(false);
    expect(result.hasFile("uv.lock")).toBe(false);
  });
});
