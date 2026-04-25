import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ALL_PRESETS } from "./presets/index.js";
import type { Preset } from "./types.js";

/** Filename used for project-local external preset configuration. */
export const CONFIG_FILE = "agentic-app.config.json";

interface ConfigFileShape {
  /** External preset module specifiers (npm package name or relative path). */
  presets?: string[];
}

/** Read external preset specs from a project-local config file, if present. */
export function readConfigFile(cwd: string): string[] {
  const configPath = path.join(cwd, CONFIG_FILE);
  if (!fs.existsSync(configPath)) return [];

  let parsed: ConfigFileShape;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, "utf-8")) as ConfigFileShape;
  } catch (e) {
    throw new Error(
      `Failed to parse ${CONFIG_FILE}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!parsed.presets) return [];
  if (!Array.isArray(parsed.presets) || parsed.presets.some((s) => typeof s !== "string")) {
    throw new Error(`${CONFIG_FILE}: "presets" must be an array of strings`);
  }
  return parsed.presets;
}

/** Resolve a preset module specifier to an absolute file path, anchored at cwd. */
function resolveSpec(spec: string, cwd: string): string {
  // Anchor the resolver at <cwd>/package.json so bare specifiers look up cwd's node_modules
  // and relative paths resolve relative to cwd.
  const resolver = createRequire(path.join(cwd, "package.json"));
  return resolver.resolve(spec);
}

/** Type guard that the value is a structurally valid Preset. Throws on failure. */
function assertValidPreset(value: unknown, source: string): asserts value is Preset {
  if (!value || typeof value !== "object") {
    throw new Error(`External preset "${source}" did not export a valid Preset object`);
  }
  const v = value as Record<string, unknown>;
  if (typeof v.name !== "string" || v.name.length === 0) {
    throw new Error(`External preset "${source}": missing or invalid "name" field`);
  }
  if (!v.files || typeof v.files !== "object") {
    throw new Error(`External preset "${source}": missing or invalid "files" field`);
  }
  if (!v.merge || typeof v.merge !== "object") {
    throw new Error(`External preset "${source}": missing or invalid "merge" field`);
  }
  if (v.requires !== undefined) {
    if (!Array.isArray(v.requires) || v.requires.some((r) => typeof r !== "string")) {
      throw new Error(`External preset "${source}": "requires" must be string[]`);
    }
  }
}

/** Dynamically import an external preset module and validate its default export. */
async function loadOne(spec: string, cwd: string): Promise<Preset> {
  let resolved: string;
  try {
    resolved = resolveSpec(spec, cwd);
  } catch (e) {
    throw new Error(
      `Could not resolve external preset "${spec}": ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  const url = pathToFileURL(resolved).href;
  let mod: { default?: unknown };
  try {
    mod = (await import(url)) as { default?: unknown };
  } catch (e) {
    throw new Error(
      `Failed to import external preset "${spec}": ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // Accept either default export or the entire module's "preset" named export
  const exported = mod.default ?? (mod as Record<string, unknown>).preset;
  assertValidPreset(exported, spec);
  return exported;
}

/** Load and validate external presets, ensuring no name collisions with built-ins or each other. */
export async function loadExternalPresets(specs: string[], cwd: string): Promise<Preset[]> {
  const presets: Preset[] = [];
  const seen = new Set<string>();

  for (const spec of specs) {
    const preset = await loadOne(spec, cwd);
    if (preset.name in ALL_PRESETS) {
      throw new Error(
        `External preset "${spec}" uses reserved name "${preset.name}" (built-in preset). External presets cannot override built-ins.`,
      );
    }
    if (seen.has(preset.name)) {
      throw new Error(
        `External preset "${spec}" has duplicate name "${preset.name}" (already loaded by another spec)`,
      );
    }
    seen.add(preset.name);
    presets.push(preset);
  }

  return presets;
}
