import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (library)", () => {
  const answers = makeAnswers({ projectType: "library" });
  const result = generate(answers);

  it("includes library owned files", () => {
    expect(result.hasFile("LICENSE")).toBe(true);
    expect(result.hasFile("src/index.ts")).toBe(true);
    expect(result.hasFile("release-please-config.json")).toBe(true);
    expect(result.hasFile(".release-please-manifest.json")).toBe(true);
    expect(result.hasFile(".github/workflows/release.yaml")).toBe(true);
  });

  it("auto-resolves typescript via requires", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("library src/index.ts overrides the typescript stub", () => {
    const src = result.readText("src/index.ts");
    expect(src).toContain("Public API for test-app");
    expect(src).not.toContain("export function hello");
  });

  it("merges npm publish fields into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    expect(pkg.type).toBe("module");
    expect(pkg.main).toBe("./dist/index.mjs");
    expect(pkg.types).toBe("./dist/index.d.mts");
    expect(pkg.files).toEqual(["dist"]);
    expect(pkg.publishConfig).toEqual({ access: "public", provenance: true });
    expect(pkg.engines).toEqual({ node: ">=22" });
    expect(pkg.packageManager).toMatch(/^pnpm@10\./);
  });

  it("adds prepublishOnly and keeps the typescript build script", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.prepublishOnly).toBe("pnpm run build");
    expect(scripts.build).toBe("tsdown");
  });

  it("adds dist/ to .gitignore", () => {
    expect(result.readText(".gitignore")).toContain("dist/");
  });

  it("release-please-config has node release type and replaces projectName", () => {
    const config = result.readJson("release-please-config.json") as Record<string, unknown>;
    expect(config["release-type"]).toBe("node");
    const packages = config.packages as Record<string, Record<string, unknown>>;
    expect(packages["."]?.["package-name"]).toBe("test-app");
  });

  it("release manifest tracks the root package", () => {
    const manifest = result.readJson(".release-please-manifest.json") as Record<string, string>;
    expect(manifest["."]).toBe("0.0.0");
  });

  it("release workflow uses pinned action versions", () => {
    const wf = result.readText(".github/workflows/release.yaml");
    expect(wf).toContain("googleapis/release-please-action");
    expect(wf).toContain("actions/checkout@");
    expect(wf).toContain("jdx/mise-action@");
    expect(wf).not.toContain("{{actionsCheckout}}");
    expect(wf).not.toContain("{{actionsMise}}");
  });

  it("library is excluded from app-only generation", () => {
    const appResult = generate(makeAnswers({ languages: ["typescript"] }));
    expect(appResult.hasFile("LICENSE")).toBe(false);
    expect(appResult.hasFile("release-please-config.json")).toBe(false);
    expect(appResult.hasFile(".github/workflows/release.yaml")).toBe(false);
  });
});
