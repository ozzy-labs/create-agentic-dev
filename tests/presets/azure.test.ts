import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (azure)", () => {
  const answers = makeAnswers({ clouds: ["azure"] });
  const result = generate(answers);

  it("merges Azure CLI into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools["pipx:azure-cli"]).toBe("2");
  });

  it("merges azure MCP server into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.azure).toBeDefined();
  });

  it("mounts ~/.azure in devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".azure"))).toBe(true);
  });

  it("does not include AWS or GCP mounts", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(false);
    expect(mounts.some((m: string) => m.includes(".config/gcloud"))).toBe(false);
  });

  it("expands CLAUDE.md with Azure MCP section", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Azure");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});
