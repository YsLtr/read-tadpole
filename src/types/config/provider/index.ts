import type {
  APIProviderConfig,
  LLMProviderConfig,
  OpenAICompatibleLLMProviderConfig,
  ProtocolCompatibleLLMProviderConfig,
  ProviderConfig,
  TranslateProviderConfig,
} from "./schemas"
import {
  isAPIProvider,
  isLLMProvider,
  isOpenAICompatibleLLMProvider,
  isProtocolCompatibleLLMProvider,
  isPureTranslateProvider,
  isTranslateProvider,
} from "./constants"

export * from "./constants"
export * from "./schemas"

export function isTranslateProviderConfig(
  config: ProviderConfig,
): config is TranslateProviderConfig {
  return isTranslateProvider(config.provider)
}

export function isLLMProviderConfig(config: ProviderConfig): config is LLMProviderConfig {
  return isLLMProvider(config.provider)
}

export function isOpenAICompatibleLLMProviderConfig(
  config: ProviderConfig,
): config is OpenAICompatibleLLMProviderConfig {
  return isOpenAICompatibleLLMProvider(config.provider)
}

export function isProtocolCompatibleLLMProviderConfig(
  config: ProviderConfig,
): config is ProtocolCompatibleLLMProviderConfig {
  return isProtocolCompatibleLLMProvider(config.provider)
}

export function isAPIProviderConfig(config: ProviderConfig): config is APIProviderConfig {
  return isAPIProvider(config.provider)
}

export function isPureTranslateProviderConfig(config: ProviderConfig): boolean {
  return isTranslateProvider(config.provider) && isPureTranslateProvider(config.provider)
}
