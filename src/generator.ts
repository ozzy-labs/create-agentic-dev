import path from "node:path";
import { ACTIONS } from "./action-versions.js";
import { buildCiWorkflow } from "./ci.js";
import { expandMarkdown, formatMcpJson, formatMcpToml, mergeFile } from "./merge.js";
import { ALL_PRESETS, PRESET_ORDER } from "./presets/index.js";
import { expandSetupScript } from "./setup.js";
import type {
  ApplyAnswers,
  FileWriter,
  GenerateResult,
  MarkdownSection,
  McpServerConfig,
  Preset,
  WizardAnswers,
} from "./types.js";
import { buildResult } from "./utils.js";

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

/** Resolve which presets to apply based on wizard answers, including dependency chains. */
export function resolvePresets(answers: WizardAnswers): string[] {
  const selected = new Set<string>(["base"]);

  for (const lang of answers.languages) {
    selected.add(lang);
  }

  if (answers.frontend !== "none") {
    selected.add(answers.frontend);
  }

  if (answers.backend !== "none") {
    selected.add(answers.backend);
  }

  for (const cloud of answers.clouds) {
    selected.add(cloud);
  }

  for (const iac of answers.iac) {
    selected.add(iac);
  }

  for (const testing of answers.testing) {
    selected.add(testing);
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
      key !== "lint:secrets" &&
      key !== "lint:trivy"
    ) {
      lintParts.push(`pnpm run ${key}`);
    }
  }
  if (scripts["lint:secrets"]) lintParts.push("pnpm run lint:secrets");
  if (scripts["lint:trivy"]) lintParts.push("pnpm run lint:trivy");
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
function distributeMcpServers(allFiles: Map<string, string>, presets: Preset[]): void {
  const allMcpServers: Record<string, McpServerConfig> = {};
  for (const preset of presets) {
    if (preset.mcpServers) {
      Object.assign(allMcpServers, preset.mcpServers);
    }
  }
  if (Object.keys(allMcpServers).length === 0) return;

  for (const preset of presets) {
    if (preset.mcpConfigPath) {
      allFiles.set(
        preset.mcpConfigPath.path,
        preset.mcpConfigPath.format === "toml"
          ? formatMcpToml(allMcpServers)
          : formatMcpJson(allMcpServers),
      );
    }
  }
}

