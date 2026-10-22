import type { Config } from "@/types/config/config"
import type { ProviderConfig } from "@/types/config/provider"
import type { ProviderCapability } from "../providers/provider-registry"
import { isTranslateProvider } from "@/types/config/provider"
import { mergeWithArrayOverwrite } from "../atoms/config"
import { getProviderConfigById } from "../config/helpers"
import { getUsableProviderIdsForCapability } from "../providers/provider-availability"

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
 * Where a feature's own on/off switch lives. Page translation is started from
 * its shortcuts, so it has no switch: clearing its provider is what turns it off.
 */
const FEATURE_ENABLED_CONFIG_PATHS = {
  videoSubtitles: ["videoSubtitles", "enabled"],
  selectionTranslation: ["selectionToolbar", "features", "translate", "enabled"],
  inputTranslation: ["inputTranslation", "enabled"],
} as const satisfies Partial<Record<FeatureKey, readonly string[]>>

function getEnabledConfigPath(featureKey: FeatureKey): readonly string[] | undefined {
  return (FEATURE_ENABLED_CONFIG_PATHS as Partial<Record<FeatureKey, readonly string[]>>)[featureKey]
}

function readConfigPath(config: Config, path: readonly string[]): unknown {
  let current: unknown = config
  for (const key of path) {
    if (typeof current !== "object" || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

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
 * Whether the feature is on. A feature with no switch of its own is on when it
 * has a provider: page translation runs on its shortcuts, not on a switch.
 */
export function isFeatureEnabled(config: Config, featureKey: FeatureKey): boolean {
  const path = getEnabledConfigPath(featureKey)
  if (!path) return FEATURE_PROVIDER_DEFS[featureKey].getProviderId(config) !== ""
  return Boolean(readConfigPath(config, path))
}

/**
 * The provider a feature runs on, or empty when it is off. A switched-off feature
 * keeps the provider it last ran on, so this is what a picker shows as "none" —
 * and what switching the feature back on has to come back to.
 */
export function getFeatureProviderId(config: Config, featureKey: FeatureKey): string {
  return isFeatureEnabled(config, featureKey)
    ? FEATURE_PROVIDER_DEFS[featureKey].getProviderId(config)
    : ""
}

/**
 * The provider a feature goes back to when it is switched on: the one it ran on
 * last if that can still run it, otherwise the first that can, otherwise none —
 * and then the caller has to say the feature cannot be turned on.
 */
export function resolveProviderToResume(config: Config, featureKey: FeatureKey): string | null {
  return resolveProviderToResumeFrom(
    config,
    featureKey,
    FEATURE_PROVIDER_DEFS[featureKey].getProviderId(config),
  )
}

/**
 * The same decision for anything that keeps a provider as the memory of what to
 * resume — a custom action, for instance, which has no switch of its own beyond
 * being off.
 */
export function resolveProviderToResumeFrom(
  config: Config,
  capability: ProviderCapability,
  storedProviderId: string,
): string | null {
  const usable = getUsableProviderIdsForCapability(capability, config.providersConfig)
  return storedProviderId && usable.includes(storedProviderId)
    ? storedProviderId
    : (usable[0] ?? null)
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

/**
 * Assign a feature's provider. No provider is the feature's "off": a feature
 * with a switch is turned off and keeps the provider it had, so switching it
 * back on can resume it; page translation, which has no switch, loses it.
 */
export function buildFeatureProviderAssignment(
  featureKey: FeatureKey,
  providerId: string,
): Partial<Config> {
  const def = FEATURE_PROVIDER_DEFS[featureKey]
  const enabledPath = getEnabledConfigPath(featureKey)
  if (!enabledPath) return buildConfigPathPatch(def.configPath, providerId)
  if (providerId === "") return buildConfigPathPatch(enabledPath, false)

  // Merged rather than spread: both halves live under the same top-level key
  // (`videoSubtitles`, `inputTranslation`).
  return mergeWithArrayOverwrite(
    buildConfigPathPatch(def.configPath, providerId),
    buildConfigPathPatch(enabledPath, true),
  )
}

/**
 * Patch for a feature's own switch. Off is the same state as "no provider"; on
 * resumes the last one, or the first that can still run the feature. Null when
 * there is nothing to resume, and the switch has to say so instead.
 */
export function buildFeatureEnabledPatch(
  config: Config,
  featureKey: FeatureKey,
  enabled: boolean,
): Partial<Config> | null {
  if (!enabled) return buildFeatureProviderAssignment(featureKey, "")

  const providerId = resolveProviderToResume(config, featureKey)
  return providerId ? buildFeatureProviderAssignment(featureKey, providerId) : null
}
