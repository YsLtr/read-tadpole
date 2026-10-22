import type { Config } from "@/types/config/config"
import type { LanguageDetectionMode } from "@/types/config/language-detection"
import type {
  APIProviderConfig,
  LLMProviderConfig,
  ProviderConfig,
  ProvidersConfig,
  TranslateProviderConfig,
} from "@/types/config/provider"
import type { FeatureKey } from "@/utils/constants/feature-providers"
import {
  isAPIProviderConfig,
  isLLMProviderConfig,
  isTranslateProviderConfig,
} from "@/types/config/provider"
import {
  FEATURE_KEYS,
  FEATURE_PROVIDER_DEFS,
  isFeatureEnabled,
} from "@/utils/constants/feature-providers"
import { getSelectionToolbarActions, patchSelectionToolbarAction } from "@/utils/custom-actions"
import { getUsableProviderIdsForCapability } from "@/utils/providers/provider-availability"

export function getProviderConfigById<T extends ProviderConfig>(
  providersConfig: T[],
  providerId: string,
): T | undefined {
  return providersConfig.find((p) => p.id === providerId)
}

export function getLLMProvidersConfig(providersConfig: ProvidersConfig): LLMProviderConfig[] {
  return providersConfig.filter(isLLMProviderConfig)
}

export function getAPIProvidersConfig(providersConfig: ProvidersConfig): APIProviderConfig[] {
  return providersConfig.filter(isAPIProviderConfig)
}

export function getTranslateProvidersConfig(
  providersConfig: ProvidersConfig,
): TranslateProviderConfig[] {
  return providersConfig.filter(isTranslateProviderConfig)
}

export function filterEnabledProvidersConfig(providersConfig: ProvidersConfig): ProvidersConfig {
  return providersConfig.filter((p) => p.enabled)
}

export function getEnabledLLMProvidersConfig(
  providersConfig: ProvidersConfig,
): LLMProviderConfig[] {
  return filterEnabledProvidersConfig(providersConfig).filter(isLLMProviderConfig)
}

export function getProviderKeyByName(
  providersConfig: ProvidersConfig,
  providerId: string,
): string | undefined {
  const provider = getProviderConfigById(providersConfig, providerId)
  return provider?.provider
}

export function getProviderModelConfig(config: Config, providerId: string) {
  const providerConfig = getProviderConfigById(config.providersConfig, providerId)
  if (providerConfig && isLLMProviderConfig(providerConfig)) {
    return providerConfig.model
  }
  return undefined
}

export function getProviderApiKey(
  providersConfig: ProvidersConfig,
  providerId: string,
): string | undefined {
  const providerConfig = getProviderConfigById(providersConfig, providerId)
  if (providerConfig && isAPIProviderConfig(providerConfig)) {
    return providerConfig.apiKey
  }
  return undefined
}

export function resolveLanguageDetectionConfigForModeChange(
  currentConfig: Config["languageDetection"],
  nextMode: LanguageDetectionMode,
  providersConfig: ProvidersConfig,
): Partial<Config["languageDetection"]> | null {
  if (nextMode === "basic") {
    return { mode: "basic" }
  }

  // Capability-based, not a plain providersConfig filter: language detection
  // needs a promptable model, and a pure translate provider cannot do it.
  const availableIds = getUsableProviderIdsForCapability("languageDetection", providersConfig)
  if (availableIds.length === 0) {
    return null
  }

  const hasSelectedProvider =
    currentConfig.providerId !== undefined && availableIds.includes(currentConfig.providerId)
  return {
    mode: "llm",
    providerId: hasSelectedProvider ? currentConfig.providerId : availableIds[0]!,
  }
}

/**
 * Compute fallback provider assignments when a provider is deleted.
 * For each feature using the deleted provider, picks the first remaining
 * provider that can actually run it — reassigning to one the account cannot use
 * is what turns a delete into a silently broken feature.
 */
