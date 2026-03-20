import { afterEach, describe, expect, it } from "vitest";
import en from "../src/i18n/en.json" with { type: "json" };
import { detectLocale, getLocale, resetLocale, setLocale, t } from "../src/i18n/index.js";
import ja from "../src/i18n/ja.json" with { type: "json" };

afterEach(() => {
  resetLocale();
});

describe("t()", () => {
  it("returns English string by default", () => {
    expect(t("cancel")).toBe("Operation cancelled.");
  });

  it("returns Japanese string when locale is ja", () => {
    setLocale("ja");
    expect(t("cancel")).toBe("操作がキャンセルされました。");
  });

  it("resolves nested keys", () => {
    expect(t("wizard.projectName.message")).toBe("Project name");
  });

  it("resolves deeply nested keys", () => {
    expect(t("wizard.frontend.react.hint")).toBe("forces TypeScript");
  });

  it("interpolates variables", () => {
    expect(t("spinner.stop", { count: 42 })).toBe("Generated 42 files");
  });

  it("interpolates variables in Japanese", () => {
    setLocale("ja");
    expect(t("spinner.stop", { count: 42 })).toBe("42 ファイルを生成しました");
  });

  it("preserves unmatched placeholders", () => {
    expect(t("overwrite.message", {})).toContain("{{path}}");
  });

  it("returns key for invalid path", () => {
    // biome-ignore lint/suspicious/noExplicitAny: testing invalid key at runtime
    expect(t("nonexistent.key" as any)).toBe("nonexistent.key");
  });
});

describe("setLocale / getLocale", () => {
  it("defaults to en", () => {
    expect(getLocale()).toBe("en");
  });

  it("can be set to ja", () => {
    setLocale("ja");
    expect(getLocale()).toBe("ja");
  });
});

describe("detectLocale()", () => {
  const originalLang = process.env.LANG;
  const originalLcAll = process.env.LC_ALL;

  afterEach(() => {
    process.env.LANG = originalLang;
    process.env.LC_ALL = originalLcAll;
  });

  it("returns en by default", () => {
    delete process.env.LANG;
    delete process.env.LC_ALL;
    expect(detectLocale()).toBe("en");
  });

  it("returns langFlag when valid", () => {
    expect(detectLocale("ja")).toBe("ja");
    expect(detectLocale("en")).toBe("en");
  });

  it("ignores invalid langFlag", () => {
    delete process.env.LANG;
    delete process.env.LC_ALL;
    expect(detectLocale("fr")).toBe("en");
  });

  it("detects ja from LANG env var", () => {
    delete process.env.LC_ALL;
    process.env.LANG = "ja_JP.UTF-8";
    expect(detectLocale()).toBe("ja");
  });

  it("LC_ALL takes priority over LANG", () => {
    process.env.LANG = "en_US.UTF-8";
    process.env.LC_ALL = "ja_JP.UTF-8";
    expect(detectLocale()).toBe("ja");
  });

  it("langFlag takes priority over env vars", () => {
    process.env.LANG = "ja_JP.UTF-8";
    expect(detectLocale("en")).toBe("en");
  });
});

describe("locale file consistency", () => {
  function extractKeys(obj: unknown, prefix = ""): string[] {
    if (typeof obj !== "object" || obj == null) return [prefix];
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      keys.push(...extractKeys(value, path));
    }
    return keys;
  }

  it("ja.json has the same keys as en.json", () => {
    const enKeys = extractKeys(en).sort();
    const jaKeys = extractKeys(ja).sort();
    expect(jaKeys).toEqual(enKeys);
  });
});
