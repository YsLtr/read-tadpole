/// <reference types="@modyfi/vite-plugin-yaml/modules" />
import type { Resource } from "i18next"
import type { SupportedUiLocale } from "./locales"
import en from "@/locales/en.yml"
import { logger } from "@/utils/logger"

export type { SupportedUiLocale } from "./locales"
export { DEFAULT_UI_LOCALE, SUPPORTED_UI_LOCALES } from "./locales"

interface LocaleTree {
  [key: string]: string | LocaleTree
}

/**
 * Convert WXT-style positional substitutions to i18next interpolation, applied to
 * every string leaf at build time:
 *   - `$$`      → literal `$`   (WXT escape; none currently in the YAML, handled anyway)
 *   - `$1`..`$9`→ `{{0}}`..`{{8}}` (0-indexed to match the facade's array mapping)
 *
 * Intentionally left untouched:
 *   - existing named tokens like `{{targetLanguage}}` (LLM prompt templates; no `$`)
 *   - Chrome context-menu placeholders like `%s`
 */
function convertPlaceholders(value: string): string {
  return value.replace(/\$\$|\$(\d)/g, (_match, digit: string | undefined) =>
    digit === undefined ? "$" : `{{${Number(digit) - 1}}}`,
  )
}

function convertTree(node: LocaleTree): LocaleTree {
  const out: LocaleTree = {}
  for (const [key, val] of Object.entries(node)) {
    out[key] = typeof val === "string" ? convertPlaceholders(val) : convertTree(val)
  }
  return out
}

// Every non-English locale is its own chunk, fetched only when selected.
// English stays eager: it is `fallbackLng`, and `translateIn("en", ...)` needs it.
const LOCALE_LOADERS = import.meta.glob<{ default: LocaleTree }>([
  "../../locales/*.yml",
  "!../../locales/en.yml",
])

/**
 * i18next resource bundle: `{ [locale]: { translation: <nested string tree> } }`.
 * Single default namespace ("translation"); keys are traversed with keySeparator ".".
 * Holds only the locales loaded so far, always including English.
 */
export const resources: Resource = {
  en: { translation: convertTree(en) },
}

/** Add a locale whose tree the caller already has (see resources-eager.ts). */
export function registerLocaleResources(locale: SupportedUiLocale, tree: LocaleTree): void {
  resources[locale] = { translation: convertTree(tree) }
}

/**
 * Fetch and add a locale to `resources`; a no-op once it is there. A locale whose
 * chunk cannot be fetched leaves i18next on `fallbackLng` instead of failing the
 * entrypoint's startup.
 */
export async function loadLocaleResources(locale: SupportedUiLocale): Promise<void> {
  if (locale in resources) return
  const load = LOCALE_LOADERS[`../../locales/${locale}.yml`]
  if (!load) return
  try {
    registerLocaleResources(locale, (await load()).default)
  } catch (error) {
    logger.warn(`[i18n] Failed to load the "${locale}" locale, falling back to English`, error)
  }
}
