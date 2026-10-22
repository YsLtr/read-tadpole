import type {
  AllProviderTypes,
  APIProviderConfig,
  APIProviderTypes,
  LLMProviderModels,
  ProviderConfig,
  ProvidersConfig,
} from "@/types/config/provider"
import type { Theme } from "@/types/config/theme"
import { camelCase } from "case-anything"
import customProviderLogo from "@/assets/providers/custom-provider.svg?url&no-inline"
import deeplxLogoDark from "@/assets/providers/deeplx-dark.svg?url&no-inline"
import deeplxLogoLight from "@/assets/providers/deeplx-light.svg?url&no-inline"
import { DEFAULT_BUILT_IN_ACTION_PROVIDER_ID } from "@/types/config/selection-toolbar"
import {
  DEEPL_OFFICIAL_ENDPOINT,
  DEEPLX_DEFAULT_ENDPOINT,
  DOUBAO_TRANSLATE_ENDPOINT,
  GOOGLE_TRANSLATE_HTML_URL,
  MICROSOFT_TRANSLATE_URL,
} from "@/utils/constants/provider-endpoints"
import { i18n } from "@/utils/i18n"
import { getLobeIconsCDNUrlFn } from "@/utils/logo"
import {
  BILIBILI_PRESET_BASE_URL,
  BILIBILI_PRESET_MODEL,
  isBilibiliEndpoint,
  LLM_PROVIDER_MODELS,
  NON_API_TRANSLATE_PROVIDERS_MAP,
} from "@/utils/constants/models"

export const DEFAULT_LLM_PROVIDER_MODELS: LLMProviderModels = {
  "openai-compatible": {
    model: "use-custom-model",
    isCustomModel: true,
    customModel: null,
  },
}

export const BILIBILI_PRESET_LOGO = "https://www.bilibili.com/favicon.ico"

export const PROVIDER_ITEMS: Record<
  AllProviderTypes,
  {
    logo: (theme: Theme) => string
    name: string
  }
> = {
  deeplx: {
    logo: (theme: Theme) => (theme === "light" ? deeplxLogoLight : deeplxLogoDark),
    name: "DeepLX",
  },
  deepl: {
    logo: (theme: Theme) => (theme === "light" ? deeplxLogoLight : deeplxLogoDark),
    name: "DeepL",
  },
  "openai-compatible": {
    logo: () => customProviderLogo,
    name: "Custom",
  },
  "google-translate": {
    logo: getLobeIconsCDNUrlFn("google-color"),
    name: NON_API_TRANSLATE_PROVIDERS_MAP["google-translate"],
  },
  "microsoft-translate": {
    logo: getLobeIconsCDNUrlFn("microsoft-color"),
    name: NON_API_TRANSLATE_PROVIDERS_MAP["microsoft-translate"],
  },
  "doubao-translate": {
    // Same brand-mark source as the other vendor translators: doubao.com's own
    // /favicon.ico answers with the SPA shell, so it cannot be an <img> src.
    logo: getLobeIconsCDNUrlFn("doubao-color"),
    name: "Doubao Translate",
  },
}

export const DEFAULT_PROVIDER_CONFIG = {
  "openai-compatible": {
    id: "openai-compatible-default",
    name: PROVIDER_ITEMS["openai-compatible"].name,
    enabled: true,
    provider: "openai-compatible",
    baseURL: "https://api.example.com/v1",
    model: DEFAULT_LLM_PROVIDER_MODELS["openai-compatible"],
  },
  deeplx: {
    id: "deeplx-default",
    name: PROVIDER_ITEMS.deeplx.name,
    enabled: true,
    provider: "deeplx",
    baseURL: DEEPLX_DEFAULT_ENDPOINT,
    apiKey: "",
  },
  deepl: {
    id: "deepl-default",
    name: PROVIDER_ITEMS.deepl.name,
    enabled: true,
    provider: "deepl",
    baseURL: DEEPL_OFFICIAL_ENDPOINT,
    apiKey: "",
  },
  "google-translate": {
    id: "google-translate-default",
    name: PROVIDER_ITEMS["google-translate"].name,
    enabled: true,
    provider: "google-translate",
  },
  "microsoft-translate": {
    id: "microsoft-translate-default",
    name: PROVIDER_ITEMS["microsoft-translate"].name,
    enabled: true,
    provider: "microsoft-translate",
  },
  "doubao-translate": {
    id: "doubao-translate-default",
    name: PROVIDER_ITEMS["doubao-translate"].name,
    enabled: true,
    provider: "doubao-translate",
    baseURL: DOUBAO_TRANSLATE_ENDPOINT,
    cookie: "",
  },
} as const satisfies Record<AllProviderTypes, ProviderConfig>

