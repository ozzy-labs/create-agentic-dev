import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (cloudformation)", () => {
  const answers = makeAnswers({
    languages: ["typescript"],
    clouds: ["aws"],
    iac: ["cloudformation"],
  });
  const result = generate(answers);

  it("includes CloudFormation owned files", () => {
    expect(result.hasFile("infra/template.yaml")).toBe(true);
    expect(result.hasFile(".cfnlintrc.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-cloudformation.yaml")).toBe(true);
  });

  it("merges cfn-lint into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.awscli).toBe("2");
    expect(toml.tools["pipx:cfn-lint"]).toBe("1");
  });

  it("merges aws-iac MCP server into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
  });

  it("adds cfn-lint CI step", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (cfn-lint)");
  });

  it("adds Trivy IaC CI step", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Security (Trivy IaC)");
  });

  it("merges ~/.aws mount into devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(true);
  });

  it("does not include CDK or Terraform files", () => {
    expect(result.hasFile("infra/cdk.json")).toBe(false);
    expect(result.hasFile(".tflint.hcl")).toBe(false);
  });

  it("expands CLAUDE.md with CloudFormation sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("CloudFormation");
    expect(claude).not.toContain("<!-- SECTION:");
  });

  it("replaces {{projectName}} in CloudFormation template", () => {
    const template = result.readText("infra/template.yaml");
    expect(template).toContain("test-app");
    expect(template).not.toContain("{{projectName}}");
  });
});
