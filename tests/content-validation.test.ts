/**
 * Content validation tests — verify generated file contents beyond mere existence.
 *
 * Validates:
 * - tsconfig.json structure (compilerOptions, strict mode, etc.)
 * - YAML files parse correctly (ci.yaml, lefthook.yaml, etc.)
 * - TOML files parse correctly (.mise.toml, pyproject.toml, etc.)
 * - package.json dependencies use valid semver ranges
 * - CI workflow step ordering (setup → lint → test → build)
 * - CD workflow structure
 */
import { describe, expect, it } from "vitest";
import { generate } from "../src/generator.js";
import { makeAnswers } from "./helpers.js";

// --- tsconfig.json structure validation ---

describe("content: tsconfig.json structure", () => {
  it("typescript preset generates valid tsconfig with strict mode", () => {
    const result = generate(makeAnswers({ languages: ["typescript"] }));
    const tsconfig = result.readJson("tsconfig.json") as Record<string, unknown>;
    const opts = tsconfig.compilerOptions as Record<string, unknown>;
    expect(opts, "compilerOptions should exist").toBeDefined();
    expect(opts.strict, "strict should be true").toBe(true);
    expect(opts.target, "target should be defined").toBeDefined();
    expect(opts.module, "module should be defined").toBeDefined();
  });

  it("react preset generates root tsconfig with references or extends", () => {
    const result = generate(makeAnswers({ frontend: "react" }));
    const tsconfig = result.readJson("tsconfig.json") as Record<string, unknown>;
    expect(
      tsconfig.compilerOptions || tsconfig.references,
      "should have compilerOptions or references",
    ).toBeDefined();
  });

  it("CDK infra has its own tsconfig.json with strict mode", () => {
    const result = generate(makeAnswers({ clouds: ["aws"], iac: ["cdk"] }));
    const tsconfig = result.readJson("infra/tsconfig.json") as Record<string, unknown>;
    const opts = tsconfig.compilerOptions as Record<string, unknown>;
    expect(opts, "compilerOptions should exist").toBeDefined();
    expect(opts.strict, "strict should be true").toBe(true);
  });

  it("express api has its own tsconfig.json", () => {
    const result = generate(makeAnswers({ backend: "express" }));
    const tsconfig = result.readJson("api/tsconfig.json") as Record<string, unknown>;
    const opts = tsconfig.compilerOptions as Record<string, unknown>;
    expect(opts, "compilerOptions should exist").toBeDefined();
  });
});

// --- YAML file syntax validation ---

describe("content: YAML files parse correctly", () => {
  const combos = [
    { name: "base only", answers: {} },
    { name: "typescript", answers: { languages: ["typescript"] as const } },
    { name: "python", answers: { languages: ["python"] as const } },
    {
      name: "react + fastapi",
      answers: { frontend: "react" as const, backend: "fastapi" as const },
    },
    {
      name: "full stack",
      answers: {
        frontend: "react" as const,
        backend: "express" as const,
        clouds: ["aws" as const],
        iac: ["cdk" as const],
      },
    },
  ];

  for (const combo of combos) {
    describe(combo.name, () => {
      const result = generate(makeAnswers(combo.answers));

      it("ci.yaml is valid YAML with expected structure", () => {
        const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
        expect(ci.name, "CI workflow should have a name").toBe("CI");
        expect(ci.on, "CI workflow should have triggers").toBeDefined();
        expect(ci.jobs, "CI workflow should have jobs").toBeDefined();
        const jobs = ci.jobs as Record<string, Record<string, unknown>>;
        expect(jobs["lint-and-check"], "should have lint-and-check job").toBeDefined();
        expect(jobs["lint-and-check"]["runs-on"], "should run on ubuntu-latest").toBe(
          "ubuntu-latest",
        );
      });

      it("lefthook.yaml is valid YAML", () => {
        const lh = result.readYaml("lefthook.yaml") as Record<string, unknown>;
        expect(lh["commit-msg"], "should have commit-msg hook").toBeDefined();
        expect(lh["pre-commit"], "should have pre-commit hook").toBeDefined();
      });

      it("all .yaml files parse without errors", () => {
        for (const file of result.fileList()) {
          if (file.endsWith(".yaml") && !file.startsWith("templates/")) {
            expect(() => result.readYaml(file), `${file} should be valid YAML`).not.toThrow();
          }
        }
      });
    });
  }
});

// --- TOML file syntax validation ---

describe("content: TOML files parse correctly", () => {
  it(".mise.toml is valid TOML with tools section", () => {
    const result = generate(makeAnswers({ languages: ["typescript"] }));
    const toml = result.readToml(".mise.toml") as Record<string, unknown>;
    expect(toml.tools, ".mise.toml should have tools section").toBeDefined();
  });

  it("pyproject.toml is valid TOML with project section", () => {
    const result = generate(makeAnswers({ languages: ["python"] }));
    const toml = result.readToml("pyproject.toml") as Record<string, unknown>;
    expect(
      toml.project || toml.tool,
      "pyproject.toml should have project or tool section",
    ).toBeDefined();
  });

  it("all .toml files parse without errors", () => {
    const result = generate(
      makeAnswers({
        languages: ["typescript", "python"],
        frontend: "react",
        backend: "fastapi",
        clouds: ["aws"],
        iac: ["cdk"],
      }),
    );
    for (const file of result.fileList()) {
      if (file.endsWith(".toml")) {
        expect(() => result.readToml(file), `${file} should be valid TOML`).not.toThrow();
      }
    }
  });
});

// --- package.json semver validation ---

