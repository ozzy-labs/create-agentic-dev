import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (cdk)", () => {
  const answers = makeAnswers({ clouds: ["aws"], iac: ["cdk"] });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes CDK owned files", () => {
    expect(result.hasFile("infra/bin/app.ts")).toBe(true);
    expect(result.hasFile("infra/lib/app-stack.ts")).toBe(true);
    expect(result.hasFile("infra/test/app.test.ts")).toBe(true);
    expect(result.hasFile("infra/cdk.json")).toBe(true);
    expect(result.hasFile("infra/tsconfig.json")).toBe(true);
    expect(result.hasFile("infra/package.json")).toBe(true);
    expect(result.hasFile(".cfnlintrc.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-cdk.yaml")).toBe(true);
  });

  it("merges CDK tools into .mise.toml", () => {
    const toml = result.readToml(".mise.toml") as Record<string, Record<string, string>>;
    expect(toml.tools.awscli).toBe("2");
    expect(toml.tools["npm:aws-cdk"]).toBe("2");
    expect(toml.tools["pipx:cfn-lint"]).toBe("1");
  });

  it("merges CDK scripts into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["cdk:synth"]).toContain("cdk synth");
    expect(scripts["cdk:deploy"]).toContain("cdk deploy");
    expect(scripts["test:infra"]).toContain("pnpm test");
    expect(scripts["lint:cfn"]).toBe("cfn-lint");
  });

  it("merges aws-iac MCP server into .mcp.json", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers["aws-iac"]).toBeDefined();
    expect(mcp.mcpServers.context7).toBeDefined();
  });

  it("adds Trivy IaC CI step", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Security (Trivy IaC)");
  });

  it("adds CDK CI steps with correct order (synth before cfn-lint)", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Install infra dependencies");
    expect(stepNames).toContain("CDK synth");
    expect(stepNames).toContain("Lint (cfn-lint)");
    expect(stepNames).toContain("Test (infra CDK)");
    const synthIdx = stepNames.indexOf("CDK synth");
    const cfnLintIdx = stepNames.indexOf("Lint (cfn-lint)");
    expect(synthIdx).toBeLessThan(cfnLintIdx);
    expect(stepNames).toContain("Lint (Biome)");
  });

  it("adds infra install to setup.sh", () => {
    const setup = result.readText("scripts/setup.sh");
    expect(setup).toContain("cd infra && pnpm install");
  });

  it("replaces {{projectName}} in CDK templates", () => {
    const infraPkg = result.readText("infra/package.json");
    expect(infraPkg).toContain("test-app-infra");
    expect(infraPkg).not.toContain("{{projectName}}");
  });

  it("infra/package.json does not include source-map-support", () => {
    const infraPkg = result.readJson("infra/package.json") as Record<string, unknown>;
    const deps = infraPkg.dependencies as Record<string, string>;
    expect(deps["source-map-support"]).toBeUndefined();
  });

  it("infra/package.json vitest matches root version", () => {
    const infraPkg = result.readJson("infra/package.json") as Record<string, unknown>;
    const devDeps = infraPkg.devDependencies as Record<string, string>;
    expect(devDeps.vitest).toBe("^4.0.0");
  });

  it("infra/bin/app.ts includes cdk-nag AwsSolutionsChecks", () => {
    const appTs = result.readText("infra/bin/app.ts");
    expect(appTs).toContain('import { AwsSolutionsChecks } from "cdk-nag"');
    expect(appTs).toContain("AwsSolutionsChecks");
    expect(appTs).toContain("Aspects.of(app).add");
  });

  it("infra/package.json includes cdk-nag dependency", () => {
    const infraPkg = result.readJson("infra/package.json") as Record<string, unknown>;
    const deps = infraPkg.dependencies as Record<string, string>;
    expect(deps["cdk-nag"]).toBeDefined();
  });

  it("infra/bin/app.ts does not import source-map-support", () => {
    const appTs = result.readText("infra/bin/app.ts");
    expect(appTs).not.toContain("source-map-support");
  });

  it("merges CDK settings into VSCode settings", () => {
    const settings = result.readJson(".vscode/settings.json") as Record<string, unknown>;
    const searchExclude = settings["search.exclude"] as Record<string, boolean>;
    expect(searchExclude["**/cdk.out"]).toBe(true);
    expect(searchExclude["**/dist"]).toBe(true);
  });

  it("merges AWS Toolkit into VSCode extensions", () => {
    const ext = result.readJson(".vscode/extensions.json") as Record<string, string[]>;
    expect(ext.recommendations).toContain("amazonwebservices.aws-toolkit-vscode");
    expect(ext.recommendations).toContain("biomejs.biome");
  });

  it("merges AWS Toolkit and ~/.aws mount into devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const customizations = dc.customizations as Record<string, Record<string, string[]>>;
    expect(customizations.vscode.extensions).toContain("amazonwebservices.aws-toolkit-vscode");
    const mounts = dc.mounts as string[];
    expect(mounts.some((m: string) => m.includes(".aws"))).toBe(true);
  });

  it("expands CLAUDE.md with CDK sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("CDK");
    expect(claude).toContain("cfn-lint");
    expect(claude).not.toContain("<!-- SECTION:");
  });
});
