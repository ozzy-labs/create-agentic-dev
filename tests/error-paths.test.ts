/**
 * Error path and isolation tests.
 *
 * Validates:
 * - buildResult file-not-found errors (readText, readYaml, readToml)
 * - Conditional devDeps removal logic
 * - Owned file isolation (preset files don't leak)
 * - Frontend sample file override behavior
 * - Devcontainer port forwarding
 */
import { describe, expect, it } from "vitest";
import { generate } from "../src/generator.js";
import { buildResult } from "../src/utils.js";
import { makeAnswers } from "./helpers.js";

// --- buildResult error paths ---

describe("error: buildResult file access", () => {
  const result = buildResult(new Map([["a.txt", "hello"]]));

  it("readText throws for missing file", () => {
    expect(() => result.readText("missing.txt")).toThrow("File not found: missing.txt");
  });

  it("readYaml throws for missing file", () => {
    expect(() => result.readYaml("missing.yaml")).toThrow("File not found: missing.yaml");
  });

  it("readToml throws for missing file", () => {
    expect(() => result.readToml("missing.toml")).toThrow("File not found: missing.toml");
  });

  it("readJson throws for missing file", () => {
    expect(() => result.readJson("missing.json")).toThrow("File not found: missing.json");
  });

  it("hasFile returns false for missing file", () => {
    expect(result.hasFile("missing.txt")).toBe(false);
  });

  it("hasFile returns true for existing file", () => {
    expect(result.hasFile("a.txt")).toBe(true);
  });
});

// --- Conditional devDeps removal ---

describe("behavior: conditional devDeps removal", () => {
  it("removes tsdown when React overrides build script", () => {
    const result = generate(makeAnswers({ frontend: "react" }));
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;
    // React overrides build to "pnpm run build:web", removing tsdown usage
    expect(devDeps.tsdown).toBeUndefined();
  });

  it("keeps vitest when tests exist", () => {
    const result = generate(makeAnswers({ languages: ["typescript"] }));
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;
    const scripts = (pkg.scripts ?? {}) as Record<string, string>;
    expect(devDeps.vitest).toBeDefined();
    expect(scripts.test).toBeDefined();
  });
});

// --- Owned file isolation ---

