import { describe, expect, it } from "vitest";
import { generate } from "../../src/generator.js";
import { makeAnswers } from "../helpers.js";

describe("generate (playwright)", () => {
  const answers = makeAnswers({ testing: ["playwright"] });
  const result = generate(answers);

  it("forces TypeScript preset inclusion", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
  });

  it("includes Playwright owned files in e2e/", () => {
    expect(result.hasFile("e2e/playwright.config.ts")).toBe(true);
    expect(result.hasFile("e2e/example.spec.ts")).toBe(true);
    expect(result.hasFile("e2e/package.json")).toBe(true);
  });

  it("has Playwright dependencies in e2e/package.json", () => {
    const pkg = result.readJson("e2e/package.json") as Record<string, unknown>;
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps["@playwright/test"]).toBeDefined();
  });

  it("merges test:e2e script into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["test:e2e"]).toContain("pnpm test");
  });

  it("adds Playwright-related entries to .gitignore", () => {
    const gitignore = result.readText(".gitignore");
    expect(gitignore).toContain("playwright-report/");
    expect(gitignore).toContain("test-results/");
  });

  it("adds Playwright CI steps", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const jobs = ci.jobs as Record<string, Record<string, unknown>>;
    const steps = jobs["lint-and-check"].steps as Array<Record<string, unknown>>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Install E2E dependencies");
    expect(stepNames).toContain("Install Playwright browsers");
    expect(stepNames).toContain("Test (E2E Playwright)");
  });

  it("adds E2E install to setup.sh", () => {
    const setup = result.readText("scripts/setup.sh");
    expect(setup).toContain("cd e2e && pnpm install");
    expect(setup).toContain("npx playwright install");
  });

  it("generates pnpm-workspace.yaml with e2e", () => {
    expect(result.hasFile("pnpm-workspace.yaml")).toBe(true);
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- e2e");
  });

  it("distributes Playwright MCP server to agent configs", () => {
    const mcp = result.readJson(".mcp.json") as Record<string, Record<string, unknown>>;
    expect(mcp.mcpServers.playwright).toBeDefined();
  });

  it("expands AGENTS.md with Playwright sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("Playwright");
    expect(agents).toContain("e2e/");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("replaces {{projectName}} in e2e/package.json", () => {
    const pkg = result.readText("e2e/package.json");
    expect(pkg).toContain("test-app-e2e");
    expect(pkg).not.toContain("{{projectName}}");
  });

  it("uses default port (3000) in playwright.config.ts when no frontend", () => {
    const config = result.readText("e2e/playwright.config.ts");
    expect(config).toContain("localhost:3000");
    expect(config).not.toContain("{{devPort}}");
  });
});

describe("generate (react + playwright)", () => {
  const answers = makeAnswers({ frontend: "react", testing: ["playwright"] });
  const result = generate(answers);

  it("workspace includes both web and e2e", () => {
    const workspace = result.readText("pnpm-workspace.yaml");
    expect(workspace).toContain("- web");
    expect(workspace).toContain("- e2e");
  });

  it("AGENTS.md contains both React and Playwright sections", () => {
    const agents = result.readText("AGENTS.md");
    expect(agents).toContain("React");
    expect(agents).toContain("Playwright");
    expect(agents).not.toContain("<!-- SECTION:");
  });

  it("uses Vite port (5173) in playwright.config.ts for React", () => {
    const config = result.readText("e2e/playwright.config.ts");
    expect(config).toContain("localhost:5173");
    expect(config).not.toContain("localhost:3000");
  });
});

describe("generate (nextjs + playwright)", () => {
  const answers = makeAnswers({ frontend: "nextjs", testing: ["playwright"] });
  const result = generate(answers);

  it("uses Next.js port (3000) in playwright.config.ts", () => {
    const config = result.readText("e2e/playwright.config.ts");
    expect(config).toContain("localhost:3000");
  });
});

describe("generate (astro + playwright)", () => {
  const answers = makeAnswers({ frontend: "astro", testing: ["playwright"] });
  const result = generate(answers);

  it("uses Astro port (4321) in playwright.config.ts", () => {
    const config = result.readText("e2e/playwright.config.ts");
    expect(config).toContain("localhost:4321");
  });
});
