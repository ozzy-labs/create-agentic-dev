import { describe, expect, it } from "vitest";
import { generate, resolvePresets } from "../src/generator.js";
import type { WizardAnswers } from "../src/types.js";

// Helper to create answers with defaults
function makeAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    projectName: "test-app",
    languages: [],
    frontend: "none",
    iac: "none",
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
    const result = resolvePresets(makeAnswers({ iac: "cdk" }));
    expect(result).toContain("typescript");
    expect(result).toContain("cdk");
  });

  it("maintains canonical order", () => {
    const result = resolvePresets(
      makeAnswers({ languages: ["python", "typescript"], frontend: "react", iac: "cdk" }),
    );
    expect(result).toEqual(["base", "typescript", "python", "react", "cdk"]);
  });

  it("deduplicates typescript when forced by multiple selections", () => {
    const result = resolvePresets(
      makeAnswers({ languages: ["typescript"], frontend: "react", iac: "cdk" }),
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
    expect(result.hasFile("trivy.yaml")).toBe(true);
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
    expect(stepNames).toContain("Typecheck");
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

  it("expands CLAUDE.md with Python sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Python");
    expect(claude).toContain("Ruff");
    expect(claude).toContain("mypy");
    expect(claude).not.toContain("<!-- SECTION:");
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

  it("lint:all includes both TypeScript and Python lint scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["lint:all"]).toContain("pnpm run lint");
    expect(scripts["lint:all"]).toContain("pnpm run typecheck");
    expect(scripts["lint:all"]).toContain("pnpm run lint:python");
    expect(scripts["lint:all"]).toContain("pnpm run lint:mypy");
    expect(scripts["lint:all"]).toContain("pnpm run lint:secrets");
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

  it("has TypeScript CI steps (React uses TS build step via script override)", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Biome)");
    expect(stepNames).toContain("Typecheck");
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
