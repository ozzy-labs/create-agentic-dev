import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (aws)", () => {
  const answers = makeAnswers({ clouds: ["aws"] });
  const result = generate(answers);

  it("merges AWS CLI into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.awscli).toBe("2");
  });

  it("merges aws-iac MCP server into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
  });

  it("mounts ~/.aws in devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(true);
  });

  it("does not include IaC files without iac selection", () => {
    expect(result.hasFile(".tflint.hcl")).toBe(false);
    expect(result.hasFile("infra/template.yaml")).toBe(false);
    expect(result.hasFile("infra/bin/app.ts")).toBe(false);
  });

  it("expands AGENTS.md with AWS MCP section", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("AWS IaC");
    expect(agents).not.toContain("<!-- SECTION:");
  });
});
