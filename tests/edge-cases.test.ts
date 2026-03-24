/**
 * Edge case tests — verify behavior for unusual or boundary inputs.
 *
 * Validates:
 * - No-agent selection (no agent presets)
 * - All agents selected simultaneously
 * - Maximum preset combination stress test
 * - Empty/minimal selections
 */
import { describe, expect, it } from "vitest";
import { generate, resolvePresets } from "../src/generator.js";
import {
  expectAllJsonValid,
  expectAllTomlValid,
  expectAllYamlValid,
  expectNoLeftoverPlaceholders,
  expectNoUnreplacedVars,
  makeAnswers,
} from "./helpers.js";

// --- No agent selected ---

describe("edge: no agent selected", () => {
  const result = generate(makeAnswers({ agents: [] }));

  it("generates base files without any agent-specific files", () => {
    expect(result.hasFile("package.json")).toBe(true);
    expect(result.hasFile(".editorconfig")).toBe(true);
    expect(result.hasFile("CLAUDE.md")).toBe(false);
    expect(result.hasFile("AGENTS.md")).toBe(false);
    expect(result.hasFile("GEMINI.md")).toBe(false);
    expect(result.hasFile(".amazonq/rules/project.md")).toBe(false);
    expect(result.hasFile(".github/copilot-instructions.md")).toBe(false);
    expect(result.hasFile(".clinerules/project.md")).toBe(false);
    expect(result.hasFile(".cursor/rules/project.mdc")).toBe(false);
  });

  it("does not generate MCP config files", () => {
    expect(result.hasFile(".mcp.json")).toBe(false);
    expect(result.hasFile(".codex/config.toml")).toBe(false);
    expect(result.hasFile(".gemini/settings.json")).toBe(false);
    expect(result.hasFile(".amazonq/mcp.json")).toBe(false);
    expect(result.hasFile(".cursor/mcp.json")).toBe(false);
    expect(result.hasFile(".copilot/mcp-config.json")).toBe(false);
  });

  it("generates valid JSON/YAML files", () => {
    expectAllJsonValid(result);
    expectAllYamlValid(result);
  });
});

// --- All agents selected simultaneously ---

describe("edge: all agents selected", () => {
  const result = generate(
    makeAnswers({
      agents: ["claude-code", "codex", "gemini", "amazon-q", "copilot", "cline", "cursor"],
    }),
  );

  it("generates all agent instruction files", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(true);
    expect(result.hasFile("AGENTS.md")).toBe(true);
    expect(result.hasFile("GEMINI.md")).toBe(true);
    expect(result.hasFile(".amazonq/rules/project.md")).toBe(true);
    expect(result.hasFile(".github/copilot-instructions.md")).toBe(true);
    expect(result.hasFile(".clinerules/project.md")).toBe(true);
    expect(result.hasFile(".cursor/rules/project.mdc")).toBe(true);
  });

  it("generates all MCP config files", () => {
    expect(result.hasFile(".mcp.json")).toBe(true);
    expect(result.hasFile(".codex/config.toml")).toBe(true);
    expect(result.hasFile(".gemini/settings.json")).toBe(true);
    expect(result.hasFile(".amazonq/mcp.json")).toBe(true);
    expect(result.hasFile(".cursor/mcp.json")).toBe(true);
    expect(result.hasFile(".copilot/mcp-config.json")).toBe(true);
  });

  it("all MCP configs have context7 and fetch servers", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.context7).toBeDefined();
    expect(mcp.mcpServers.fetch).toBeDefined();

    const codex = result.readText(".codex/config.toml");
    expect(codex).toContain("[mcp_servers.context7]");

    const gemini = result.readJson(".gemini/settings.json") as Record<
      string,
      Record<string, unknown>
    >;
    expect(gemini.mcpServers.context7).toBeDefined();

    const amazonq = result.readJson(".amazonq/mcp.json") as Record<string, Record<string, unknown>>;
    expect(amazonq.mcpServers.context7).toBeDefined();

    const cursor = result.readJson(".cursor/mcp.json") as Record<string, Record<string, unknown>>;
    expect(cursor.mcpServers.context7).toBeDefined();

    const copilot = result.readJson(".copilot/mcp-config.json") as Record<
      string,
      Record<string, unknown>
    >;
    expect(copilot.mcpServers.context7).toBeDefined();
  });

  it("all JSON files are valid", () => {
    expectAllJsonValid(result);
  });

  it("no leftover placeholders or unreplaced vars", () => {
    expectNoLeftoverPlaceholders(result);
    expectNoUnreplacedVars(result);
  });
});

// --- Maximum preset combination (stress test) ---

