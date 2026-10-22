// Keep existing IDs: persisted provider configs validate against these enums.
export const LLM_PROVIDER_MODELS = {
  "openai-compatible": ["use-custom-model"],
} as const

/**
 * The free Bilibili Index model, offered as a preset of the custom provider
 * rather than a provider type of its own. It speaks the OpenAI Chat Completions
 * protocol like any other custom endpoint; the only thing special about it is
 * the request tweaks and the Origin-header rule in `utils/providers/bilibili`.
 */
export const BILIBILI_PRESET_BASE_URL = "https://index-translate.bilibili.com/v1"
export const BILIBILI_PRESET_MODEL = "Index-Translate-35B-A3B"

/**
 * Whether a base URL points at the free Bilibili gateway.
 *
 * That endpoint — not a provider type — is what identifies the preset now, so
 * both the transport that adds its request tweaks and the UI that shows its own
 * name and mark ask this one question. Trailing slashes and case are normalised
 * so a hand-typed URL still matches.
 */
export function isBilibiliEndpoint(baseURL: string | undefined): boolean {
  if (!baseURL) return false
  return baseURL.trim().replace(/\/+$/, "").toLowerCase() === BILIBILI_PRESET_BASE_URL
}

/**
 * Translators that need no account, key or endpoint: they call the vendor's own
 * public endpoint directly. Distinct from `PURE_TRANSLATE_PROVIDERS` below only
 * in that they carry no request settings at all, so the form shows nothing but
 * an enable toggle.
 */
export const NON_API_TRANSLATE_PROVIDERS = ["google-translate", "microsoft-translate"] as const
export const NON_API_TRANSLATE_PROVIDERS_MAP: Record<
  (typeof NON_API_TRANSLATE_PROVIDERS)[number],
  string
> = {
  "google-translate": "Google Translate",
  "microsoft-translate": "Microsoft Translator",
}

export const PURE_TRANSLATE_PROVIDERS = [
  ...NON_API_TRANSLATE_PROVIDERS,
  "deeplx",
  "deepl",
  "doubao-translate",
] as const
