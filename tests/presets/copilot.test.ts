import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (copilot)", () => {
  const result = generate(makeAnswers({ agents: ["copilot"] }));

  it("does not generate .github/copilot-instructions.md (reads AGENTS.md natively)", () => {
    expect(result.hasFile(".github/copilot-instructions.md")).toBe(false);
  });

  it("generates AGENTS.md for Copilot to read natively", () => {
    expect(result.hasFile("AGENTS.md")).toBe(true);
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("test-app");
    expect(agents).not.toContain("{{projectName}}");
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

  it("does not generate other agent files", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(false);
    expect(result.hasFile("GEMINI.md")).toBe(false);
    expect(result.hasFile(".mcp.json")).toBe(false);
  });
});
