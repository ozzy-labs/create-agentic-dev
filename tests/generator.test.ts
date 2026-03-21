import { describe, expect, it } from "vitest";
import { generate, resolvePresets } from "../src/generator.js";
import type { WizardAnswers } from "../src/types.js";

// Helper to create answers with defaults
function makeAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    projectName: "test-app",
    languages: [],
    frontend: "none",
    clouds: [],
    iac: [],
    ...overrides,
  };
}

describe("resolvePresets", () => {
  it("always includes base", () => {
    const result = resolvePresets(makeAnswers());
    expect(result).toContain("base");
  });

  it("includes selected languages", () => {
    const result = resolvePresets(makeAnswers({ languages: ["typescript", "python"] }));
    expect(result).toEqual(["base", "typescript", "python"]);
  });

  it("forces typescript when react is selected", () => {
    const result = resolvePresets(makeAnswers({ frontend: "react" }));
    expect(result).toContain("typescript");
    expect(result).toContain("react");
  });

  it("forces typescript when cdk is selected", () => {
    const result = resolvePresets(makeAnswers({ clouds: ["aws"], iac: ["cdk"] }));
    expect(result).toContain("typescript");
    expect(result).toContain("cdk");
  });

  it("maintains canonical order", () => {
    const result = resolvePresets(
      makeAnswers({
        languages: ["python", "typescript"],
        frontend: "react",
        clouds: ["aws"],
        iac: ["cdk"],
      }),
    );
    expect(result).toEqual(["base", "typescript", "python", "react", "aws", "cdk"]);
  });

  it("deduplicates typescript when forced by multiple selections", () => {
    const result = resolvePresets(
      makeAnswers({ languages: ["typescript"], frontend: "react", clouds: ["aws"], iac: ["cdk"] }),
    );
    const tsCount = result.filter((p) => p === "typescript").length;
    expect(tsCount).toBe(1);
  });
});

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

  it("generates merged .mcp.json with base servers", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.context7).toBeDefined();
    expect(mcp.mcpServers.fetch).toBeDefined();
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
    expect(claude).toContain("test-app");
    expect(claude).not.toContain("{{projectName}}");
  });

  it("generates CLAUDE.md with expanded placeholders", () => {
    const claude = result.readText("CLAUDE.md");
    // Placeholders should be replaced (even if with empty string)
    expect(claude).not.toContain("<!-- SECTION:PRE_PUSH_HOOKS -->");
    expect(claude).not.toContain("<!-- SECTION:GIT_WORKFLOW -->");
  });

  it("generates git-workflow.md without leftover placeholders", () => {
    const gw = result.readText(".claude/rules/git-workflow.md");
    expect(gw).not.toContain("<!-- SECTION:");
    // base only should not mention Biome or Ruff
    expect(gw).not.toContain("Biome");
    expect(gw).not.toContain("Ruff");
    // base only has no pre-push hooks, so the line should be removed
    expect(gw).not.toContain("pre-push");
  });

  it("generates test skill without preset-specific steps", () => {
    const skill = result.readText(".claude/skills/test/SKILL.md");
    expect(skill).not.toContain("<!-- SECTION:");
    expect(skill).not.toContain("vitest");
    expect(skill).not.toContain("pytest");
    expect(skill).not.toContain("infra");
  });

  it("generates VSCode settings with common settings only", () => {
    const settings = result.readJson(".vscode/settings.json") as Record<string, unknown>;
    expect(settings["editor.formatOnSave"]).toBe(true);
    expect(settings["files.eol"]).toBe("\n");
    // No Biome or Python settings in base
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
    // No preset-specific extensions
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
    // No preset-specific mounts
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(false);
    expect(mounts.some((m: string) => m.includes("uv-cache"))).toBe(false);
    expect(mounts.some((m: string) => m.includes("pnpm-store"))).toBe(true);
  });

  it("base only has no TypeScript/Python specific files", () => {
    expect(result.hasFile("biome.json")).toBe(false);
    expect(result.hasFile("tsconfig.json")).toBe(false);
    expect(result.hasFile("pyproject.toml")).toBe(false);
    expect(result.hasFile("uv.lock")).toBe(false);
  });
});

