import { expect } from "vitest";
import type { generate } from "../src/generator.js";
import type { GenerateResult, WizardAnswers } from "../src/types.js";

/** Create WizardAnswers with sensible defaults. */
export function makeAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    projectName: "test-app",
    projectType: "app",
    frontend: "none",
    backend: "none",
    clouds: [],
    iac: [],
    languages: [],
    testing: [],
    agents: ["claude-code"],
    ...overrides,
  };
}

/** Parse and validate a JSON file from generate result. */
export function readValidJson(
  result: ReturnType<typeof generate>,
  path: string,
): Record<string, unknown> {
  const text = result.readText(path);
  expect(() => JSON.parse(text), `${path} should be valid JSON`).not.toThrow();
  return JSON.parse(text) as Record<string, unknown>;
}

/** Assert that all JSON files in the result are parseable. */
export function expectAllJsonValid(result: GenerateResult): void {
  for (const file of result.fileList()) {
    if (file.endsWith(".json")) {
      expect(() => result.readJson(file), `${file} should be valid JSON`).not.toThrow();
    }
  }
}

/** Assert that all YAML files in the result are parseable. */
export function expectAllYamlValid(result: GenerateResult): void {
  for (const file of result.fileList()) {
    if (file.endsWith(".yaml")) {
      expect(() => result.readYaml(file), `${file} should be valid YAML`).not.toThrow();
    }
  }
}

/** Assert that all TOML files in the result are parseable. */
export function expectAllTomlValid(result: GenerateResult): void {
  for (const file of result.fileList()) {
    if (file.endsWith(".toml")) {
      expect(() => result.readToml(file), `${file} should be valid TOML`).not.toThrow();
    }
  }
}

/** Assert that no markdown/mdc files contain leftover section placeholders. */
export function expectNoLeftoverPlaceholders(result: GenerateResult): void {
  for (const file of result.fileList()) {
    if (file.endsWith(".md") || file.endsWith(".mdc")) {
      const content = result.readText(file);
      expect(content, `${file} should not have leftover placeholders`).not.toContain(
        "<!-- SECTION:",
      );
    }
  }
}

/** Assert that no files contain unreplaced {{projectName}} (except pnpm-lock.yaml). */
export function expectNoUnreplacedVars(result: GenerateResult): void {
  for (const file of result.fileList()) {
    if (file === "pnpm-lock.yaml") continue;
    const content = result.readText(file);
    expect(content, `${file} should not contain {{projectName}}`).not.toContain("{{projectName}}");
  }
}
