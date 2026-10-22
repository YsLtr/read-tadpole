import type { LangCodeISO6391 } from "@read-frog/definitions"
import type { ProviderConfig } from "@/types/config/provider"
import type { TranslationTextFormat } from "@/types/config/translate"
import { DEEPL_FREE_ENDPOINT, DEEPL_OFFICIAL_ENDPOINT } from "@/utils/constants/provider-endpoints"
import { resolveProviderHeaders } from "@/utils/providers/headers"

type DeepLProviderConfig = Extract<ProviderConfig, { provider: "deepl" }>

interface DeepLLanguagePair {
  source?: string
  target: string
}

/**
 * DeepL's own API.
 *
 * The endpoint is the row's `baseURL`, in full — DeepL's paid host, its free one,
 * or a proxy in front of either. A row that carries no endpoint falls back to the
 * host its key belongs to, because DeepL accepts a `:fx` key on its free host only.
 *
 * Nothing here refuses to run without a key: a missing one is DeepL's 403, reported
 * as the request error it is rather than as a form the reader cannot submit.
 */
export async function deeplTranslate(
  sourceText: string,
  fromLang: LangCodeISO6391 | "auto",
  toLang: LangCodeISO6391,
  providerConfig: DeepLProviderConfig,
  options?: { textFormat?: TranslationTextFormat; signal?: AbortSignal },
): Promise<string> {
  const [translatedText] = await requestDeepLTranslations(
    [sourceText],
    fromLang,
    toLang,
    providerConfig,
    options,
  )

  if (translatedText === undefined) {
    throw new Error("DeepL translation response did not include a result")
  }

  return translatedText
}

async function requestDeepLTranslations(
  sourceTexts: string[],
  fromLang: LangCodeISO6391 | "auto",
  toLang: LangCodeISO6391,
  providerConfig: DeepLProviderConfig,
  options?: { textFormat?: TranslationTextFormat; signal?: AbortSignal },
): Promise<string[]> {
  const apiKey = providerConfig.apiKey?.trim()
  const url = providerConfig.baseURL || getDeepLBaseURL(apiKey)
  const normalizedLanguages = normalizeDeepLLanguages(fromLang, toLang)

  const requestBody = JSON.stringify({
    text: sourceTexts,
    ...(normalizedLanguages.source ? { source_lang: normalizedLanguages.source } : {}),
    target_lang: normalizedLanguages.target,
    ...(options?.textFormat === "html" ? { tag_handling: "html" } : {}),
  })

  const fetchResponse = await fetchDirect(
    url,
    apiKey,
    requestBody,
    providerConfig.headers,
    options?.signal,
  )

  return await parseDeepLResponse(fetchResponse, sourceTexts.length)
}

async function fetchDirect(
  url: string,
  apiKey: string | undefined,
  body: string,
  userHeaders: Record<string, unknown> | undefined,
  signal?: AbortSignal,
): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) {
    headers.Authorization = `DeepL-Auth-Key ${apiKey}`
  }

  const resp = await fetch(url, {
    method: "POST",
    // The row's own headers go last: a proxy in front of DeepL may need its own
    // Authorization scheme, and only the reader knows that.
    headers: { ...headers, ...resolveProviderHeaders(userHeaders, apiKey) },
    body,
    signal,
  }).catch((error) => {
    throw new Error(`Network error during DeepL translation: ${error.message}`)
  })

  return resp
}

async function parseDeepLResponse(resp: Response, expectedCount: number): Promise<string[]> {
  if (!resp.ok) {
    const errorText = await resp.text().catch(() => "Unable to read error response")
    throw new Error(
      `DeepL translation request failed: ${resp.status} ${resp.statusText}${errorText ? ` - ${errorText}` : ""}`,
    )
  }

  try {
    const result = await resp.json()
    const translations = (result as { translations?: Array<{ text?: unknown }> })?.translations

    if (!Array.isArray(translations)) {
      throw new TypeError("Unexpected response format from DeepL translation API")
    }

    if (translations.length !== expectedCount) {
      throw new RangeError(
        `DeepL translation response count mismatch: expected ${expectedCount}, got ${translations.length}`,
      )
    }

    return translations.map((translation, index) => {
      if (typeof translation?.text !== "string") {
        throw new TypeError(`Unexpected translation format at index ${index}`)
      }
      return translation.text
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse DeepL translation response: ${message}`, { cause: error })
  }
}

/** The host a key belongs to, for a row that carries no endpoint of its own. */
function getDeepLBaseURL(apiKey: string | undefined): string {
  return apiKey?.endsWith(":fx") ? DEEPL_FREE_ENDPOINT : DEEPL_OFFICIAL_ENDPOINT
}

export function normalizeDeepLLanguages(
  fromLang: LangCodeISO6391 | "auto",
  toLang: LangCodeISO6391,
): DeepLLanguagePair {
  return {
    source: fromLang === "auto" ? undefined : formatDeepLLanguageCode(fromLang, "source"),
    target: formatDeepLLanguageCode(toLang, "target"),
  }
}

function formatDeepLLanguageCode(lang: LangCodeISO6391, direction: "source" | "target"): string {
  const formattedLang = lang.toUpperCase()

  if (formattedLang === "ZH") {
    return direction === "target" ? "ZH-HANS" : "ZH"
  }

  if (formattedLang === "ZH-TW") {
    return direction === "target" ? "ZH-HANT" : "ZH"
  }

  return formattedLang
}