// --- Pattern 1: Minimal TypeScript ---
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
    // lint:all dynamically generated with all lint scripts
    expect(scripts["lint:all"]).toContain("pnpm run lint");
    expect(scripts["lint:all"]).toContain("pnpm run typecheck");
    expect(scripts["lint:all"]).toContain("pnpm run lint:yaml");
    expect(scripts["lint:all"]).toContain("pnpm run lint:secrets");
    // base scripts still present
    expect(scripts.prepare).toBe("lefthook install");
    expect(scripts["lint:yaml"]).toContain("yamllint");
  });

  it("merges Biome into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
    // base tools still present
    expect(toml.tools.node).toBe("24");
  });

  it("merges biome and typecheck hooks into lefthook.yaml", () => {
    const hook = result.readYaml("lefthook.yaml") as Record<string, unknown>;
    const preCommit = hook["pre-commit"] as Record<string, unknown>;
    const preCommitCmds = preCommit.commands as Record<string, unknown>;
    expect(preCommitCmds.biome).toBeDefined();
    // base hooks still present
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
    // base steps still present
    expect(stepNames).toContain("Lint (Markdown)");
  });

  it("expands CLAUDE.md with TypeScript sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("TypeScript");
    expect(claude).toContain("Biome");
    expect(claude).toContain("typecheck (tsc)");
    expect(claude).not.toContain("<!-- SECTION:");
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
    const skill = result.readText(".claude/skills/test/SKILL.md");
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
    // No Python settings
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

// --- Pattern 2: Minimal Python ---
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

  it("expands CLAUDE.md with Python sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Python");
    expect(claude).toContain("Ruff");
    expect(claude).toContain("mypy");
    expect(claude).not.toContain("<!-- SECTION:");
  });

  it("merges Python settings into VSCode settings", () => {
    const settings = result.readJson(".vscode/settings.json") as Record<string, unknown>;
    expect(settings["mypy-type-checker.importStrategy"]).toBe("fromEnvironment");
    const pySettings = settings["[python]"] as Record<string, unknown>;
    expect(pySettings["editor.defaultFormatter"]).toBe("charliermarsh.ruff");
    // No Biome settings
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

// --- Pattern 3: TypeScript + Python ---
describe("generate (typescript + python)", () => {
  const answers = makeAnswers({ languages: ["typescript", "python"] });
  const result = generate(answers);

  it("includes both TypeScript and Python files", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
    expect(result.hasFile("pyproject.toml")).toBe(true);
    expect(result.hasFile("uv.lock")).toBe(true);
  });

  it("merges both language tools into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
    expect(toml.tools.python).toBe("3.12");
    expect(toml.tools.uv).toBe("0.7");
  });

  it("merges both language hooks into lefthook.yaml", () => {
    const hook = result.readYaml("lefthook.yaml") as Record<string, unknown>;
    const preCommit = hook["pre-commit"] as Record<string, unknown>;
    const cmds = preCommit.commands as Record<string, unknown>;
    expect(cmds.biome).toBeDefined();
    expect(cmds["ruff-format"]).toBeDefined();
  });

  it("has CI steps from both presets", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Biome)");
    expect(stepNames).toContain("Lint (Ruff)");
    expect(stepNames).toContain("Test");
    expect(stepNames).toContain("Test (pytest)");
  });

  it("expands CLAUDE.md with both language sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("TypeScript");
    expect(claude).toContain("Python");
    expect(claude).not.toContain("<!-- SECTION:");
  });

  it("expands git-workflow.md with both Biome/Ruff and typecheck/mypy", () => {
    const gw = result.readText(".claude/rules/git-workflow.md");
    expect(gw).toContain("Biome");
    expect(gw).toContain("Ruff");
    expect(gw).toContain("typecheck");
    expect(gw).toContain("mypy");
    expect(gw).not.toContain("<!-- SECTION:");
  });

  it("lint:all includes both TypeScript and Python lint scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["lint:all"]).toContain("pnpm run lint");
    expect(scripts["lint:all"]).toContain("pnpm run typecheck");
    expect(scripts["lint:all"]).toContain("pnpm run lint:python");
    expect(scripts["lint:all"]).toContain("pnpm run lint:mypy");
    expect(scripts["lint:all"]).toContain("pnpm run lint:secrets");
  });

  it("merges both language settings into VSCode settings", () => {
    const settings = result.readJson(".vscode/settings.json") as Record<string, unknown>;
    // TypeScript settings
    expect(settings["editor.defaultFormatter"]).toBe("biomejs.biome");
    expect(settings["[typescript]"]).toBeDefined();
    // Python settings
    expect(settings["mypy-type-checker.importStrategy"]).toBe("fromEnvironment");
    expect(settings["[python]"]).toBeDefined();
  });

  it("merges both language extensions into VSCode extensions", () => {
    const ext = result.readJson(".vscode/extensions.json") as Record<string, string[]>;
    expect(ext.recommendations).toContain("biomejs.biome");
    expect(ext.recommendations).toContain("charliermarsh.ruff");
    expect(ext.recommendations).toContain("ms-python.python");
    // base extensions still present
    expect(ext.recommendations).toContain("EditorConfig.EditorConfig");
  });

  it("merges both language extensions and mounts into devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const customizations = dc.customizations as Record<string, Record<string, string[]>>;
    expect(customizations.vscode.extensions).toContain("biomejs.biome");
    expect(customizations.vscode.extensions).toContain("charliermarsh.ruff");
    expect(customizations.vscode.extensions).toContain("ms-python.python");
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes("uv-cache"))).toBe(true);
    expect(mounts.some((m: string) => m.includes("pnpm-store"))).toBe(true);
  });
});

