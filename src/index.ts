#!/usr/bin/env node
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { runWizard } from "./cli.js";
import { generate, validateAnswers } from "./generator.js";
import { detectLocale, setLocale, t } from "./i18n/index.js";
import { buildFileTree } from "./tree.js";
import { createDiskWriter } from "./utils.js";

/** Run a shell command and return stdout. Rejects on non-zero exit. */
function run(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${cmd} ${args.join(" ")} failed: ${stderr || error.message}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      lang: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      "no-install": { type: "boolean", default: false },
    },
    allowPositionals: true,
    strict: false,
  });

  const langFlag = typeof values.lang === "string" ? values.lang : undefined;
  setLocale(detectLocale(langFlag));

  const dryRun = values["dry-run"] === true;
  const noInstall = values["no-install"] === true;

  const positionalArg = positionals[0];
  const defaultName = positionalArg ? path.basename(positionalArg) : undefined;
  const parentDir = positionalArg
    ? path.resolve(process.cwd(), path.dirname(positionalArg))
    : process.cwd();
  const answers = await runWizard(defaultName);

  const warnings = validateAnswers(answers);
  for (const warning of warnings) {
    p.log.warn(pc.yellow(warning));
  }

  const outDir = path.resolve(parentDir, answers.projectName);
  const relPath = path.relative(process.cwd(), outDir) || ".";

  // --- Dry-run mode: preview only, no disk writes ---
  if (dryRun) {
    const result = generate(answers);
    const fileList = result.fileList();
    const tree = buildFileTree(fileList);
    p.log.info(
      `${t("dryRun.preview", { count: fileList.length })}\n\n${pc.dim(tree)}\n\n${pc.yellow(t("dryRun.noWrite"))}`,
    );
    p.outro(pc.green(t("outro")));
    return;
  }

  // --- Normal mode: write to disk ---
  if (fs.existsSync(outDir) && fs.readdirSync(outDir).length > 0) {
    const overwrite = await p.confirm({
      message: t("overwrite.message", { path: relPath }),
    });
    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel(t("cancel"));
      process.exit(0);
    }
  }

  const s = p.spinner();
  s.start(t("spinner.start"));

  const writer = createDiskWriter(outDir);
  const result = generate(answers, { writer });

  s.stop(t("spinner.stop", { count: result.fileList().length }));

  // --- Post-generation setup ---
  if (noInstall) {
    p.log.step(`${t("nextSteps.title")}:\n  cd ${relPath}\n  bash scripts/setup.sh`);
  } else {
    const setupSpinner = p.spinner();

    // git init
    setupSpinner.start(t("setup.gitInit"));
    try {
      await run("git", ["init"], outDir);
      setupSpinner.stop(t("setup.gitInitDone"));
    } catch {
      setupSpinner.stop(pc.yellow(t("setup.gitInitFailed")));
    }

    // pnpm install
    setupSpinner.start(t("setup.pnpmInstall"));
    try {
      await run("pnpm", ["install"], outDir);
      setupSpinner.stop(t("setup.pnpmInstallDone"));
    } catch {
      setupSpinner.stop(pc.yellow(t("setup.pnpmInstallFailed")));
      p.log.warn(t("setup.manualHint", { path: relPath }));
    }
  }

  p.outro(pc.green(t("outro")));
}

main().catch((err) => {
  p.log.error(String(err));
  process.exit(1);
});