describe("edge: maximum preset combination", () => {
  const result = generate(
    makeAnswers({
      languages: ["typescript", "python"],
      frontend: "react",
      backend: "fastapi",
      clouds: ["aws", "azure", "gcp"],
      iac: ["cdk", "cloudformation", "terraform", "bicep"],
      agents: ["claude-code", "codex", "gemini", "amazon-q", "copilot", "cline", "cursor"],
    }),
  );

  it("generates without errors", () => {
    expect(result.fileList().length).toBeGreaterThan(0);
  });

  it("all JSON files are valid", () => {
    expectAllJsonValid(result);
  });

  it("all YAML files are valid", () => {
    expectAllYamlValid(result);
  });

  it("all TOML files are valid", () => {
    expectAllTomlValid(result);
  });

  it("no leftover vars or placeholders", () => {
    expectNoUnreplacedVars(result);
    expectNoLeftoverPlaceholders(result);
  });

  it("includes all 4 CD workflows", () => {
    expect(result.hasFile(".github/workflows/cd-cdk.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-cloudformation.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-terraform.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-bicep.yaml")).toBe(true);
  });

  it("resolves all expected presets in canonical order", () => {
    const presets = resolvePresets(
      makeAnswers({
        languages: ["typescript", "python"],
        frontend: "react",
        backend: "fastapi",
        clouds: ["aws", "azure", "gcp"],
        iac: ["cdk", "cloudformation", "terraform", "bicep"],
        agents: ["claude-code", "codex", "gemini", "amazon-q", "copilot", "cline", "cursor"],
      }),
    );
    expect(presets[0]).toBe("base");
    // typescript before python (canonical order)
    expect(presets.indexOf("typescript")).toBeLessThan(presets.indexOf("python"));
    // languages before frontend
    expect(presets.indexOf("python")).toBeLessThan(presets.indexOf("react"));
    // frontend before backend
    expect(presets.indexOf("react")).toBeLessThan(presets.indexOf("fastapi"));
    // clouds before iac
    expect(presets.indexOf("aws")).toBeLessThan(presets.indexOf("cdk"));
    // iac before agents
    expect(presets.indexOf("bicep")).toBeLessThan(presets.indexOf("claude-code"));
  });
});

// --- Minimal selection (base only) ---

describe("edge: base only (no languages, no frameworks)", () => {
  const result = generate(makeAnswers({ agents: [] }));

  it("generates only base files plus no language-specific files", () => {
    expect(result.hasFile("package.json")).toBe(true);
    expect(result.hasFile(".editorconfig")).toBe(true);
    expect(result.hasFile("biome.json")).toBe(false);
    expect(result.hasFile("tsconfig.json")).toBe(false);
    expect(result.hasFile("pyproject.toml")).toBe(false);
  });

  it("package.json has no language-specific scripts", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.lint).toBeUndefined();
    expect(scripts.typecheck).toBeUndefined();
    expect(scripts["lint:python"]).toBeUndefined();
  });

  it("CI workflow has only common steps (no language-specific lint/test)", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name as string);
    expect(stepNames).not.toContain("Lint (Biome)");
    expect(stepNames).not.toContain("Lint (Ruff)");
    expect(stepNames).not.toContain("Typecheck");
  });
});

// --- Forced dependency consistency ---

describe("edge: forced dependency chains", () => {
  it("react forces typescript — resolved presets include typescript", () => {
    const presets = resolvePresets(makeAnswers({ frontend: "react", agents: [] }));
    expect(presets).toContain("typescript");
    expect(presets).toContain("react");
  });

  it("nextjs forces typescript — resolved presets include typescript", () => {
    const presets = resolvePresets(makeAnswers({ frontend: "nextjs", agents: [] }));
    expect(presets).toContain("typescript");
    expect(presets).toContain("nextjs");
  });

  it("fastapi forces python — resolved presets include python", () => {
    const presets = resolvePresets(makeAnswers({ backend: "fastapi", agents: [] }));
    expect(presets).toContain("python");
    expect(presets).toContain("fastapi");
  });

  it("express forces typescript — resolved presets include typescript", () => {
    const presets = resolvePresets(makeAnswers({ backend: "express", agents: [] }));
    expect(presets).toContain("typescript");
    expect(presets).toContain("express");
  });

  it("cdk forces typescript — resolved presets include typescript", () => {
    const presets = resolvePresets(makeAnswers({ clouds: ["aws"], iac: ["cdk"], agents: [] }));
    expect(presets).toContain("typescript");
    expect(presets).toContain("cdk");
  });

  it("forced dependencies are not duplicated", () => {
    const presets = resolvePresets(
      makeAnswers({ languages: ["typescript"], frontend: "react", agents: [] }),
    );
    const tsCount = presets.filter((p) => p === "typescript").length;
    expect(tsCount, "typescript should appear exactly once").toBe(1);
  });
});
