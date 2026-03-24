/**
 * Build a tree-formatted string from a sorted list of file paths.
 *
 * Example output:
 *   ├── package.json
 *   ├── src/
 *   │   └── index.ts
 *   └── tests/
 *       └── index.test.ts
 */
export function buildFileTree(paths: string[]): string {
  interface TreeNode {
    children: Map<string, TreeNode>;
  }

  const root: TreeNode = { children: new Map() };

  for (const p of paths) {
    const parts = p.split("/");
    let current = root;
    for (const part of parts) {
      if (!current.children.has(part)) {
        current.children.set(part, { children: new Map() });
      }
      // biome-ignore lint/style/noNonNullAssertion: just set above
      current = current.children.get(part)!;
    }
  }

  const lines: string[] = [];

  function render(node: TreeNode, prefix: string): void {
    const entries = [...node.children.entries()];
    for (let i = 0; i < entries.length; i++) {
      const [name, child] = entries[i];
      const last = i === entries.length - 1;
      const connector = last ? "└── " : "├── ";
      const isDir = child.children.size > 0;
      lines.push(`${prefix}${connector}${name}${isDir ? "/" : ""}`);
      if (isDir) {
        render(child, prefix + (last ? "    " : "│   "));
      }
    }
  }

  render(root, "");
  return lines.join("\n");
}
