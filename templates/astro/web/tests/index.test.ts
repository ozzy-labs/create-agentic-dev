import { describe, expect, it } from "vitest";
import { siteName } from "../src/index.js";

describe("siteName", () => {
  it("is defined", () => {
    expect(siteName).toBeDefined();
  });
});