// --- Pattern 4: TypeScript + React ---
describe("generate (react)", () => {
  const answers = makeAnswers({ frontend: "react" });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    // React requires TypeScript — TypeScript files should be present
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes React owned files", () => {
    expect(result.hasFile("vite.config.ts")).toBe(true);
    expect(result.hasFile("index.html")).toBe(true);
    expect(result.hasFile("src/main.tsx")).toBe(true);
    expect(result.hasFile("src/App.tsx")).toBe(true);
    expect(result.hasFile("src/App.css")).toBe(true);
    expect(result.hasFile("src/vite-env.d.ts")).toBe(true);
  });

  it("merges React dependencies into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps.react).toBeDefined();
    expect(deps["react-dom"]).toBeDefined();
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.vite).toBeDefined();
    expect(devDeps["@vitejs/plugin-react"]).toBeDefined();
    expect(devDeps["@types/react"]).toBeDefined();
    expect(devDeps["@types/react-dom"]).toBeDefined();
    // TypeScript devDeps also present
    expect(devDeps.typescript).toBeDefined();
  });

  it("React overrides TypeScript build script with vite", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    // React preset's build/dev override TypeScript's (applied later in order)
    expect(scripts.build).toBe("vite build");
    expect(scripts.dev).toBe("vite");
    expect(scripts.preview).toBe("vite preview");
  });

  it("removes tsdown from devDependencies when not used in scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps.tsdown).toBeUndefined();
  });

  it("overrides tsconfig module resolution to bundler for Vite", () => {
    const tsconfig = result.readJson("tsconfig.json") as Record<string, unknown>;
    const compilerOptions = tsconfig.compilerOptions as Record<string, unknown>;
    expect(compilerOptions.module).toBe("ESNext");
    expect(compilerOptions.moduleResolution).toBe("bundler");
    expect(compilerOptions.jsx).toBe("react-jsx");
  });

  it("App.tsx imports App.css", () => {
    const appTsx = result.readText("src/App.tsx");
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
    // No duplicate "Build (Vite)" — React overrides the build script instead
    expect(stepNames).not.toContain("Build (Vite)");
  });

  it("overrides TypeScript sample files with React-appropriate versions", () => {
    const indexTs = result.readText("src/index.ts");
    expect(indexTs).toContain("App");
    expect(indexTs).not.toContain("hello");

    const testFile = result.readText("tests/index.test.ts");
    expect(testFile).toContain("App");
  });

  it("expands CLAUDE.md with React sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("React");
    expect(claude).toContain("Vite");
    expect(claude).not.toContain("<!-- SECTION:");
  });

  it("replaces {{projectName}} in React templates", () => {
    const html = result.readText("index.html");
    expect(html).toContain("test-app");
    expect(html).not.toContain("{{projectName}}");
  });
});

