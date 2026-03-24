import { describe, expect, it } from "vitest";
import { buildResult } from "../src/utils.js";

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
