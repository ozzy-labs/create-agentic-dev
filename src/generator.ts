import { parse as parseToml } from "smol-toml";
import { parse as parseYaml } from "yaml";
import { buildCiWorkflow } from "./ci.js";
import { expandMarkdown, mergeFile } from "./merge.js";
import { basePreset } from "./presets/base.js";
import { pythonPreset } from "./presets/python.js";
import { reactPreset } from "./presets/react.js";
import { typescriptPreset } from "./presets/typescript.js";
import { expandSetupScript } from "./setup.js";
import type {
  FileWriter,
  GenerateResult,
  MarkdownSection,
  Preset,
  WizardAnswers,
} from "./types.js";

const ALL_PRESETS: Record<string, Preset> = {
  base: basePreset,
  typescript: typescriptPreset,
  python: pythonPreset,
  react: reactPreset,
};

/** Canonical application order for presets. */
const PRESET_ORDER = [
  "base",
  "typescript",
  "python",
  "react",
  "cdk",
  "cloudformation",
  "terraform",
];

/** Resolve which presets to apply based on wizard answers, including dependency chains. */
export function resolvePresets(answers: WizardAnswers): string[] {
  const selected = new Set<string>(["base"]);

  for (const lang of answers.languages) {
    selected.add(lang);
  }

  if (answers.frontend === "react") {
    selected.add("react");
    selected.add("typescript"); // React forces TypeScript
  }

  if (answers.iac === "cdk") {
    selected.add("cdk");
    selected.add("typescript"); // CDK forces TypeScript
  } else if (answers.iac !== "none") {
    selected.add(answers.iac);
  }

  // Resolve `requires` chains
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of [...selected]) {
      const preset = ALL_PRESETS[name];
      if (preset?.requires) {
        for (const req of preset.requires) {
          if (!selected.has(req)) {
            selected.add(req);
            changed = true;
          }
        }
      }
    }
  }

  // Sort by canonical order
  return PRESET_ORDER.filter((p) => selected.has(p));
}

/** Template variable replacement in file contents. */
function replaceVariables(content: string, vars: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

export interface GenerateOptions {
  writer?: FileWriter;
}

/** Main composition engine: resolve presets, merge files, write output. */
export function generate(answers: WizardAnswers, options: GenerateOptions = {}): GenerateResult {
  const presetNames = resolvePresets(answers);
  const presets = presetNames.map((name) => {
    const preset = ALL_PRESETS[name];
    if (!preset) throw new Error(`Unknown preset: ${name}`);
    return preset;
  });

  const vars: Record<string, string> = {
    projectName: answers.projectName,
  };

  // 1. Collect all owned files
  const allFiles = new Map<string, string>();
  for (const preset of presets) {
    for (const [filePath, content] of Object.entries(preset.files)) {
      allFiles.set(filePath, replaceVariables(content, vars));
    }
  }

  // 2. Merge shared files (JSON/YAML/TOML)
  const mergeContributions = new Map<string, unknown[]>();
  for (const preset of presets) {
    for (const [filePath, patch] of Object.entries(preset.merge)) {
      const patches = mergeContributions.get(filePath) ?? [];
      patches.push(patch);
      mergeContributions.set(filePath, patches);
    }
  }

  for (const [filePath, patches] of mergeContributions) {
    const defaultBase = filePath.endsWith(".toml") ? "" : "{}";
    const base = allFiles.get(filePath) ?? defaultBase;
    const merged = mergeFile(filePath, base, patches);
    allFiles.set(filePath, replaceVariables(merged, vars));
  }

  // 2.5. Build lint:all script dynamically from merged package.json
  const pkgContent = allFiles.get("package.json");
  if (pkgContent) {
    const pkg = JSON.parse(pkgContent) as Record<string, Record<string, string>>;
    const scripts = pkg.scripts ?? {};
    const lintParts: string[] = [];
    // Biome lint (if present)
    if (scripts.lint) lintParts.push("pnpm run lint");
    // TypeScript typecheck (if present)
    if (scripts.typecheck) lintParts.push("pnpm run typecheck");
    // All lint:* scripts in sorted order (except lint:all and lint:fix)
    for (const key of Object.keys(scripts).sort()) {
      if (key.startsWith("lint:") && key !== "lint:all" && key !== "lint:fix") {
        lintParts.push(`pnpm run ${key}`);
      }
    }
    if (lintParts.length > 0) {
      scripts["lint:all"] = lintParts.join(" && ");
      pkg.scripts = scripts;
      allFiles.set("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
    }
  }

  // 3. Expand Markdown templates
  const markdownSections = new Map<string, MarkdownSection[]>();
  for (const preset of presets) {
    if (!preset.markdown) continue;
    for (const [filePath, sections] of Object.entries(preset.markdown)) {
      const existing = markdownSections.get(filePath) ?? [];
      existing.push(...sections);
      markdownSections.set(filePath, existing);
    }
  }

  for (const [filePath, sections] of markdownSections) {
    const template = allFiles.get(filePath);
    if (template) {
      let expanded = replaceVariables(expandMarkdown(template, sections), vars);
      // Remove any remaining unused placeholders
      expanded = expanded.replaceAll(/<!-- SECTION:\w+ -->\n?/g, "");
      allFiles.set(filePath, expanded);
    }
  }

  // 4. Build CI workflow
  const ciContributions = presets
    .map((p) => p.ciSteps)
    .filter((s): s is NonNullable<typeof s> => s != null);
  if (ciContributions.length > 0) {
    const hasTest = presets.some((p) => p.ciSteps?.testSteps?.length);
    const hasBuild = presets.some((p) => p.ciSteps?.buildSteps?.length);
    const ciYaml = buildCiWorkflow({ contributions: ciContributions, hasTest, hasBuild });
    allFiles.set(".github/workflows/ci.yaml", ciYaml);
  }

  // 5. Expand setup.sh template with preset-specific extra commands
  const setupTemplate = allFiles.get("scripts/setup.sh");
  if (setupTemplate) {
    allFiles.set("scripts/setup.sh", expandSetupScript(setupTemplate, presets));
  }

  // 6. Write files & return result
  if (options.writer) {
    for (const [filePath, content] of allFiles) {
      options.writer.write(filePath, content);
    }
  }

  return buildResult(allFiles);
}

function buildResult(files: Map<string, string>): GenerateResult {
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
