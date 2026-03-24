import { describe, expect, it } from "vitest";
import { buildFileTree } from "../src/tree.js";

describe("buildFileTree", () => {
  it("renders a flat list of files", () => {
    const tree = buildFileTree(["a.txt", "b.txt"]);
    expect(tree).toBe("├── a.txt\n└── b.txt");
  });

  it("renders nested directories", () => {
    const tree = buildFileTree(["src/index.ts", "src/utils.ts", "package.json"]);
    expect(tree).toContain("src/");
    expect(tree).toContain("index.ts");
    expect(tree).toContain("utils.ts");
    expect(tree).toContain("package.json");
  });

  it("renders deeply nested paths", () => {
    const tree = buildFileTree([".claude/rules/git-workflow.md", ".claude/skills/lint/SKILL.md"]);
    expect(tree).toContain(".claude/");
    expect(tree).toContain("rules/");
    expect(tree).toContain("skills/");
    expect(tree).toContain("git-workflow.md");
    expect(tree).toContain("SKILL.md");
  });

  it("handles single file", () => {
    const tree = buildFileTree(["README.md"]);
    expect(tree).toBe("└── README.md");
  });

  it("handles empty list", () => {
    const tree = buildFileTree([]);
    expect(tree).toBe("");
  });

  it("uses tree connectors correctly", () => {
    const tree = buildFileTree(["a.txt", "b.txt", "c.txt"]);
    const lines = tree.split("\n");
    expect(lines[0]).toMatch(/^├── a\.txt$/);
    expect(lines[1]).toMatch(/^├── b\.txt$/);
    expect(lines[2]).toMatch(/^└── c\.txt$/);
  });

  it("marks directories with trailing /", () => {
    const tree = buildFileTree(["src/index.ts"]);
    expect(tree).toContain("src/");
  });

  it("renders a realistic project structure", () => {
    const files = [
      ".gitignore",
      "package.json",
      "src/index.ts",
      "src/utils.ts",
      "tests/index.test.ts",
      "web/package.json",
      "web/src/App.tsx",
    ];
    const tree = buildFileTree(files);
    expect(tree).toContain("src/");
    expect(tree).toContain("tests/");
    expect(tree).toContain("web/");
    // All files should be present
    for (const f of files) {
      const name = f.split("/").pop() ?? "";
      expect(tree).toContain(name);
    }
  });
});
