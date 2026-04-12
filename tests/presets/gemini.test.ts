import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (gemini)", () => {
  const result = generate(makeAnswers({ agents: ["gemini"] }));

  it("does not generate GEMINI.md (reads AGENTS.md natively)", () => {
    expect(result.hasFile("GEMINI.md")).toBe(false);
  });

  it("generates AGENTS.md for Gemini to read natively", () => {
    expect(result.hasFile("AGENTS.md")).toBe(true);
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("test-app");
    expect(agents).not.toContain("{{projectName}}");
  });

  it("writes MCP servers and context config to .gemini/settings.json", () => {
    expect(result.hasFile(".gemini/settings.json")).toBe(true);
    const settings = result.readJson(".gemini/settings.json") as Record<
      string,
      Record<string, unknown>
    >;
    expect(settings.mcpServers.context7).toBeDefined();
    expect(settings.mcpServers.fetch).toBeDefined();
    const context = settings.context as Record<string, string>;
    expect(context.fileName).toBe("AGENTS.md");
  });

  it("adds GEMINI_API_KEY to devcontainer remoteEnv", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const remoteEnv = dc.remoteEnv as Record<string, string>;
    expect(remoteEnv.GEMINI_API_KEY).toBeDefined();
  });

  it("adds .gemini/.env to .gitignore", () => {
    const gitignore = result.readText(".gitignore");
    expect(gitignore).toContain(".gemini/.env");
  });

  it("does not generate Claude Code or Codex files", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(false);
    expect(result.hasFile(".mcp.json")).toBe(false);
    expect(result.hasFile(".codex/config.toml")).toBe(false);
  });
});
