import type { APIProviderConfig } from "@/types/config/provider"

/** Return the configured endpoint used to connect to an API provider. */
export function getProviderConnectionURL(providerConfig: APIProviderConfig): string {
  // Required by the LLM schemas and defaulted for the rest, so the empty case
  // only exists for a hand-edited config; the model picker never sees one.
  return providerConfig.baseURL ?? ""
}
