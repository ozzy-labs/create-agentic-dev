import { describe, expect, it } from "vitest";
import { generate, resolvePresets } from "../src/generator.js";
import type { WizardAnswers } from "../src/types.js";
import { makeAnswers } from "./helpers.js";

describe("resolvePresets", () => {
  it("always includes base", () => {
    const result = resolvePresets(makeAnswers());
    expect(result).toContain("base");
  });

  it("includes selected languages", () => {
    const result = resolvePresets(makeAnswers({ languages: ["typescript", "python"] }));
    expect(result).toEqual(["base", "typescript", "python"]);
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
    expect(result).toEqual(["base", "typescript", "python", "react", "aws", "cdk"]);
  });

  it("maintains canonical order with gcp", () => {
    const result = resolvePresets(
      makeAnswers({
        languages: ["typescript"],
        clouds: ["aws", "azure", "gcp"],
        iac: ["terraform"],
      }),
    );
    expect(result).toEqual(["base", "typescript", "aws", "azure", "gcp", "terraform"]);
  });

  it("deduplicates typescript when forced by multiple selections", () => {
    const result = resolvePresets(
      makeAnswers({ languages: ["typescript"], frontend: "react", clouds: ["aws"], iac: ["cdk"] }),
    );
    const tsCount = result.filter((p) => p === "typescript").length;
    expect(tsCount).toBe(1);
  });

  it("includes fastapi and forces python", () => {
    const result = resolvePresets(makeAnswers({ backend: "fastapi" }));
    expect(result).toEqual(["base", "python", "fastapi"]);
  });

  it("includes express and forces typescript", () => {
    const result = resolvePresets(makeAnswers({ backend: "express" }));
    expect(result).toEqual(["base", "typescript", "express"]);
  });

  it("includes both frontend and backend presets", () => {
    const result = resolvePresets(makeAnswers({ frontend: "react", backend: "fastapi" }));
    expect(result).toEqual(["base", "typescript", "python", "react", "fastapi"]);
  });

  it("deduplicates typescript when express and react are both selected", () => {
    const result = resolvePresets(makeAnswers({ frontend: "react", backend: "express" }));
    expect(result).toContain("typescript");
    expect(result).toContain("react");
    expect(result).toContain("express");
    const tsCount = result.filter((p) => p === "typescript").length;
    expect(tsCount).toBe(1);
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
      name: "fastapi",
      answers: { backend: "fastapi" },
    },
    {
      name: "express",
      answers: { backend: "express" },
    },
    {
      name: "react + fastapi",
      answers: { frontend: "react", backend: "fastapi" },
    },
    {
      name: "react + express",
      answers: { frontend: "react", backend: "express" },
    },
  ];

  for (const { name, answers } of patterns) {
    it(`${name}`, () => {
      const result = generate(makeAnswers(answers));
      expect(result.fileList()).toMatchSnapshot();
    });
  }
});
