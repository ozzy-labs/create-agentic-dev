#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { runWizard } from "./cli.js";
import { generate } from "./generator.js";
import { createDiskWriter } from "./utils.js";

async function main(): Promise<void> {
  const arg = process.argv[2];
  const defaultName = arg ? path.basename(arg) : undefined;
  const parentDir = arg ? path.resolve(process.cwd(), path.dirname(arg)) : process.cwd();
  const answers = await runWizard(defaultName);

  const outDir = path.resolve(parentDir, answers.projectName);
  const relPath = path.relative(process.cwd(), outDir) || ".";

  if (fs.existsSync(outDir) && fs.readdirSync(outDir).length > 0) {
    const overwrite = await p.confirm({
      message: `Directory "${relPath}" already exists and is not empty. Overwrite?`,
    });
    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
  }

  const s = p.spinner();
  s.start("Generating project...");

  const writer = createDiskWriter(outDir);
  const result = generate(answers, { writer });

  s.stop(`Generated ${result.fileList().length} files`);

  p.note([`cd ${relPath}`, "bash scripts/setup.sh"].join("\n"), "Next steps");

  p.outro(pc.green("Done! Happy coding."));
}

main().catch((err) => {
  p.log.error(String(err));
  process.exit(1);
});
