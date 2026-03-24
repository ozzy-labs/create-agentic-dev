import { describe, expect, it } from "vitest";
import { generate, resolvePresets, validateAnswers } from "../src/generator.js";
import type { WizardAnswers } from "../src/types.js";
import { makeAnswers } from "./helpers.js";

describe("resolvePresets", () => {
  it("always includes base", () => {
    const result = resolvePresets(makeAnswers());
    expect(result).toContain("base");
  });

  it("includes selected languages", () => {
    const result = resolvePresets(makeAnswers({ languages: ["typescript", "python"] }));
    expect(result).toEqual(["base", "typescript", "python", "claude-code"]);
  });

  it("forces typescript when react is selected", () => {
    const result = resolvePresets(makeAnswers({ frontend: "react" }));
    expect(result).toContain("typescript");
    expect(result).toContain("react");
  });

  it("forces typescript when nextjs is selected", () => {
    const result = resolvePresets(makeAnswers({ frontend: "nextjs" }));
    expect(result).toContain("typescript");
    expect(result).toContain("nextjs");
  });

  it("forces typescript when cdk is selected", () => {
    const result = resolvePresets(makeAnswers({ clouds: ["aws"], iac: ["cdk"] }));
    expect(result).toContain("typescript");
    expect(result).toContain("cdk");
  });

  it("includes gcp when selected", () => {
    const result = resolvePresets(makeAnswers({ clouds: ["gcp"] }));
    expect(result).toContain("gcp");
  });

  it("maintains canonical order", () => {
    const result = resolvePresets(
      makeAnswers({
        languages: ["python", "typescript"],
        frontend: "react",
        clouds: ["aws"],
        iac: ["cdk"],
      }),
    );
    expect(result).toEqual(["base", "typescript", "python", "react", "aws", "cdk", "claude-code"]);
  });

  it("maintains canonical order with gcp", () => {
    const result = resolvePresets(
      makeAnswers({
        languages: ["typescript"],
        clouds: ["aws", "azure", "gcp"],
        iac: ["terraform"],
      }),
    );
    expect(result).toEqual([
      "base",
      "typescript",
      "aws",
      "azure",
      "gcp",
      "terraform",
      "claude-code",
    ]);
  });

  it("deduplicates typescript when forced by multiple selections", () => {
    const result = resolvePresets(
      makeAnswers({ languages: ["typescript"], frontend: "react", clouds: ["aws"], iac: ["cdk"] }),
    );
    const tsCount = result.filter((p) => p === "typescript").length;
    expect(tsCount).toBe(1);
  });

  it("forces typescript when vue is selected", () => {
    const result = resolvePresets(makeAnswers({ frontend: "vue" }));
    expect(result).toContain("typescript");
    expect(result).toContain("vue");
  });

  it("forces typescript when nuxt is selected", () => {
    const result = resolvePresets(makeAnswers({ frontend: "nuxt" }));
    expect(result).toContain("typescript");
    expect(result).toContain("nuxt");
  });

  it("includes fastapi and forces python", () => {
    const result = resolvePresets(makeAnswers({ backend: "fastapi" }));
    expect(result).toEqual(["base", "python", "fastapi", "claude-code"]);
  });

  it("includes express and forces typescript", () => {
    const result = resolvePresets(makeAnswers({ backend: "express" }));
    expect(result).toEqual(["base", "typescript", "express", "claude-code"]);
  });

  it("includes batch and forces typescript", () => {
    const result = resolvePresets(makeAnswers({ backend: "batch" }));
    expect(result).toEqual(["base", "typescript", "batch", "claude-code"]);
  });

  it("includes both frontend and backend presets", () => {
    const result = resolvePresets(makeAnswers({ frontend: "react", backend: "fastapi" }));
    expect(result).toEqual(["base", "typescript", "python", "react", "fastapi", "claude-code"]);
  });

  it("deduplicates typescript when express and react are both selected", () => {
    const result = resolvePresets(makeAnswers({ frontend: "react", backend: "express" }));
    expect(result).toContain("typescript");
    expect(result).toContain("react");
    expect(result).toContain("express");
    const tsCount = result.filter((p) => p === "typescript").length;
    expect(tsCount).toBe(1);
  });

  it("includes both typescript and python when react + fastapi", () => {
    const result = resolvePresets(makeAnswers({ frontend: "react", backend: "fastapi" }));
    expect(result).toEqual(["base", "typescript", "python", "react", "fastapi", "claude-code"]);
  });

  it("includes both typescript and python when nextjs + fastapi", () => {
    const result = resolvePresets(makeAnswers({ frontend: "nextjs", backend: "fastapi" }));
    expect(result).toEqual(["base", "typescript", "python", "nextjs", "fastapi", "claude-code"]);
  });

  it("does not force languages for cloud-only selections", () => {
    const result = resolvePresets(makeAnswers({ clouds: ["aws", "azure", "gcp"] }));
    expect(result).toEqual(["base", "aws", "azure", "gcp", "claude-code"]);
  });
});

// --- validateAnswers ---

