import { processJob } from "./processor.js";

async function main(): Promise<void> {
  console.log("Worker started");
  await processJob({ id: "1", payload: {} });
  console.log("Worker finished");
}

main().catch((err: unknown) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
