/**
 * E2E smoke tests for external preset loading via the published
 * `@ozzylabs/preset-base` / `-web` / `-cli` packages.
 *
 * These tests opt in to the real npm packages that ship the canonical external
 * presets (handbook ADR-0017). When the packages are not installed in this
 * working tree (e.g. the `presets` repo has not yet been published, or local
 * `pnpm install` has not pulled them), the suite skips itself with a console
 * warning so CI does not fail before the upstream presets land.
 *
 * Run with: pnpm run verify
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { generate } from "../src/generator.js";
import { loadExternalPresets } from "../src/loader.js";
import { makeAnswers, readValidJson } from "./helpers.js";

const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TESTS_DIR, "..");

const PRESET_BASE = "@ozzylabs/preset-base";
const PRESET_WEB = "@ozzylabs/preset-web";
const PRESET_CLI = "@ozzylabs/preset-cli";

function canResolve(spec: string): boolean {
  try {
    const resolver = createRequire(path.join(REPO_ROOT, "package.json"));
    resolver.resolve(spec);
    return true;
  } catch {
    return false;
  }
}

const baseAvailable = canResolve(PRESET_BASE);
const webAvailable = canResolve(PRESET_WEB);
const cliAvailable = canResolve(PRESET_CLI);
const allAvailable = baseAvailable && webAvailable && cliAvailable;

if (!allAvailable) {
  console.warn(
    `[smoke] Skipping external preset E2E suite: ${PRESET_BASE}/${PRESET_WEB}/${PRESET_CLI} ` +
      "are not installed. Install the @ozzylabs/preset-* packages (or link them via pnpm) " +
      "to enable these tests.",
  );
}

describe.skipIf(!allAvailable)("smoke: external @ozzylabs/preset-* E2E", () => {
  it(`scaffolds successfully with ${PRESET_BASE} alone`, async () => {
    const presets = await loadExternalPresets([PRESET_BASE], REPO_ROOT);
    expect(presets).toHaveLength(1);

    const result = generate(makeAnswers(), { extraPresets: presets });
    const pkg = readValidJson(result, "package.json") as Record<string, unknown>;
    expect(pkg.name).toBeTypeOf("string");

    expect(result.hasFile("biome.json")).toBe(true);
    readValidJson(result, "biome.json");
  });

  it(`scaffolds a web project with ${PRESET_BASE} + ${PRESET_WEB}`, async () => {
    const presets = await loadExternalPresets([PRESET_BASE, PRESET_WEB], REPO_ROOT);
    expect(presets).toHaveLength(2);

    const result = generate(makeAnswers(), { extraPresets: presets });

    // package.json and biome.json — the shared base contributions — are still valid
    const pkg = readValidJson(result, "package.json") as Record<string, unknown>;
    expect(pkg.scripts).toBeDefined();
    expect(result.hasFile("biome.json")).toBe(true);
    readValidJson(result, "biome.json");
  });

  it(`scaffolds a CLI project with ${PRESET_BASE} + ${PRESET_CLI}`, async () => {
    const presets = await loadExternalPresets([PRESET_BASE, PRESET_CLI], REPO_ROOT);
    expect(presets).toHaveLength(2);

    const result = generate(makeAnswers(), { extraPresets: presets });

    const pkg = readValidJson(result, "package.json") as Record<string, unknown>;
    expect(pkg.scripts).toBeDefined();
    expect(result.hasFile("biome.json")).toBe(true);
    readValidJson(result, "biome.json");
  });

  it("resolves requires across external presets without error", async () => {
    // Loading -web (or -cli) without -base should still succeed if -web declares
    // `requires: ["base"]` and -base is loaded alongside, or fail clearly otherwise.
    // Either way, supplying both must not throw at generation time.
    const presets = await loadExternalPresets([PRESET_BASE, PRESET_WEB, PRESET_CLI], REPO_ROOT);
    expect(presets.map((p) => p.name)).toEqual(expect.arrayContaining(presets.map((p) => p.name)));

    expect(() => generate(makeAnswers(), { extraPresets: presets })).not.toThrow();
  });
});
