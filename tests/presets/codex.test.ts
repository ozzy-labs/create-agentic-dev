import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (codex)", () => {
  const result = generate(makeAnswers({ agents: ["codex"] }));

  it("generates AGENTS.md instruction file", () => {
    expect(result.hasFile("AGENTS.md")).toBe(true);
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("test-app");
    expect(agents).not.toContain("{{projectName}}");
  });

  it("writes MCP servers to .codex/config.toml", () => {
    expect(result.hasFile(".codex/config.toml")).toBe(true);
    const toml = result.readText(".codex/config.toml");
    expect(toml).toContain("[mcp_servers.context7]");
    expect(toml).toContain("[mcp_servers.fetch]");
  });

  it("adds OPENAI_API_KEY to devcontainer remoteEnv", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const remoteEnv = dc.remoteEnv as Record<string, string>;
    expect(remoteEnv.OPENAI_API_KEY).toBeDefined();
  });

  it("expands AGENTS.md with agent-instructions sections", () => {
    const agents = result.readText("AGENTS.md");
    // No leftover placeholders
    expect(agents).not.toContain("<!-- SECTION:TECH_STACK -->");
    expect(agents).not.toContain("<!-- SECTION:PRE_PUSH_HOOKS -->");
  });

  it("does not generate Claude Code files", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(false);
    expect(result.hasFile(".claude/settings.json")).toBe(false);
    expect(result.hasFile(".mcp.json")).toBe(false);
  });

  it("includes cloud MCP servers when cloud is selected", () => {
    const withAws = generate(makeAnswers({ agents: ["codex"], clouds: ["aws"] }));
    const toml = withAws.readText(".codex/config.toml");
    expect(toml).toContain("[mcp_servers.context7]");
    expect(toml).toContain("[mcp_servers.aws-iac]");
  });
});
