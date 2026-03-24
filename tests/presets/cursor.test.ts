import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (cursor)", () => {
  const result = generate(makeAnswers({ agents: ["cursor"] }));

  it("generates .cursor/rules/project.mdc instruction file", () => {
    expect(result.hasFile(".cursor/rules/project.mdc")).toBe(true);
    const rules = result.readText(".cursor/rules/project.mdc");
    expect(rules).toContain("test-app");
    expect(rules).not.toContain("{{projectName}}");
  });

  it("includes MDC frontmatter with description and globs", () => {
    const rules = result.readText(".cursor/rules/project.mdc");
    expect(rules).toMatch(/^---\n/);
    expect(rules).toContain("description:");
    expect(rules).toContain("globs:");
  });

  it("writes MCP servers to .cursor/mcp.json", () => {
    expect(result.hasFile(".cursor/mcp.json")).toBe(true);
    const mcp = result.readJson(".cursor/mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.context7).toBeDefined();
    expect(mcp.mcpServers.fetch).toBeDefined();
  });

  it("expands instruction file with agent-instructions sections", () => {
    const rules = result.readText(".cursor/rules/project.mdc");
    expect(rules).not.toContain("<!-- SECTION:TECH_STACK -->");
    expect(rules).not.toContain("<!-- SECTION:PRE_PUSH_HOOKS -->");
  });

  it("does not generate other agent files", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(false);
    expect(result.hasFile("AGENTS.md")).toBe(false);
    expect(result.hasFile("GEMINI.md")).toBe(false);
    expect(result.hasFile(".mcp.json")).toBe(false);
  });

  it("includes cloud MCP servers when cloud is selected", () => {
    const withAws = generate(makeAnswers({ agents: ["cursor"], clouds: ["aws"] }));
    const mcp = withAws.readJson(".cursor/mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
  });
});
