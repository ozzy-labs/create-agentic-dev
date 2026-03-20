import { deepmergeCustom } from "deepmerge-ts";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { MarkdownSection } from "./types.js";

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
    result = result.replaceAll(placeholder, contents.join("\n"));
  }
  return result;
}

/** Dispatch to the correct merge function based on file extension. */
export function mergeFile(filePath: string, base: string, patches: unknown[]): string {
  if (patches.length === 0) return base;
  if (filePath.endsWith(".json")) return mergeJson(base, ...patches);
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return mergeYaml(base, ...patches);
  if (filePath.endsWith(".toml")) return mergeToml(base, ...patches);
  return base;
}
