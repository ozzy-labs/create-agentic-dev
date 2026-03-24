import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock @clack/prompts ---
// We intercept group() to execute each prompt callback with simulated answers,
// and stub the individual prompt helpers (text, select, multiselect) to return
// pre-configured values that the test controls via `mockAnswers`.

interface MockAnswers {
  projectName?: string;
  frontend?: "none" | "react" | "nextjs" | "vue" | "nuxt";
  backend?: "none" | "fastapi" | "express" | "batch";
  clouds?: Array<"aws" | "azure" | "gcp">;
  iac?: Array<"cdk" | "cloudformation" | "terraform" | "bicep">;
  languages?: Array<"typescript" | "python">;
  agents?: Array<"claude-code" | "codex" | "gemini" | "amazon-q" | "copilot" | "cline" | "cursor">;
}

let mockAnswers: MockAnswers = {};

// Track calls to p.log.info for verifying auto-selected language messages
let logInfoCalls: string[] = [];

vi.mock("@clack/prompts", () => {
  const intro = vi.fn();
  const cancel = vi.fn();
  const log = { info: vi.fn((msg: string) => logInfoCalls.push(msg)) };

  // group() faithfully executes each callback in order, accumulating results,
  // exactly like the real implementation. The individual prompt mocks below
  // supply the "user input".
  const group = vi.fn(
    async (
      prompts: Record<string, (opts: { results: Record<string, unknown> }) => unknown>,
      _opts?: { onCancel?: () => void },
    ) => {
      const results: Record<string, unknown> = {};
      for (const [key, fn] of Object.entries(prompts)) {
        const value = await fn({ results });
        // undefined means the question was skipped (conditional)
        if (value !== undefined) {
          results[key] = value;
        }
      }
      return results;
    },
  );

  const text = vi.fn(async () => mockAnswers.projectName ?? "my-app");
  const select = vi.fn(async () => "none");
  const multiselect = vi.fn(async () => []);

  return { intro, cancel, log, group, text, select, multiselect };
});

// Import after mocking
import * as p from "@clack/prompts";
import { runWizard } from "../src/cli.js";

/** Configure mock answers and set up prompt return values. */
function setupMock(answers: MockAnswers): void {
  mockAnswers = answers;
  logInfoCalls = [];

  const textMock = vi.mocked(p.text);
  textMock.mockResolvedValue(answers.projectName ?? "my-app");

  // select is called twice: frontend then backend
  const selectMock = vi.mocked(p.select);
  selectMock
    .mockResolvedValueOnce(answers.frontend ?? "none")
    .mockResolvedValueOnce(answers.backend ?? "none");

  // multiselect call order: clouds, (iac if clouds), (languages if needed), agents
  const multiselectMock = vi.mocked(p.multiselect);
  const multiselectReturns: unknown[] = [];

  // 1. clouds
  multiselectReturns.push(answers.clouds ?? []);
  // 2. iac (only called if clouds.length > 0)
  if ((answers.clouds ?? []).length > 0) {
    multiselectReturns.push(answers.iac ?? []);
  }
  // 3. languages (only called if not all auto-resolved)
  const needsLanguagePrompt = shouldShowLanguagePrompt(answers);
  if (needsLanguagePrompt) {
    multiselectReturns.push(answers.languages ?? []);
  }
  // 4. agents
  multiselectReturns.push(answers.agents ?? ["claude-code"]);

  multiselectMock.mockReset();
  for (const val of multiselectReturns) {
    multiselectMock.mockResolvedValueOnce(val);
  }
}

/** Predict whether the languages multiselect will be shown. */
function shouldShowLanguagePrompt(answers: MockAnswers): boolean {
  const frontend = answers.frontend ?? "none";
  const backend = answers.backend ?? "none";
  const iac = answers.iac ?? [];

  let hasTypeScript = false;
  let hasPython = false;

  if (["react", "nextjs", "vue", "nuxt"].includes(frontend)) hasTypeScript = true;
  if (backend === "express" || backend === "batch") hasTypeScript = true;
  if (iac.includes("cdk")) hasTypeScript = true;
  if (backend === "fastapi") hasPython = true;

  // If both are auto-resolved, the prompt is skipped
  return !(hasTypeScript && hasPython);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAnswers = {};
  logInfoCalls = [];
});

