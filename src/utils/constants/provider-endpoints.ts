/**
 * The endpoints the presets start from, before a reader edits them.
 *
 * They live here rather than in the adapters that call them so that
 * `utils/constants/providers` can seed a preset without importing an adapter:
 * every adapter imports `utils/providers/headers`, which imports that provider
 * constants module, so an endpoint kept in an adapter and read from there would
 * close a cycle — and a cycle only works by luck of which module loads first.
 */
export const DEEPL_OFFICIAL_ENDPOINT = "https://api.deepl.com/v2/translate"
export const DEEPL_FREE_ENDPOINT = "https://api-free.deepl.com/v2/translate"
export const DEEPLX_DEFAULT_ENDPOINT = "http://localhost:1188"
export const GOOGLE_TRANSLATE_HTML_URL = "https://translate-pa.googleapis.com/v1/translateHtml"
export const MICROSOFT_TRANSLATE_URL = "https://edge.microsoft.com/translate/translatetext"