/**
 * The free Bilibili Index model as a stored provider.
 *
 * It is not a provider type: it speaks the OpenAI Chat Completions protocol like
 * any hand-filled custom endpoint, so it is a row of `openai-compatible` with the
 * base URL and model already chosen. `utils/providers/bilibili` recognises that
 * endpoint by its URL and adds the request tweaks plus the Origin-header rule the
 * gateway needs, so nothing else has to know the preset exists.
 *
 * The id is unchanged from when Bilibili was its own provider type: a config that
 * already assigned features to it keeps working, and it remains the provider the
 * built-in dictionary action falls back to.
 */
export const BILIBILI_PRESET_PROVIDER_CONFIG: APIProviderConfig = {
  id: DEFAULT_BUILT_IN_ACTION_PROVIDER_ID,
  name: "Bilibili Index Translate",
  enabled: true,
  provider: "openai-compatible",
  baseURL: BILIBILI_PRESET_BASE_URL,
  model: {
    model: LLM_PROVIDER_MODELS["openai-compatible"][0],
    isCustomModel: true,
    customModel: BILIBILI_PRESET_MODEL,
  },
}

export const BILIBILI_PRESET_PROVIDER_ID = BILIBILI_PRESET_PROVIDER_CONFIG.id

/** Whether a provider row is the Bilibili preset, which needs no key of its own. */
export function isBilibiliPresetProvider(providerConfig: ProviderConfig): boolean {
  return (
    providerConfig.provider === "openai-compatible" &&
    isBilibiliEndpoint((providerConfig as APIProviderConfig).baseURL)
  )
}

/**
 * One tile in the add-provider dialog. Most presets are just a provider type; the
 * custom endpoint has two, because the free Bilibili gateway is the same
 * provider type pre-filled. Adding either writes an ordinary provider row, so the
 * distinction ends at the dialog.
 */
export interface ProviderPreset {
  /** Stable key for React and for the click handler. */
  id: string
  name: string
  logo: (theme: Theme) => string
  /** The row to start from; the id and name are made unique when it is added. */
  config: ProviderConfig
  /** Resolved on demand, because the description is localized. */
  description: () => string | undefined
}