describe("CLI Wizard E2E", () => {
  describe("basic flow", () => {
    it("returns correct WizardAnswers with minimal selections", async () => {
      setupMock({ projectName: "test-project", agents: ["claude-code"] });

      const result = await runWizard();

      expect(result).toEqual({
        projectName: "test-project",
        frontend: "none",
        backend: "none",
        clouds: [],
        iac: [],
        languages: [],
        agents: ["claude-code"],
      });
    });

    it("passes defaultName as initialValue to text prompt", async () => {
      setupMock({ projectName: "provided-name" });

      await runWizard("default-name");

      const textMock = vi.mocked(p.text);
      expect(textMock).toHaveBeenCalledOnce();
      const callArg = textMock.mock.calls[0][0];
      expect(callArg).toHaveProperty("initialValue", "default-name");
    });

    it("trims whitespace from project name", async () => {
      setupMock({ projectName: "  spaced-name  " });

      const result = await runWizard();

      expect(result.projectName).toBe("spaced-name");
    });
  });

  describe("frontend and backend selections", () => {
    it("returns selected frontend framework", async () => {
      setupMock({ frontend: "react", agents: [] });

      const result = await runWizard();

      expect(result.frontend).toBe("react");
    });

    it("returns selected backend framework", async () => {
      setupMock({ backend: "express", agents: [] });

      const result = await runWizard();

      expect(result.backend).toBe("express");
    });

    it("returns both frontend and backend", async () => {
      setupMock({ frontend: "nextjs", backend: "fastapi", agents: [] });

      const result = await runWizard();

      expect(result.frontend).toBe("nextjs");
      expect(result.backend).toBe("fastapi");
    });
  });

  describe("cloud and IaC conditional flow", () => {
    it("skips IaC question when no clouds selected", async () => {
      setupMock({ clouds: [], agents: [] });

      const result = await runWizard();

      expect(result.clouds).toEqual([]);
      expect(result.iac).toEqual([]);
    });

    it("shows IaC question when clouds are selected", async () => {
      setupMock({
        clouds: ["aws"],
        iac: ["cdk"],
        agents: [],
      });

      const result = await runWizard();

      expect(result.clouds).toEqual(["aws"]);
      expect(result.iac).toEqual(["cdk"]);
    });

    it("returns multiple clouds and IaC tools", async () => {
      setupMock({
        clouds: ["aws", "azure"],
        iac: ["terraform"],
        agents: [],
      });

      const result = await runWizard();

      expect(result.clouds).toEqual(["aws", "azure"]);
      expect(result.iac).toEqual(["terraform"]);
    });
  });

  describe("dependency chains — language auto-selection", () => {
    it("React forces TypeScript — logs auto-selected message", async () => {
      setupMock({ frontend: "react", agents: [] });

      await runWizard();

      expect(logInfoCalls.some((msg) => msg.includes("TypeScript"))).toBe(true);
    });

    it("Next.js forces TypeScript", async () => {
      setupMock({ frontend: "nextjs", agents: [] });

      await runWizard();

      expect(logInfoCalls.some((msg) => msg.includes("TypeScript"))).toBe(true);
    });

    it("Express forces TypeScript", async () => {
      setupMock({ backend: "express", agents: [] });

      await runWizard();

      expect(logInfoCalls.some((msg) => msg.includes("TypeScript"))).toBe(true);
    });

    it("FastAPI forces Python", async () => {
      setupMock({ backend: "fastapi", agents: [] });

      await runWizard();

      expect(logInfoCalls.some((msg) => msg.includes("Python"))).toBe(true);
    });

    it("React + FastAPI auto-resolves both languages — skips language prompt", async () => {
      setupMock({ frontend: "react", backend: "fastapi", agents: [] });

      const result = await runWizard();

      // Both languages auto-resolved — languages prompt was skipped (returned undefined)
      expect(result.languages).toEqual([]);

      // Both auto-selection messages should appear
      expect(logInfoCalls.some((msg) => msg.includes("TypeScript"))).toBe(true);
      expect(logInfoCalls.some((msg) => msg.includes("Python"))).toBe(true);
    });

    it("CDK forces TypeScript", async () => {
      setupMock({ clouds: ["aws"], iac: ["cdk"], agents: [] });

      await runWizard();

      expect(logInfoCalls.some((msg) => msg.includes("TypeScript"))).toBe(true);
    });
  });

  describe("language manual selection", () => {
    it("allows manual TypeScript selection when no framework forces it", async () => {
      setupMock({ languages: ["typescript"], agents: [] });

      const result = await runWizard();

      expect(result.languages).toEqual(["typescript"]);
    });

    it("allows manual Python selection when no framework forces it", async () => {
      setupMock({ languages: ["python"], agents: [] });

      const result = await runWizard();

      expect(result.languages).toEqual(["python"]);
    });

    it("allows both languages selected manually", async () => {
      setupMock({ languages: ["typescript", "python"], agents: [] });

      const result = await runWizard();

      expect(result.languages).toEqual(["typescript", "python"]);
    });
  });

  describe("agent selection", () => {
    it("returns selected agents", async () => {
      setupMock({ agents: ["claude-code", "copilot", "cursor"] });

      const result = await runWizard();

      expect(result.agents).toEqual(["claude-code", "copilot", "cursor"]);
    });

    it("allows empty agent selection", async () => {
      setupMock({ agents: [] });

      const result = await runWizard();

      expect(result.agents).toEqual([]);
    });

    it("returns all agents when all selected", async () => {
      const allAgents = [
        "claude-code",
        "codex",
        "gemini",
        "amazon-q",
        "copilot",
        "cline",
        "cursor",
      ] as const;
      setupMock({ agents: [...allAgents] });

      const result = await runWizard();

      expect(result.agents).toEqual([...allAgents]);
    });
  });

  describe("full combination flow", () => {
    it("handles full-stack selection: React + Express + AWS + CDK + all agents", async () => {
      setupMock({
        projectName: "full-stack-app",
        frontend: "react",
        backend: "express",
        clouds: ["aws"],
        iac: ["cdk"],
        agents: ["claude-code", "copilot"],
      });

      const result = await runWizard();

      expect(result).toEqual({
        projectName: "full-stack-app",
        frontend: "react",
        backend: "express",
        clouds: ["aws"],
        iac: ["cdk"],
        languages: [],
        agents: ["claude-code", "copilot"],
      });
    });

    it("handles multi-cloud with terraform", async () => {
      setupMock({
        projectName: "multi-cloud",
        clouds: ["aws", "azure", "gcp"],
        iac: ["terraform"],
        languages: ["typescript"],
        agents: ["claude-code"],
      });

      const result = await runWizard();

      expect(result).toEqual({
        projectName: "multi-cloud",
        frontend: "none",
        backend: "none",
        clouds: ["aws", "azure", "gcp"],
        iac: ["terraform"],
        languages: ["typescript"],
        agents: ["claude-code"],
      });
    });
  });

  describe("project name validation", () => {
    it("text prompt has validation function", async () => {
      setupMock({});

      await runWizard();

      const textMock = vi.mocked(p.text);
      const callArg = textMock.mock.calls[0][0];
      expect(callArg).toHaveProperty("validate");
      expect(typeof callArg.validate).toBe("function");
    });

    it("validation rejects empty name", async () => {
      setupMock({});

      await runWizard();

      const validate = vi.mocked(p.text).mock.calls[0][0].validate as (
        v: string,
      ) => string | undefined;
      expect(validate("")).toBeTruthy();
      expect(validate("   ")).toBeTruthy();
    });

    it("validation rejects invalid characters", async () => {
      setupMock({});

      await runWizard();

      const validate = vi.mocked(p.text).mock.calls[0][0].validate as (
        v: string,
      ) => string | undefined;
      expect(validate("invalid name!")).toBeTruthy();
      expect(validate("@scope/pkg")).toBeTruthy();
    });

    it("validation accepts valid names", async () => {
      setupMock({});

      await runWizard();

      const validate = vi.mocked(p.text).mock.calls[0][0].validate as (
        v: string,
      ) => string | undefined;
      expect(validate("my-app")).toBeUndefined();
      expect(validate("my_app.v2")).toBeUndefined();
      expect(validate("App123")).toBeUndefined();
    });
  });

  describe("wizard → generate integration", () => {
    it("wizard output is valid input for generate()", async () => {
      const { generate } = await import("../src/generator.js");

      setupMock({
        projectName: "integration-test",
        frontend: "react",
        backend: "fastapi",
        clouds: ["aws"],
        iac: ["cdk"],
        agents: ["claude-code", "codex"],
      });

      const answers = await runWizard();
      const result = generate(answers);

      expect(result.fileList().length).toBeGreaterThan(0);
      expect(result.hasFile("package.json")).toBe(true);
    });
  });
});
