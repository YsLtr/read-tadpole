import type { LLMProviderTypes } from "@/types/config/provider"
import { FORCED_PROVIDER_HEADERS } from "@/utils/constants/providers"

const API_KEY_PLACEHOLDER_RE = /\{\{apiKey\}\}/g

function compactStringRecord(
  record?: Readonly<Record<string, unknown>>,
): Record<string, string> | undefined {
  if (!record) {
    return undefined
  }

  const compacted = Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, string] => {
      const [, value] = entry
      return typeof value === "string" && value !== ""
    }),
  )

  return Object.keys(compacted).length > 0 ? compacted : undefined
}

/**
 * The headers a row's own config contributes, for the hand-written translator
 * adapters that build their request directly instead of going through the AI SDK.
 *
 * `{{apiKey}}` is filled from the row's key, the same placeholder a DeepLX base URL
 * already takes. A header left empty by the substitution is dropped rather than sent
 * blank: `Authorization: DeepL-Auth-Key ` carries the scheme but no credential, which
 * reads as a malformed request instead of a missing key.
 */
export function resolveProviderHeaders(
  userHeaders?: Record<string, unknown>,
  apiKey?: string,
): Record<string, string> | undefined {
  const configured = compactStringRecord(userHeaders)
  if (!configured) {
    return undefined
  }

  const key = apiKey?.trim()
  const resolved = Object.entries(configured).flatMap(([name, value]) => {
    if (!value.includes("{{apiKey}}")) {
      return [[name, value] as const]
    }
    if (!key) {
      return []
    }
    return [[name, value.replace(API_KEY_PLACEHOLDER_RE, key)] as const]
  })

  return resolved.length > 0 ? Object.fromEntries(resolved) : undefined
}

export function getForcedProviderHeaders(
  provider: LLMProviderTypes,
): Record<string, string> | undefined {
  return compactStringRecord(FORCED_PROVIDER_HEADERS[provider])
}

/**
 * The headers a request actually goes out with: whatever the user's config holds, with the
 * forced ones layered last so they always win a name collision.
 *
 * There is no third source. A header a provider should merely start out with is seeded into
 * `DEFAULT_PROVIDER_CONFIG[provider].headers`, so it arrives here as ordinary user config —
 * visible in the form, and no longer able to vanish the moment the user adds one of their own.
 */
export function getProviderHeadersWithOverride(
  provider: LLMProviderTypes,
  userHeaders?: Record<string, unknown>,
): Record<string, string> | undefined {
  const configured = compactStringRecord(userHeaders)
  const forced = getForcedProviderHeaders(provider)

  if (!forced) {
    return configured
  }

  return { ...configured, ...forced }
}
