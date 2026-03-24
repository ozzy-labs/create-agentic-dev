import { buildCiWorkflow } from "./ci.js";
import { expandMarkdown, formatMcpJson, formatMcpToml, mergeFile } from "./merge.js";
import { amazonQPreset } from "./presets/amazon-q.js";
import { awsPreset } from "./presets/aws.js";
import { azurePreset } from "./presets/azure.js";
import { basePreset } from "./presets/base.js";
import { bicepPreset } from "./presets/bicep.js";
import { cdkPreset } from "./presets/cdk.js";
import { claudeCodePreset } from "./presets/claude-code.js";
import { clinePreset } from "./presets/cline.js";
import { cloudformationPreset } from "./presets/cloudformation.js";
import { codexPreset } from "./presets/codex.js";
import { copilotPreset } from "./presets/copilot.js";
import { cursorPreset } from "./presets/cursor.js";
import { expressPreset } from "./presets/express.js";
import { fastapiPreset } from "./presets/fastapi.js";
import { gcpPreset } from "./presets/gcp.js";
import { geminiPreset } from "./presets/gemini.js";
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
  "claude-code": claudeCodePreset,
  codex: codexPreset,
  gemini: geminiPreset,
  "amazon-q": amazonQPreset,
  copilot: copilotPreset,
  cline: clinePreset,
  cursor: cursorPreset,
};

// Validate that all preset `requires` entries reference known presets (fail-fast at import time)
for (const [name, preset] of Object.entries(ALL_PRESETS)) {
  if (!preset.requires) continue;
  for (const req of preset.requires) {
    if (!(req in ALL_PRESETS)) {
      throw new Error(`Preset "${name}" requires unknown preset "${req}"`);
    }
  }
}

/** IaC tools and the cloud providers they require. */
const IAC_CLOUD_REQUIREMENTS: Record<string, { clouds: string[]; label: string }> = {
  cdk: { clouds: ["aws"], label: "CDK" },
  cloudformation: { clouds: ["aws"], label: "CloudFormation" },
  bicep: { clouds: ["azure"], label: "Bicep" },
};

/** Validate wizard answers and return warnings for questionable (but allowed) combinations. */
export function validateAnswers(answers: WizardAnswers): string[] {
  const warnings: string[] = [];

  for (const iac of answers.iac) {
    const req = IAC_CLOUD_REQUIREMENTS[iac];
    if (!req) continue;
    const hasRequired = req.clouds.some((cloud) =>
      answers.clouds.includes(cloud as WizardAnswers["clouds"][number]),
    );
    if (!hasRequired) {
      warnings.push(
        `${req.label} is typically used with ${req.clouds.join("/")} — no matching cloud provider selected`,
      );
    }
  }

  return warnings;
}

/**
 * Collapse multiple IaC infra placeholder contributions into a single entry.
 * Returns a new array — does not mutate the input.
 * e.g. ["CDK (bin/, lib/, test/)", "CloudFormation"] → "infra/ -> Infrastructure (CDK (bin/, lib/, test/), CloudFormation)"
 */
function collapseInfraPlaceholders(
  sections: MarkdownSection[],
  placeholder: string,
  formatter: (names: string) => string,
): MarkdownSection[] {
  const infraSections = sections.filter((s) => s.placeholder === placeholder);
  if (infraSections.length === 0) return sections;

  const remaining = sections.filter((s) => s.placeholder !== placeholder);
  const names = [...new Set(infraSections.map((s) => s.content))].join(", ");
  remaining.push({ placeholder, content: formatter(names) });
  return remaining;
}

/**
 * Collapse CD_SECTION entries: wrap table rows with a section header.
 * Returns a new array — does not mutate the input.
 */
