/**
 * Verification tests — generate representative patterns and validate output.
 *
 * These tests go beyond unit/integration tests by verifying the actual merged
 * output of generated projects: JSON validity, preset isolation, and correct
 * composition of shared files (VSCode, devcontainer, package.json, etc.).
 *
 * Run with: pnpm run verify
 */
import { describe, expect, it } from "vitest";
import { generate } from "../src/generator.js";
import type { WizardAnswers } from "../src/types.js";

function makeAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    projectName: "verify-app",
    languages: [],
    frontend: "none",
    clouds: [],
    iac: [],
    ...overrides,
  };
}

// Helper to parse and validate JSON files
function readValidJson(result: ReturnType<typeof generate>, path: string): Record<string, unknown> {
  const text = result.readText(path);
  expect(() => JSON.parse(text), `${path} should be valid JSON`).not.toThrow();
  return JSON.parse(text) as Record<string, unknown>;
}

// --- Shared file composition checks across all patterns ---

interface PatternDef {
  name: string;
  answers: Partial<WizardAnswers>;
  vscodeSettings: {
    mustInclude: string[];
    mustExclude: string[];
  };
  vscodeExtensions: {
    mustInclude: string[];
    mustExclude: string[];
  };
  devcontainer: {
    extensionsMustInclude: string[];
    extensionsMustExclude: string[];
    mountsMustInclude: string[];
    mountsMustExclude: string[];
  };
  packageJson: {
    scriptsMustInclude: string[];
    scriptsMustExclude: string[];
  };
}

const COMMON_EXTENSIONS = [
  "DavidAnson.vscode-markdownlint",
  "EditorConfig.EditorConfig",
  "foxundermoon.shell-format",
  "github.vscode-github-actions",
  "ms-azuretools.vscode-docker",
  "redhat.vscode-yaml",
  "tamasfe.even-better-toml",
  "timonwong.shellcheck",
];

