import type { Config } from "@/types/config/config"
import type { LLMProviderConfig } from "@/types/config/provider"
import { createOpenAI } from "@ai-sdk/openai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { storage } from "#imports"
import { isResponsesEndpointFormat } from "@/types/config/provider"
import { getLLMProvidersConfig, getProviderConfigById } from "../config/helpers"
import { CONFIG_STORAGE_KEY } from "../constants/config"
import { isBilibiliEndpoint } from "@/utils/constants/models"
import { bilibiliFetch } from "./bilibili"
import { getProviderHeadersWithOverride } from "./headers"
import { resolveModelId } from "./model-id"
import { ProviderSetupError } from "./provider-setup-error"

async function getLanguageModelById(providerId: string) {
  const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
  if (!config) {
    throw new ProviderSetupError("Config not found")
  }

  const LLMProvidersConfig = getLLMProvidersConfig(config.providersConfig)
  const providerConfig = getProviderConfigById(LLMProvidersConfig, providerId)
  if (!providerConfig) {
    throw new ProviderSetupError(`Provider ${providerId} not found`)
  }

  return getLanguageModelForConfig(providerConfig)
}

/**
 * Build a model from a config the caller already holds.
 *
 * Callers that were handed a provider config — a transported `providerRef`, say
 * — must use this rather than looking the id up again: re-reading storage picks
 * up edits made after the ref was captured, so the model would come from the
 * new row while the params derived from the ref came from the old one.
 */
export function getLanguageModelForConfig(providerConfig: LLMProviderConfig) {
  const headers = getProviderHeadersWithOverride(providerConfig.provider, providerConfig.headers)
  const modelId = resolveModelId(providerConfig.model)

  if (!modelId) {
    throw new ProviderSetupError("Model is undefined")
  }

  // The custom provider is the one place a user picks the wire format, because
  // a self-hosted gateway may speak either. Chat Completions goes through the
  // OpenAI-compatible factory; the Responses API needs its own client, which is
  // why it is built from `baseURL` here rather than a separate provider type.
  if (isResponsesEndpointFormat(providerConfig.endpointFormat)) {
    const openai = createOpenAI({
      name: providerConfig.provider,
      baseURL: providerConfig.baseURL,
      ...(providerConfig.apiKey && { apiKey: providerConfig.apiKey }),
      ...(headers && { headers }),
    })
    return openai.responses(modelId)
  }

  const provider = createOpenAICompatible({
    name: providerConfig.provider,
    baseURL: providerConfig.baseURL,
    supportsStructuredOutputs: true,
    // The free Bilibili gateway is the only endpoint that needs the Origin rule
    // and request tweaks; every other custom endpoint fetches normally.
    ...(isBilibiliEndpoint(providerConfig.baseURL) && { fetch: bilibiliFetch }),
    ...(providerConfig.apiKey && { apiKey: providerConfig.apiKey }),
    ...(headers && { headers }),
  })

  return provider.languageModel(modelId)
}

export async function getModelById(providerId: string) {
  return getLanguageModelById(providerId)
}
