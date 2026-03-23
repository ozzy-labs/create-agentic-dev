// --- Wizard ---

export interface WizardAnswers {
  projectName: string;
  frontend: "none" | "react" | "nextjs";
  backend: "none" | "fastapi" | "express";
  clouds: Array<"aws" | "azure" | "gcp">;
  iac: Array<"cdk" | "cloudformation" | "terraform" | "bicep">;
  languages: Array<"typescript" | "python">;
  agents: Array<"claude-code" | "codex">;
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