const patterns: PatternDef[] = [
  {
    name: "base only",
    answers: {},
    vscodeSettings: {
      mustInclude: ["editor.formatOnSave", "files.eol"],
      mustExclude: ["biomejs.biome", "charliermarsh.ruff", "cdk.out", "mypy-type-checker"],
    },
    vscodeExtensions: {
      mustInclude: COMMON_EXTENSIONS,
      mustExclude: [
        "biomejs.biome",
        "charliermarsh.ruff",
        "amazonwebservices.aws-toolkit-vscode",
        "ms-azuretools.vscode-bicep",
      ],
    },
    devcontainer: {
      extensionsMustInclude: COMMON_EXTENSIONS,
      extensionsMustExclude: [
        "biomejs.biome",
        "charliermarsh.ruff",
        "amazonwebservices.aws-toolkit-vscode",
        "ms-azuretools.vscode-bicep",
      ],
      mountsMustInclude: ["pnpm-store"],
      mountsMustExclude: [".aws", ".azure", "uv-cache"],
    },
    packageJson: {
      scriptsMustInclude: ["prepare", "lint:md", "lint:yaml", "lint:secrets"],
      scriptsMustExclude: ["lint", "typecheck", "lint:python", "lint:cfn", "lint:tf", "lint:bicep"],
    },
  },
  {
    name: "typescript",
    answers: { languages: ["typescript"] },
    vscodeSettings: {
      mustInclude: ["biomejs.biome", "source.fixAll.biome", "**/dist"],
      mustExclude: ["charliermarsh.ruff", "mypy-type-checker", "cdk.out"],
    },
    vscodeExtensions: {
      mustInclude: [...COMMON_EXTENSIONS, "biomejs.biome"],
      mustExclude: [
        "charliermarsh.ruff",
        "amazonwebservices.aws-toolkit-vscode",
        "ms-azuretools.vscode-bicep",
      ],
    },
    devcontainer: {
      extensionsMustInclude: [...COMMON_EXTENSIONS, "biomejs.biome"],
      extensionsMustExclude: [
        "charliermarsh.ruff",
        "amazonwebservices.aws-toolkit-vscode",
        "ms-azuretools.vscode-bicep",
      ],
      mountsMustInclude: ["pnpm-store"],
      mountsMustExclude: [".aws", ".azure", "uv-cache"],
    },
    packageJson: {
      scriptsMustInclude: ["lint", "typecheck", "test", "build"],
      scriptsMustExclude: ["lint:python", "lint:mypy", "lint:cfn", "lint:tf", "lint:bicep"],
    },
  },
  {
    name: "python",
    answers: { languages: ["python"] },
    vscodeSettings: {
      mustInclude: ["charliermarsh.ruff", "mypy-type-checker.importStrategy"],
      mustExclude: ["biomejs.biome", "cdk.out"],
    },
    vscodeExtensions: {
      mustInclude: [
        ...COMMON_EXTENSIONS,
        "charliermarsh.ruff",
        "ms-python.mypy-type-checker",
        "ms-python.python",
      ],
      mustExclude: [
        "biomejs.biome",
        "amazonwebservices.aws-toolkit-vscode",
        "ms-azuretools.vscode-bicep",
      ],
    },
    devcontainer: {
      extensionsMustInclude: [
        ...COMMON_EXTENSIONS,
        "charliermarsh.ruff",
        "ms-python.mypy-type-checker",
        "ms-python.python",
      ],
      extensionsMustExclude: [
        "biomejs.biome",
        "amazonwebservices.aws-toolkit-vscode",
        "ms-azuretools.vscode-bicep",
      ],
      mountsMustInclude: ["pnpm-store", "uv-cache"],
      mountsMustExclude: [".aws", ".azure"],
    },
    packageJson: {
      scriptsMustInclude: ["lint:python", "lint:mypy"],
      scriptsMustExclude: ["lint", "typecheck", "lint:cfn", "lint:tf", "lint:bicep"],
    },
  },
  {
    name: "typescript + python",
    answers: { languages: ["typescript", "python"] },
    vscodeSettings: {
      mustInclude: ["biomejs.biome", "charliermarsh.ruff", "mypy-type-checker.importStrategy"],
      mustExclude: ["cdk.out"],
    },
    vscodeExtensions: {
      mustInclude: [
        ...COMMON_EXTENSIONS,
        "biomejs.biome",
        "charliermarsh.ruff",
        "ms-python.python",
      ],
      mustExclude: ["amazonwebservices.aws-toolkit-vscode", "ms-azuretools.vscode-bicep"],
    },
    devcontainer: {
      extensionsMustInclude: [...COMMON_EXTENSIONS, "biomejs.biome", "charliermarsh.ruff"],
      extensionsMustExclude: ["amazonwebservices.aws-toolkit-vscode", "ms-azuretools.vscode-bicep"],
      mountsMustInclude: ["pnpm-store", "uv-cache"],
      mountsMustExclude: [".aws", ".azure"],
    },
    packageJson: {
      scriptsMustInclude: ["lint", "typecheck", "lint:python", "lint:mypy"],
      scriptsMustExclude: ["lint:cfn", "lint:tf", "lint:bicep"],
    },
  },
  {
    name: "aws + cdk",
    answers: { clouds: ["aws"], iac: ["cdk"] },
    vscodeSettings: {
      mustInclude: ["biomejs.biome", "**/cdk.out", "**/dist"],
      mustExclude: ["charliermarsh.ruff", "mypy-type-checker"],
    },
    vscodeExtensions: {
      mustInclude: [...COMMON_EXTENSIONS, "biomejs.biome", "amazonwebservices.aws-toolkit-vscode"],
      mustExclude: ["charliermarsh.ruff", "ms-azuretools.vscode-bicep"],
    },
    devcontainer: {
      extensionsMustInclude: [
        ...COMMON_EXTENSIONS,
        "biomejs.biome",
        "amazonwebservices.aws-toolkit-vscode",
      ],
      extensionsMustExclude: ["charliermarsh.ruff", "ms-azuretools.vscode-bicep"],
      mountsMustInclude: ["pnpm-store", ".aws"],
      mountsMustExclude: ["uv-cache", ".azure"],
    },
    packageJson: {
      scriptsMustInclude: ["lint", "typecheck", "lint:cfn", "cdk:synth"],
      scriptsMustExclude: ["lint:python", "lint:tf", "lint:bicep"],
    },
  },
  {
    name: "aws + cloudformation (ts)",
    answers: { languages: ["typescript"], clouds: ["aws"], iac: ["cloudformation"] },
    vscodeSettings: {
      mustInclude: ["biomejs.biome"],
      mustExclude: ["cdk.out", "charliermarsh.ruff"],
    },
    vscodeExtensions: {
      mustInclude: [...COMMON_EXTENSIONS, "biomejs.biome"],
      mustExclude: ["amazonwebservices.aws-toolkit-vscode", "ms-azuretools.vscode-bicep"],
    },
    devcontainer: {
      extensionsMustInclude: [...COMMON_EXTENSIONS, "biomejs.biome"],
      extensionsMustExclude: ["amazonwebservices.aws-toolkit-vscode", "ms-azuretools.vscode-bicep"],
      mountsMustInclude: ["pnpm-store", ".aws"],
      mountsMustExclude: ["uv-cache", ".azure"],
    },
    packageJson: {
      scriptsMustInclude: ["lint", "typecheck", "lint:cfn"],
      scriptsMustExclude: ["lint:python", "lint:tf", "cdk:synth", "lint:bicep"],
    },
  },
  {
    name: "aws + terraform (ts)",
    answers: { languages: ["typescript"], clouds: ["aws"], iac: ["terraform"] },
    vscodeSettings: {
      mustInclude: ["biomejs.biome"],
      mustExclude: ["cdk.out", "charliermarsh.ruff"],
    },
    vscodeExtensions: {
      mustInclude: [...COMMON_EXTENSIONS, "biomejs.biome"],
      mustExclude: ["amazonwebservices.aws-toolkit-vscode", "ms-azuretools.vscode-bicep"],
    },
    devcontainer: {
      extensionsMustInclude: [...COMMON_EXTENSIONS, "biomejs.biome"],
      extensionsMustExclude: ["amazonwebservices.aws-toolkit-vscode", "ms-azuretools.vscode-bicep"],
      mountsMustInclude: ["pnpm-store", ".aws"],
      mountsMustExclude: ["uv-cache", ".azure"],
    },
    packageJson: {
      scriptsMustInclude: ["lint", "typecheck", "lint:tf"],
      scriptsMustExclude: ["lint:python", "lint:cfn", "cdk:synth", "lint:bicep"],
    },
  },
  {
    name: "azure + bicep (ts)",
    answers: { languages: ["typescript"], clouds: ["azure"], iac: ["bicep"] },
    vscodeSettings: {
      mustInclude: ["biomejs.biome"],
      mustExclude: ["cdk.out", "charliermarsh.ruff"],
    },
    vscodeExtensions: {
      mustInclude: [...COMMON_EXTENSIONS, "biomejs.biome", "ms-azuretools.vscode-bicep"],
      mustExclude: ["amazonwebservices.aws-toolkit-vscode"],
    },
    devcontainer: {
      extensionsMustInclude: [...COMMON_EXTENSIONS, "biomejs.biome", "ms-azuretools.vscode-bicep"],
      extensionsMustExclude: ["amazonwebservices.aws-toolkit-vscode"],
      mountsMustInclude: ["pnpm-store", ".azure"],
      mountsMustExclude: [".aws", "uv-cache"],
    },
    packageJson: {
      scriptsMustInclude: ["lint", "typecheck", "lint:bicep"],
      scriptsMustExclude: ["lint:python", "lint:cfn", "lint:tf", "cdk:synth"],
    },
  },
  {
    name: "azure + terraform (ts)",
    answers: { languages: ["typescript"], clouds: ["azure"], iac: ["terraform"] },
    vscodeSettings: {
      mustInclude: ["biomejs.biome"],
      mustExclude: ["cdk.out", "charliermarsh.ruff"],
    },
    vscodeExtensions: {
      mustInclude: [...COMMON_EXTENSIONS, "biomejs.biome"],
      mustExclude: ["amazonwebservices.aws-toolkit-vscode", "ms-azuretools.vscode-bicep"],
    },
    devcontainer: {
      extensionsMustInclude: [...COMMON_EXTENSIONS, "biomejs.biome"],
      extensionsMustExclude: ["amazonwebservices.aws-toolkit-vscode", "ms-azuretools.vscode-bicep"],
      mountsMustInclude: ["pnpm-store", ".azure"],
      mountsMustExclude: [".aws", "uv-cache"],
    },
    packageJson: {
      scriptsMustInclude: ["lint", "typecheck", "lint:tf"],
      scriptsMustExclude: ["lint:python", "lint:cfn", "cdk:synth", "lint:bicep"],
    },
  },
  {
    name: "azure + bicep (python)",
    answers: { languages: ["python"], clouds: ["azure"], iac: ["bicep"] },
    vscodeSettings: {
      mustInclude: ["charliermarsh.ruff"],
      mustExclude: ["biomejs.biome", "cdk.out"],
    },
    vscodeExtensions: {
      mustInclude: [...COMMON_EXTENSIONS, "charliermarsh.ruff", "ms-azuretools.vscode-bicep"],
      mustExclude: ["biomejs.biome", "amazonwebservices.aws-toolkit-vscode"],
    },
    devcontainer: {
      extensionsMustInclude: [
        ...COMMON_EXTENSIONS,
        "charliermarsh.ruff",
        "ms-azuretools.vscode-bicep",
      ],
      extensionsMustExclude: ["biomejs.biome", "amazonwebservices.aws-toolkit-vscode"],
      mountsMustInclude: ["pnpm-store", "uv-cache", ".azure"],
      mountsMustExclude: [".aws"],
    },
    packageJson: {
      scriptsMustInclude: ["lint:python", "lint:bicep"],
      scriptsMustExclude: ["lint", "typecheck", "lint:cfn", "lint:tf"],
    },
  },
  {
    name: "aws + azure + terraform + bicep (ts)",
    answers: { languages: ["typescript"], clouds: ["aws", "azure"], iac: ["terraform", "bicep"] },
    vscodeSettings: {
      mustInclude: ["biomejs.biome"],
      mustExclude: ["cdk.out", "charliermarsh.ruff"],
    },
    vscodeExtensions: {
      mustInclude: [...COMMON_EXTENSIONS, "biomejs.biome", "ms-azuretools.vscode-bicep"],
      mustExclude: [],
    },
    devcontainer: {
      extensionsMustInclude: [...COMMON_EXTENSIONS, "biomejs.biome", "ms-azuretools.vscode-bicep"],
      extensionsMustExclude: [],
      mountsMustInclude: ["pnpm-store", ".aws", ".azure"],
      mountsMustExclude: ["uv-cache"],
    },
    packageJson: {
      scriptsMustInclude: ["lint", "typecheck", "lint:tf", "lint:bicep"],
      scriptsMustExclude: ["lint:python", "lint:cfn"],
    },
  },
  {
    name: "nextjs",
    answers: { frontend: "nextjs" },
    vscodeSettings: {
      mustInclude: ["biomejs.biome", "source.fixAll.biome", "**/dist", "**/.next"],
      mustExclude: ["charliermarsh.ruff", "mypy-type-checker", "cdk.out"],
    },
    vscodeExtensions: {
      mustInclude: [...COMMON_EXTENSIONS, "biomejs.biome"],
      mustExclude: [
        "charliermarsh.ruff",
        "amazonwebservices.aws-toolkit-vscode",
        "ms-azuretools.vscode-bicep",
      ],
    },
    devcontainer: {
      extensionsMustInclude: [...COMMON_EXTENSIONS, "biomejs.biome"],
      extensionsMustExclude: [
        "charliermarsh.ruff",
        "amazonwebservices.aws-toolkit-vscode",
        "ms-azuretools.vscode-bicep",
      ],
      mountsMustInclude: ["pnpm-store"],
      mountsMustExclude: [".aws", ".azure", "uv-cache"],
    },
    packageJson: {
      scriptsMustInclude: ["lint", "typecheck", "test", "build"],
      scriptsMustExclude: ["lint:python", "lint:mypy", "lint:cfn", "lint:tf", "lint:bicep"],
    },
  },
  {
    name: "full config (ts + python + react + aws + cdk)",
    answers: {
      languages: ["typescript", "python"],
      frontend: "react",
      clouds: ["aws"],
      iac: ["cdk"],
    },
    vscodeSettings: {
      mustInclude: ["biomejs.biome", "charliermarsh.ruff", "**/cdk.out", "**/dist"],
      mustExclude: [],
    },
    vscodeExtensions: {
      mustInclude: [
        ...COMMON_EXTENSIONS,
        "biomejs.biome",
        "charliermarsh.ruff",
        "ms-python.python",
        "amazonwebservices.aws-toolkit-vscode",
      ],
      mustExclude: [],
    },
    devcontainer: {
      extensionsMustInclude: [
        ...COMMON_EXTENSIONS,
        "biomejs.biome",
        "charliermarsh.ruff",
        "amazonwebservices.aws-toolkit-vscode",
      ],
      extensionsMustExclude: [],
      mountsMustInclude: ["pnpm-store", "uv-cache", ".aws"],
      mountsMustExclude: [],
    },
    packageJson: {
      scriptsMustInclude: ["lint", "typecheck", "lint:python", "lint:cfn", "lint:all"],
      scriptsMustExclude: ["lint:tf", "lint:bicep"],
    },
  },
];

