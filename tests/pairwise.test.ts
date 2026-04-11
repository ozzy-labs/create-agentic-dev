/**
 * Layer B: Pairwise interaction tests.
 *
 * Verifies that important preset combinations produce correct merged output.
 * Focuses on cross-layer interactions where merge conflicts or deduplication matter.
 */
import { describe, expect, it } from "vitest";
import { generate } from "../src/generator.js";
import { makeAnswers } from "./helpers.js";

// --- TypeScript + Python ---

describe("pairwise: typescript + python", () => {
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
    expect(settings["editor.defaultFormatter"]).toBe("biomejs.biome");
    expect(settings["[typescript]"]).toBeDefined();
    expect(settings["mypy-type-checker.importStrategy"]).toBe("fromEnvironment");
    expect(settings["[python]"]).toBeDefined();
  });

  it("merges both language extensions into VSCode extensions", () => {
    const ext = result.readJson(".vscode/extensions.json") as Record<string, string[]>;
    expect(ext.recommendations).toContain("biomejs.biome");
    expect(ext.recommendations).toContain("charliermarsh.ruff");
    expect(ext.recommendations).toContain("ms-python.python");
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

// --- Python + Terraform ---

describe("pairwise: python + terraform", () => {
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

// --- Python + CloudFormation ---

describe("pairwise: python + cloudformation", () => {
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

// --- CDK + CloudFormation (cfn-lint deduplication) ---

describe("pairwise: cdk + cloudformation (cfn-lint dedup)", () => {
  it("cfn-lint appears only once when both CDK and CloudFormation are selected", () => {
    const result = generate(
      makeAnswers({
        languages: ["typescript"],
        clouds: ["aws"],
        iac: ["cdk", "cloudformation"],
      }),
    );
    const ci = result.readText(".github/workflows/ci.yaml");
    const matches = ci.match(/Lint \(cfn-lint\)/g) ?? [];
    expect(matches.length, "cfn-lint should appear exactly once in CI").toBe(1);
  });
});

// --- React + CDK (web/ + infra/ coexistence) ---

describe("pairwise: react + cdk", () => {
  const answers = makeAnswers({ frontend: "react", clouds: ["aws"], iac: ["cdk"] });
  const result = generate(answers);

  it("includes both web/ and infra/ directories", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
    expect(result.hasFile("infra/bin/app.ts")).toBe(true);
    expect(result.hasFile("infra/package.json")).toBe(true);
  });

  it("workspace includes web only (infra uses independent npm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).not.toContain("- infra");
  });

  it("root package.json has both orchestration and CDK scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts["cdk:synth"]).toContain("cdk synth");
  });
});

// --- React + Python (web/ + Python tools coexistence) ---

describe("pairwise: react + python", () => {
  const answers = makeAnswers({ frontend: "react", languages: ["python"] });
  const result = generate(answers);

  it("includes web/ and Python files", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("pyproject.toml")).toBe(true);
  });

  it("merges both TypeScript and Python tools (React forces TypeScript)", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
    expect(toml.tools.python).toBe("3.12");
  });

  it("lint:all includes both TypeScript and Python lint scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["lint:all"]).toContain("pnpm run lint");
    expect(scripts["lint:all"]).toContain("pnpm run lint:python");
  });
});

// --- FastAPI + React (web/ + api/ coexistence) ---

