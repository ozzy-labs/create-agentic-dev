import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (bicep)", () => {
  const answers = makeAnswers({ clouds: ["azure"], iac: ["bicep"] });
  const result = generate(answers);

  it("includes Bicep owned files", () => {
    expect(result.hasFile("infra/main.bicep")).toBe(true);
    expect(result.hasFile("bicepconfig.json")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-bicep.yaml")).toBe(true);
  });

  it("merges lint:bicep script into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["lint:bicep"]).toContain("az bicep build");
  });

  it("merges Bicep extension into VSCode extensions", () => {
    const ext = result.readJson(".vscode/extensions.json") as Record<string, string[]>;
    expect(ext.recommendations).toContain("ms-azuretools.vscode-bicep");
  });

  it("merges Bicep extension into devcontainer", () => {
    const dc = result.readJson(".devcontainer/devcontainer.json") as Record<string, unknown>;
    const customizations = dc.customizations as Record<string, Record<string, string[]>>;
    expect(customizations.vscode.extensions).toContain("ms-azuretools.vscode-bicep");
  });

  it("adds Bicep CI lint step", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Lint (Bicep)");
  });

  it("adds Trivy IaC CI step", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Security (Trivy IaC: Bicep)");
  });

  it("expands CLAUDE.md with Bicep sections", () => {
    const claude = result.readText("CLAUDE.md");
    expect(claude).toContain("Bicep");
    expect(claude).not.toContain("<!-- SECTION:");
  });

  it("expands README.md with Bicep sections", () => {
    const readme = result.readText("README.md");
    expect(readme).toContain("Bicep");
    expect(readme).toContain("bicepconfig.json");
    expect(readme).not.toContain("<!-- SECTION:");
  });
});
