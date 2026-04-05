import { stringify as stringifyYaml } from "yaml";
import type { CiContribution, CiStep } from "./types.js";

interface CiWorkflowOptions {
  contributions: CiContribution[];
  hasTest: boolean;
  hasBuild: boolean;
}

/** Build a complete ci.yaml from preset CI contributions. */
export function buildCiWorkflow({ contributions, hasTest, hasBuild }: CiWorkflowOptions): string {
  const setupSteps: CiStep[] = [];
  const lintSteps: CiStep[] = [];
  const testSteps: CiStep[] = [];
  const buildSteps: CiStep[] = [];

  for (const c of contributions) {
    if (c.setupSteps) setupSteps.push(...c.setupSteps);
    if (c.lintSteps) lintSteps.push(...c.lintSteps);
    if (c.testSteps) testSteps.push(...c.testSteps);
    if (c.buildSteps) buildSteps.push(...c.buildSteps);
  }

  // Deduplicate steps by name (last-wins)
  const dedup = (steps: CiStep[]): CiStep[] => {
    const seen = new Map<string, CiStep>();
    for (const step of steps) {
      seen.set(step.name, step);
    }
    return [...seen.values()];
  };

  const dedupedSetup = dedup(setupSteps);
  const dedupedLint = dedup(lintSteps);
  const dedupedTest = dedup(testSteps);
  const dedupedBuild = dedup(buildSteps);

  // Common setup: checkout + mise
  const commonSetup: CiStep[] = [
    {
      name: "Checkout",
      uses: "actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5",
    },
    {
      name: "Setup mise",
      uses: "jdx/mise-action@c37c93293d6b742fc901e1406b8f764f6fb19dac",
      with: { install: "true", cache: "true" },
    },
  ];

  const allSteps = [...commonSetup, ...dedupedSetup, ...dedupedLint];
  if (hasTest) allSteps.push(...dedupedTest);
  if (hasBuild) allSteps.push(...dedupedBuild);

  const workflow = {
    name: "CI",
    on: {
      push: { branches: ["main"] },
      pull_request: { branches: ["main"] },
    },
    permissions: { contents: "read" },
    concurrency: {
      // biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression syntax
      group: "${{ github.workflow }}-${{ github.ref }}",
      "cancel-in-progress": true,
    },
    jobs: {
      "lint-and-check": {
        "runs-on": "ubuntu-latest",
        steps: allSteps.map(formatStep),
      },
    },
  };

  return stringifyYaml(workflow, { lineWidth: 120 });
}

function formatStep(step: CiStep): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (step.uses) {
    result.name = step.name;
    result.uses = step.uses;
    if (step.with) result.with = step.with;
  } else {
    result.name = step.name;
    if (step.run) result.run = step.run;
  }
  if (step.id) result.id = step.id;
  return result;
}
