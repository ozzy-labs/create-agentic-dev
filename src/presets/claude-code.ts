import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";
import { buildClaudeInstruction } from "./instruction-template.js";
import { DEFAULT_MCP_SERVERS } from "./shared.js";

export const claudeCodePreset: Preset = {
  name: "claude-code",
  mcpConfigPath: { path: ".mcp.json", format: "json" },
  files: { ...readTemplateFiles("claude-code"), "CLAUDE.md": buildClaudeInstruction() },
  merge: {
    ".gitignore": ".claude/settings.local.json",
    ".devcontainer/devcontainer.json": {
      mounts: [
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        "source=${localEnv:HOME}/.claude.json,target=/home/vscode/.claude.json,type=bind,consistency=cached",
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        "source=${localEnv:HOME}/.claude/.credentials.json,target=/home/vscode/.claude/.credentials.json,type=bind,readonly,consistency=cached",
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        "source=${localEnv:HOME}/.claude/projects,target=/home/vscode/.claude/projects,type=bind,consistency=cached",
        // biome-ignore lint/suspicious/noTemplateCurlyInString: devcontainer variable syntax
        "source=${localEnv:HOME}/.claude/settings.json,target=/home/vscode/.claude/settings.json,type=bind,readonly,consistency=cached",
      ],
    },
  },
  mcpServers: { ...DEFAULT_MCP_SERVERS },
  markdown: {
    "agent-instructions": [],
    "README.md": [],
  },
};