describe("pairwise: fastapi + react", () => {
  const answers = makeAnswers({ frontend: "react", backend: "fastapi" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
    expect(result.hasFile("api/src/main.py")).toBe(true);
    expect(result.hasFile("api/pyproject.toml")).toBe(true);
  });

  it("workspace includes web only (FastAPI uses uv, not pnpm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).not.toContain("- api");
  });

  it("root package.json has both orchestration and API scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts["dev:api"]).toContain("uvicorn");
    expect(scripts["test:api"]).toContain("pytest");
  });

  it("includes both TypeScript (via React) and Python (via FastAPI) tools", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
    expect(toml.tools.python).toBe("3.12");
  });

  it("devcontainer forwards port 8000", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const ports = dc.forwardPorts as number[];
    expect(ports).toContain(8000);
  });

  it("has CI steps from both presets", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Biome)");
    expect(stepNames).toContain("Lint (API Ruff)");
    expect(stepNames).toContain("Test (API pytest)");
  });

  it("CLAUDE.md contains both React and FastAPI sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("React");
    expect(claude).toContain("FastAPI");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Hono + React (web/ + api/ coexistence, both in pnpm workspace) ---

describe("pairwise: hono + react", () => {
  const answers = makeAnswers({ frontend: "react", backend: "hono" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
    expect(result.hasFile("api/src/app.ts")).toBe(true);
    expect(result.hasFile("api/package.json")).toBe(true);
  });

  it("workspace includes both web and api (Hono uses pnpm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).toContain("- api");
  });

  it("root package.json has both orchestration and API scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts["dev:api"]).toBeDefined();
    expect(scripts["test:api"]).toBeDefined();
    expect(scripts["build:api"]).toBeDefined();
  });

  it("has CI steps from both presets", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Biome)");
    expect(stepNames).toContain("Typecheck (API tsc)");
    expect(stepNames).toContain("Test (API vitest)");
    expect(stepNames).toContain("Build (API)");
  });

  it("CLAUDE.md contains both React and Hono sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("React");
    expect(claude).toContain("Hono");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Hono + CDK (api/ + infra/ coexistence) ---

describe("pairwise: hono + cdk", () => {
  const answers = makeAnswers({ backend: "hono", clouds: ["aws"], iac: ["cdk"] });
  const result = generate(answers);

  it("includes both api/ and infra/ directories", () => {
    expect(result.hasFile("api/src/app.ts")).toBe(true);
    expect(result.hasFile("api/package.json")).toBe(true);
    expect(result.hasFile("infra/bin/app.ts")).toBe(true);
    expect(result.hasFile("infra/package.json")).toBe(true);
  });

  it("workspace includes api only (infra uses independent npm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- api");
    expect(workspace).not.toContain("- infra");
  });

  it("biome.json excludes both api/dist/ and cdk.out/", () => {
    const biome = result.readJson("biome.json") as Record<string, unknown>;
    const files = biome.files as Record<string, string[]>;
    expect(files.includes).toContain("!**/api/dist/");
    expect(files.includes).toContain("!**/cdk.out/");
  });

  it("root package.json has both API and CDK scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["dev:api"]).toBeDefined();
    expect(scripts["cdk:synth"]).toBeDefined();
  });

  it("has CI steps from both presets", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Typecheck (API tsc)");
    expect(stepNames).toContain("Test (API vitest)");
    expect(stepNames).toContain("Test (infra CDK)");
  });
});

// --- Express + React (web/ + api/ coexistence, both in pnpm workspace) ---

describe("pairwise: express + react", () => {
  const answers = makeAnswers({ frontend: "react", backend: "express" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
    expect(result.hasFile("api/src/app.ts")).toBe(true);
    expect(result.hasFile("api/package.json")).toBe(true);
  });

  it("workspace includes both web and api (Express uses pnpm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).toContain("- api");
  });

  it("root package.json has both orchestration and API scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts["dev:api"]).toBeDefined();
    expect(scripts["test:api"]).toBeDefined();
    expect(scripts["build:api"]).toBeDefined();
  });

  it("both use TypeScript tools (single set)", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
  });

  it("devcontainer forwards port 3000", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const ports = dc.forwardPorts as number[];
    expect(ports).toContain(3000);
  });

  it("has CI steps from both presets", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Biome)");
    expect(stepNames).toContain("Typecheck (API tsc)");
    expect(stepNames).toContain("Test (API vitest)");
    expect(stepNames).toContain("Build (API)");
  });

  it("CLAUDE.md contains both React and Express sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("React");
    expect(claude).toContain("Express");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Express + CDK (api/ + infra/ coexistence) ---

describe("pairwise: express + cdk", () => {
  const answers = makeAnswers({ backend: "express", clouds: ["aws"], iac: ["cdk"] });
  const result = generate(answers);

  it("includes both api/ and infra/ directories", () => {
    expect(result.hasFile("api/src/app.ts")).toBe(true);
    expect(result.hasFile("api/package.json")).toBe(true);
    expect(result.hasFile("infra/bin/app.ts")).toBe(true);
    expect(result.hasFile("infra/package.json")).toBe(true);
  });

  it("workspace includes api only (infra uses independent npm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- api");
    expect(workspace).not.toContain("- infra");
  });

  it("biome.json excludes both api/dist/ and cdk.out/", () => {
    const biome = result.readJson("biome.json") as Record<string, unknown>;
    const files = biome.files as Record<string, string[]>;
    expect(files.includes).toContain("!**/api/dist/");
    expect(files.includes).toContain("!**/cdk.out/");
  });

  it("root package.json has both API and CDK scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["dev:api"]).toBeDefined();
    expect(scripts["cdk:synth"]).toBeDefined();
  });

  it("has CI steps from both presets", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Typecheck (API tsc)");
    expect(stepNames).toContain("Test (API vitest)");
    expect(stepNames).toContain("Test (infra CDK)");
  });
});

// --- Express + React + CDK (web/ + api/ + infra/ triple coexistence) ---

describe("pairwise: express + react + cdk", () => {
  const answers = makeAnswers({
    frontend: "react",
    backend: "express",
    clouds: ["aws"],
    iac: ["cdk"],
  });
  const result = generate(answers);

  it("includes web/, api/, and infra/ directories", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("api/src/app.ts")).toBe(true);
    expect(result.hasFile("infra/bin/app.ts")).toBe(true);
  });

  it("workspace includes web and api (not infra)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).toContain("- api");
    expect(workspace).not.toContain("- infra");
  });
});

