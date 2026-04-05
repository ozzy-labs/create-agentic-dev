import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildResult,
  createDiskWriter,
  createMemoryWriter,
  readTemplateFiles,
} from "../src/utils.js";

describe("createDiskWriter", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes a file to disk and creates parent directories", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cad-test-"));
    const writer = createDiskWriter(tmpDir);

    writer.write("sub/dir/hello.txt", "world");

    const written = fs.readFileSync(path.join(tmpDir, "sub/dir/hello.txt"), "utf-8");
    expect(written).toBe("world");
  });
});

describe("readTemplateFiles", () => {
  it("returns empty object for non-existent preset", () => {
    const result = readTemplateFiles("non-existent-preset-xyz");
    expect(result).toEqual({});
  });
});

describe("createMemoryWriter", () => {
  it("stores files in memory and builds a GenerateResult", () => {
    const { writer, getResult } = createMemoryWriter();

    writer.write("a.txt", "hello");
    writer.write("b.json", '{"key":"value"}');

    const result = getResult();
    expect(result.hasFile("a.txt")).toBe(true);
    expect(result.readText("a.txt")).toBe("hello");
    expect(result.readJson("b.json")).toEqual({ key: "value" });
    expect(result.fileList()).toEqual(["a.txt", "b.json"]);
  });
});

describe("buildResult parse error messages", () => {
  it("readJson throws with file path on invalid JSON", () => {
    const files = new Map([["config.json", "not valid json"]]);
    const result = buildResult(files);
    expect(() => result.readJson("config.json")).toThrow(/Invalid JSON in config\.json/);
  });

  it("readYaml throws with file path on invalid YAML", () => {
    const files = new Map([["config.yaml", ":\n  :\n    - :\n  :\n:"]]);
    const result = buildResult(files);
    expect(() => result.readYaml("config.yaml")).toThrow(/Invalid YAML in config\.yaml/);
  });

  it("readToml throws with file path on invalid TOML", () => {
    const files = new Map([["config.toml", "[invalid\nkey = "]]);
    const result = buildResult(files);
    expect(() => result.readToml("config.toml")).toThrow(/Invalid TOML in config\.toml/);
  });

  it("readJson still throws file-not-found for missing files", () => {
    const result = buildResult(new Map());
    expect(() => result.readJson("missing.json")).toThrow("File not found: missing.json");
  });
});