function collapseCdSection(sections: MarkdownSection[]): MarkdownSection[] {
  const cdSections = sections.filter((s) => s.placeholder === "<!-- SECTION:CD_SECTION -->");
  if (cdSections.length === 0) return sections;

  const remaining = sections.filter((s) => s.placeholder !== "<!-- SECTION:CD_SECTION -->");
  const rows = [...new Set(cdSections.map((s) => s.content))].join("\n");
  remaining.push({
    placeholder: "<!-- SECTION:CD_SECTION -->",
    content: `## デプロイ設定（CD）\n\nCD ワークフローを利用するには、GitHub リポジトリの **Settings → Secrets and variables → Actions → Variables** で以下を設定してください:\n\n| 変数名 | 説明 |\n|--------|------|\n${rows}`,
  });
  return remaining;
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
  "claude-code",
  "codex",
  "gemini",
  "amazon-q",
  "copilot",
  "cline",
  "cursor",
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

  for (const agent of answers.agents) {
    selected.add(agent);
  }

  // Resolve `requires` chains (with guard against circular dependencies)
  const MAX_RESOLVE_ITERATIONS = 100;
  let changed = true;
  let iterations = 0;
  while (changed) {
    if (++iterations > MAX_RESOLVE_ITERATIONS) {
      throw new Error("Circular dependency detected in preset requires chains");
    }
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

// --- Agent config mappings ---

const AGENT_MCP_FILES: Record<string, { path: string; format: "json" | "toml" }> = {
  "claude-code": { path: ".mcp.json", format: "json" },
  codex: { path: ".codex/config.toml", format: "toml" },
  gemini: { path: ".gemini/settings.json", format: "json" },
  "amazon-q": { path: ".amazonq/mcp.json", format: "json" },
  copilot: { path: ".copilot/mcp-config.json", format: "json" },
  cursor: { path: ".cursor/mcp.json", format: "json" },
};

const AGENT_INSTRUCTION_FILES: Record<string, string> = {
  "claude-code": "CLAUDE.md",
  codex: "AGENTS.md",
  gemini: "GEMINI.md",
  "amazon-q": ".amazonq/rules/project.md",
  copilot: ".github/copilot-instructions.md",
  cline: ".clinerules/project.md",
  cursor: ".cursor/rules/project.mdc",
};

// --- Helper functions for generate() ---

/** Post-process package.json: remove unused conditional deps, build lint:all and test:all. */
function postProcessPackageJson(pkgContent: string, presets: Preset[]): string {
  let pkg: Record<string, Record<string, string>>;
  try {
    pkg = JSON.parse(pkgContent) as Record<string, Record<string, string>>;
  } catch (e) {
    throw new Error(
      `Failed to parse merged package.json: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
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
  if (scripts.lint) lintParts.push("pnpm run lint");
  if (scripts.typecheck) lintParts.push("pnpm run typecheck");
  for (const key of Object.keys(scripts).sort()) {
    if (key.startsWith("typecheck:")) {
      lintParts.push(`pnpm run ${key}`);
    }
  }
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
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

/** Collect MCP servers from all presets and write config files for active agents. */
function distributeMcpServers(
  allFiles: Map<string, string>,
  presets: Preset[],
  presetNames: string[],
): void {
  const allMcpServers: Record<string, McpServerConfig> = {};
  for (const preset of presets) {
    if (preset.mcpServers) {
      Object.assign(allMcpServers, preset.mcpServers);
    }
  }
  if (Object.keys(allMcpServers).length === 0) return;

  for (const name of presetNames) {
    const config = AGENT_MCP_FILES[name];
    if (config) {
      allFiles.set(
        config.path,
        config.format === "toml" ? formatMcpToml(allMcpServers) : formatMcpJson(allMcpServers),
      );
    }
  }
}

/** Collect, distribute, collapse, and expand all Markdown template sections. */
function expandMarkdownTemplates(
  allFiles: Map<string, string>,
  presets: Preset[],
  presetNames: string[],
  vars: Record<string, string>,
): void {
  // Collect sections from all presets
  const markdownSections = new Map<string, MarkdownSection[]>();
  for (const preset of presets) {
    if (!preset.markdown) continue;
    for (const [key, sections] of Object.entries(preset.markdown)) {
      const existing = markdownSections.get(key) ?? [];
      existing.push(...sections);
      markdownSections.set(key, existing);
    }
  }

  // Distribute "agent-instructions" sections to each agent's instruction file
  const instructionTargets = presetNames
    .filter((name) => name in AGENT_INSTRUCTION_FILES)
    .map((name) => AGENT_INSTRUCTION_FILES[name]);
  const agentSections = markdownSections.get("agent-instructions");
  if (agentSections) {
    for (const target of instructionTargets) {
      const existing = markdownSections.get(target) ?? [];
      existing.push(...agentSections);
      markdownSections.set(target, existing);
    }
    markdownSections.delete("agent-instructions");
  }

  // Pre-process: collapse repeated placeholders into single entries
  for (const [key, sections] of markdownSections) {
    let collapsed = collapseInfraPlaceholders(
      sections,
      "<!-- SECTION:INFRA_STRUCTURE -->",
      (names) => `infra/        -> Infrastructure (${names})`,
    );
    collapsed = collapseInfraPlaceholders(
      collapsed,
      "<!-- SECTION:INFRA_DIR_STRUCTURE -->",
      (names) => `├── infra/               # インフラストラクチャ (${names})`,
    );
    collapsed = collapseCdSection(collapsed);
    markdownSections.set(key, collapsed);
  }

  // Apply section expansions to templates
  for (const [filePath, sections] of markdownSections) {
    const template = allFiles.get(filePath);
    if (template) {
      allFiles.set(filePath, replaceVariables(expandMarkdown(template, sections), vars));
    }
  }

  // Remove any remaining unused placeholders and empty list items
  for (const [filePath, content] of allFiles) {
    if (
      (filePath.endsWith(".md") || filePath.endsWith(".mdc")) &&
      content.includes("<!-- SECTION:")
    ) {
      const cleaned = content
        .replaceAll(/<!-- SECTION:\w+ -->\n?/g, "")
        .replaceAll(/^(?:\d+\.|-)\s+\*\*[^*]+\*\*:\s*\n(?=\n|#|$)/gm, "");
      allFiles.set(filePath, cleaned);
    }
  }
}

/** Generate .tflint.hcl based on selected cloud providers. */
function generateTflintConfig(
  allFiles: Map<string, string>,
  clouds: WizardAnswers["clouds"],
): void {
  const plugins: string[] = [];
  if (clouds.includes("aws")) {
    plugins.push(`plugin "aws" {
  enabled = true
  version = "0.38.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}`);
  }
  if (clouds.includes("azure")) {
    plugins.push(`plugin "azurerm" {
  enabled = true
  version = "0.27.0"
  source  = "github.com/terraform-linters/tflint-ruleset-azurerm"
}`);
  }
  if (clouds.includes("gcp")) {
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

// --- Main entry point ---

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

  const vars: Record<string, string> = { projectName: answers.projectName };

  // 1. Collect all owned files
  const allFiles = new Map<string, string>();
  for (const preset of presets) {
    for (const [filePath, content] of Object.entries(preset.files)) {
      allFiles.set(filePath, replaceVariables(content, vars));
    }
  }
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
    allFiles.set(filePath, replaceVariables(mergeFile(filePath, base, patches), vars));
  }

  // 3. Post-process package.json (conditional deps, lint:all, test:all)
  const pkgContent = allFiles.get("package.json");
  if (pkgContent) {
    allFiles.set("package.json", postProcessPackageJson(pkgContent, presets));
  }

  // 4. Distribute MCP servers to agent config files
  distributeMcpServers(allFiles, presets, presetNames);

  // 5. Expand Markdown templates
  expandMarkdownTemplates(allFiles, presets, presetNames, vars);

  // 6. Generate .tflint.hcl (if terraform is selected)
  if (presetNames.includes("terraform")) {
    generateTflintConfig(allFiles, answers.clouds);
  }

  // 7. Build CI workflow
  const ciContributions = presets
    .map((p) => p.ciSteps)
    .filter((s): s is NonNullable<typeof s> => s != null);
  if (ciContributions.length > 0) {
    const hasTest = presets.some((p) => p.ciSteps?.testSteps?.length);
    const hasBuild = presets.some((p) => p.ciSteps?.buildSteps?.length);
    allFiles.set(
      ".github/workflows/ci.yaml",
      buildCiWorkflow({ contributions: ciContributions, hasTest, hasBuild }),
    );
  }

  // 8. Expand setup.sh template
  const setupTemplate = allFiles.get("scripts/setup.sh");
  if (setupTemplate) {
    allFiles.set("scripts/setup.sh", expandSetupScript(setupTemplate, presets));
  }

  // 9. Generate pnpm-workspace.yaml
  const workspacePackages: string[] = [];
  if (answers.frontend !== "none") workspacePackages.push("web");
  if (answers.backend === "express") workspacePackages.push("api");
  if (workspacePackages.length > 0) {
    const yamlLines = ["packages:"];
    for (const pkg of workspacePackages) {
      yamlLines.push(`  - ${pkg}`);
    }
    allFiles.set("pnpm-workspace.yaml", `${yamlLines.join("\n")}\n`);
  }

  // 10. Write files & return result
  if (options.writer) {
    for (const [filePath, content] of allFiles) {
      options.writer.write(filePath, content);
    }
  }

  return buildResult(allFiles);
}