// --- NextJS + Express (web/ + api/, both TypeScript) ---

describe("pairwise: nextjs + express", () => {
  const answers = makeAnswers({ frontend: "nextjs", backend: "express" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/next.config.ts")).toBe(true);
    expect(result.hasFile("api/src/app.ts")).toBe(true);
  });

  it("workspace includes both web and api", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).toContain("- api");
  });

  it("CLAUDE.md contains both Next.js and Express sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Next.js");
    expect(claude).toContain("Express");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- NextJS + FastAPI (web/ + api/, TypeScript + Python) ---

describe("pairwise: nextjs + fastapi", () => {
  const answers = makeAnswers({ frontend: "nextjs", backend: "fastapi" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/next.config.ts")).toBe(true);
    expect(result.hasFile("api/src/main.py")).toBe(true);
  });

  it("workspace includes web only (FastAPI uses uv, not pnpm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).not.toContain("- api");
  });

  it("includes both TypeScript and Python tools", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
    expect(toml.tools.python).toBe("3.12");
  });

  it("CLAUDE.md contains both Next.js and FastAPI sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Next.js");
    expect(claude).toContain("FastAPI");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- FastAPI + CDK (api/ Python + infra/ TypeScript) ---

describe("pairwise: fastapi + cdk", () => {
  const answers = makeAnswers({ backend: "fastapi", clouds: ["aws"], iac: ["cdk"] });
  const result = generate(answers);

  it("includes both api/ and infra/ directories", () => {
    expect(result.hasFile("api/src/main.py")).toBe(true);
    expect(result.hasFile("infra/bin/app.ts")).toBe(true);
  });

  it("includes both TypeScript (via CDK) and Python (via FastAPI) tools", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
    expect(toml.tools.python).toBe("3.12");
    expect(toml.tools["npm:aws-cdk"]).toBe("2");
  });

  it("has CI steps from both presets", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (API Ruff)");
    expect(stepNames).toContain("Test (API pytest)");
    expect(stepNames).toContain("Test (infra CDK)");
  });
});

// --- Vue + FastAPI (web/ + api/ coexistence) ---

describe("pairwise: vue + fastapi", () => {
  const answers = makeAnswers({ frontend: "vue", backend: "fastapi" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("web/src/App.vue")).toBe(true);
    expect(result.hasFile("api/src/main.py")).toBe(true);
    expect(result.hasFile("api/pyproject.toml")).toBe(true);
  });

  it("workspace includes web only (FastAPI uses uv, not pnpm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).not.toContain("- api");
  });

  it("includes both TypeScript (via Vue) and Python (via FastAPI) tools", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
    expect(toml.tools.python).toBe("3.12");
  });

  it("CLAUDE.md contains both Vue and FastAPI sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Vue");
    expect(claude).toContain("FastAPI");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Vue + Express (web/ + api/ coexistence, both in pnpm workspace) ---

describe("pairwise: vue + express", () => {
  const answers = makeAnswers({ frontend: "vue", backend: "express" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("web/src/App.vue")).toBe(true);
    expect(result.hasFile("api/src/app.ts")).toBe(true);
    expect(result.hasFile("api/package.json")).toBe(true);
  });

  it("workspace includes both web and api (Express uses pnpm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).toContain("- api");
  });

  it("CLAUDE.md contains both Vue and Express sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Vue");
    expect(claude).toContain("Express");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Nuxt + Express (web/ + api/, both TypeScript) ---

describe("pairwise: nuxt + express", () => {
  const answers = makeAnswers({ frontend: "nuxt", backend: "express" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/nuxt.config.ts")).toBe(true);
    expect(result.hasFile("api/src/app.ts")).toBe(true);
  });

  it("workspace includes both web and api", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).toContain("- api");
  });

  it("CLAUDE.md contains both Nuxt and Express sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Nuxt");
    expect(claude).toContain("Express");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Nuxt + FastAPI (web/ + api/, TypeScript + Python) ---

describe("pairwise: nuxt + fastapi", () => {
  const answers = makeAnswers({ frontend: "nuxt", backend: "fastapi" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/nuxt.config.ts")).toBe(true);
    expect(result.hasFile("api/src/main.py")).toBe(true);
  });

  it("workspace includes web only (FastAPI uses uv, not pnpm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).not.toContain("- api");
  });

  it("includes both TypeScript and Python tools", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["npm:@biomejs/biome"]).toBe("2");
    expect(toml.tools.python).toBe("3.12");
  });

  it("CLAUDE.md contains both Nuxt and FastAPI sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Nuxt");
    expect(claude).toContain("FastAPI");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Vue + CDK (web/ + infra/ coexistence) ---