// --- Pattern 5: TypeScript + CDK ---
describe("generate (cdk)", () => {
  const answers = makeAnswers({ clouds: ["aws"], iac: ["cdk"] });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes CDK owned files", () => {
    expect(result.hasFile("infra/bin/app.ts")).toBe(true);
    expect(result.hasFile("infra/lib/app-stack.ts")).toBe(true);
    expect(result.hasFile("infra/test/app.test.ts")).toBe(true);
    expect(result.hasFile("infra/cdk.json")).toBe(true);
    expect(result.hasFile("infra/tsconfig.json")).toBe(true);
    expect(result.hasFile("infra/package.json")).toBe(true);
    expect(result.hasFile(".cfnlintrc.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-cdk.yaml")).toBe(true);
  });

  it("merges CDK tools into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.awscli).toBe("2");
    expect(toml.tools["npm:aws-cdk"]).toBe("2");
    expect(toml.tools["pipx:cfn-lint"]).toBe("1");
  });

  it("merges CDK scripts into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["cdk:synth"]).toContain("cdk synth");
    expect(scripts["cdk:deploy"]).toContain("cdk deploy");
    expect(scripts["test:infra"]).toContain("pnpm test");
    expect(scripts["lint:cfn"]).toBe("cfn-lint cdk.out/**/*.template.json");
  });

  it("merges aws-iac MCP server into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
    // base servers still present
    expect(mcp.mcpServers.context7).toBeDefined();
  });

  it("adds CDK CI steps with correct order (synth before cfn-lint)", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Install infra dependencies");
    expect(stepNames).toContain("CDK synth");
    expect(stepNames).toContain("Lint (cfn-lint)");
    expect(stepNames).toContain("Test (CDK)");
    // CDK synth must run before cfn-lint (synth generates templates that cfn-lint checks)
    const synthIdx = stepNames.indexOf("CDK synth");
    const cfnLintIdx = stepNames.indexOf("Lint (cfn-lint)");
    expect(synthIdx).toBeLessThan(cfnLintIdx);
    // TypeScript steps still present
    expect(stepNames).toContain("Lint (Biome)");
  });

  it("adds infra install to setup.sh", () => {
    const setup = result.readText("scripts/setup.sh");
    expect(setup).toContain("cd infra && pnpm install");
  });

  it("replaces {{projectName}} in CDK templates", () => {
    const infraPkg = result.readText("infra/package.json");
    expect(infraPkg).toContain("test-app-infra");
    expect(infraPkg).not.toContain("{{projectName}}");
  });

  it("infra/package.json does not include source-map-support", () => {
    const infraPkg = result.readJson("infra/package.json") as Record<string, unknown>;
    const deps = infraPkg.dependencies as Record<string, string>;
    expect(deps["source-map-support"]).toBeUndefined();
  });

  it("infra/package.json vitest matches root version", () => {
    const infraPkg = result.readJson("infra/package.json") as Record<string, unknown>;
    const devDeps = infraPkg.devDependencies as Record<string, string>;
    expect(devDeps.vitest).toBe("^4.0.0");
  });

  it("infra/bin/app.ts does not import source-map-support", () => {
    const appTs = result.readText("infra/bin/app.ts");
    expect(appTs).not.toContain("source-map-support");
  });

  it("merges CDK settings into VSCode settings", () => {
    const settings = result.readJson(".vscode/settings.json") as Record<string, unknown>;
    const searchExclude = settings["search.exclude"] as Record<string, boolean>;
    expect(searchExclude["**/cdk.out"]).toBe(true);
    // TypeScript settings also present (CDK forces TypeScript)
    expect(searchExclude["**/dist"]).toBe(true);
  });

  it("merges AWS Toolkit into VSCode extensions", () => {
    const ext = result.readJson(".vscode/extensions.json") as Record<string, string[]>;
    expect(ext.recommendations).toContain("amazonwebservices.aws-toolkit-vscode");
    expect(ext.recommendations).toContain("biomejs.biome");
  });

  it("merges AWS Toolkit and ~/.aws mount into devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const customizations = dc.customizations as Record<string, Record<string, string[]>>;
    expect(customizations.vscode.extensions).toContain("amazonwebservices.aws-toolkit-vscode");
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(true);
  });

  it("expands CLAUDE.md with CDK sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("CDK");
    expect(claude).toContain("cfn-lint");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Pattern 6: TypeScript + CloudFormation ---
describe("generate (cloudformation)", () => {
  const answers = makeAnswers({
    languages: ["typescript"],
    clouds: ["aws"],
    iac: ["cloudformation"],
  });
  const result = generate(answers);

  it("includes CloudFormation owned files", () => {
    expect(result.hasFile("infra/template.yaml")).toBe(true);
    expect(result.hasFile(".cfnlintrc.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-cloudformation.yaml")).toBe(true);
  });

  it("merges cfn-lint into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.awscli).toBe("2");
    expect(toml.tools["pipx:cfn-lint"]).toBe("1");
  });

  it("merges aws-iac MCP server into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
  });

  it("adds cfn-lint CI step", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (cfn-lint)");
  });

  it("merges ~/.aws mount into devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(true);
  });

  it("does not include CDK or Terraform files", () => {
    expect(result.hasFile("infra/cdk.json")).toBe(false);
    expect(result.hasFile(".tflint.hcl")).toBe(false);
  });

  it("expands CLAUDE.md with CloudFormation sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("CloudFormation");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Pattern 7: TypeScript + Terraform ---
describe("generate (terraform)", () => {
  const answers = makeAnswers({ languages: ["typescript"], clouds: ["aws"], iac: ["terraform"] });
  const result = generate(answers);

  it("includes Terraform owned files", () => {
    expect(result.hasFile(".tflint.hcl")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-terraform.yaml")).toBe(true);
  });

  it("merges Terraform tools into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.terraform).toBe("1");
    expect(toml.tools.tflint).toBe("0.55");
    expect(toml.tools.awscli).toBe("2");
  });

  it("merges aws-iac MCP server into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
  });

  it("adds tflint CI step", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Terraform)");
  });

  it("merges ~/.aws mount into devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(true);
  });

  it("does not include CDK or CloudFormation files", () => {
    expect(result.hasFile("infra/cdk.json")).toBe(false);
    expect(result.hasFile("infra/template.yaml")).toBe(false);
  });

  it("expands CLAUDE.md with Terraform sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Terraform");
    expect(claude).toContain("tflint");
    expect(claude).not.toContain("<!-- SECTION:");
  });

  it("includes lint:tf in lint:all", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["lint:all"]).toContain("pnpm run lint:tf");
  });
});

