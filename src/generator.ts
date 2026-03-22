import { buildCiWorkflow } from "./ci.js";
import { expandMarkdown, formatMcpJson, mergeFile } from "./merge.js";
import { awsPreset } from "./presets/aws.js";
import { azurePreset } from "./presets/azure.js";
import { basePreset } from "./presets/base.js";
import { bicepPreset } from "./presets/bicep.js";
import { cdkPreset } from "./presets/cdk.js";
import { cloudformationPreset } from "./presets/cloudformation.js";
import { expressPreset } from "./presets/express.js";
import { fastapiPreset } from "./presets/fastapi.js";
import { gcpPreset } from "./presets/gcp.js";
import { nextjsPreset } from "./presets/nextjs.js";
import { pythonPreset } from "./presets/python.js";
import { reactPreset } from "./presets/react.js";
import { terraformPreset } from "./presets/terraform.js";
import { typescriptPreset } from "./presets/typescript.js";
import { expandSetupScript } from "./setup.js";
import type {
  FileWriter,
  GenerateResult,
  MarkdownSection,
  McpServerConfig,
  Preset,
  WizardAnswers,
} from "./types.js";
import { buildResult } from "./utils.js";

const ALL_PRESETS: Record<string, Preset> = {
  base: basePreset,
  typescript: typescriptPreset,
  python: pythonPreset,
  react: reactPreset,
  nextjs: nextjsPreset,
  fastapi: fastapiPreset,
  express: expressPreset,
  aws: awsPreset,
  azure: azurePreset,
  gcp: gcpPreset,
  cdk: cdkPreset,
  cloudformation: cloudformationPreset,
  terraform: terraformPreset,
  bicep: bicepPreset,
};

/**
 * Collapse multiple IaC infra placeholder contributions into a single entry.
 * e.g. ["CDK (bin/, lib/, test/)", "CloudFormation"] → "infra/ -> Infrastructure (CDK (bin/, lib/, test/), CloudFormation)"
 */
function collapseInfraPlaceholders(
  sections: MarkdownSection[],
  placeholder: string,
  formatter: (names: string) => string,
): void {
  const infraSections = sections.filter((s) => s.placeholder === placeholder);
  if (infraSections.length === 0) return;

  // Remove all matching entries
  const remaining = sections.filter((s) => s.placeholder !== placeholder);

  // Combine into single entry
  const names = [...new Set(infraSections.map((s) => s.content))].join(", ");
  remaining.push({ placeholder, content: formatter(names) });

  // Replace sections array contents
  sections.length = 0;
  sections.push(...remaining);
}

/** Canonical application order for presets. */
const PRESET_ORDER = [
  "base",
  "typescript",
  "python",
  "react",
  "nextjs",
  "fastapi",
  "express",
  "aws",
  "azure",
  "gcp",
  "cdk",
  "cloudformation",
  "terraform",
  "bicep",
];