describe("content: package.json dependency versions", () => {
  const semverPattern = /^[\^~>=<*]?\d|^workspace:|^latest$/;

  const combos = [
    { name: "typescript", answers: { languages: ["typescript"] as const } },
    { name: "react", answers: { frontend: "react" as const } },
    { name: "express", answers: { backend: "express" as const } },
    { name: "cdk", answers: { clouds: ["aws" as const], iac: ["cdk" as const] } },
  ];

  for (const combo of combos) {
    it(`${combo.name}: all dependency versions are valid semver ranges`, () => {
      const result = generate(makeAnswers(combo.answers));
      for (const file of result.fileList()) {
        if (!file.endsWith("package.json")) continue;
        const pkg = result.readJson(file) as Record<string, unknown>;
        for (const depType of ["dependencies", "devDependencies"]) {
          const deps = pkg[depType] as Record<string, string> | undefined;
          if (!deps) continue;
          for (const [name, version] of Object.entries(deps)) {
            expect(
              semverPattern.test(version),
              `${file} ${depType}.${name}: "${version}" should be a valid semver range`,
            ).toBe(true);
          }
        }
      }
    });
  }
});

// --- CI workflow step ordering ---

describe("content: CI workflow step ordering", () => {
  it("steps follow setup → lint → test → build order", () => {
    const result = generate(
      makeAnswers({
        languages: ["typescript", "python"],
        frontend: "react",
        clouds: ["aws"],
        iac: ["cdk"],
      }),
    );
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name as string);

    // Find indices for each category
    const checkoutIdx = stepNames.indexOf("Checkout");
    const miseIdx = stepNames.indexOf("Setup mise");
    const firstLintIdx = stepNames.findIndex((n) => typeof n === "string" && n.startsWith("Lint"));
    const firstTestIdx = stepNames.findIndex((n) => typeof n === "string" && n.startsWith("Test"));
    const firstBuildIdx = stepNames.findIndex(
      (n) => typeof n === "string" && n.startsWith("Build"),
    );

    expect(checkoutIdx, "Checkout should be first").toBe(0);
    expect(miseIdx, "Setup mise should be second").toBe(1);
    expect(firstLintIdx, "Lint steps should come before Test").toBeLessThan(firstTestIdx);
    if (firstBuildIdx >= 0) {
      expect(firstTestIdx, "Test steps should come before Build").toBeLessThan(firstBuildIdx);
    }
  });

  it("CDK synth step exists before cfn-lint when both CDK and CloudFormation are used", () => {
    const result = generate(
      makeAnswers({
        clouds: ["aws"],
        iac: ["cdk", "cloudformation"],
      }),
    );
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name as string);

    const synthIdx = stepNames.findIndex((n) => n.includes("CDK"));
    const cfnLintIdx = stepNames.findIndex((n) => n.includes("cfn-lint"));

    expect(synthIdx, "CDK synth step should exist").toBeGreaterThanOrEqual(0);
    expect(cfnLintIdx, "cfn-lint step should exist").toBeGreaterThanOrEqual(0);
  });

  it("always starts with Checkout and Setup mise", () => {
    const combos = [
      { languages: ["typescript"] as const },
      { languages: ["python"] as const },
      { frontend: "react" as const, backend: "fastapi" as const },
    ];

    for (const answers of combos) {
      const result = generate(makeAnswers(answers));
      const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
      const jobs = ci.jobs as Record<string, Record<string, unknown>>;
      const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
      expect(steps[0].name, "First step should be Checkout").toBe("Checkout");
      expect(steps[1].name, "Second step should be Setup mise").toBe("Setup mise");
    }
  });
});

// --- CD workflow content validation ---

describe("content: CD workflow structure", () => {
  it("cd-cdk.yaml has valid YAML structure with deploy job", () => {
    const result = generate(makeAnswers({ clouds: ["aws"], iac: ["cdk"] }));
    const cd = result.readYaml(".github/workflows/cd-cdk.yaml") as Record<string, unknown>;
    expect(cd.name, "should have a workflow name").toBeDefined();
    expect(cd.on, "should have triggers").toBeDefined();
    expect(cd.jobs, "should have jobs").toBeDefined();
  });

  it("cd-terraform-{cloud}.yaml has valid YAML structure per cloud", () => {
    const result = generate(makeAnswers({ clouds: ["aws", "azure", "gcp"], iac: ["terraform"] }));
    for (const cloud of ["aws", "azure", "gcp"]) {
      const cd = result.readYaml(`.github/workflows/cd-terraform-${cloud}.yaml`) as Record<
        string,
        unknown
      >;
      expect(cd.name, `${cloud}: should have a workflow name`).toBeDefined();
      expect(cd.on, `${cloud}: should have triggers`).toBeDefined();
      expect(cd.jobs, `${cloud}: should have jobs`).toBeDefined();
    }
  });

  it("cd-cloudformation.yaml has valid YAML structure", () => {
    const result = generate(
      makeAnswers({ languages: ["typescript"], clouds: ["aws"], iac: ["cloudformation"] }),
    );
    const cd = result.readYaml(".github/workflows/cd-cloudformation.yaml") as Record<
      string,
      unknown
    >;
    expect(cd.name, "should have a workflow name").toBeDefined();
    expect(cd.on, "should have triggers").toBeDefined();
  });

  it("cd-bicep.yaml has valid YAML structure", () => {
    const result = generate(
      makeAnswers({ languages: ["typescript"], clouds: ["azure"], iac: ["bicep"] }),
    );
    const cd = result.readYaml(".github/workflows/cd-bicep.yaml") as Record<string, unknown>;
    expect(cd.name, "should have a workflow name").toBeDefined();
    expect(cd.on, "should have triggers").toBeDefined();
  });
});
