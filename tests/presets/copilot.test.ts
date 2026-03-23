import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (copilot)", () => {
  const result = generate(makeAnswers({ agents: ["copilot"] }));

  it("generates .github/copilot-instructions.md", () => {
    expect(result.hasFile(".github/copilot-instructions.md")).toBe(true);
    const instructions = result.readText(".github/copilot-instructions.md");
    expect(instructions).toContain("test-app");
    expect(instructions).not.toContain("{{projectName}}");
  });

  it("writes MCP servers to .copilot/mcp-config.json", () => {
    expect(result.hasFile(".copilot/mcp-config.json")).toBe(true);
    const mcp = result.readJson(".copilot/mcp-config.json") as Record<
      string,
      Record<string, unknown>
    >;
    expect(mcp.mcpServers.context7).toBeDefined();
    expect(mcp.mcpServers.fetch).toBeDefined();
  });

  it("expands instruction file with agent-instructions sections", () => {
    const instructions = result.readText(".github/copilot-instructions.md");
    expect(instructions).not.toContain("<!-- SECTION:TECH_STACK -->");
    expect(instructions).not.toContain("<!-- SECTION:PRE_PUSH_HOOKS -->");
  });

  it("does not generate other agent files", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(false);
    expect(result.hasFile("AGENTS.md")).toBe(false);
    expect(result.hasFile("GEMINI.md")).toBe(false);
    expect(result.hasFile(".mcp.json")).toBe(false);
  });
});
