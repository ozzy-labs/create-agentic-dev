import { expect } from "vitest";
import type { generate } from "../src/generator.js";
import type { WizardAnswers } from "../src/types.js";

/** Create WizardAnswers with sensible defaults. */
export function makeAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    projectName: "test-app",
    frontend: "none",
    backend: "none",
    clouds: [],
    iac: [],
    languages: [],
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