describe("verify: generated output", () => {
  for (const p of patterns) {
    describe(p.name, () => {
      const result = generate(makeAnswers(p.answers));

      it("generates valid JSON for all JSON files", () => {
        for (const file of result.fileList()) {
          if (file.endsWith(".json")) {
            readValidJson(result, file);
          }
        }
      });

      it(".vscode/settings.json has correct preset-specific settings", () => {
        const text = JSON.stringify(readValidJson(result, ".vscode/settings.json"));
        for (const s of p.vscodeSettings.mustInclude) {
          expect(text, `settings.json should contain "${s}"`).toContain(s);
        }
        for (const s of p.vscodeSettings.mustExclude) {
          expect(text, `settings.json should NOT contain "${s}"`).not.toContain(s);
        }
      });

      it(".vscode/extensions.json has correct preset-specific extensions", () => {
        const ext = readValidJson(result, ".vscode/extensions.json");
        const recs = ext.recommendations as string[];
        for (const e of p.vscodeExtensions.mustInclude) {
          expect(recs, `extensions.json should contain "${e}"`).toContain(e);
        }
        for (const e of p.vscodeExtensions.mustExclude) {
          expect(recs, `extensions.json should NOT contain "${e}"`).not.toContain(e);
        }
      });

      it("devcontainer.json has correct preset-specific extensions and mounts", () => {
        const dc = readValidJson(result, ".devcontainer/devcontainer.json");
        const customizations = dc.customizations as Record<string, Record<string, string[]>>;
        const extensions = customizations.vscode.extensions;
        const mounts = dc.mounts as string[];

        for (const e of p.devcontainer.extensionsMustInclude) {
          expect(extensions, `devcontainer extensions should contain "${e}"`).toContain(e);
        }
        for (const e of p.devcontainer.extensionsMustExclude) {
          expect(extensions, `devcontainer extensions should NOT contain "${e}"`).not.toContain(e);
        }
        for (const m of p.devcontainer.mountsMustInclude) {
          expect(
            mounts.some((mount: string) => mount.includes(m)),
            `devcontainer mounts should contain "${m}"`,
          ).toBe(true);
        }
        for (const m of p.devcontainer.mountsMustExclude) {
          expect(
            mounts.some((mount: string) => mount.includes(m)),
            `devcontainer mounts should NOT contain "${m}"`,
          ).toBe(false);
        }
      });

      it("package.json has correct preset-specific scripts", () => {
        const pkg = readValidJson(result, "package.json");
        const scripts = pkg.scripts as Record<string, string>;
        for (const s of p.packageJson.scriptsMustInclude) {
          expect(scripts, `package.json scripts should have "${s}"`).toHaveProperty(s);
        }
        for (const s of p.packageJson.scriptsMustExclude) {
          expect(scripts, `package.json scripts should NOT have "${s}"`).not.toHaveProperty(s);
        }
      });

      it("package.json lint:all includes all lint scripts", () => {
        const pkg = readValidJson(result, "package.json");
        const scripts = pkg.scripts as Record<string, string>;
        if (!scripts["lint:all"]) return; // base-only may not have lint:all
        const lintAll = scripts["lint:all"];
        for (const key of Object.keys(scripts).sort()) {
          if (key.startsWith("lint:") && key !== "lint:all" && key !== "lint:fix") {
            expect(lintAll, `lint:all should include "pnpm run ${key}"`).toContain(
              `pnpm run ${key}`,
            );
          }
        }
      });

      it("devcontainer.json extensions match .vscode/extensions.json", () => {
        const ext = readValidJson(result, ".vscode/extensions.json");
        const dc = readValidJson(result, ".devcontainer/devcontainer.json");
        const vscodeRecs = ext.recommendations as string[];
        const dcExtensions = (dc.customizations as Record<string, Record<string, string[]>>).vscode
          .extensions;

        // Every VSCode recommended extension should also be in devcontainer
        for (const e of vscodeRecs) {
          expect(dcExtensions, `devcontainer should include VSCode extension "${e}"`).toContain(e);
        }
      });
    });
  }
});