describe("validateAnswers", () => {
  it("returns no warnings for valid combinations", () => {
    expect(validateAnswers(makeAnswers({ clouds: ["aws"], iac: ["cdk"] }))).toEqual([]);
    expect(validateAnswers(makeAnswers({ clouds: ["aws"], iac: ["cloudformation"] }))).toEqual([]);
    expect(validateAnswers(makeAnswers({ clouds: ["azure"], iac: ["bicep"] }))).toEqual([]);
    expect(validateAnswers(makeAnswers({ clouds: ["aws"], iac: ["terraform"] }))).toEqual([]);
    expect(validateAnswers(makeAnswers())).toEqual([]);
  });

  it("warns when CDK is selected without AWS", () => {
    const warnings = validateAnswers(makeAnswers({ clouds: ["azure"], iac: ["cdk"] }));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("CDK");
    expect(warnings[0]).toContain("aws");
  });

  it("warns when CloudFormation is selected without AWS", () => {
    const warnings = validateAnswers(makeAnswers({ clouds: ["gcp"], iac: ["cloudformation"] }));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("CloudFormation");
    expect(warnings[0]).toContain("aws");
  });

  it("warns when Bicep is selected without Azure", () => {
    const warnings = validateAnswers(makeAnswers({ clouds: ["aws"], iac: ["bicep"] }));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Bicep");
    expect(warnings[0]).toContain("azure");
  });

  it("returns multiple warnings for multiple mismatches", () => {
    const warnings = validateAnswers(makeAnswers({ clouds: [], iac: ["cdk", "bicep"] }));
    expect(warnings).toHaveLength(2);
  });

  it("no warning for Terraform (multi-cloud)", () => {
    expect(validateAnswers(makeAnswers({ clouds: ["gcp"], iac: ["terraform"] }))).toEqual([]);
  });
});

// --- File list snapshots for all patterns ---

describe("file list snapshots", () => {
  const patterns: Array<{ name: string; answers: Partial<WizardAnswers> }> = [
    { name: "base only", answers: {} },
    { name: "typescript", answers: { languages: ["typescript"] } },
    { name: "python", answers: { languages: ["python"] } },
    { name: "typescript + python", answers: { languages: ["typescript", "python"] } },
    { name: "react", answers: { frontend: "react" } },
    { name: "nextjs", answers: { frontend: "nextjs" } },
    { name: "cdk", answers: { clouds: ["aws"], iac: ["cdk"] } },
    {
      name: "cloudformation (ts)",
      answers: { languages: ["typescript"], clouds: ["aws"], iac: ["cloudformation"] },
    },
    {
      name: "terraform (ts)",
      answers: { languages: ["typescript"], clouds: ["aws"], iac: ["terraform"] },
    },
    {
      name: "full config",
      answers: {
        languages: ["typescript", "python"],
        frontend: "react",
        clouds: ["aws"],
        iac: ["cdk"],
      },
    },
    {
      name: "python + terraform",
      answers: { languages: ["python"], clouds: ["aws"], iac: ["terraform"] },
    },
    {
      name: "python + cloudformation",
      answers: { languages: ["python"], clouds: ["aws"], iac: ["cloudformation"] },
    },
    {
      name: "vue",
      answers: { frontend: "vue" },
    },
    {
      name: "nuxt",
      answers: { frontend: "nuxt" },
    },
    {
      name: "fastapi",
      answers: { backend: "fastapi" },
    },
    {
      name: "express",
      answers: { backend: "express" },
    },
    {
      name: "batch",
      answers: { backend: "batch" },
    },
    {
      name: "react + fastapi",
      answers: { frontend: "react", backend: "fastapi" },
    },
    {
      name: "react + express",
      answers: { frontend: "react", backend: "express" },
    },
    {
      name: "react + batch",
      answers: { frontend: "react", backend: "batch" },
    },
    {
      name: "nextjs + fastapi",
      answers: { frontend: "nextjs", backend: "fastapi" },
    },
    {
      name: "nextjs + express",
      answers: { frontend: "nextjs", backend: "express" },
    },
    {
      name: "vue + fastapi",
      answers: { frontend: "vue", backend: "fastapi" },
    },
    {
      name: "nuxt + batch",
      answers: { frontend: "nuxt", backend: "batch" },
    },
    {
      name: "express + cdk",
      answers: { backend: "express", clouds: ["aws"], iac: ["cdk"] },
    },
    {
      name: "fastapi + cdk",
      answers: { backend: "fastapi", clouds: ["aws"], iac: ["cdk"] },
    },
    {
      name: "azure + bicep",
      answers: { languages: ["typescript"], clouds: ["azure"], iac: ["bicep"] },
    },
    {
      name: "gcp + terraform",
      answers: { languages: ["typescript"], clouds: ["gcp"], iac: ["terraform"] },
    },
  ];

  for (const { name, answers } of patterns) {
    it(`${name}`, () => {
      const result = generate(makeAnswers(answers));
      expect(result.fileList()).toMatchSnapshot();
    });
  }
});