// --- Pattern 8: Full config (TS + Python + React + CDK) ---
describe("generate (full config)", () => {
  const answers = makeAnswers({
    languages: ["typescript", "python"],
    frontend: "react",
    clouds: ["aws"],
    iac: ["cdk"],
  });
  const result = generate(answers);

  it("includes all preset files", () => {
    // TypeScript
    expect(result.hasFile("biome.json")).toBe(true);
    // Python
    expect(result.hasFile("pyproject.toml")).toBe(true);
    // React
    expect(result.hasFile("vite.config.ts")).toBe(true);
    expect(result.hasFile("index.html")).toBe(true);
    // CDK
    expect(result.hasFile("infra/bin/app.ts")).toBe(true);
    expect(result.hasFile(".cfnlintrc.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-cdk.yaml")).toBe(true);
  });

  it("merges all tools into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
    expect(toml.tools.python).toBe("3.12");
    expect(toml.tools["npm:aws-cdk"]).toBe("2");
  });

  it("merges all MCP servers", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.context7).toBeDefined();
    expect(mcp.mcpServers.fetch).toBeDefined();
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
  });

  it("lint:all includes all lint scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["lint:all"]).toContain("pnpm run lint");
    expect(scripts["lint:all"]).toContain("pnpm run typecheck");
    expect(scripts["lint:all"]).toContain("pnpm run lint:python");
    expect(scripts["lint:all"]).toContain("pnpm run lint:cfn");
    expect(scripts["lint:all"]).toContain("pnpm run lint:secrets");
  });

  it("CLAUDE.md contains all preset sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("TypeScript");
    expect(claude).toContain("Python");
    expect(claude).toContain("React");
    expect(claude).toContain("CDK");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Pattern 9: Python + Terraform ---
describe("generate (python + terraform)", () => {
  const answers = makeAnswers({ languages: ["python"], clouds: ["aws"], iac: ["terraform"] });
  const result = generate(answers);

  it("includes Python and Terraform files", () => {
    expect(result.hasFile("pyproject.toml")).toBe(true);
    expect(result.hasFile(".tflint.hcl")).toBe(true);
  });

  it("does not include TypeScript files", () => {
    expect(result.hasFile("biome.json")).toBe(false);
    expect(result.hasFile("tsconfig.json")).toBe(false);
  });

  it("merges both preset tools into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.python).toBe("3.12");
    expect(toml.tools.terraform).toBe("1");
    expect(toml.tools.tflint).toBe("0.55");
  });

  it("has CI steps from both presets", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Ruff)");
    expect(stepNames).toContain("Lint (Terraform)");
  });
});

