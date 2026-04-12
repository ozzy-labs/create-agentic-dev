import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (gcp)", () => {
  const answers = makeAnswers({ clouds: ["gcp"] });
  const result = generate(answers);

  it("merges gcloud into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.gcloud).toBe("2");
  });

  it("merges google-cloud MCP server into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["google-cloud"]).toBeDefined();
  });

  it("mounts ~/.config/gcloud in devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".config/gcloud"))).toBe(true);
  });

  it("does not include AWS or Azure mounts", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(false);
    expect(mounts.some((m: string) => m.includes(".azure"))).toBe(false);
  });

  it("expands AGENTS.md with Google Cloud MCP section", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("Google Cloud");
    expect(agents).not.toContain("<!-- SECTION:");
  });
});