// --- CI deduplication checks ---

describe("verify: CI deduplication", () => {
  it("cfn-lint appears only once when both CDK and CloudFormation are selected", () => {
    const result = generate(
      makeAnswers({
        languages: ["typescript"],
        clouds: ["aws"],
        iac: ["cdk", "cloudformation"],
      }),
    );
    const ci = result.readText(".github/workflows/ci.yaml");
    const matches = ci.match(/Lint \(cfn-lint\)/g) ?? [];
    expect(matches.length, "cfn-lint should appear exactly once in CI").toBe(1);
  });
});

// --- CD workflow per-IaC checks ---

describe("verify: CD workflows", () => {
  it("generates separate CD workflows for each IaC tool", () => {
    const result = generate(
      makeAnswers({
        languages: ["typescript"],
        clouds: ["aws", "azure"],
        iac: ["cdk", "cloudformation", "terraform", "bicep"],
      }),
    );
    expect(result.hasFile(".github/workflows/cd-cdk.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-cloudformation.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-terraform.yaml")).toBe(true);
    expect(result.hasFile(".github/workflows/cd-bicep.yaml")).toBe(true);
  });

  it("does not generate a single cd.yaml when multiple IaC tools are selected", () => {
    const result = generate(
      makeAnswers({
        languages: ["typescript"],
        clouds: ["aws", "azure"],
        iac: ["cdk", "bicep"],
      }),
    );
    expect(result.hasFile(".github/workflows/cd.yaml")).toBe(false);
  });
});