export function computeProviderFallbacksAfterDeletion(
  deletedProviderId: string,
  config: Config,
  remainingProviders: ProvidersConfig,
): Partial<Record<FeatureKey, string>> {
  const updates: Partial<Record<FeatureKey, string>> = {}
  for (const key of FEATURE_KEYS) {
    const def = FEATURE_PROVIDER_DEFS[key]
    const currentId = def.getProviderId(config)
    if (currentId !== deletedProviderId) continue
    const fallbackProviderId = getUsableProviderIdsForCapability(key, remainingProviders)[0]
    if (fallbackProviderId) updates[key] = fallbackProviderId
  }
  return updates
}

/**
 * The first feature that would be left with no provider that can actually run
 * it, or null when every feature keeps a working one.
 *
 * Gated on usable providers, not merely present ones. `getProviderIdsForCapability`
 * appends the built-ins unconditionally, so the old presence check was
 * satisfied for every feature and this guard never fired — a user could delete
 * their last BYOK provider and have half the extension silently reassigned to a
 * tier their plan does not fund.
 *
 * `status` decides which built-ins count. Omitting it (or passing a status that
 * has not loaded) treats them as usable, so an unreachable status endpoint
 * cannot block someone from deleting their own credentials.
 *
 * Features the user has switched off are skipped: their provider is only a
 * memory of what to resume, and switching one back on picks whatever can still
 * run it (or refuses). Blocking a delete for a slot nothing is using would make
 * the last provider undeletable.
 */
export function findFeatureMissingProvider(
  remainingProviders: ProvidersConfig,
  config?: Config,
): FeatureKey | "languageDetection" | null {
  for (const key of FEATURE_KEYS) {
    // A feature that is off has nothing to lose: it keeps its provider, and
    // switching it back on resumes whatever can still run it.
    if (config && !isFeatureEnabled(config, key)) continue
    if (!getUsableProviderIdsForCapability(key, remainingProviders)[0]) {
      return key
    }
  }

  if (
    config?.languageDetection.mode === "llm" &&
    getUsableProviderIdsForCapability("languageDetection", remainingProviders).length === 0
  ) {
    return "languageDetection"
  }

  return null
}

/**
 * Reassign selection toolbar actions that reference the deleted provider.
 * Fallback target must be the first enabled LLM provider.
 * Returns null when no action is affected or when no fallback exists.
 */
export function computeSelectionToolbarCustomActionFallbacksAfterDeletion(
  deletedProviderId: string,
  config: Config,
  remainingProviders: ProvidersConfig,
): Config["selectionToolbar"] | null {
  const affectedActions = getSelectionToolbarActions(config.selectionToolbar).filter(
    (action) => action.providerId === deletedProviderId,
  )

  if (affectedActions.length === 0) {
    return null
  }

  const fallbackProviderId = getUsableProviderIdsForCapability(
    "customAction",
    remainingProviders,
  )[0]
  if (!fallbackProviderId) {
    return null
  }

  return affectedActions.reduce(
    (selectionToolbar, action) =>
      patchSelectionToolbarAction(selectionToolbar, action.id, {
        providerId: fallbackProviderId,
      }),
    config.selectionToolbar,
  )
}

/**
 * Compute languageDetection fallback when a provider is deleted.
 * Only applies when mode is "llm" and the deleted provider is the current one.
 * Returns the new providerId (first enabled LLM), or undefined if none available.
 * Returns null when no change is needed.
 */
export function computeLanguageDetectionFallbackAfterDeletion(
  deletedProviderId: string,
  config: Config,
  remainingProviders: ProvidersConfig,
): string | undefined | null {
  if (config.languageDetection.mode !== "llm") return null
  if (config.languageDetection.providerId !== deletedProviderId) return null

  // Resolved by capability rather than by a bare `providersConfig` lookup, so
  // only a provider that can actually run detection is offered here.
  return getUsableProviderIdsForCapability("languageDetection", remainingProviders)[0]
}
