import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (amazon-q)", () => {
  const result = generate(makeAnswers({ agents: ["amazon-q"] }));

  it("generates .amazonq/rules/project.md instruction file", () => {
    expect(result.hasFile(".amazonq/rules/project.md")).toBe(true);
    const rules = result.readText(".amazonq/rules/project.md");
    expect(rules).toContain("test-app");
    expect(rules).not.toContain("{{projectName}}");
  });

  it("writes MCP servers to .amazonq/mcp.json", () => {
    expect(result.hasFile(".amazonq/mcp.json")).toBe(true);
    const mcp = result.readJson(".amazonq/mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.context7).toBeDefined();
    expect(mcp.mcpServers.fetch).toBeDefined();
  });

  it("expands instruction file with agent-instructions sections", () => {
    const rules = result.readText(".amazonq/rules/project.md");
    expect(rules).not.toContain("<!-- SECTION:TECH_STACK -->");
    expect(rules).not.toContain("<!-- SECTION:PRE_PUSH_HOOKS -->");
  });

  it("does not generate other agent files (except universal AGENTS.md)", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(false);
    expect(result.hasFile("AGENTS.md")).toBe(true); // always generated when agents.length > 0
    expect(result.hasFile("GEMINI.md")).toBe(false);
    expect(result.hasFile(".mcp.json")).toBe(false);
  });

  it("includes cloud MCP servers when cloud is selected", () => {
    const withAws = generate(makeAnswers({ agents: ["amazon-q"], clouds: ["aws"] }));
    const mcp = withAws.readJson(".amazonq/mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
  });
});
