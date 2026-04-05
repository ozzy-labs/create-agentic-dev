/**
 * Generate test projects under tmp/ for manual inspection.
 *
 * Usage:
 *   npx tsx scripts/gen-test-projects.ts
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { generate } from "../src/generator.js";
import type { WizardAnswers } from "../src/types.js";

const ROOT = resolve(import.meta.dirname, "..");
const TMP = resolve(ROOT, "tmp");

function defaults(overrides: Partial<WizardAnswers>): WizardAnswers {
  return {
    projectName: "test-project",
    frontend: "none",
    backend: "none",
    clouds: [],
    iac: [],
    languages: [],
    agents: ["claude-code"],
    ...overrides,
  };
}

// ─── Test project definitions ───────────────────────────────────────────────
// Each entry covers a distinct architectural pattern or feature combination.

const projects: [string, Partial<WizardAnswers>][] = [
  // ── Minimal baselines ──
  ["01-base-only", { projectName: "base-only", agents: [] }],
  ["02-typescript-only", { projectName: "typescript-only", languages: ["typescript"] }],
  ["03-python-only", { projectName: "python-only", languages: ["python"] }],
  ["04-dual-language", { projectName: "dual-language", languages: ["typescript", "python"] }],

  // ── Frontend ──
  [
    "05-react",
    {
      projectName: "react-app",
      frontend: "react",
    },
  ],
  [
    "06-nextjs",
    {
      projectName: "nextjs-app",
      frontend: "nextjs",
    },
  ],
  [
    "07-vue",
    {
      projectName: "vue-app",
      frontend: "vue",
    },
  ],
  [
    "08-nuxt",
    {
      projectName: "nuxt-app",
      frontend: "nuxt",
    },
  ],

  // ── Backend ──
  [
    "09-express",
    {
      projectName: "express-app",
      backend: "express",
    },
  ],
  [
    "10-fastapi",
    {
      projectName: "fastapi-app",
      backend: "fastapi",
    },
  ],
  [
    "11-batch",
    {
      projectName: "batch-app",
      backend: "batch",
    },
  ],

  // ── Frontend + Backend ──
  [
    "12-react-express",
    {
      projectName: "react-express",
      frontend: "react",
      backend: "express",
    },
  ],
  [
    "13-nextjs-fastapi",
    {
      projectName: "nextjs-fastapi",
      frontend: "nextjs",
      backend: "fastapi",
    },
  ],

  // ── Cloud + IaC ──
  [
    "14-aws-cdk",
    {
      projectName: "aws-cdk",
      clouds: ["aws"],
      iac: ["cdk"],
      languages: ["typescript"],
    },
  ],
  [
    "15-aws-terraform",
    {
      projectName: "aws-terraform",
      clouds: ["aws"],
      iac: ["terraform"],
      languages: ["typescript"],
    },
  ],
  [
    "16-azure-bicep",
    {
      projectName: "azure-bicep",
      clouds: ["azure"],
      iac: ["bicep"],
      languages: ["typescript"],
    },
  ],
  [
    "17-gcp-terraform",
    {
      projectName: "gcp-terraform",
      clouds: ["gcp"],
      iac: ["terraform"],
      languages: ["typescript"],
    },
  ],
  [
    "18-multi-cloud-terraform",
    {
      projectName: "multi-cloud",
      clouds: ["aws", "azure", "gcp"],
      iac: ["terraform"],
      languages: ["typescript"],
    },
  ],
  [
    "19-aws-cdk-cloudformation",
    {
      projectName: "aws-dual-iac",
      clouds: ["aws"],
      iac: ["cdk", "cloudformation"],
      languages: ["typescript"],
    },
  ],

  // ── Full-stack combinations ──
  [
    "20-react-express-aws-cdk",
    {
      projectName: "fullstack-aws",
      frontend: "react",
      backend: "express",
      clouds: ["aws"],
      iac: ["cdk"],
      agents: ["claude-code", "copilot"],
    },
  ],
  [
    "21-nextjs-fastapi-azure",
    {
      projectName: "fullstack-azure",
      frontend: "nextjs",
      backend: "fastapi",
      clouds: ["azure"],
      iac: ["bicep", "terraform"],
      agents: ["claude-code", "cursor"],
    },
  ],

  // ── Agent variations ──
  [
    "22-all-agents",
    {
      projectName: "all-agents",
      languages: ["typescript"],
      agents: ["claude-code", "codex", "gemini", "amazon-q", "copilot", "cline", "cursor"],
    },
  ],

  // ── Cross-layer combinations ──
  [
    "23-vue-fastapi",
    {
      projectName: "vue-fastapi",
      frontend: "vue",
      backend: "fastapi",
    },
  ],
  [
    "24-nuxt-express",
    {
      projectName: "nuxt-express",
      frontend: "nuxt",
      backend: "express",
    },
  ],
  [
    "25-batch-aws-cdk",
    {
      projectName: "batch-aws-cdk",
      backend: "batch",
      clouds: ["aws"],
      iac: ["cdk"],
    },
  ],
  [
    "26-aws-only",
    {
      projectName: "aws-only",
      clouds: ["aws"],
      languages: ["typescript"],
    },
  ],

  // ── Kitchen sink ──
  [
    "27-kitchen-sink",
    {
      projectName: "kitchen-sink",
      frontend: "react",
      backend: "express",
      clouds: ["aws", "azure", "gcp"],
      iac: ["cdk", "cloudformation", "terraform", "bicep"],
      languages: ["python"],
      agents: ["claude-code", "codex", "gemini", "amazon-q", "copilot", "cline", "cursor"],
    },
  ],
];

// ─── Generate ───────────────────────────────────────────────────────────────

rmSync(TMP, { recursive: true, force: true });

console.log(`Generating ${projects.length} test projects under tmp/\n`);

for (const [dir, overrides] of projects) {
  const answers = defaults(overrides);
  const result = generate(answers);
  const outDir = resolve(TMP, dir);

  for (const [filePath, content] of result.files) {
    const absPath = resolve(outDir, filePath);
    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, content, "utf-8");
  }

  console.log(`  ✓ ${dir} (${result.files.size} files)`);
}

console.log(`\nDone! ${projects.length} projects generated in tmp/`);
