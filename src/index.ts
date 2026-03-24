#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { runWizard } from "./cli.js";
import { generate, validateAnswers } from "./generator.js";
import { detectLocale, setLocale, t } from "./i18n/index.js";
import { createDiskWriter } from "./utils.js";

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      lang: { type: "string" },
    },
    allowPositionals: true,
    strict: false,
  });

  const langFlag = typeof values.lang === "string" ? values.lang : undefined;
  setLocale(detectLocale(langFlag));

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

  p.log.step(`${t("nextSteps.title")}:\n  cd ${relPath}\n  bash scripts/setup.sh`);

  p.outro(pc.green(t("outro")));
}

main().catch((err) => {
  p.log.error(String(err));
  process.exit(1);
});
