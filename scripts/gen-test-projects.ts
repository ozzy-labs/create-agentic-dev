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
    testing: [],
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

  [
    "09-sveltekit",
    {
      projectName: "sveltekit-app",
      frontend: "sveltekit",
    },
  ],
  [
    "10-astro",
    {
      projectName: "astro-app",
      frontend: "astro",
    },
  ],

  // ── Backend ──
  [
    "11-hono",
    {
      projectName: "hono-app",
      backend: "hono",
    },
  ],
  [
    "12-express",
    {
      projectName: "express-app",
      backend: "express",
    },
  ],
  [
    "13-fastapi",
    {
      projectName: "fastapi-app",
      backend: "fastapi",
    },
  ],
  [
    "14-batch",
    {
      projectName: "batch-app",
      backend: "batch",
    },
  ],

  // ── Frontend + Backend ──
  [
    "15-react-express",
    {
      projectName: "react-express",
      frontend: "react",
      backend: "express",
    },
  ],
  [
    "16-react-hono",
    {
      projectName: "react-hono",
      frontend: "react",
      backend: "hono",
    },
  ],
  [
    "17-nextjs-fastapi",
    {
      projectName: "nextjs-fastapi",
      frontend: "nextjs",
      backend: "fastapi",
    },
  ],

  // ── Cloud + IaC ──
  [
    "18-aws-cdk",
    {
      projectName: "aws-cdk",
      clouds: ["aws"],
      iac: ["cdk"],
      languages: ["typescript"],
    },
  ],
  [
    "19-aws-terraform",
    {
      projectName: "aws-terraform",
      clouds: ["aws"],
      iac: ["terraform"],
      languages: ["typescript"],
    },
  ],
  [
    "20-azure-bicep",
    {
      projectName: "azure-bicep",
      clouds: ["azure"],
      iac: ["bicep"],
      languages: ["typescript"],
    },
  ],
  [
    "21-gcp-terraform",
    {
      projectName: "gcp-terraform",
      clouds: ["gcp"],
      iac: ["terraform"],
      languages: ["typescript"],
    },
  ],
  [
    "22-multi-cloud-terraform",
    {
      projectName: "multi-cloud",
      clouds: ["aws", "azure", "gcp"],
      iac: ["terraform"],
      languages: ["typescript"],
    },
  ],
  [
    "23-aws-cdk-cloudformation",
    {
      projectName: "aws-dual-iac",
      clouds: ["aws"],
      iac: ["cdk", "cloudformation"],
      languages: ["typescript"],
    },
  ],

  // ── Testing ──
  [
    "24-playwright",
    {
      projectName: "playwright-app",
      languages: ["typescript"],
      testing: ["playwright"],
    },
  ],
  [
    "25-react-playwright",
    {
      projectName: "react-playwright",
      frontend: "react",
      testing: ["playwright"],
    },
  ],

  // ── Full-stack combinations ──
  [
    "26-react-express-aws-cdk",
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
    "27-react-hono-aws-cdk-playwright",
    {
      projectName: "fullstack-modern",
      frontend: "react",
      backend: "hono",
      clouds: ["aws"],
      iac: ["cdk"],
      testing: ["playwright"],
      agents: ["claude-code", "copilot"],
    },
  ],
  [
    "28-nextjs-fastapi-azure",
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
    "29-all-agents",
    {
      projectName: "all-agents",
      languages: ["typescript"],
      agents: ["claude-code", "codex", "gemini", "amazon-q", "copilot", "cline", "cursor"],
    },
  ],

  // ── Cross-layer combinations ──
  [
    "30-vue-fastapi",
    {
      projectName: "vue-fastapi",
      frontend: "vue",
      backend: "fastapi",
    },
  ],
  [
    "31-nuxt-express",
    {
      projectName: "nuxt-express",
      frontend: "nuxt",
      backend: "express",
    },
  ],
  [
    "32-sveltekit-hono",
    {
      projectName: "sveltekit-hono",
      frontend: "sveltekit",
      backend: "hono",
    },
  ],
  [
    "33-batch-aws-cdk",
    {
      projectName: "batch-aws-cdk",
      backend: "batch",
      clouds: ["aws"],
      iac: ["cdk"],
    },
  ],
  [
    "34-aws-only",
    {
      projectName: "aws-only",
      clouds: ["aws"],
      languages: ["typescript"],
    },
  ],

  // ── Kitchen sink ──
  [
    "35-kitchen-sink",
    {
      projectName: "kitchen-sink",
      frontend: "react",
      backend: "express",
      clouds: ["aws", "azure", "gcp"],
      iac: ["cdk", "cloudformation", "terraform", "bicep"],
      languages: ["python"],
      testing: ["playwright"],
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
