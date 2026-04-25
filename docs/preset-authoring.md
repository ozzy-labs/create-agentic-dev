# Preset Authoring Guide

This guide explains how to create and modify presets for `create-agentic-app`.

## Overview

Each preset provides two types of contributions to the generated project:

1. **Owned files** (`files`) — files exclusively owned by the preset, copied as-is
2. **Merge contributions** (`merge`) — partial configs deep-merged into shared files

Additionally, presets can contribute:

- **Markdown sections** (`markdown`) — content injected into CLAUDE.md / README.md templates
- **CI steps** (`ciSteps`) — steps added to the generated CI workflow
- **Setup commands** (`setupExtra`) — extra commands for `scripts/setup.sh`

## Preset Interface

```typescript
interface Preset {
  name: string;
  requires?: string[];            // dependency presets (auto-resolved)
  files: Record<string, string>;  // owned files: relative path → content
  merge: Record<string, unknown>; // shared files: relative path → partial object
  markdown?: Record<string, MarkdownSection[]>;
  ciSteps?: CiContribution;
  setupExtra?: string;
  conditionalDevDeps?: string[];  // devDeps removed if unused by scripts
  mcpServers?: Record<string, McpServerConfig>;  // MCP servers (distributed to agent configs)
  mcpConfigPath?: McpConfigPath;  // agent MCP config file path (agent presets only)
  instructionFile?: string;       // agent instruction file path (agent presets only)
}
```

`mcpConfigPath` and `instructionFile` are used by **agent presets only**. The generator uses these fields to distribute MCP servers and markdown sections to each agent's config/instruction file.

## Step-by-Step: Adding a New Preset

### 1. Create template files

Add owned files under `templates/<preset-name>/`:

```text
templates/
└── vue/
    ├── vite.config.ts
    ├── src/
    │   ├── App.vue
    │   └── main.ts
    └── public/
        └── index.html
```

These files are read by `readTemplateFiles()` and copied as-is to the output.
Template variables like `{{projectName}}` are replaced automatically.

### 2. Create the preset definition

Create `src/presets/<preset-name>.ts`:

```typescript
import type { Preset } from "../types.js";
import { readTemplateFiles } from "../utils.js";

export const vuePreset: Preset = {
  name: "vue",
  requires: ["typescript"],  // auto-resolves dependencies
  files: readTemplateFiles("vue"),
  merge: { /* ... */ },
  markdown: { /* ... */ },
  ciSteps: { /* ... */ },
  setupExtra: "...",
};
```

### 3. Register in presets/index.ts

Add the preset import and entry to `PRESET_ENTRIES` in `src/presets/index.ts`:

```typescript
import { vuePreset } from "./vue.js";

const PRESET_ENTRIES: ReadonlyArray<readonly [string, Preset]> = [
  // ... existing entries
  ["vue", vuePreset],  // add in logical position within the layer
  // ...
];
```

### 4. Add wizard option (if needed)

Update `src/cli.ts` to add the new option to the wizard.

### 5. Add tests