/** Resolve which presets to apply based on wizard answers, including dependency chains. */
export function resolvePresets(answers: WizardAnswers): string[] {
  const selected = new Set<string>(["base"]);

  for (const lang of answers.languages) {
    selected.add(lang);
  }

  if (answers.frontend !== "none") {
    selected.add(answers.frontend);
    // TypeScript forcing is handled by each preset's `requires` chain
  }

  if (answers.backend !== "none") {
    selected.add(answers.backend);
    // Language forcing is handled by each preset's `requires` chain
  }

  for (const cloud of answers.clouds) {
    selected.add(cloud);
  }

  for (const iac of answers.iac) {
    selected.add(iac);
    if (iac === "cdk") {
      selected.add("typescript"); // CDK forces TypeScript
    }
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

  // 1.5. Remove language sample files when frontend provides web/ workspace
  if (answers.frontend !== "none") {
    allFiles.delete("src/index.ts");
    allFiles.delete("tests/index.test.ts");
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

  // 2.5. Post-merge cleanup & lint:all generation for package.json
  const pkgContent = allFiles.get("package.json");
  if (pkgContent) {
    const pkg = JSON.parse(pkgContent) as Record<string, Record<string, string>>;
    const scripts = pkg.scripts ?? {};

    // Remove devDependencies not referenced by any script (e.g. tsdown when React overrides build)
    const conditionalDeps = presets.flatMap((p) => p.conditionalDevDeps ?? []);
    const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;
    const scriptValues = Object.values(scripts).join(" ");
    for (const dep of conditionalDeps) {
      if (dep in devDeps && !scriptValues.includes(dep)) {
        delete devDeps[dep];
      }
    }

    // Build lint:all dynamically
    const lintParts: string[] = [];
    // Biome lint (if present)
    if (scripts.lint) lintParts.push("pnpm run lint");
    // TypeScript typecheck (if present)
    if (scripts.typecheck) lintParts.push("pnpm run typecheck");
    // Additional typecheck:* scripts (e.g. typecheck:infra for CDK)
    for (const key of Object.keys(scripts).sort()) {
      if (key.startsWith("typecheck:")) {
        lintParts.push(`pnpm run ${key}`);
      }
    }
    // All lint:* scripts in sorted order (except lint:all, lint:fix, lint:secrets)
    for (const key of Object.keys(scripts).sort()) {
      if (
        key.startsWith("lint:") &&
        key !== "lint:all" &&
        key !== "lint:fix" &&
        key !== "lint:secrets"
      ) {
        lintParts.push(`pnpm run ${key}`);
      }
    }
    // lint:secrets last (gitleaks can be slow)
    if (scripts["lint:secrets"]) lintParts.push("pnpm run lint:secrets");
    if (lintParts.length > 0) {
      scripts["lint:all"] = lintParts.join(" && ");
    }

    // Build test:all dynamically
    const testParts: string[] = [];
    if (scripts.test) testParts.push("pnpm test");
    for (const key of Object.keys(scripts).sort()) {
      if (key.startsWith("test:") && key !== "test:all" && key !== "test:watch") {
        testParts.push(`pnpm run ${key}`);
      }
    }
    if (testParts.length > 1) {
      scripts["test:all"] = testParts.join(" && ");
    }

    pkg.scripts = scripts;
    allFiles.set("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
  }

  // 2.7. Collect MCP servers from all presets and write .mcp.json
  const allMcpServers: Record<string, McpServerConfig> = {};
  for (const preset of presets) {
    if (preset.mcpServers) {
      Object.assign(allMcpServers, preset.mcpServers);
    }
  }
  if (Object.keys(allMcpServers).length > 0) {
    allFiles.set(".mcp.json", formatMcpJson(allMcpServers));
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

  // Pre-process: collapse INFRA_STRUCTURE / INFRA_DIR_STRUCTURE into single lines
  for (const [, sections] of markdownSections) {
    collapseInfraPlaceholders(sections, "<!-- SECTION:INFRA_STRUCTURE -->", (names) => {
      return `infra/        -> Infrastructure (${names})`;
    });
    collapseInfraPlaceholders(sections, "<!-- SECTION:INFRA_DIR_STRUCTURE -->", (names) => {
      return `├── infra/               # インフラストラクチャ (${names})`;
    });

    // Collapse CD_SECTION: wrap table rows with section header
    const cdSections = sections.filter((s) => s.placeholder === "<!-- SECTION:CD_SECTION -->");
    if (cdSections.length > 0) {
      const remaining = sections.filter((s) => s.placeholder !== "<!-- SECTION:CD_SECTION -->");
      const rows = [...new Set(cdSections.map((s) => s.content))].join("\n");
      remaining.push({
        placeholder: "<!-- SECTION:CD_SECTION -->",
        content: `## デプロイ設定（CD）\n\nCD ワークフローを利用するには、GitHub リポジトリの **Settings → Secrets and variables → Actions → Variables** で以下を設定してください:\n\n| 変数名 | 説明 |\n|--------|------|\n${rows}`,
      });
      sections.length = 0;
      sections.push(...remaining);
    }
  }

  for (const [filePath, sections] of markdownSections) {
    const template = allFiles.get(filePath);
    if (template) {
      const expanded = replaceVariables(expandMarkdown(template, sections), vars);
      allFiles.set(filePath, expanded);
    }
  }

  // Remove any remaining unused placeholders from all Markdown files
  // and clean up list items that became content-empty after removal
  for (const [filePath, content] of allFiles) {
    if (filePath.endsWith(".md") && content.includes("<!-- SECTION:")) {
      const cleaned = content
        .replaceAll(/<!-- SECTION:\w+ -->\n?/g, "")
        .replaceAll(/^(?:\d+\.|-)\s+\*\*[^*]+\*\*:\s*\n(?=\n|#|$)/gm, "");
      allFiles.set(filePath, cleaned);
    }
  }

  // 3.5. Generate .tflint.hcl based on cloud providers (if terraform is selected)
  if (presetNames.includes("terraform")) {
    const plugins: string[] = [];
    if (answers.clouds.includes("aws")) {
      plugins.push(`plugin "aws" {
  enabled = true
  version = "0.38.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}`);
    }
    if (answers.clouds.includes("azure")) {
      plugins.push(`plugin "azurerm" {
  enabled = true
  version = "0.27.0"
  source  = "github.com/terraform-linters/tflint-ruleset-azurerm"
}`);
    }
    if (answers.clouds.includes("gcp")) {
      plugins.push(`plugin "google" {
  enabled = true
  version = "0.38.0"
  source  = "github.com/terraform-linters/tflint-ruleset-google"
}`);
    }
    if (plugins.length > 0) {
      const header =
        "# NOTE: Plugin versions are not managed by Renovate.\n# Update version numbers manually, then run `tflint --init` to download them.\n";
      allFiles.set(".tflint.hcl", `${header}\n${plugins.join("\n\n")}\n`);
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

  // 6. Generate pnpm-workspace.yaml for workspace packages
  const workspacePackages: string[] = [];
  if (answers.frontend !== "none") workspacePackages.push("web");
  if (answers.backend === "express") workspacePackages.push("api");
  // FastAPI uses Python/uv, not pnpm workspace
  if (workspacePackages.length > 0) {
    const yamlLines = ["packages:"];
    for (const pkg of workspacePackages) {
      yamlLines.push(`  - ${pkg}`);
    }
    allFiles.set("pnpm-workspace.yaml", `${yamlLines.join("\n")}\n`);
  }

  // 7. Write files & return result
  if (options.writer) {
    for (const [filePath, content] of allFiles) {
      options.writer.write(filePath, content);
    }
  }

  return buildResult(allFiles);
}
