import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (terraform)", () => {
  const answers = makeAnswers({ languages: ["typescript"], clouds: ["aws"], iac: ["terraform"] });
  const result = generate(answers);

  it("includes Terraform owned files", () => {
    expect(result.hasFile(".tflint.hcl")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-terraform-aws.yaml")).toBe(true);
  });

  it("merges Terraform tools into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.terraform).toBe("1");
    expect(toml.tools.tflint).toBe("0.55");
    expect(toml.tools.awscli).toBe("2");
  });

  it("merges aws-iac MCP server into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
  });

  it("adds tflint CI step", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Terraform)");
  });

  it("adds Trivy IaC CI step", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Security (Trivy IaC: Terraform)");
  });

  it("merges ~/.aws mount into devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(true);
  });

  it("does not include CDK or CloudFormation files", () => {
    expect(result.hasFile("infra/cdk.json")).toBe(false);
    expect(result.hasFile("infra/template.yaml")).toBe(false);
  });

  it("expands CLAUDE.md with Terraform sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Terraform");
    expect(claude).toContain("tflint");
    expect(claude).not.toContain("<!-- SECTION:");
  });

  it("includes lint:tf in lint:all", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["lint:all"]).toContain("pnpm run lint:tf");
  });

  it("generates main.tf placeholder", () => {
    expect(result.hasFile("main.tf")).toBe(true);
  });

  it("adds Terraform entries to .gitignore", () => {
    const gitignore = result.readText(".gitignore");
    expect(gitignore).toContain(".terraform/");
    expect(gitignore).toContain("*.tfstate");
  });
});
