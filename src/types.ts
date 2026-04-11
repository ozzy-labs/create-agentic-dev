// --- Wizard ---

export interface WizardAnswers {
  projectName: string;
  frontend: "none" | "react" | "nextjs" | "vue" | "nuxt" | "sveltekit" | "astro";
  backend: "none" | "hono" | "fastapi" | "express" | "batch";
  clouds: Array<"aws" | "azure" | "gcp">;
  iac: Array<"cdk" | "cloudformation" | "terraform" | "bicep">;
  languages: Array<"typescript" | "python">;
  testing: Array<"playwright">;
  agents: Array<"claude-code" | "codex" | "gemini" | "amazon-q" | "copilot" | "cline" | "cursor">;
}

/** Answers for --apply mode (agent-only wizard). */
export interface ApplyAnswers {
  clouds: WizardAnswers["clouds"];
  agents: WizardAnswers["agents"];
}

// --- Markdown template ---

export interface MarkdownSection {
  /** e.g. "<!-- SECTION:TOOLS -->" */
  placeholder: string;
  content: string;
}

// --- CI workflow ---

export interface CiStep {
  name: string;
  run?: string;
  uses?: string;
  with?: Record<string, string>;
  id?: string;
}

export interface CiContribution {
  setupSteps?: CiStep[];
  lintSteps?: CiStep[];
  testSteps?: CiStep[];
  buildSteps?: CiStep[];
}

// --- MCP ---

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpConfigPath {
  path: string;
  format: "json" | "toml";
}

// --- Preset ---

export interface Preset {
  name: string;
  requires?: string[];
  /** Owned files: relative path → content */
  files: Record<string, string>;
  /** Shared files: relative path → partial object to deep-merge */
  merge: Record<string, unknown>;
  /** Markdown templates: relative path → sections to inject */
  markdown?: Record<string, MarkdownSection[]>;
  /** CI workflow contribution */
  ciSteps?: CiContribution;
  /** Extra commands for setup.sh */
  setupExtra?: string;
  /** devDependencies that should be removed if not referenced by any script */
  conditionalDevDeps?: string[];
  /** MCP server definitions (distributed to agent config files by generator) */
  mcpServers?: Record<string, McpServerConfig>;
  /** Path to agent-specific MCP config file (agent presets only) */
  mcpConfigPath?: McpConfigPath;
  /** Path to agent instruction file for Markdown section injection (agent presets only) */
  instructionFile?: string;
}

// --- File I/O abstraction ---

export interface FileWriter {
  write(path: string, content: string): void;
}

// --- Generator result (used by tests) ---

export interface GenerateResult {
  files: Map<string, string>;
  fileList(): string[];
  hasFile(path: string): boolean;
  readText(path: string): string;
  readJson(path: string): unknown;
  readYaml(path: string): unknown;
  readToml(path: string): unknown;
}
