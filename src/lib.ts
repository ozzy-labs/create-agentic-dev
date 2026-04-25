/**
 * Public API for external preset authors.
 *
 * External preset packages (e.g. `@ozzylabs/preset-*`) consume this entry to
 * import the `Preset` type and helpers. Importing from the package's main
 * entry (`@ozzylabs/create-agentic-app`) yields these exports.
 */

export type {
  CiContribution,
  CiStep,
  MarkdownSection,
  McpConfigPath,
  McpServerConfig,
  Preset,
} from "./types.js";
export { readTemplateFiles } from "./utils.js";