// --- Terraform file generation checks ---

describe("verify: Terraform preset", () => {
  it("generates main.tf placeholder", () => {
    const result = generate(
      makeAnswers({ languages: ["typescript"], clouds: ["aws"], iac: ["terraform"] }),
    );
    expect(result.hasFile("main.tf")).toBe(true);
  });

  it("adds Terraform entries to .gitignore", () => {
    const result = generate(
      makeAnswers({ languages: ["typescript"], clouds: ["aws"], iac: ["terraform"] }),
    );
    const gitignore = result.readText(".gitignore");
    expect(gitignore).toContain(".terraform/");
    expect(gitignore).toContain("*.tfstate");
  });
});

// --- .gitignore preset isolation ---

describe("verify: .gitignore preset isolation", () => {
  it("base-only does not include CDK or Python or Terraform entries", () => {
    const result = generate(makeAnswers());
    const gitignore = result.readText(".gitignore");
    expect(gitignore).not.toContain("cdk.out");
    expect(gitignore).not.toContain("__pycache__");
    expect(gitignore).not.toContain(".terraform/");
    expect(gitignore).not.toContain("*.d.ts");
  });

  it("CDK preset adds cdk.out to .gitignore", () => {
    const result = generate(makeAnswers({ clouds: ["aws"], iac: ["cdk"] }));
    const gitignore = result.readText(".gitignore");
    expect(gitignore).toContain("cdk.out/");
    expect(gitignore).toContain("!infra/**/*.d.ts");
  });

  it("Python preset adds __pycache__ to .gitignore", () => {
    const result = generate(makeAnswers({ languages: ["python"] }));
    const gitignore = result.readText(".gitignore");
    expect(gitignore).toContain("__pycache__/");
    expect(gitignore).toContain(".mypy_cache/");
  });
});