/** Collect, distribute, collapse, and expand all Markdown template sections. */
function expandMarkdownTemplates(
  allFiles: Map<string, string>,
  presets: Preset[],
  vars: Record<string, string>,
  extraSections?: Map<string, MarkdownSection[]>,
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

  // Merge extra sections from generator (e.g. Terraform CD)
  if (extraSections) {
    for (const [key, sections] of extraSections) {
      const existing = markdownSections.get(key) ?? [];
      existing.push(...sections);
      markdownSections.set(key, existing);
    }
  }

  // Distribute "agent-instructions" sections to each agent's instruction file
  const instructionTargets = presets
    .filter((p) => p.instructionFile)
    .map((p) => p.instructionFile as string);
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

  // Remove any remaining unused placeholders, empty list items, and empty table sections
  for (const [filePath, content] of allFiles) {
    if (
      (filePath.endsWith(".md") || filePath.endsWith(".mdc")) &&
      content.includes("<!-- SECTION:")
    ) {
      const cleaned = content
        .replaceAll(/<!-- SECTION:\w+ -->\n?/g, "")
        .replaceAll(/^(?:\d+\.|-)\s+\*\*[^*]+\*\*:\s*\n(?=\n|#|$)/gm, "")
        .replaceAll(/^### .+\n\n\| .+ \|\n\|[-| ]+\|\n(?=\n|$)/gm, "")
        .replaceAll(/\n{3,}/g, "\n\n");
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

// --- Terraform CD (cloud-aware) ---

function terraformCdHeader(): string {
  return `name: "CD: Terraform ({{CLOUD_LABEL}})"

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

permissions:
  contents: read
  id-token: write

concurrency:
  # biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression syntax
  group: cd-terraform-{{CLOUD_ID}}-\${{ github.ref }}
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    steps:
      - name: Checkout
        uses: ${ACTIONS.checkout}

      - name: Setup mise
        uses: ${ACTIONS.mise}
        with:
          install: "true"
          cache: "true"
`;
}

function terraformCdAuth(): Record<
  string,
  { id: string; label: string; steps: string; cdVars: string }
> {
  return {
    aws: {
      id: "aws",
      label: "AWS",
      steps: `
      # Required repository variables:
      #   AWS_ROLE_ARN  - IAM role ARN for OIDC authentication
      #   AWS_REGION    - AWS region (e.g., ap-northeast-1)
      # See: https://github.com/aws-actions/configure-aws-credentials
      - name: Configure AWS credentials
        uses: ${ACTIONS.awsCredentials}
        with:
          # biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression syntax
          role-to-assume: \${{ vars.AWS_ROLE_ARN }}
          # biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression syntax
          aws-region: \${{ vars.AWS_REGION }}
`,
      cdVars:
        "| `AWS_ROLE_ARN` | デプロイ用 IAM ロール ARN（OIDC 認証） |\n| `AWS_REGION` | AWS リージョン（例: `ap-northeast-1`） |",
    },
    azure: {
      id: "azure",
      label: "Azure",
      steps: `
      # Required repository variables:
      #   AZURE_CLIENT_ID       - Azure AD application client ID
      #   AZURE_TENANT_ID       - Azure AD tenant ID
      #   AZURE_SUBSCRIPTION_ID - Azure subscription ID
      # See: https://github.com/azure/login
      - name: Azure login (OIDC)
        uses: ${ACTIONS.azureLogin}
        with:
          # biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression syntax
          client-id: \${{ vars.AZURE_CLIENT_ID }}
          # biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression syntax
          tenant-id: \${{ vars.AZURE_TENANT_ID }}
          # biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression syntax
          subscription-id: \${{ vars.AZURE_SUBSCRIPTION_ID }}
`,
      cdVars:
        "| `AZURE_CLIENT_ID` | Azure OIDC 認証用クライアント ID |\n| `AZURE_TENANT_ID` | Azure テナント ID |\n| `AZURE_SUBSCRIPTION_ID` | Azure サブスクリプション ID |",
    },
    gcp: {
      id: "gcp",
      label: "Google Cloud",
      steps: `
      # Required repository variables:
      #   GCP_WORKLOAD_IDENTITY_PROVIDER - Workload Identity Provider resource name
      #   GCP_SERVICE_ACCOUNT            - Service account email
      # See: https://github.com/google-github-actions/auth
      - name: Authenticate to Google Cloud
        uses: ${ACTIONS.gcpAuth}
        with:
          # biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression syntax
          workload_identity_provider: \${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          # biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression syntax
          service_account: \${{ vars.GCP_SERVICE_ACCOUNT }}
`,
      cdVars:
        "| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Provider リソース名 |\n| `GCP_SERVICE_ACCOUNT` | サービスアカウント メール |",
    },
  };
}

const TERRAFORM_CD_DEPLOY = `
      - name: Terraform init
        run: terraform init

      - name: Terraform plan
        run: terraform plan -out=tfplan

      - name: Terraform apply
        run: terraform apply tfplan
`;

/** Generate cloud-specific Terraform CD workflows and CD_SECTION markdown entries. */
function generateTerraformCd(
  allFiles: Map<string, string>,
  clouds: WizardAnswers["clouds"],
): MarkdownSection[] {
  const cdSections: MarkdownSection[] = [];

  const authMap = terraformCdAuth();
  for (const cloud of clouds) {
    const auth = authMap[cloud];
    if (!auth) continue;

    // Generate CD workflow file
    const workflow = terraformCdHeader()
      .replaceAll("{{CLOUD_LABEL}}", auth.label)
      .replaceAll("{{CLOUD_ID}}", auth.id)
      .concat(auth.steps, TERRAFORM_CD_DEPLOY);
    allFiles.set(`.github/workflows/cd-terraform-${auth.id}.yaml`, workflow);

    // Collect CD_SECTION markdown entries
    cdSections.push({
      placeholder: "<!-- SECTION:CD_SECTION -->",
      content: auth.cdVars,
    });
  }

  return cdSections;
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

  const vars: Record<string, string> = {
    projectName: answers.projectName,
    actionsCheckout: ACTIONS.checkout,
    actionsMise: ACTIONS.mise,
    actionsCache: ACTIONS.cache,
    actionsAwsCredentials: ACTIONS.awsCredentials,
    actionsAzureLogin: ACTIONS.azureLogin,
    actionsGcpAuth: ACTIONS.gcpAuth,
  };

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
  distributeMcpServers(allFiles, presets);

  // 5. Generate Terraform CD workflows (must run before markdown expansion for CD_SECTION)
  const extraSections = new Map<string, MarkdownSection[]>();
  if (presetNames.includes("terraform")) {
    const tfCdSections = generateTerraformCd(allFiles, answers.clouds);
    if (tfCdSections.length > 0) {
      extraSections.set("README.md", tfCdSections);
    }
  }

  // 5a. Expand Markdown templates
  expandMarkdownTemplates(allFiles, presets, vars, extraSections);

  // 5b. Remove root src/tests from Project Structure when frontend overrides them
  if (answers.frontend !== "none") {
    for (const [filePath, content] of allFiles) {
      if (filePath.endsWith(".md") || filePath.endsWith(".mdc")) {
        const cleaned = content
          .replaceAll(/^src\/\s+-> Source code\n/gm, "")
          .replaceAll(/^tests\/\s+-> Tests\n/gm, "")
          .replaceAll(/^├── src\/\s+# ソースコード\n/gm, "")
          .replaceAll(/^├── tests\/\s+# テスト\n/gm, "");
        if (cleaned !== content) allFiles.set(filePath, cleaned);
      }
    }
  }

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
  if (answers.backend === "hono" || answers.backend === "express") workspacePackages.push("api");
  if (answers.backend === "batch") workspacePackages.push("worker");
  if (answers.testing.includes("playwright")) workspacePackages.push("e2e");
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

/** File path prefixes/patterns that are agent-related output for --apply mode. */
const APPLY_FILE_PATTERNS = [
  "CLAUDE.md",
  "AGENTS.md",
  "GEMINI.md",
  ".claude/",
  ".amazonq/",
  ".github/copilot-instructions.md",
  ".clinerules/",
  ".cursor/",
  ".mcp.json",
];

/** Check if a file path matches agent-related output. */
function isApplyFile(filePath: string): boolean {
  return APPLY_FILE_PATTERNS.some(
    (pattern) => filePath === pattern || filePath.startsWith(pattern),
  );
}

/**
 * Generate agent-related files only (for --apply mode).
 * Uses the full generator internally, then filters to agent output.
 */
export function generateApply(answers: ApplyAnswers): GenerateResult {
  // Build full WizardAnswers with agent + cloud selections only
  const fullAnswers: WizardAnswers = {
    projectName: path.basename(process.cwd()),
    frontend: "none",
    backend: "none",
    clouds: answers.clouds,
    iac: [],
    languages: [],
    testing: [],
    agents: answers.agents,
  };

  const result = generate(fullAnswers);

  // Filter to agent-related files only
  const filteredFiles = new Map<string, string>();
  for (const file of result.fileList()) {
    if (isApplyFile(file)) {
      filteredFiles.set(file, result.readText(file));
    }
  }

  return buildResult(filteredFiles);
}
