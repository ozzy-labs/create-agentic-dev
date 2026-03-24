import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (cline)", () => {
  const result = generate(makeAnswers({ agents: ["cline"] }));

  it("generates .clinerules/project.md instruction file", () => {
    expect(result.hasFile(".clinerules/project.md")).toBe(true);
    const rules = result.readText(".clinerules/project.md");
    expect(rules).toContain("test-app");
    expect(rules).not.toContain("{{projectName}}");
  });

  it("does not generate MCP config file (managed via Cline UI)", () => {
    // Cline manages MCP servers through VS Code extension UI,
    // so no MCP config file should be generated
    const files = result.fileList();
    const clineFiles = files.filter((f) => f.startsWith(".cline") || f.startsWith(".clinerules"));
    expect(clineFiles).toEqual([".clinerules/project.md"]);
  });

  it("expands instruction file with agent-instructions sections", () => {
    const rules = result.readText(".clinerules/project.md");
    expect(rules).not.toContain("<!-- SECTION:TECH_STACK -->");
    expect(rules).not.toContain("<!-- SECTION:PRE_PUSH_HOOKS -->");
  });

  it("does not generate other agent files", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(false);
    expect(result.hasFile("AGENTS.md")).toBe(false);
    expect(result.hasFile("GEMINI.md")).toBe(false);
    expect(result.hasFile(".mcp.json")).toBe(false);
  });

  it("contributes MCP servers to other agents when combined", () => {
    const withClaude = generate(makeAnswers({ agents: ["cline", "claude-code"] }));
    const mcp = withClaude.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.context7).toBeDefined();
    expect(mcp.mcpServers.fetch).toBeDefined();
  });
});
