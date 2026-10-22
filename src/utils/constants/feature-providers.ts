import type { Config } from "@/types/config/config"
import type { ProviderConfig } from "@/types/config/provider"
import { isTranslateProvider } from "@/types/config/provider"
import { mergeWithArrayOverwrite } from "../atoms/config"
import { getProviderConfigById } from "../config/helpers"

export const FEATURE_KEYS = [
  "pageTranslation",
  "videoSubtitles",
  "selectionTranslation",
  "inputTranslation",
] as const

export type FeatureKey = (typeof FEATURE_KEYS)[number]

export interface FeatureProviderDef {
  getProviderId: (config: Config) => string
  configPath: readonly string[]
  isProvider: (provider: string) => boolean
}

export const FEATURE_PROVIDER_DEFS = {
  pageTranslation: {
    isProvider: isTranslateProvider,
    getProviderId: (c: Config) => c.pageTranslation.providerId,
    configPath: ["pageTranslation", "providerId"],
  },
  videoSubtitles: {
    isProvider: isTranslateProvider,
    getProviderId: (c: Config) => c.videoSubtitles.providerId,
    configPath: ["videoSubtitles", "providerId"],
  },
  selectionTranslation: {
    isProvider: isTranslateProvider,
    getProviderId: (c: Config) => c.selectionToolbar.features.translate.providerId,
    configPath: ["selectionToolbar", "features", "translate", "providerId"],
  },
  inputTranslation: {
    isProvider: isTranslateProvider,
    getProviderId: (c: Config) => c.inputTranslation.providerId,
    configPath: ["inputTranslation", "providerId"],
  },
} as const satisfies Record<FeatureKey, FeatureProviderDef>

/** Maps FeatureKey (with dots) to i18n-safe key (with underscores) for `options.apiProviders.featureProviders.features.*` */
export const FEATURE_KEY_I18N_MAP = {
  pageTranslation: "pageTranslation",
  videoSubtitles: "videoSubtitles",
  selectionTranslation: "selectionTranslation",
  inputTranslation: "inputTranslation",
} as const satisfies Record<FeatureKey, string>

export type FeatureLabelI18nKey =
  `options.apiProviders.featureProviders.features.${(typeof FEATURE_KEY_I18N_MAP)[FeatureKey]}`

export function getFeatureLabelI18nKey(featureKey: FeatureKey): FeatureLabelI18nKey {
  return `options.apiProviders.featureProviders.features.${FEATURE_KEY_I18N_MAP[featureKey]}`
}

export type FeatureDescriptionI18nKey =
  `options.apiProviders.featureProviders.descriptions.${(typeof FEATURE_KEY_I18N_MAP)[FeatureKey]}`

export function getFeatureDescriptionI18nKey(featureKey: FeatureKey): FeatureDescriptionI18nKey {
  return `options.apiProviders.featureProviders.descriptions.${FEATURE_KEY_I18N_MAP[featureKey]}`
}

export function resolveProviderConfig(config: Config, featureKey: FeatureKey) {
  const providerConfig = resolveProviderConfigOrNull(config, featureKey)
  if (!providerConfig) {
    const providerId = FEATURE_PROVIDER_DEFS[featureKey].getProviderId(config)
    throw new Error(`No provider config for id "${providerId}" (feature "${featureKey}")`)
  }
  return providerConfig
}

export function resolveProviderConfigOrNull(
  config: Config,
  featureKey: FeatureKey,
): ProviderConfig | null {
  const def = FEATURE_PROVIDER_DEFS[featureKey]
  const providerId = def.getProviderId(config)
  return getProviderConfigById(config.providersConfig, providerId) ?? null
}

/**
 * Where a feature's own on/off switch lives, for the features that have one.
 * Page translation is started from its shortcuts, so it has no switch: clearing
 * its provider is what turns it off.
 */
const FEATURE_ENABLED_CONFIG_PATHS = {
  videoSubtitles: ["videoSubtitles", "enabled"],
  selectionTranslation: ["selectionToolbar", "features", "translate", "enabled"],
  inputTranslation: ["inputTranslation", "enabled"],
} as const satisfies Partial<Record<FeatureKey, readonly string[]>>

/** Build a nested Partial<Config> patch from a config path and the value to set there. */
function buildConfigPathPatch(path: readonly string[], value: unknown): Partial<Config> {
  let patch: Record<string, unknown> = {}
  let current = patch
  for (let i = 0; i < path.length - 1; i++) {
    const next: Record<string, unknown> = {}
    current[path[i]!] = next
    current = next
  }
  current[path[path.length - 1]!] = value
  return patch as Partial<Config>
}

/**
 * Convert a feature→providerId mapping into a Partial<Config> using FEATURE_PROVIDER_DEFS.configPath.
 * Generic — works for any scenario that assigns provider IDs to features.
 */

export function buildFeatureProviderPatch(
  assignments: Partial<Record<FeatureKey, string>>,
): Partial<Config> {
  let patch: Partial<Config> = {}

  for (const key of FEATURE_KEYS) {
    const newId = assignments[key]
    if (newId === undefined) continue

    const def = FEATURE_PROVIDER_DEFS[key]
    patch = mergeWithArrayOverwrite(patch, buildConfigPathPatch(def.configPath, newId))
  }

  return patch
}

/** The feature's own on/off state, for the features that have one. */
function buildFeatureEnabledPatch(featureKey: FeatureKey, enabled: boolean): Partial<Config> {
  const path = (FEATURE_ENABLED_CONFIG_PATHS as Partial<Record<FeatureKey, readonly string[]>>)[
    featureKey
  ]
  return path ? buildConfigPathPatch(path, enabled) : {}
}

/**
 * Assign a feature's provider, keeping the feature's own switch in step: an empty
 * provider means the feature is off. Merged rather than spread, because both
 * halves can live under the same top-level key (`videoSubtitles`).
 */
export function buildFeatureProviderAssignment(
  featureKey: FeatureKey,
  providerId: string,
): Partial<Config> {
  return mergeWithArrayOverwrite(
    buildFeatureProviderPatch({ [featureKey]: providerId }),
    buildFeatureEnabledPatch(featureKey, providerId !== ""),
  )
}