Add tests following the 3-layer strategy (see [Testing](#testing)):

- Layer A: `tests/presets/<preset>.test.ts` (unit test for the preset)
- Layer B: `tests/pairwise.test.ts` (cross-layer pairs, if needed)
- Layer C: `tests/smoke.test.ts` (representative patterns, if needed)

### 6. Update docs

Update `docs/design.md` with the new preset details.

## Agent Presets

Agent presets use `instructionFile` and `mcpConfigPath` to tell the generator where to write their instruction and MCP config files:

```typescript
import { DEFAULT_MCP_SERVERS } from "./shared.js";

export const exampleAgentPreset: Preset = {
  name: "example-agent",
  instructionFile: ".example/instructions.md",  // markdown section injection target
  mcpConfigPath: { path: ".example/mcp.json", format: "json" },  // MCP config output
  files: readTemplateFiles("example-agent"),
  merge: {},
  mcpServers: { ...DEFAULT_MCP_SERVERS },  // shared MCP servers (context7, fetch)
  markdown: {
    "agent-instructions": [],  // receives shared sections from all presets
    "README.md": [],
  },
};
```

The generator automatically:

- Distributes all collected MCP servers to `mcpConfigPath` files
- Injects `agent-instructions` markdown sections into `instructionFile` targets

## Merge Contributions

### How it works

Each preset's `merge` object maps shared file paths to partial objects.
The generator collects all patches per file and deep-merges them in preset order.

**Merge strategies by file type:**

| Extension | Strategy |
|-----------|----------|
| `.json` | Deep merge, arrays deduplicated by `JSON.stringify()` |
| `.yaml` / `.yml` | Deep merge, arrays deduplicated |
| `.toml` | Deep merge |

### Example: Contributing to package.json

```typescript
merge: {
  "package.json": {
    scripts: {
      lint: "biome check",
      typecheck: "tsc --noEmit",
      test: "vitest run",
    },
    devDependencies: {
      typescript: "^5.0.0",
      vitest: "^3.0.0",
    },
  },
},
```

### Example: Contributing to .mise.toml

```typescript
merge: {
  ".mise.toml": {
    tools: {
      python: "3.12",
      uv: "0.7",
      "pipx:ruff": "0.11",
    },
  },
},
```

### Example: Contributing to lefthook.yaml

```typescript
merge: {
  "lefthook.yaml": {
    "pre-commit": {
      commands: {
        biome: {
          glob: "*.{ts,tsx,js,jsx,json,jsonc}",
          run: "biome check --write {staged_files}",
          stage_fixed: true,
        },
      },
    },
    "pre-push": {
      commands: {
        typecheck: { run: "tsc --noEmit" },
      },
    },
  },
},
```

### Example: Contributing to VSCode settings and extensions

Presets can add editor settings, recommended extensions, and devcontainer
configuration. Arrays (like `recommendations` and `mounts`) are deduplicated
via unique-union merge.

```typescript
merge: {
  ".vscode/settings.json": {
    "editor.defaultFormatter": "biomejs.biome",
    "[typescript]": {
      "editor.defaultFormatter": "biomejs.biome",
    },
  },
  ".vscode/extensions.json": {
    recommendations: ["biomejs.biome"],
  },
  ".devcontainer/devcontainer.json": {
    customizations: {
      vscode: {
        extensions: ["biomejs.biome"],
      },
    },
    // Add mounts if needed (e.g., ~/.aws for AWS presets)
    mounts: [
      "source=${localEnv:HOME}/.aws,target=/home/vscode/.aws,type=bind,consistency=cached",
    ],
  },
},
```

## Markdown Section Injection

Templates (`templates/base/CLAUDE.md`, `templates/base/README.md`) contain
placeholders like `<!-- SECTION:TECH_STACK -->`. Presets inject content at these
placeholders.

### Injection mechanism

1. Template files contain `<!-- SECTION:NAME -->` placeholders
2. Each preset contributes `MarkdownSection[]` per file
3. Multiple presets can inject into the same placeholder — content is concatenated
4. Unused placeholders are removed automatically after expansion

### Example

```typescript
markdown: {
  "CLAUDE.md": [
    {
      placeholder: "<!-- SECTION:TECH_STACK -->",
      content: '- **Language**: TypeScript (ESM, strict mode)',
    },
    {
      placeholder: "<!-- SECTION:LINT_COMMANDS -->",
      content: "pnpm run lint              # Biome check",
    },
  ],
  "README.md": [
    {
      placeholder: "<!-- SECTION:DIR_STRUCTURE -->",
      content: "├── src/                 # TypeScript ソースコード",
    },
  ],
},
```

### Available placeholders

Check `templates/base/CLAUDE.md` and `templates/base/README.md` for the full
list of `<!-- SECTION:... -->` placeholders.

## CI Steps

The `ciSteps` field contributes steps to the generated `.github/workflows/ci.yaml`.

### CiContribution interface

```typescript
interface CiContribution {
  setupSteps?: CiStep[];   // runs after checkout + mise setup
  lintSteps?: CiStep[];    // lint/format checks
  testSteps?: CiStep[];    // test execution
  buildSteps?: CiStep[];   // build + typecheck
}

interface CiStep {
  name: string;
  run?: string;             // shell command
  uses?: string;            // GitHub Action reference
  with?: Record<string, string>;
  id?: string;
}
```

### Step ordering in generated workflow

```text
Checkout → mise setup → [setupSteps] → [lintSteps] → [testSteps] → [buildSteps]
```

Steps from all presets are concatenated in preset order within each category.

### CI steps example

```typescript
ciSteps: {
  setupSteps: [
    {
      name: "uv cache",
      uses: "actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830",
      with: {
        path: "~/.cache/uv",
        key: "uv-${{ runner.os }}-${{ hashFiles('uv.lock') }}",
        "restore-keys": "uv-${{ runner.os }}-",
      },
    },
    { name: "Install Python dependencies", run: "uv sync" },
  ],
  lintSteps: [
    { name: "Lint (Ruff)", run: "ruff check . && ruff format --check ." },
  ],
  testSteps: [
    { name: "Test (pytest)", run: "uv run pytest" },
  ],
},
```

## Setup Script

The `setupExtra` field adds commands to `scripts/setup.sh`. The generator
replaces the `# SETUP:EXTRA` placeholder in the template with each preset's
extra commands.

```typescript
setupExtra: "uv sync",
```

Generated output in setup.sh:

```bash
# python
uv sync
```

## Dynamic lint:all

The generator automatically builds a `lint:all` script in `package.json` from:

1. `lint` script (e.g., Biome) — if present
2. `typecheck` script — if present
3. All `lint:*` scripts in sorted order (excluding `lint:all` and `lint:fix`)

You don't need to define `lint:all` manually — just add your `lint:*` scripts
via `merge["package.json"].scripts`.

## Dependency Resolution

Use `requires` to declare preset dependencies:

```typescript
export const reactPreset: Preset = {
  name: "react",
  requires: ["typescript"],  // TypeScript is auto-added
  // ...
};
```

The generator resolves dependencies recursively and ensures all required
presets are included in canonical order.

## Testing

### Test structure

Tests use an in-memory filesystem via `createMemoryWriter()`:

```typescript
import { generate } from "../src/generator.js";
import type { WizardAnswers } from "../src/types.js";

function makeAnswers(overrides: Partial<WizardAnswers> = {}): WizardAnswers {
  return {
    projectName: "test-app",
    languages: [],
    frontend: "none",
    clouds: [],
    iac: [],
    ...overrides,
  };
}

const result = generate(makeAnswers({ languages: ["typescript"] }));
```

### GenerateResult helpers

| Method | Description |
|--------|-------------|
| `fileList()` | Sorted list of all generated file paths |
| `hasFile(path)` | Check if a file was generated |
| `readText(path)` | Read file content as string |
| `readJson(path)` | Parse file as JSON |
| `readYaml(path)` | Parse file as YAML |
| `readToml(path)` | Parse file as TOML |

### What to test

1. **Required files exist** — owned files from your preset
2. **Excluded files don't exist** — files that shouldn't appear for this config
3. **Shared file contents** — merged scripts, dependencies, tools
4. **VSCode/devcontainer** — extensions, settings, and mounts are preset-specific
5. **CI workflow** — your lint/test/build steps appear
6. **Markdown content** — CLAUDE.md and README.md contain your injected sections

### Example test

```typescript
describe("generate (TypeScript)", () => {
  const result = generate(makeAnswers({ languages: ["typescript"] }));

  it("generates TypeScript owned files", () => {
    expect(result.hasFile("biome.json")).toBe(true);
    expect(result.hasFile("tsconfig.json")).toBe(true);
    expect(result.hasFile("src/index.ts")).toBe(true);
  });

  it("merges TypeScript scripts into package.json", () => {
    const pkg = result.readJson("package.json") as Record<string, unknown>;
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.lint).toContain("biome");
    expect(scripts.typecheck).toContain("tsc");
  });

  it("adds Biome to CI lint steps", () => {
    const ci = result.readYaml(".github/workflows/ci.yaml") as Record<string, unknown>;
    const steps = (ci.jobs as any)["lint-and-check"].steps as any[];
    const names = steps.map((s: any) => s.name);
    expect(names).toContain("Lint (Biome)");
  });
});
```

## External Preset Packages

Presets can also live in their own npm packages and be loaded at scaffold time
without modifying `create-agentic-app`. This is the mechanism that the
`@ozzylabs/preset-*` family uses to ship presets independently of the CLI.

### Loading external presets

Two equivalent ways to opt into an external preset:

1. **CLI flag** (repeatable): `--preset @ozzylabs/preset-foo` or `--preset ./local/preset`
2. **Project config file** (`agentic-app.config.json` in the working directory):

   ```json
   {
     "presets": ["@ozzylabs/preset-foo", "./local/preset"]
   }
   ```

CLI flags and config-file entries are merged (config first, CLI flags second);
duplicate names produce an error. Specifiers are resolved with Node's standard
resolver anchored at the working directory, so both bare specifiers (looked up
in the local `node_modules`) and relative paths work.

### Authoring an external preset

An external preset is an ESM module whose default export satisfies the `Preset`
interface. The package can import the type and helpers from the public API
entry of `@ozzylabs/create-agentic-app`:

```typescript
// @ozzylabs/preset-foo/src/index.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTemplateFiles, type Preset } from "@ozzylabs/create-agentic-app";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const preset: Preset = {
  name: "foo",
  requires: ["typescript"],
  files: readTemplateFiles({ rootDir, subPath: "../templates" }),
  merge: {
    "package.json": {
      scripts: { "foo:hello": "echo hi" },
    },
  },
};

export default preset;
```

Suggested package shape:

```text
@ozzylabs/preset-foo/
├── package.json
├── dist/                  # built ESM output
└── templates/             # bundled template files
```

`package.json` should set `"main": "./dist/index.mjs"` (or use `"exports"`),
include both `dist` and `templates` in `"files"`, and depend on
`@ozzylabs/create-agentic-app` only via `peerDependencies` so the CLI version
is not duplicated.

### Constraints

- External preset names cannot collide with built-in preset names — built-ins
  are reserved and will reject any external preset that tries to use them.
- External presets are always selected (loading them implies opt-in); they are
  not toggled by wizard answers.
- Built-in presets are applied first (in canonical `PRESET_ORDER`), then
  external presets in the order they were supplied — later contributions win
  on the same field.
- External presets may declare `requires` against built-in or other external
  presets; unknown names raise a clear error at generation time.

A minimal reference implementation lives at
[`examples/preset-example`](../examples/preset-example) — it demonstrates the
package layout, exporting a default `Preset`, and bundling template files.

## Reference: Existing Presets

Study these files as examples:

| Preset | File | Complexity |
|--------|------|------------|
| `base` | `src/presets/base.ts` | Full example (all fields) |
| `typescript` | `src/presets/typescript.ts` | Merge + CI + Markdown |
| `python` | `src/presets/python.ts` | Merge + CI + Markdown + setupExtra |
| `react` | `src/presets/react.ts` | Requires + Merge + Markdown (no CI) |
| `nextjs` | `src/presets/nextjs.ts` | Requires + Merge + Markdown (no CI) |
| `fastapi` | `src/presets/fastapi.ts` | Requires + Merge + CI + Markdown + setupExtra |
| `express` | `src/presets/express.ts` | Requires + Merge + CI + Markdown |
| `cdk` | `src/presets/cdk.ts` | Requires + CD workflow + Markdown |
