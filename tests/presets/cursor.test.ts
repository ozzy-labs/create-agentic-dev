import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (cursor)", () => {
  const result = generate(makeAnswers({ agents: ["cursor"] }));

  it("does not generate .cursor/rules/project.mdc (reads AGENTS.md natively)", () => {
    expect(result.hasFile(".cursor/rules/project.mdc")).toBe(false);
  });

  it("generates AGENTS.md for Cursor to read natively", () => {
    expect(result.hasFile("AGENTS.md")).toBe(true);
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("test-app");
    expect(agents).not.toContain("{{projectName}}");
  });

  it("writes MCP servers to .cursor/mcp.json", () => {
    expect(result.hasFile(".cursor/mcp.json")).toBe(true);
    const mcp = result.readJson(".cursor/mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.context7).toBeDefined();
    expect(mcp.mcpServers.fetch).toBeDefined();
  });

  it("does not generate other agent files", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(false);
    expect(result.hasFile("GEMINI.md")).toBe(false);
    expect(result.hasFile(".mcp.json")).toBe(false);
  });

  it("includes cloud MCP servers when cloud is selected", () => {
    const withAws = generate(makeAnswers({ agents: ["cursor"], clouds: ["aws"] }));
    const mcp = withAws.readJson(".cursor/mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
  });
});
