import type { Preset } from "../types.js";
import { amazonQPreset } from "./amazon-q.js";
import { astroPreset } from "./astro.js";
import { awsPreset } from "./aws.js";
import { azurePreset } from "./azure.js";
import { basePreset } from "./base.js";
import { batchPreset } from "./batch.js";
import { bicepPreset } from "./bicep.js";
import { cdkPreset } from "./cdk.js";
import { claudeCodePreset } from "./claude-code.js";
import { clinePreset } from "./cline.js";
import { cloudformationPreset } from "./cloudformation.js";
import { codexPreset } from "./codex.js";
import { copilotPreset } from "./copilot.js";
import { cursorPreset } from "./cursor.js";
import { expressPreset } from "./express.js";
import { fastapiPreset } from "./fastapi.js";
import { gcpPreset } from "./gcp.js";
import { geminiPreset } from "./gemini.js";
import { honoPreset } from "./hono.js";
import { nextjsPreset } from "./nextjs.js";
import { nuxtPreset } from "./nuxt.js";
import { pythonPreset } from "./python.js";
import { reactPreset } from "./react.js";
import { sveltekitPreset } from "./sveltekit.js";
import { terraformPreset } from "./terraform.js";
import { typescriptPreset } from "./typescript.js";
import { vuePreset } from "./vue.js";

/**
 * Ordered preset entries — defines both the canonical merge order and the full preset registry.
 * New presets must be added here in the correct position.
 */
const PRESET_ENTRIES: ReadonlyArray<readonly [string, Preset]> = [
  ["base", basePreset],
  ["typescript", typescriptPreset],
  ["python", pythonPreset],
  ["react", reactPreset],
  ["nextjs", nextjsPreset],
  ["vue", vuePreset],
  ["nuxt", nuxtPreset],
  ["sveltekit", sveltekitPreset],
  ["astro", astroPreset],
  ["hono", honoPreset],
  ["fastapi", fastapiPreset],
  ["express", expressPreset],
  ["batch", batchPreset],
  ["aws", awsPreset],
  ["azure", azurePreset],
  ["gcp", gcpPreset],
  ["cdk", cdkPreset],
  ["cloudformation", cloudformationPreset],
  ["terraform", terraformPreset],
  ["bicep", bicepPreset],
  ["claude-code", claudeCodePreset],
  ["codex", codexPreset],
  ["gemini", geminiPreset],
  ["amazon-q", amazonQPreset],
  ["copilot", copilotPreset],
  ["cline", clinePreset],
  ["cursor", cursorPreset],
];

/** All presets keyed by name. Derived from PRESET_ENTRIES. */
export const ALL_PRESETS: Record<string, Preset> = Object.fromEntries(PRESET_ENTRIES);

/** Canonical application order for presets. Derived from PRESET_ENTRIES. */
export const PRESET_ORDER: string[] = PRESET_ENTRIES.map(([name]) => name);

// Validate that all preset `requires` entries reference known presets (fail-fast at import time)
for (const [name, preset] of PRESET_ENTRIES) {
  if (!preset.requires) continue;
  for (const req of preset.requires) {
    if (!(req in ALL_PRESETS)) {
      throw new Error(`Preset "${name}" requires unknown preset "${req}"`);
    }
  }
}
