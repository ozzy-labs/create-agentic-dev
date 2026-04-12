import { describe, expect, it } from "vitest";
import { generateApply } from "../src/generator.js";
import type { ApplyAnswers } from "../src/types.js";

function makeApplyAnswers(overrides: Partial<ApplyAnswers> = {}): ApplyAnswers {
  return {
    clouds: [],
    agents: ["claude-code"],
    ...overrides,
  };
}

describe("generateApply", () => {
  it("generates Claude Code agent files only", () => {
    const result = generateApply(makeApplyAnswers({ agents: ["claude-code"] }));
    const files = result.fileList();

    // Should include Claude Code agent files
    expect(files.some((f) => f === "CLAUDE.md")).toBe(true);
    expect(files.some((f) => f.startsWith(".claude/"))).toBe(true);
    expect(files.some((f) => f === ".mcp.json")).toBe(true);

    // Should NOT include non-agent files
    expect(files.some((f) => f === "package.json")).toBe(false);
    expect(files.some((f) => f === ".gitignore")).toBe(false);
    expect(files.some((f) => f === "biome.json")).toBe(false);
    expect(files.some((f) => f === "lefthook.yaml")).toBe(false);
    expect(files.some((f) => f.startsWith(".devcontainer/"))).toBe(false);
    expect(files.some((f) => f.startsWith(".github/workflows/"))).toBe(false);
    expect(files.some((f) => f === ".vscode/settings.json")).toBe(false);
  });

  it("generates multiple agent files when multiple agents selected", () => {
    const result = generateApply(
      makeApplyAnswers({ agents: ["claude-code", "codex", "gemini", "cursor"] }),
    );
    const files = result.fileList();

    expect(files.some((f) => f === "CLAUDE.md")).toBe(true);
    expect(files.some((f) => f === "AGENTS.md")).toBe(true);
    // Gemini reads AGENTS.md natively — no separate GEMINI.md
    expect(files.some((f) => f === "GEMINI.md")).toBe(false);
    expect(files.some((f) => f.startsWith(".cursor/"))).toBe(true);
    expect(files.some((f) => f === ".mcp.json")).toBe(true);
  });

  it("includes cloud MCP servers when clouds are selected", () => {
    const result = generateApply(makeApplyAnswers({ clouds: ["aws"], agents: ["claude-code"] }));
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
    expect(mcp.mcpServers.context7).toBeDefined();
    expect(mcp.mcpServers.fetch).toBeDefined();
  });

  it("includes multiple cloud MCP servers", () => {
    const result = generateApply(
      makeApplyAnswers({ clouds: ["aws", "azure", "gcp"], agents: ["claude-code"] }),
    );
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
    expect(mcp.mcpServers.azure).toBeDefined();
    expect(mcp.mcpServers["google-cloud"]).toBeDefined();
  });

  it("generates no files when no agents selected", () => {
    const result = generateApply(makeApplyAnswers({ agents: [] }));
    const files = result.fileList();

    // Only base .mcp.json would exist (from base preset), but no agent instruction files
    expect(files.some((f) => f === "CLAUDE.md")).toBe(false);
    expect(files.some((f) => f === "AGENTS.md")).toBe(false);
  });

  it("does not contain leftover section placeholders", () => {
    const result = generateApply(
      makeApplyAnswers({ clouds: ["aws"], agents: ["claude-code", "codex", "gemini"] }),
    );
    for (const file of result.fileList()) {
      if (file.endsWith(".md") || file.endsWith(".mdc")) {
        const content = result.readText(file);
        expect(content, `${file} should not have leftover placeholders`).not.toContain(
          "<!-- SECTION:",
        );
      }
    }
  });

  it("Amazon Q and Copilot instruction files are included", () => {
    const result = generateApply(makeApplyAnswers({ agents: ["amazon-q", "copilot"] }));
    const files = result.fileList();
    expect(files.some((f) => f.startsWith(".amazonq/"))).toBe(true);
    // Copilot reads AGENTS.md natively — no separate copilot-instructions.md
    expect(files.some((f) => f === ".github/copilot-instructions.md")).toBe(false);
    expect(files.some((f) => f === ".copilot/mcp-config.json")).toBe(true);
  });

  it("Cline instruction files are included", () => {
    const result = generateApply(makeApplyAnswers({ agents: ["cline"] }));
    const files = result.fileList();
    expect(files.some((f) => f.startsWith(".clinerules/"))).toBe(true);
  });
});