describe("isolation: owned file isolation", () => {
  it("React files only exist when React is selected", () => {
    const withReact = generate(makeAnswers({ frontend: "react" }));
    const withoutReact = generate(makeAnswers({ languages: ["typescript"] }));

    expect(withReact.hasFile("web/vite.config.ts")).toBe(true);
    expect(withReact.hasFile("web/src/App.tsx")).toBe(true);

    expect(withoutReact.hasFile("web/vite.config.ts")).toBe(false);
    expect(withoutReact.hasFile("web/src/App.tsx")).toBe(false);
  });

  it("Express files only exist when Express is selected", () => {
    const withExpress = generate(makeAnswers({ backend: "express" }));
    const withoutExpress = generate(makeAnswers({ languages: ["typescript"] }));

    expect(withExpress.hasFile("api/src/app.ts")).toBe(true);
    expect(withoutExpress.hasFile("api/src/app.ts")).toBe(false);
  });

  it("FastAPI files only exist when FastAPI is selected", () => {
    const withFastapi = generate(makeAnswers({ backend: "fastapi" }));
    const withoutFastapi = generate(makeAnswers({ languages: ["python"] }));

    expect(withFastapi.hasFile("api/src/main.py")).toBe(true);
    expect(withoutFastapi.hasFile("api/src/main.py")).toBe(false);
  });

  it("CDK files only exist when CDK is selected", () => {
    const withCdk = generate(makeAnswers({ clouds: ["aws"], iac: ["cdk"] }));
    const withoutCdk = generate(makeAnswers({ clouds: ["aws"] }));

    expect(withCdk.hasFile("infra/bin/app.ts")).toBe(true);
    expect(withoutCdk.hasFile("infra/bin/app.ts")).toBe(false);
  });

  it("Claude Code files only exist when claude-code agent is selected", () => {
    const withClaude = generate(makeAnswers({ agents: ["claude-code"] }));
    const withoutClaude = generate(makeAnswers({ agents: ["codex"] }));

    expect(withClaude.hasFile("CLAUDE.md")).toBe(true);
    expect(withClaude.hasFile(".claude/settings.json")).toBe(true);

    expect(withoutClaude.hasFile("CLAUDE.md")).toBe(false);
    expect(withoutClaude.hasFile(".claude/settings.json")).toBe(false);
  });

  it("Codex files only exist when codex agent is selected", () => {
    const withCodex = generate(makeAnswers({ agents: ["codex"] }));
    const withoutCodex = generate(makeAnswers({ agents: ["claude-code"] }));

    expect(withCodex.hasFile(".codex/config.toml")).toBe(true);
    expect(withoutCodex.hasFile(".codex/config.toml")).toBe(false);
    // AGENTS.md is always generated when any agent is selected
    expect(withCodex.hasFile("AGENTS.md")).toBe(true);
    expect(withoutCodex.hasFile("AGENTS.md")).toBe(true);
  });

  it("Python files only exist when Python is selected", () => {
    const withPython = generate(makeAnswers({ languages: ["python"] }));
    const withoutPython = generate(makeAnswers({ languages: ["typescript"] }));

    expect(withPython.hasFile("pyproject.toml")).toBe(true);
    expect(withoutPython.hasFile("pyproject.toml")).toBe(false);
  });

  it("TypeScript files only exist when TypeScript is selected", () => {
    const withTs = generate(makeAnswers({ languages: ["typescript"] }));
    const withoutTs = generate(makeAnswers({ languages: ["python"] }));

    expect(withTs.hasFile("tsconfig.json")).toBe(true);
    expect(withTs.hasFile("biome.json")).toBe(true);
    expect(withoutTs.hasFile("tsconfig.json")).toBe(false);
    expect(withoutTs.hasFile("biome.json")).toBe(false);
  });
});

// --- Frontend removes language sample files ---

describe("behavior: frontend overrides language sample files", () => {
  it("React removes src/index.ts and tests/index.test.ts", () => {
    const result = generate(makeAnswers({ frontend: "react" }));
    expect(result.hasFile("src/index.ts")).toBe(false);
    expect(result.hasFile("tests/index.test.ts")).toBe(false);
  });

  it("Next.js removes src/index.ts and tests/index.test.ts", () => {
    const result = generate(makeAnswers({ frontend: "nextjs" }));
    expect(result.hasFile("src/index.ts")).toBe(false);
    expect(result.hasFile("tests/index.test.ts")).toBe(false);
  });

  it("TypeScript without frontend keeps src/index.ts", () => {
    const result = generate(makeAnswers({ languages: ["typescript"] }));
    expect(result.hasFile("src/index.ts")).toBe(true);
    expect(result.hasFile("tests/index.test.ts")).toBe(true);
  });
});

// --- Port forwarding ---

describe("behavior: devcontainer port forwarding", () => {
  it("no forwardPorts without backend", () => {
    const result = generate(makeAnswers({ languages: ["typescript"] }));
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    expect(dc.forwardPorts).toBeUndefined();
  });

  it("Express forwards port 3000", () => {
    const result = generate(makeAnswers({ backend: "express" }));
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const ports = dc.forwardPorts as number[];
    expect(ports).toContain(3000);
  });

  it("FastAPI forwards port 8000", () => {
    const result = generate(makeAnswers({ backend: "fastapi" }));
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const ports = dc.forwardPorts as number[];
    expect(ports).toContain(8000);
  });

  it("React + Express forwards port 3000", () => {
    const result = generate(makeAnswers({ frontend: "react", backend: "express" }));
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const ports = dc.forwardPorts as number[];
    expect(ports).toContain(3000);
  });
});
