import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseToml } from "smol-toml";
import { parse as parseYaml } from "yaml";
import type { FileWriter, GenerateResult } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root directory of this package (one level up from dist/ or src/). */
export const PKG_ROOT = path.resolve(__dirname, "..");

/** Directory containing preset templates. */
export const TEMPLATES_DIR = path.join(PKG_ROOT, "templates");

/** Recursively read all files under templates/{presetName}/ into a Record<relativePath, content>. */
export function readTemplateFiles(presetName: string): Record<string, string> {
  const dir = path.join(TEMPLATES_DIR, presetName);
  const result: Record<string, string> = {};

  function walk(currentDir: string): void {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const relativePath = path.relative(dir, fullPath);
        result[relativePath] = fs.readFileSync(fullPath, "utf-8");
      }
    }
  }

  if (fs.existsSync(dir)) walk(dir);
  return result;
}

/** Create a FileWriter that writes to disk under the given output directory. */
export function createDiskWriter(outDir: string): FileWriter {
  return {
    write(filePath: string, content: string): void {
      const fullPath = path.join(outDir, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content);
    },
  };
}

/** Build a GenerateResult from a file map. */
export function buildResult(files: Map<string, string>): GenerateResult {
  return {
    files,
    fileList: () => [...files.keys()].sort(),
    hasFile: (p: string) => files.has(p),
    readText: (p: string) => {
      const content = files.get(p);
      if (content === undefined) throw new Error(`File not found: ${p}`);
      return content;
    },
    readJson: (p: string) => {
      const c = files.get(p);
      if (c === undefined) throw new Error(`File not found: ${p}`);
      return JSON.parse(c) as unknown;
    },
    readYaml: (p: string) => {
      const c = files.get(p);
      if (c === undefined) throw new Error(`File not found: ${p}`);
      return parseYaml(c) as unknown;
    },
    readToml: (p: string) => {
      const c = files.get(p);
      if (c === undefined) throw new Error(`File not found: ${p}`);
      return parseToml(c) as unknown;
    },
  };
}

/** Create a memory-based FileWriter for testing. Returns writer and a function to build GenerateResult. */
export function createMemoryWriter(): { writer: FileWriter; getResult: () => GenerateResult } {
  const files = new Map<string, string>();
  const writer: FileWriter = {
    write(filePath: string, content: string): void {
      files.set(filePath, content);
    },
  };

  return { writer, getResult: () => buildResult(files) };
}
