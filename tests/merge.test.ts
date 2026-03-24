import { describe, expect, it } from "vitest";
import {
  expandMarkdown,
  mergeDeep,
  mergeFile,
  mergeJson,
  mergeToml,
  mergeYaml,
} from "../src/merge.js";

describe("mergeDeep", () => {
  it("merges flat objects", () => {
    const result = mergeDeep({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("merges nested objects", () => {
    const result = mergeDeep({ a: { x: 1 } }, { a: { y: 2 } });
    expect(result).toEqual({ a: { x: 1, y: 2 } });
  });

  it("deduplicates arrays (unique union)", () => {
    const result = mergeDeep({ a: [1, 2] }, { a: [2, 3] });
    expect(result).toEqual({ a: [1, 2, 3] });
  });

  it("deduplicates arrays of objects", () => {
    const result = mergeDeep({ a: [{ x: 1 }] }, { a: [{ x: 1 }, { x: 2 }] });
    expect(result).toEqual({ a: [{ x: 1 }, { x: 2 }] });
  });

  it("merges three or more objects", () => {
    const result = mergeDeep({ a: 1 }, { b: 2 }, { c: 3 });
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("handles nested objects with arrays", () => {
    const result = mergeDeep(
      { scripts: { dev: "vite" }, deps: ["a"] },
      { scripts: { build: "tsc" }, deps: ["b", "a"] },
    );
    expect(result).toEqual({ scripts: { dev: "vite", build: "tsc" }, deps: ["a", "b"] });
  });
});

describe("mergeJson", () => {
  it("merges package.json-style objects", () => {
    const base = JSON.stringify({
      name: "my-app",
      scripts: { dev: "vite" },
      dependencies: {},
    });
    const patch = {
      scripts: { build: "tsc" },
      dependencies: { typescript: "^5.0.0" },
    };
    const result = JSON.parse(mergeJson(base, patch));
    expect(result.scripts).toEqual({ dev: "vite", build: "tsc" });
    expect(result.dependencies).toEqual({ typescript: "^5.0.0" });
    expect(result.name).toBe("my-app");
  });

  it("returns valid JSON with trailing newline", () => {
    const result = mergeJson("{}", { a: 1 });
    expect(result.endsWith("\n")).toBe(true);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});

describe("mergeYaml", () => {
  it("merges lefthook-style nested YAML", () => {
    const base = "pre-commit:\n  commands:\n    biome:\n      run: biome check\n";
    const patch = {
      "pre-commit": {
        commands: {
          ruff: { run: "ruff check ." },
        },
      },
    };
    const result = mergeYaml(base, patch);
    expect(result).toContain("biome:");
    expect(result).toContain("ruff:");
  });
});

describe("mergeToml", () => {
  it("merges mise-style TOML", () => {
    const base = '[tools]\nnode = "24"\npnpm = "10"\n';
    const patch = { tools: { python: "3.13" } };
    const result = mergeToml(base, patch);
    expect(result).toContain('node = "24"');
    expect(result).toContain('python = "3.13"');
  });
});

describe("expandMarkdown", () => {
  it("replaces a single placeholder", () => {
    const template = "# Title\n<!-- SECTION:TOOLS -->\nFooter";
    const result = expandMarkdown(template, [
      { placeholder: "<!-- SECTION:TOOLS -->", content: "- Node.js\n- pnpm" },
    ]);
    expect(result).toBe("# Title\n- Node.js\n- pnpm\nFooter");
  });

  it("replaces multiple placeholders", () => {
    const template = "<!-- A -->\n---\n<!-- B -->";
    const result = expandMarkdown(template, [
      { placeholder: "<!-- A -->", content: "Alpha" },
      { placeholder: "<!-- B -->", content: "Beta" },
    ]);
    expect(result).toBe("Alpha\n---\nBeta");
  });

  it("concatenates multiple injections into the same placeholder", () => {
    const template = "<!-- SECTION:TOOLS -->";
    const result = expandMarkdown(template, [
      { placeholder: "<!-- SECTION:TOOLS -->", content: "- TypeScript" },
      { placeholder: "<!-- SECTION:TOOLS -->", content: "- Python" },
    ]);
    expect(result).toBe("- TypeScript\n- Python");
  });

  it("deduplicates identical lines from multiple presets", () => {
    const template = "<!-- SECTION:DIRS -->";
    const result = expandMarkdown(template, [
      { placeholder: "<!-- SECTION:DIRS -->", content: "src/\ntests/" },
      { placeholder: "<!-- SECTION:DIRS -->", content: "tests/" },
    ]);
    expect(result).toBe("src/\ntests/");
  });

  it("joins with comma-space for inline placeholders", () => {
    const template = "pre-push: <!-- SECTION:HOOKS -->)";
    const result = expandMarkdown(template, [
      { placeholder: "<!-- SECTION:HOOKS -->", content: "typecheck" },
      { placeholder: "<!-- SECTION:HOOKS -->", content: "mypy" },
    ]);
    expect(result).toBe("pre-push: typecheck, mypy)");
  });

  it("filters out empty strings from contributions", () => {
    const template = "pre-push: <!-- SECTION:HOOKS -->)";
    const result = expandMarkdown(template, [
      { placeholder: "<!-- SECTION:HOOKS -->", content: "" },
      { placeholder: "<!-- SECTION:HOOKS -->", content: "typecheck" },
    ]);
    expect(result).toBe("pre-push: typecheck)");
  });

  it("leaves unmatched placeholders unchanged", () => {
    const template = "<!-- SECTION:UNKNOWN -->";
    const result = expandMarkdown(template, [
      { placeholder: "<!-- SECTION:OTHER -->", content: "stuff" },
    ]);
    expect(result).toBe("<!-- SECTION:UNKNOWN -->");
  });

  it("handles same placeholder in both inline and block contexts", () => {
    const template = "Tools: <!-- SECTION:TOOLS -->\n\n## Details\n<!-- SECTION:TOOLS -->\nEnd";
    const result = expandMarkdown(template, [
      { placeholder: "<!-- SECTION:TOOLS -->", content: "Node.js" },
      { placeholder: "<!-- SECTION:TOOLS -->", content: "pnpm" },
    ]);
    // First occurrence is inline → comma-separated
    expect(result).toContain("Tools: Node.js, pnpm");
    // Second occurrence is block → newline-separated
    expect(result).toContain("## Details\nNode.js\npnpm\nEnd");
  });
});

describe("mergeFile", () => {
  it("dispatches .json to mergeJson", () => {
    const result = mergeFile("package.json", '{"a":1}', [{ b: 2 }]);
    expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
  });

  it("dispatches .yaml to mergeYaml", () => {
    const result = mergeFile("ci.yaml", "a: 1\n", [{ b: 2 }]);
    expect(result).toContain("a: 1");
    expect(result).toContain("b: 2");
  });

  it("dispatches .toml to mergeToml", () => {
    const result = mergeFile(".mise.toml", 'a = "1"\n', [{ b: "2" }]);
    expect(result).toContain('a = "1"');
    expect(result).toContain('b = "2"');
  });

  it("returns base unchanged for unknown extensions", () => {
    const base = "some content";
    expect(mergeFile("file.txt", base, [{ x: 1 }])).toBe(base);
  });

  it("returns base when patches is empty", () => {
    const base = '{"a":1}';
    expect(mergeFile("file.json", base, [])).toBe(base);
  });
});
