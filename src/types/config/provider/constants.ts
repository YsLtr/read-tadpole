import { LLM_PROVIDER_MODELS, PURE_TRANSLATE_PROVIDERS } from "@/utils/constants/models"

// Re-export for external consumers.
export { LLM_PROVIDER_MODELS, PURE_TRANSLATE_PROVIDERS }

/* ──────────────────────────────
  Derived provider names
  ────────────────────────────── */

// translate provider names
export const TRANSLATE_PROVIDER_TYPES = [
  "openai-compatible",
  "deeplx",
  "deepl",
  "google-translate",
  "microsoft-translate",
] as const satisfies Readonly<
  (keyof typeof LLM_PROVIDER_MODELS | (typeof PURE_TRANSLATE_PROVIDERS)[number])[]
>
export type TranslateProviderTypes = (typeof TRANSLATE_PROVIDER_TYPES)[number]
export function isTranslateProvider(provider: string): provider is TranslateProviderTypes {
  return TRANSLATE_PROVIDER_TYPES.includes(provider)
}

export const LLM_PROVIDER_TYPES = ["openai-compatible"] as const satisfies Readonly<
  (keyof typeof LLM_PROVIDER_MODELS)[]
>
export type LLMProviderTypes = (typeof LLM_PROVIDER_TYPES)[number]
export function isLLMProvider(provider: string): provider is LLMProviderTypes {
  return LLM_PROVIDER_TYPES.includes(provider)
}

const OPENAI_COMPATIBLE_CUSTOM_LLM_PROVIDER_TYPE = "openai-compatible"

export const OPENAI_COMPATIBLE_LLM_PROVIDER_TYPES = [
  OPENAI_COMPATIBLE_CUSTOM_LLM_PROVIDER_TYPE,
] as const satisfies Readonly<LLMProviderTypes[]>
export type OpenAICompatibleLLMProviderTypes = (typeof OPENAI_COMPATIBLE_LLM_PROVIDER_TYPES)[number]
export function isOpenAICompatibleLLMProvider(
  provider: string,
): provider is OpenAICompatibleLLMProviderTypes {
  return OPENAI_COMPATIBLE_LLM_PROVIDER_TYPES.includes(provider)
}

/** Every LLM provider here speaks the OpenAI-compatible protocol. */
export const PROTOCOL_COMPATIBLE_LLM_PROVIDER_TYPES = OPENAI_COMPATIBLE_LLM_PROVIDER_TYPES
export type ProtocolCompatibleLLMProviderTypes = OpenAICompatibleLLMProviderTypes
export function isProtocolCompatibleLLMProvider(
  provider: string,
): provider is ProtocolCompatibleLLMProviderTypes {
  return OPENAI_COMPATIBLE_LLM_PROVIDER_TYPES.includes(provider)
}

export const CUSTOM_MODEL_ONLY_PROVIDER_TYPES = [
  OPENAI_COMPATIBLE_CUSTOM_LLM_PROVIDER_TYPE,
] as const satisfies Readonly<ProtocolCompatibleLLMProviderTypes[]>
export type CustomModelOnlyProviderTypes = (typeof CUSTOM_MODEL_ONLY_PROVIDER_TYPES)[number]
export function isCustomModelOnlyProvider(
  provider: string,
): provider is CustomModelOnlyProviderTypes {
  return CUSTOM_MODEL_ONLY_PROVIDER_TYPES.includes(provider)
}

/**
 * Every provider name. A keyless translator is an ordinary provider row — its
 * key, endpoint and model are just empty — so the set of API-shaped configs and
 * the set of provider types are the same set.
 */
export const ALL_PROVIDER_TYPES = [
  "deeplx",
  "deepl",
  "openai-compatible",
  "google-translate",
  "microsoft-translate",
] as const satisfies Readonly<TranslateProviderTypes[]>
export type AllProviderTypes = (typeof ALL_PROVIDER_TYPES)[number]

export const API_PROVIDER_TYPES = ALL_PROVIDER_TYPES
export type APIProviderTypes = AllProviderTypes
export function isAPIProvider(provider: string): provider is APIProviderTypes {
  return (ALL_PROVIDER_TYPES as readonly string[]).includes(provider)
}

export function isPureTranslateProvider(
  provider: TranslateProviderTypes,
): provider is (typeof PURE_TRANSLATE_PROVIDERS)[number] {
  return PURE_TRANSLATE_PROVIDERS.includes(provider)
}

/* ──────────────────────────────
  Per-provider request options
  ────────────────────────────── */

/**
 * How much thinking a model does before it answers. Passed to the AI SDK as the
 * top-level `reasoning` call option, which each provider maps to whatever its own
 * wire format calls it — `reasoning_effort` for the OpenAI-compatible protocol,
 * `reasoning.effort` for the Responses API. `provider-default` is sent as an
 * explicit "say nothing", so a provider's own default survives.
 */
export const AI_SDK_REASONING_VALUES = [
  "provider-default",
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
] as const
export type AISDKReasoning = (typeof AI_SDK_REASONING_VALUES)[number]

/**
 * The wire format a custom endpoint speaks. Both are reachable through the one
 * custom provider, because a self-hosted gateway is just as likely to expose
 * `/chat/completions` as `/responses` and the two are not interchangeable.
 */
export const API_ENDPOINT_FORMATS = ["chat", "responses"] as const
export type APIEndpointFormat = (typeof API_ENDPOINT_FORMATS)[number]
export const DEFAULT_API_ENDPOINT_FORMAT: APIEndpointFormat = "chat"

/** An endpoint that has not chosen a format yet is a Chat Completions endpoint. */
export function resolveEndpointFormat(format: APIEndpointFormat | undefined): APIEndpointFormat {
  return format ?? DEFAULT_API_ENDPOINT_FORMAT
}
export function isResponsesEndpointFormat(format: APIEndpointFormat | undefined): boolean {
  return resolveEndpointFormat(format) === "responses"
}