// --- CLAUDE.md MCP servers line ---

describe("verify: CLAUDE.md MCP servers", () => {
  it("no empty entries when both AWS and Azure are selected", () => {
    const result = generate(
      makeAnswers({ languages: ["typescript"], clouds: ["aws", "azure"], iac: ["terraform"] }),
    );
    const claude = result.readText("CLAUDE.md");
    const mcpLine = claude.split("\n").find((l) => l.includes("MCP servers"));
    expect(mcpLine).toBeDefined();
    expect(mcpLine).not.toMatch(/, ,/);
    expect(mcpLine).toContain("AWS IaC");
    expect(mcpLine).toContain("Azure");
  });

  it("has comma separator between base and injected MCP servers", () => {
    const result = generate(
      makeAnswers({ languages: ["typescript"], clouds: ["aws"], iac: ["terraform"] }),
    );
    const claude = result.readText("CLAUDE.md");
    const mcpLine = claude.split("\n").find((l) => l.includes("MCP servers"));
    expect(mcpLine).toBeDefined();
    // Ensure "Fetch (web)" is followed by ", AWS IaC" (not "Fetch (web)AWS IaC")
    expect(mcpLine).toContain("Fetch (web), AWS IaC");
  });
});

// --- Project Structure infra/ deduplication ---