export const PROVIDER_PRESETS: readonly ProviderPreset[] = [
  {
    id: "custom",
    name: PROVIDER_ITEMS["openai-compatible"].name,
    logo: () => customProviderLogo,
    config: DEFAULT_PROVIDER_CONFIG["openai-compatible"],
    description: () => getDefaultProviderDescription("openai-compatible"),
  },
  {
    id: "bilibili",
    name: BILIBILI_PRESET_PROVIDER_CONFIG.name,
    logo: () => BILIBILI_PRESET_LOGO,
    config: BILIBILI_PRESET_PROVIDER_CONFIG,
    description: getBilibiliPresetDescription,
  },
  {
    id: "deeplx",
    name: PROVIDER_ITEMS.deeplx.name,
    logo: PROVIDER_ITEMS.deeplx.logo,
    config: DEFAULT_PROVIDER_CONFIG.deeplx,
    description: () => getDefaultProviderDescription("deeplx"),
  },
  {
    id: "deepl",
    name: PROVIDER_ITEMS.deepl.name,
    logo: PROVIDER_ITEMS.deepl.logo,
    config: DEFAULT_PROVIDER_CONFIG.deepl,
    description: () => getDefaultProviderDescription("deepl"),
  },
  {
    id: "google-translate",
    name: PROVIDER_ITEMS["google-translate"].name,
    logo: PROVIDER_ITEMS["google-translate"].logo,
    config: DEFAULT_PROVIDER_CONFIG["google-translate"],
    description: () => getDefaultProviderDescription("google-translate"),
  },
  {
    id: "microsoft-translate",
    name: PROVIDER_ITEMS["microsoft-translate"].name,
    logo: PROVIDER_ITEMS["microsoft-translate"].logo,
    config: DEFAULT_PROVIDER_CONFIG["microsoft-translate"],
    description: () => getDefaultProviderDescription("microsoft-translate"),
  },
  {
    id: "doubao-translate",
    name: PROVIDER_ITEMS["doubao-translate"].name,
    logo: PROVIDER_ITEMS["doubao-translate"].logo,
    config: DEFAULT_PROVIDER_CONFIG["doubao-translate"],
    description: () => getDefaultProviderDescription("doubao-translate"),
  },
]

/**
 * Headers a provider is always called with, merged over whatever the user set. The user may add
 * headers alongside these but cannot drop or rewrite them, and they never enter stored config —
 * which is also what makes them ours to change in a later release. A header a provider merely
 * starts out with belongs in `DEFAULT_PROVIDER_CONFIG[provider].headers` instead, where the user
 * owns it.
 */
export const FORCED_PROVIDER_HEADERS: Partial<Record<AllProviderTypes, Record<string, string>>> =
  {}

export const PROVIDER_URL_PLACEHOLDERS: Partial<Record<APIProviderTypes, string>> = {
  "openai-compatible": DEFAULT_PROVIDER_CONFIG["openai-compatible"].baseURL,
  deeplx: DEFAULT_PROVIDER_CONFIG.deeplx.baseURL,
  deepl: DEFAULT_PROVIDER_CONFIG.deepl.baseURL,
  "google-translate": GOOGLE_TRANSLATE_HTML_URL,
  "microsoft-translate": MICROSOFT_TRANSLATE_URL,
  "doubao-translate": DOUBAO_TRANSLATE_ENDPOINT,
}

export const DEFAULT_PROVIDER_CONFIG_LIST: ProvidersConfig = [BILIBILI_PRESET_PROVIDER_CONFIG]

/** Resolve a provider's default description in the active interface language. */
export function getDefaultProviderDescription(providerType: AllProviderTypes): string | undefined {
  const descriptionKey = camelCase(providerType)
  const description = i18n.t(
    `options.apiProviders.providers.description.${descriptionKey}` as never,
  )
  return description || undefined
}

/** Resolve the Bilibili preset's description in the active interface language. */
export function getBilibiliPresetDescription(): string | undefined {
  const description = i18n.t("options.apiProviders.providers.description.bilibiliTranslate" as never)
  return description || undefined
}

/**
 * Build providers for a fresh config after i18n has initialized, so descriptions are
 * persisted in the same interface language as providers created from the options page.
 */
export function buildDefaultProviderConfigList(): ProvidersConfig {
  return structuredClone(DEFAULT_PROVIDER_CONFIG_LIST).map((providerConfig) => {
    const description = isBilibiliPresetProvider(providerConfig)
      ? getBilibiliPresetDescription()
      : getDefaultProviderDescription(providerConfig.provider)
    return description ? { ...providerConfig, description } : providerConfig
  })
}

/**
 * A provider's name as the product shows it. Every surviving provider has a
 * fixed, product-owned name, so this is a plain lookup — there is nothing left
 * that would need a per-language variant.
 */
export function getProviderItemName(providerType: AllProviderTypes): string {
  return PROVIDER_ITEMS[providerType].name
}
