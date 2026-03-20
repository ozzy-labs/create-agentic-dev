import en from "./en.json" with { type: "json" };
import ja from "./ja.json" with { type: "json" };

// --- Types ---

type Messages = typeof en;

/** Supported locale codes. */
export type Locale = "en" | "ja";

/**
 * Recursively extract dot-separated paths that resolve to a string leaf.
 * e.g. "wizard.projectName.message" | "cancel" | ...
 */
type PathKeys<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: PathKeys<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
      }[keyof T & string]
    : never;

/** All valid translation keys derived from the English locale file. */
export type MessageKey = PathKeys<Messages>;

// --- Locale map & state ---

const locales: Record<Locale, Messages> = { en, ja };
let currentLocale: Locale = "en";

// --- Public API ---

/** Set the active locale. */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/** Get the active locale. */
export function getLocale(): Locale {
  return currentLocale;
}

/** Reset locale to default (en). Useful for testing. */
export function resetLocale(): void {
  currentLocale = "en";
}

/**
 * Detect locale from a CLI flag or environment variables.
 * Priority: langFlag > LC_ALL > LANG > "en"
 */
export function detectLocale(langFlag?: string): Locale {
  if (langFlag && langFlag in locales) return langFlag as Locale;
  const envLang = process.env.LC_ALL || process.env.LANG || "";
  if (envLang.startsWith("ja")) return "ja";
  return "en";
}

/**
 * Look up a translated string by dot-separated key.
 * Supports `{{var}}` interpolation via the `vars` parameter.
 */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  let value: unknown = locales[currentLocale];
  for (const part of parts) {
    if (value == null || typeof value !== "object") return key;
    value = (value as Record<string, unknown>)[part];
  }
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
    vars[k] != null ? String(vars[k]) : `{{${k}}}`,
  );
}
