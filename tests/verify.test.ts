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
  return { projectName: "verify-app", languages: [], frontend: "none", iac: "none", ...overrides };
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
    name: "cdk",
    answers: { iac: "cdk" },
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
    name: "cloudformation (ts)",
    answers: { languages: ["typescript"], iac: "cloudformation" },
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
    name: "terraform (ts)",
    answers: { languages: ["typescript"], iac: "terraform" },
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
    name: "bicep (ts)",
    answers: { languages: ["typescript"], iac: "bicep" },
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
    name: "bicep (python)",
    answers: { languages: ["python"], iac: "bicep" },
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
    name: "full config (ts + python + react + cdk)",
    answers: { languages: ["typescript", "python"], frontend: "react", iac: "cdk" },
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
