import type { JSONValue } from "ai"
import type { LLMProviderConfig } from "@/types/config/provider"
import { isOpenAICompatibleLLMProvider, isResponsesEndpointFormat } from "@/types/config/provider"

const OPENAI_COMPATIBLE_OPTION_ALIASES = {
  reasoning_effort: "reasoningEffort",
  verbosity: "textVerbosity",
} as const satisfies Record<string, string>

type ProviderOptionsOwner = Pick<LLMProviderConfig, "provider" | "endpointFormat">

function normalizeUserProviderOptions(
  provider: string,
  userOptions: Record<string, JSONValue>,
): Record<string, JSONValue> {
  if (!isOpenAICompatibleLLMProvider(provider)) {
    return userOptions
  }

  let changed = false
  const normalizedOptions: Record<string, JSONValue> = { ...userOptions }

  for (const [rawKey, canonicalKey] of Object.entries(OPENAI_COMPATIBLE_OPTION_ALIASES)) {
    if (!(rawKey in normalizedOptions)) {
      continue
    }

    if (!(canonicalKey in normalizedOptions)) {
      normalizedOptions[canonicalKey] = normalizedOptions[rawKey]!
    }

    delete normalizedOptions[rawKey]
    changed = true
  }

  return changed ? normalizedOptions : userOptions
}

/**
 * The key the model we build reads its options from. The Chat Completions client
 * accepts the provider name it was created with or the camelCase form of it — but
 * flags the former as deprecated — while the Responses client is hard-coded to
 * `openai` (`azure` when its name says so), so anything filed under the custom
 * provider's own name is silently dropped there.
 */
function getProviderOptionsKey(owner: ProviderOptionsOwner): string {
  if (isResponsesEndpointFormat(owner.endpointFormat)) {
    return "openai"
  }

  const name = owner.provider.split(".")[0]!.trim()
  return name.replace(/[-_]([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

/**
 * Wrap the reader's provider options for the AI SDK request shape.
 *
 * Nothing is recommended on top: a custom endpoint's model id says nothing about
 * which vendor-specific extras that endpoint accepts, so only what the reader
 * typed is sent. `undefined` means "say nothing", which keeps the provider's own
 * default.
 */
export function getProviderOptions(
  owner: ProviderOptionsOwner,
  userOptions?: Record<string, JSONValue>,
): Record<string, Record<string, JSONValue>> | undefined {
  if (userOptions === undefined) {
    return undefined
  }

  return {
    [getProviderOptionsKey(owner)]: normalizeUserProviderOptions(owner.provider, userOptions),
  }
}
