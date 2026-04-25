/**
 * Reference external preset for create-agentic-app.
 *
 * Demonstrates the minimum shape required by the loader: name + files + merge.
 * In a real package, import the Preset type for editor support:
 *
 *   import type { Preset } from "@ozzylabs/create-agentic-app";
 *
 * and use the bundled `readTemplateFiles` helper anchored at the package root:
 *
 *   import { readTemplateFiles } from "@ozzylabs/create-agentic-app";
 *   import { fileURLToPath } from "node:url";
 *   import path from "node:path";
 *
 *   const rootDir = path.dirname(fileURLToPath(import.meta.url));
 *   const files = readTemplateFiles({ rootDir, subPath: "templates" });
 *
 * This example uses the same pattern with vanilla Node imports.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function readDir(dir) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(out, readDir(full));
    } else {
      out[path.relative(dir, full)] = fs.readFileSync(full, "utf-8");
    }
  }
  return out;
}

const preset = {
  name: "example",
  files: readDir(path.join(rootDir, "templates")),
  merge: {
    "package.json": {
      scripts: {
        "example:hello": "echo Hello from @ozzylabs/preset-example",
      },
    },
  },
  markdown: {
    "README.md": [
      {
        placeholder: "<!-- SECTION:ROOT_FILES -->",
        content: "├── EXAMPLE.md           # @ozzylabs/preset-example reference file",
      },
    ],
  },
};

export default preset;
