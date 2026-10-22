import type { LangCodeISO6391 } from "@read-frog/definitions"
import type { ProviderConfig } from "@/types/config/provider"
import type { TranslationTextFormat } from "@/types/config/translate"
import { DEEPLX_DEFAULT_ENDPOINT } from "@/utils/constants/provider-endpoints"
import { resolveProviderHeaders } from "@/utils/providers/headers"

type DeepLXProviderConfig = Extract<ProviderConfig, { provider: "deeplx" }>
const API_KEY_PLACEHOLDER_RE = /\{\{apiKey\}\}/g

/**
 * A DeepLX server — the unofficial, self-hosted DeepL-compatible API.
 *
 * Its endpoint is the row's `baseURL` in full, and the key, when there is one,
 * travels in that URL through the `{{apiKey}}` placeholder rather than in a
 * header. A missing key is not refused here: a server that wants one answers with
 * its own error.
 */
export async function deeplxTranslate(
  sourceText: string,
  fromLang: LangCodeISO6391 | "auto",
  toLang: LangCodeISO6391,
  providerConfig: DeepLXProviderConfig,
  options?: { textFormat?: TranslationTextFormat; signal?: AbortSignal },
): Promise<string> {
  // A row that carries no endpoint of its own — an imported config, say — still
  // has somewhere to go, because `baseURL` is optional in the schema.
  const baseURL = providerConfig.baseURL || DEEPLX_DEFAULT_ENDPOINT

  const url = buildDeepLXUrl(baseURL, providerConfig.apiKey)

  const requestBody = JSON.stringify({
    text: sourceText,
    source_lang: formatLang(fromLang),
    target_lang: formatLang(toLang),
    ...(options?.textFormat === "html" ? { tag_handling: "html" } : {}),
  })

  const fetchResponse = await fetchDirect(
    url,
    requestBody,
    providerConfig.headers,
    providerConfig.apiKey,
    options?.signal,
  )

  return parseDeepLXResponse(fetchResponse)
}

function formatLang(lang: LangCodeISO6391 | "auto"): string {
  if (lang === "auto") return "auto"
  let formattedLang = lang.toUpperCase()
  if (formattedLang === "ZH-TW") formattedLang = "ZH-HANT"
  return formattedLang
}

async function fetchDirect(
  url: string,
  body: string,
  userHeaders: Record<string, unknown> | undefined,
  apiKey: string | undefined,
  signal?: AbortSignal,
) {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...resolveProviderHeaders(userHeaders, apiKey),
    },
    body,
    signal,
  }).catch((error) => {
    throw new Error(`Network error during DeepLX translation: ${error.message}`)
  })

  return resp
}

async function parseDeepLXResponse(resp: {
  ok: boolean
  status: number
  statusText: string
  text: () => Promise<string>
  json: () => Promise<any>
}) {
  if (!resp.ok) {
    const errorText = await resp.text().catch(() => "Unable to read error response")
    throw new Error(
      `DeepLX translation request failed: ${resp.status} ${resp.statusText}${
        errorText ? ` - ${errorText}` : ""
      }`,
    )
  }

  try {
    const result = await resp.json()
    if (typeof result?.data !== "string") {
      throw new TypeError("Unexpected response format from DeepLX translation API")
    }
    return result.data
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse DeepLX translation response: ${message}`, { cause: error })
  }
}

export function buildDeepLXUrl(baseURL: string, apiKey?: string): string {
  if (baseURL.includes("{{apiKey}}")) {
    const normalizedApiKey = apiKey?.trim()
    if (!normalizedApiKey) {
      throw new Error("API key is required when using {{apiKey}} placeholder in DeepLX baseURL")
    }
    return baseURL.replace(API_KEY_PLACEHOLDER_RE, normalizedApiKey)
  }

  return baseURL
}
