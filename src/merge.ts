import { deepmergeCustom } from "deepmerge-ts";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { MarkdownSection, McpServerConfig } from "./types.js";

/**
 * Deep merge with unique-union arrays.
 * JSON primitives are compared via JSON.stringify for dedup.
 */
export const mergeDeep = deepmergeCustom({
  mergeArrays: (values) => {
    const flat = values.flat();
    const seen = new Set<string>();
    const result: unknown[] = [];
    for (const item of flat) {
      const key = JSON.stringify(item);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  },
});

/** Merge partial objects into a JSON string. */
export function mergeJson(base: string, ...patches: unknown[]): string {
  const baseObj = JSON.parse(base) as Record<string, unknown>;
  const merged = mergeDeep(baseObj, ...patches);
  return `${JSON.stringify(merged, null, 2)}\n`;
}

/** Merge partial objects into a YAML string. */
export function mergeYaml(base: string, ...patches: unknown[]): string {
  const baseObj = parseYaml(base) as Record<string, unknown>;
  const merged = mergeDeep(baseObj, ...patches);
  return stringifyYaml(merged, { lineWidth: 120 });
}

/** Merge partial objects into a TOML string. */
export function mergeToml(base: string, ...patches: unknown[]): string {
  const baseObj = base.trim() ? (parseToml(base) as Record<string, unknown>) : {};
  const merged = mergeDeep(baseObj, ...patches);
  const result = stringifyToml(merged as Record<string, unknown>);
  return result.endsWith("\n") ? result : `${result}\n`;
}

/** Replace placeholders in a Markdown template with injected sections. */
export function expandMarkdown(template: string, sections: MarkdownSection[]): string {
  let result = template;
  // Group sections by placeholder (multiple presets may inject into the same one)
  const grouped = new Map<string, string[]>();
  for (const { placeholder, content } of sections) {
    const list = grouped.get(placeholder) ?? [];
    list.push(content);
    grouped.set(placeholder, list);
  }
  for (const [placeholder, contents] of grouped) {
    // Deduplicate identical lines and filter empty strings
    const allLines = contents.flatMap((c) => c.split("\n"));
    const unique = [...new Set(allLines)].filter((l) => l !== "");

    // Replace each occurrence individually, detecting context per-occurrence
    let searchFrom = 0;
    while (true) {
      const idx = result.indexOf(placeholder, searchFrom);
      if (idx === -1) break;

      // Detect inline placeholder (preceded by non-whitespace on same line) → join with ", "
      let separator = "\n";
      let needsLeadingSep = false;
      if (idx > 0) {
        const lineStart = result.lastIndexOf("\n", idx - 1) + 1;
        const prefix = result.slice(lineStart, idx);
        if (prefix.trim().length > 0) {
          separator = ", ";
          const charBefore = result[idx - 1];
          if (unique.length > 0 && !/[\s,:]/.test(charBefore)) {
            needsLeadingSep = true;
          }
        }
      }

      const joined = unique.join(separator);
      const replacement = needsLeadingSep ? `${separator}${joined}` : joined;
      result = result.slice(0, idx) + replacement + result.slice(idx + placeholder.length);
      searchFrom = idx + replacement.length;
    }
  }
  return result;
}

/** Append unique lines/blocks to a text file (e.g. .gitignore). */
export function mergeText(base: string, ...patches: unknown[]): string {
  let result = base.endsWith("\n") ? base : `${base}\n`;
  for (const patch of patches) {
    const block = String(patch);
    if (block && !result.includes(block)) {
      result += `\n${block}\n`;
    }
  }
  return result;
}

/** Format MCP server configs as a JSON string (.mcp.json format). */
export function formatMcpJson(servers: Record<string, McpServerConfig>): string {
  return `${JSON.stringify({ mcpServers: servers }, null, 2)}\n`;
}

/** Format MCP server configs as a TOML string (Codex config.toml format). */
export function formatMcpToml(servers: Record<string, McpServerConfig>): string {
  const tables: Record<string, Record<string, unknown>> = {};
  for (const [name, config] of Object.entries(servers)) {
    const entry: Record<string, unknown> = {
      command: config.command,
      args: config.args,
    };
    if (config.env && Object.keys(config.env).length > 0) {
      entry.env = config.env;
    }
    tables[name] = entry;
  }
  const result = stringifyToml({ mcp_servers: tables });
  return result.endsWith("\n") ? result : `${result}\n`;
}

/** Files that support text-append merging (block-level dedup). */
const TEXT_MERGE_FILES = new Set([".gitignore"]);

/** Dispatch to the correct merge function based on file extension. */
export function mergeFile(filePath: string, base: string, patches: unknown[]): string {
  if (patches.length === 0) return base;
  if (filePath.endsWith(".json")) return mergeJson(base, ...patches);
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return mergeYaml(base, ...patches);
  if (filePath.endsWith(".toml")) return mergeToml(base, ...patches);
  const basename = filePath.split("/").pop() ?? filePath;
  if (TEXT_MERGE_FILES.has(basename)) return mergeText(base, ...patches);
  return base;
}
