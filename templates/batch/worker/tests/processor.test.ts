import { describe, expect, it } from "vitest";

import { processJob } from "../src/processor.js";

describe("processJob", () => {
  it("returns success for a valid job", async () => {
    const result = await processJob({ id: "test-1", payload: {} });
    expect(result.status).toBe("success");
    expect(result.jobId).toBe("test-1");
  });
});
