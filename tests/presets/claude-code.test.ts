import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (claude-code)", () => {
  const result = generate(makeAnswers({ agents: ["claude-code"] }));

  it("generates Claude Code owned files", () => {
    expect(result.hasFile("CLAUDE.md")).toBe(true);
    expect(result.hasFile(".claude/settings.json")).toBe(true);
    expect(result.hasFile(".claude/rules/git-workflow.md")).toBe(true);
    expect(result.hasFile(".claude/skills/setup/SKILL.md")).toBe(true);
    expect(result.hasFile(".claude/skills/implement/SKILL.md")).toBe(true);
    expect(result.hasFile(".claude/skills/lint/SKILL.md")).toBe(true);
    expect(result.hasFile(".claude/skills/lint-rules/SKILL.md")).toBe(true);
    expect(result.hasFile(".claude/skills/test/SKILL.md")).toBe(true);
    expect(result.hasFile(".claude/skills/commit/SKILL.md")).toBe(true);
    expect(result.hasFile(".claude/skills/commit-conventions/SKILL.md")).toBe(true);
    expect(result.hasFile(".claude/skills/pr/SKILL.md")).toBe(true);
    expect(result.hasFile(".claude/skills/review/SKILL.md")).toBe(true);
    expect(result.hasFile(".claude/skills/ship/SKILL.md")).toBe(true);
  });

  it("merges MCP servers into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.context7).toBeDefined();
    expect(mcp.mcpServers.fetch).toBeDefined();
  });

  it("adds Claude mounts to devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".claude.json"))).toBe(true);
    expect(mounts.some((m: string) => m.includes(".claude/.credentials.json"))).toBe(true);
    expect(mounts.some((m: string) => m.includes(".claude/projects"))).toBe(true);
    expect(mounts.some((m: string) => m.includes(".claude/settings.json"))).toBe(true);
  });

  it("adds .claude/settings.local.json to .gitignore", () => {
    const gitignore = result.readText(".gitignore");
    expect(gitignore).toContain(".claude/settings.local.json");
  });

  it("CLAUDE.md is slim (no project name, only @AGENTS.md reference)", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("@AGENTS.md");
    expect(claude).not.toContain("{{projectName}}");
  });

  it("does not generate Claude Code files when agent not selected", () => {
    const noAgent = generate(makeAnswers({ agents: [] }));
    expect(noAgent.hasFile("CLAUDE.md")).toBe(false);
    expect(noAgent.hasFile(".claude/settings.json")).toBe(false);
    expect(noAgent.hasFile(".mcp.json")).toBe(false);
  });
});
