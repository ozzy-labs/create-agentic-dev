import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (typescript)", () => {
  const answers = makeAnswers({ languages: ["typescript"] });
  const result = generate(answers);

  it("includes TypeScript owned files", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
    expect(result.hasFile("src/index.ts")).toBe(true);
    expect(result.hasFile("tests/index.test.ts")).toBe(true);
  });

  it("merges TypeScript devDependencies into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.typescript).toBeDefined();
    expect(devDeps["@types/node"]).toBeDefined();
    expect(devDeps.vitest).toBeDefined();
    expect(devDeps.tsdown).toBeDefined();
  });

  it("tsconfig includes both src and tests", () => {
    const tsconfig = result.readJson("tsconfig.json") as Record<string, unknown>;
    const include = tsconfig.include as string[];
    expect(include).toContain("src");
    expect(include).toContain("tests");
  });

  it("tsconfig does not have build output options", () => {
    const tsconfig = result.readJson("tsconfig.json") as Record<string, unknown>;
    const compilerOptions = tsconfig.compilerOptions as Record<string, unknown>;
    expect(compilerOptions.declaration).toBeUndefined();
    expect(compilerOptions.declarationMap).toBeUndefined();
    expect(compilerOptions.sourceMap).toBeUndefined();
    expect(compilerOptions.outDir).toBeUndefined();
    expect(compilerOptions.rootDir).toBeUndefined();
  });

  it("merges TypeScript scripts into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.build).toBe("tsdown");
    expect(scripts.typecheck).toBe("tsc --noEmit");
    expect(scripts.test).toBe("vitest run");
    expect(scripts.lint).toBe("biome check");
    expect(scripts["lint:all"]).toContain("pnpm run lint");
    expect(scripts["lint:all"]).toContain("pnpm run typecheck");
    expect(scripts["lint:all"]).toContain("pnpm run lint:yaml");
    expect(scripts["lint:all"]).toContain("pnpm run lint:secrets");
    expect(scripts.prepare).toBe("lefthook install");
    expect(scripts["lint:yaml"]).toContain("yamllint");
  });

  it("merges Biome into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
    expect(toml.tools.node).toBe("24");
  });

  it("merges biome and typecheck hooks into lefthook.yaml", () => {
    const hook = result.readYaml("lefthook.yaml") as Record<string, unknown>;
    const preCommit = hook["pre-commit"] as Record<string, unknown>;
    const preCommitCmds = preCommit.commands as Record<string, unknown>;
    expect(preCommitCmds.biome).toBeDefined();
    expect(preCommitCmds.shellcheck).toBeDefined();

    const prePush = hook["pre-push"] as Record<string, unknown>;
    const prePushCmds = prePush.commands as Record<string, unknown>;
    expect(prePushCmds.typecheck).toBeDefined();
  });

  it("adds TypeScript CI steps", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Biome)");
    expect(stepNames).toContain("Test");
    expect(stepNames).toContain("Typecheck (TypeScript)");
    expect(stepNames).toContain("Build");
    expect(stepNames).toContain("Lint (Markdown)");
  });

  it("expands AGENTS.md with TypeScript sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("TypeScript");
    expect(agents).toContain("Biome");
    expect(agents).toContain("typecheck (tsc)");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("expands git-workflow.md with Biome and typecheck", () => {
    const gw = result.readText(".claude/rules/git-workflow.md");
    expect(gw).toContain("Biome");
    expect(gw).not.toContain("Ruff");
    expect(gw).toContain("typecheck");
    expect(gw).not.toContain("mypy");
    expect(gw).not.toContain("<!-- SECTION:");
  });

  it("expands test skill with vitest step only", () => {
    const skill = result.readText(".agents/skills/test/SKILL.md");
    expect(skill).toContain("pnpm test");
    expect(skill).not.toContain("pytest");
    expect(skill).not.toContain("infra");
    expect(skill).not.toContain("<!-- SECTION:");
  });

  it("merges Biome settings into VSCode settings", () => {
    const settings = result.readJson(".vscode/settings.json") as Record<string, unknown>;
    expect(settings["editor.defaultFormatter"]).toBe("biomejs.biome");
    const codeActions = settings["editor.codeActionsOnSave"] as Record<string, string>;
    expect(codeActions["source.fixAll.biome"]).toBe("explicit");
    const searchExclude = settings["search.exclude"] as Record<string, boolean>;
    expect(searchExclude["**/dist"]).toBe(true);
    const jsSettings = settings["[javascript]"] as Record<string, string>;
    expect(jsSettings["editor.defaultFormatter"]).toBe("biomejs.biome");
    expect(settings["[python]"]).toBeUndefined();
    expect(settings["mypy-type-checker.importStrategy"]).toBeUndefined();
  });

  it("merges Biome extension into VSCode extensions", () => {
    const ext = result.readJson(".vscode/extensions.json") as Record<string, string[]>;
    expect(ext.recommendations).toContain("biomejs.biome");
    expect(ext.recommendations).not.toContain("charliermarsh.ruff");
  });

  it("merges Biome extension into devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const customizations = dc.customizations as Record<string, Record<string, string[]>>;
    expect(customizations.vscode.extensions).toContain("biomejs.biome");
    expect(customizations.vscode.extensions).not.toContain("charliermarsh.ruff");
  });

  it("does not include Python files", () => {
    expect(result.hasFile("pyproject.toml")).toBe(false);
    expect(result.hasFile("uv.lock")).toBe(false);
  });
});
