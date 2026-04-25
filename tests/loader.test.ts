import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generate } from "../src/generator.js";
import { CONFIG_FILE, loadExternalPresets, readConfigFile } from "../src/loader.js";
import { makeAnswers } from "./helpers.js";

const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TESTS_DIR, "..");
const EXAMPLE_DIR = path.join(REPO_ROOT, "examples/preset-example");

describe("loader: loadExternalPresets", () => {
  it("loads a preset from a relative path and validates its shape", async () => {
    const presets = await loadExternalPresets([EXAMPLE_DIR], REPO_ROOT);
    expect(presets).toHaveLength(1);
    expect(presets[0]?.name).toBe("example");
    expect(presets[0]?.files).toBeDefined();
    expect(presets[0]?.merge).toBeDefined();
  });

  it("returns an empty array when no specs are provided", async () => {
    const presets = await loadExternalPresets([], REPO_ROOT);
    expect(presets).toEqual([]);
  });

  it("rejects a preset whose name collides with a built-in", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "loader-collision-"));
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "tmp", type: "module", main: "./index.mjs" }),
    );
    fs.writeFileSync(
      path.join(dir, "index.mjs"),
      'export default { name: "react", files: {}, merge: {} };\n',
    );
    await expect(loadExternalPresets([dir], REPO_ROOT)).rejects.toThrow(/reserved name "react"/);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("rejects two external presets sharing the same name", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "loader-dup-"));
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "tmp", type: "module", main: "./index.mjs" }),
    );
    fs.writeFileSync(
      path.join(dir, "index.mjs"),
      'export default { name: "dup", files: {}, merge: {} };\n',
    );
    await expect(loadExternalPresets([dir, dir], REPO_ROOT)).rejects.toThrow(
      /duplicate name "dup"/,
    );
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("rejects a module that does not export a Preset object", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "loader-invalid-"));
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "tmp", type: "module", main: "./index.mjs" }),
    );
    fs.writeFileSync(path.join(dir, "index.mjs"), "export default 42;\n");
    await expect(loadExternalPresets([dir], REPO_ROOT)).rejects.toThrow(/valid Preset object/);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("rejects a preset missing the required name field", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "loader-noname-"));
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "tmp", type: "module", main: "./index.mjs" }),
    );
    fs.writeFileSync(path.join(dir, "index.mjs"), "export default { files: {}, merge: {} };\n");
    await expect(loadExternalPresets([dir], REPO_ROOT)).rejects.toThrow(
      /missing or invalid "name"/,
    );
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("surfaces a clear error when a spec cannot be resolved", async () => {
    await expect(loadExternalPresets(["./nonexistent-preset-xyz"], REPO_ROOT)).rejects.toThrow(
      /Could not resolve external preset/,
    );
  });
});

describe("loader: readConfigFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "loader-config-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns an empty array when no config file is present", () => {
    expect(readConfigFile(tmpDir)).toEqual([]);
  });

  it("reads the presets array from the config file", () => {
    fs.writeFileSync(
      path.join(tmpDir, CONFIG_FILE),
      JSON.stringify({ presets: ["@scope/preset-foo", "./local"] }),
    );
    expect(readConfigFile(tmpDir)).toEqual(["@scope/preset-foo", "./local"]);
  });

  it("returns an empty array when presets field is absent", () => {
    fs.writeFileSync(path.join(tmpDir, CONFIG_FILE), "{}");
    expect(readConfigFile(tmpDir)).toEqual([]);
  });

  it("throws on malformed JSON", () => {
    fs.writeFileSync(path.join(tmpDir, CONFIG_FILE), "{not json");
    expect(() => readConfigFile(tmpDir)).toThrow(/Failed to parse/);
  });

  it("throws when presets is not a string array", () => {
    fs.writeFileSync(path.join(tmpDir, CONFIG_FILE), JSON.stringify({ presets: [1, 2, 3] }));
    expect(() => readConfigFile(tmpDir)).toThrow(/array of strings/);
  });
});

describe("generator: external presets integration", () => {
  it("applies merge contributions from an external preset", async () => {
    const [example] = await loadExternalPresets([EXAMPLE_DIR], REPO_ROOT);
    if (!example) throw new Error("expected example preset to load");

    const result = generate(makeAnswers({ languages: ["typescript"] }), {
      extraPresets: [example],
    });

    const pkg = result.readJson("package.json") as { scripts: Record<string, string> };
    expect(pkg.scripts["example:hello"]).toBe("echo Hello from @ozzylabs/preset-example");

    expect(result.hasFile("EXAMPLE.md")).toBe(true);
    expect(result.readText("EXAMPLE.md")).toContain("Example external preset");
  });

  it("includes external preset markdown sections in README", async () => {
    const [example] = await loadExternalPresets([EXAMPLE_DIR], REPO_ROOT);
    if (!example) throw new Error("expected example preset to load");

    const result = generate(makeAnswers(), { extraPresets: [example] });
    const readme = result.readText("README.md");
    expect(readme).toContain("EXAMPLE.md");
    expect(readme).toContain("@ozzylabs/preset-example reference file");
  });

  it("rejects an external preset whose requires references an unknown name", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "loader-unknown-req-"));
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "tmp", type: "module", main: "./index.mjs" }),
    );
    fs.writeFileSync(
      path.join(dir, "index.mjs"),
      'export default { name: "needs-ghost", requires: ["ghost"], files: {}, merge: {} };\n',
    );
    const [preset] = await loadExternalPresets([dir], REPO_ROOT);
    if (!preset) throw new Error("expected preset to load");
    expect(() => generate(makeAnswers(), { extraPresets: [preset] })).toThrow(
      /unknown preset "ghost"/,
    );
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
