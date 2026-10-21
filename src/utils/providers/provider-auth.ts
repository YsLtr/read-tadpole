import type { APIProviderTypes } from "@/types/config/provider"
import { isPureAPIProvider } from "@/types/config/provider"
import { isBilibiliEndpoint } from "@/utils/constants/models"

/**
 * Whether a provider authenticates with a key of the user's own.
 *
 * The free Bilibili preset needs no key, but it is now an ordinary
 * `openai-compatible` endpoint rather than a provider type, so the endpoint URL
 * is what tells the two apart. DeepLX's self-hosted server and DeepL's official
 * API are handled by type.
 */
export function providerNeedsApiKey(
  providerType: APIProviderTypes,
  baseURL: string | undefined,
): boolean {
  if (isPureAPIProvider(providerType)) {
    // DeepLX is commonly self-hosted without auth; DeepL always needs its key.
    return providerType === "deepl"
  }
  return !isBilibiliEndpoint(baseURL)
}