describe("verify: infra/ structure deduplication", () => {
  it("CLAUDE.md shows single infra/ line for multiple IaC presets", () => {
    const result = generate(
      makeAnswers({
        languages: ["typescript"],
        clouds: ["aws", "azure"],
        iac: ["cdk", "cloudformation", "bicep"],
      }),
    );
    const claude = result.readText("CLAUDE.md");
    const infraLines = claude.split("\n").filter((l) => l.includes("infra/"));
    const structureInfra = infraLines.filter((l) => l.includes("->"));
    expect(structureInfra.length, "Should have exactly one infra/ -> line in structure").toBe(1);
    expect(structureInfra[0]).toContain("CDK");
    expect(structureInfra[0]).toContain("CloudFormation");
    expect(structureInfra[0]).toContain("Bicep");
  });

  it("README shows single infra/ line for multiple IaC presets", () => {
    const result = generate(
      makeAnswers({
        languages: ["typescript"],
        clouds: ["aws", "azure"],
        iac: ["cdk", "cloudformation", "bicep"],
      }),
    );
    const readme = result.readText("README.md");
    const infraLines = readme
      .split("\n")
      .filter((l) => l.includes("├── infra/") || l.includes("└── infra/"));
    expect(infraLines.length, "Should have exactly one infra/ line in dir structure").toBe(1);
    expect(infraLines[0]).toContain("CDK");
    expect(infraLines[0]).toContain("Bicep");
  });
});
