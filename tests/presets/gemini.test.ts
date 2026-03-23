import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (gemini)", () => {
  const result = generate(makeAnswers({ agents: ["gemini"] }));

  it("generates GEMINI.md instruction file", () => {
    expect(result.hasFile("GEMINI.md")).toBe(true);
    const gemini = result.readText("GEMINI.md");
    expect(gemini).toContain("test-app");
    expect(gemini).not.toContain("{{projectName}}");
  });

  it("writes MCP servers to .gemini/settings.json", () => {
    expect(result.hasFile(".gemini/settings.json")).toBe(true);
    const settings = result.readJson(".gemini/settings.json") as Record<
      string,
      Record<string, unknown>
    >;
    expect(settings.mcpServers.context7).toBeDefined();
    expect(settings.mcpServers.fetch).toBeDefined();
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

  it("expands GEMINI.md with agent-instructions sections", () => {
    const gemini = result.readText("GEMINI.md");
    expect(gemini).not.toContain("<!-- SECTION:TECH_STACK -->");
    expect(gemini).not.toContain("<!-- SECTION:PRE_PUSH_HOOKS -->");
  });

  it("does not generate Claude Code or Codex files", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(false);
    expect(result.hasFile("AGENTS.md")).toBe(false);
    expect(result.hasFile(".mcp.json")).toBe(false);
    expect(result.hasFile(".codex/config.toml")).toBe(false);
  });
});