// --- Pattern 10: Python + CloudFormation ---
describe("generate (python + cloudformation)", () => {
  const answers = makeAnswers({ languages: ["python"], clouds: ["aws"], iac: ["cloudformation"] });
  const result = generate(answers);

  it("includes Python and CloudFormation files", () => {
    expect(result.hasFile("pyproject.toml")).toBe(true);
    expect(result.hasFile("infra/template.yaml")).toBe(true);
    expect(result.hasFile(".cfnlintrc.yaml")).toBe(true);
  });

  it("does not include TypeScript or Terraform files", () => {
    expect(result.hasFile("biome.json")).toBe(false);
    expect(result.hasFile(".tflint.hcl")).toBe(false);
  });

  it("merges both preset tools into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.python).toBe("3.12");
    expect(toml.tools["pipx:cfn-lint"]).toBe("1");
  });

  it("has CI steps from both presets", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Ruff)");
    expect(stepNames).toContain("Lint (cfn-lint)");
  });

  it("replaces {{projectName}} in CloudFormation template", () => {
    const template = result.readText("infra/template.yaml");
    expect(template).toContain("test-app");
    expect(template).not.toContain("{{projectName}}");
  });
});

// --- File list snapshots for all patterns ---
describe("file list snapshots", () => {
  const patterns: Array<{ name: string; answers: Partial<WizardAnswers> }> = [
    { name: "base only", answers: {} },
    { name: "typescript", answers: { languages: ["typescript"] } },
    { name: "python", answers: { languages: ["python"] } },
    { name: "typescript + python", answers: { languages: ["typescript", "python"] } },
    { name: "react", answers: { frontend: "react" } },
    { name: "cdk", answers: { clouds: ["aws"], iac: ["cdk"] } },
    {
      name: "cloudformation (ts)",
      answers: { languages: ["typescript"], clouds: ["aws"], iac: ["cloudformation"] },
    },
    {
      name: "terraform (ts)",
      answers: { languages: ["typescript"], clouds: ["aws"], iac: ["terraform"] },
    },
    {
      name: "full config",
      answers: {
        languages: ["typescript", "python"],
        frontend: "react",
        clouds: ["aws"],
        iac: ["cdk"],
      },
    },
    {
      name: "python + terraform",
      answers: { languages: ["python"], clouds: ["aws"], iac: ["terraform"] },
    },
    {
      name: "python + cloudformation",
      answers: { languages: ["python"], clouds: ["aws"], iac: ["cloudformation"] },
    },
  ];

  for (const { name, answers } of patterns) {
    it(`${name}`, () => {
      const result = generate(makeAnswers(answers));
      expect(result.fileList()).toMatchSnapshot();
    });
  }
});