describe("pairwise: vue + cdk", () => {
  const answers = makeAnswers({ frontend: "vue", clouds: ["aws"], iac: ["cdk"] });
  const result = generate(answers);

  it("includes both web/ and infra/ directories", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("infra/bin/app.ts")).toBe(true);
  });

  it("workspace includes web only (infra uses independent npm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).not.toContain("- infra");
  });
});

// --- SvelteKit + Hono (web/ + api/, both in pnpm workspace) ---

describe("pairwise: sveltekit + hono", () => {
  const answers = makeAnswers({ frontend: "sveltekit", backend: "hono" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/svelte.config.js")).toBe(true);
    expect(result.hasFile("api/src/app.ts")).toBe(true);
    expect(result.hasFile("api/package.json")).toBe(true);
  });

  it("workspace includes both web and api", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).toContain("- api");
  });

  it("CLAUDE.md contains both SvelteKit and Hono sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("SvelteKit");
    expect(claude).toContain("Hono");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Astro + FastAPI (web/ + api/, TypeScript + Python) ---

describe("pairwise: astro + fastapi", () => {
  const answers = makeAnswers({ frontend: "astro", backend: "fastapi" });
  const result = generate(answers);

  it("includes both web/ and api/ directories", () => {
    expect(result.hasFile("web/astro.config.ts")).toBe(true);
    expect(result.hasFile("api/src/main.py")).toBe(true);
  });

  it("workspace includes web only (FastAPI uses uv, not pnpm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).not.toContain("- api");
  });

  it("CLAUDE.md contains both Astro and FastAPI sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Astro");
    expect(claude).toContain("FastAPI");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- React + Playwright (web/ + e2e/ coexistence) ---

describe("pairwise: react + playwright", () => {
  const answers = makeAnswers({ frontend: "react", testing: ["playwright"] });
  const result = generate(answers);

  it("includes both web/ and e2e/ directories", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("e2e/playwright.config.ts")).toBe(true);
  });

  it("workspace includes both web and e2e", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).toContain("- e2e");
  });

  it("distributes Playwright MCP server", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.playwright).toBeDefined();
  });

  it("CLAUDE.md contains both React and Playwright sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("React");
    expect(claude).toContain("Playwright");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Batch + React (web/ + worker/ coexistence) ---

describe("pairwise: batch + react", () => {
  const answers = makeAnswers({ frontend: "react", backend: "batch" });
  const result = generate(answers);

  it("includes both web/ and worker/ directories", () => {
    expect(result.hasFile("web/vite.config.ts")).toBe(true);
    expect(result.hasFile("web/package.json")).toBe(true);
    expect(result.hasFile("worker/src/index.ts")).toBe(true);
    expect(result.hasFile("worker/package.json")).toBe(true);
  });

  it("workspace includes both web and worker", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).toContain("- worker");
  });

  it("root package.json has both orchestration and worker scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["build:web"]).toBe("pnpm --filter web build");
    expect(scripts["dev:worker"]).toBeDefined();
    expect(scripts["test:worker"]).toBeDefined();
    expect(scripts["build:worker"]).toBeDefined();
  });

  it("CLAUDE.md contains both React and batch/worker sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("React");
    expect(claude).toContain("Worker");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});

// --- Batch + CDK (worker/ + infra/ coexistence) ---

describe("pairwise: batch + cdk", () => {
  const answers = makeAnswers({ backend: "batch", clouds: ["aws"], iac: ["cdk"] });
  const result = generate(answers);

  it("includes both worker/ and infra/ directories", () => {
    expect(result.hasFile("worker/src/index.ts")).toBe(true);
    expect(result.hasFile("worker/package.json")).toBe(true);
    expect(result.hasFile("infra/bin/app.ts")).toBe(true);
    expect(result.hasFile("infra/package.json")).toBe(true);
  });

  it("workspace includes worker only (infra uses independent npm)", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- worker");
    expect(workspace).not.toContain("- infra");
  });

  it("has CI steps from both presets", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Typecheck (Worker tsc)");
    expect(stepNames).toContain("Test (Worker vitest)");
    expect(stepNames).toContain("Test (infra CDK)");
  });
});

// --- AWS + Azure (multi-cloud MCP and mounts) ---

describe("pairwise: aws + azure", () => {
  const answers = makeAnswers({ clouds: ["aws", "azure"] });
  const result = generate(answers);

  it("includes both cloud CLI tools in .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.awscli).toBe("2");
    expect(toml.tools["pipx:azure-cli"]).toBe("2");
  });

  it("merges both MCP servers into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
    expect(mcp.mcpServers.azure).toBeDefined();
  });

  it("mounts both ~/.aws and ~/.azure in devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(true);
    expect(mounts.some((m: string) => m.includes(".azure"))).toBe(true);
  });
});
