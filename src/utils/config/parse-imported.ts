import type { Config } from "@/types/config/config"
import type { ProviderConfig, ProvidersConfig } from "@/types/config/provider"
import type { ProviderCapability } from "@/utils/providers/provider-registry"
import type { ZodType } from "zod"
import { configSchema } from "@/types/config/config"
import {
  isCustomModelOnlyProvider,
  providerConfigItemSchema,
  providerConfigSchemaList,
} from "@/types/config/provider"
import { selectionToolbarCustomActionSchema } from "@/types/config/selection-toolbar"
import { createDefaultTTSLanguageVoices } from "@/types/config/tts"
import { buildFreshDefaultConfig } from "@/utils/constants/config"
import {
  BUILT_IN_ACTION_IDS,
  BUILT_IN_ACTION_KEYS,
  isBuiltInActionId,
} from "@/utils/constants/custom-action"
import {
  FEATURE_KEYS,
  FEATURE_PROVIDER_DEFS,
  isFeatureEnabled,
} from "@/utils/constants/feature-providers"
import {
  BILIBILI_PRESET_PROVIDER_CONFIG,
  DEFAULT_LLM_PROVIDER_MODELS,
} from "@/utils/constants/providers"
import { logger } from "@/utils/logger"
import { getUniqueName } from "@/utils/name"
import { getUsableProviderIdsForCapability } from "@/utils/providers/provider-availability"
import { doesProviderSupportsCapability } from "@/utils/providers/provider-registry"

/**
 * Read a config this build did not write itself — an imported file, a Drive
 * blob, a backup, the last-synced mirror, the stored config on startup — by
 * looking at which fields it carries rather than at a version number.
 *
 * This is the only way a config is read. Everything a build writes goes through
 * `configSchema` first, so a stored value that does not validate is not this
 * build's own output: answering it with the defaults would trade the reader's
 * settings for whatever changed shape, and refusing it would do the same.
 *
 * Nothing here compares versions: a field the payload has is used, a field it
 * does not have (or carries in a shape this build cannot read) is left at this
 * build's default, and a field this build does not know is dropped. Losing an
 * unusable value is deliberate — the alternative, refusing the whole file,
 * throws away everything the payload got right.
 *
 * The same walk puts back what an export leaves out; see `portable-config.ts`
 * for what that is and why it is safe to rebuild.
 */
export function parseImportedConfig(value: unknown): Config {
  const payload = unwrapConfigPayload(value)
  const sectionSchemas = configSchema.shape as unknown as Record<string, ZodType>

  // A payload with none of the sections this build knows is not a config the
  // reader meant to import, and answering with the defaults would silently
  // replace everything they had.
  if (!Object.keys(sectionSchemas).some((sectionKey) => sectionKey in payload)) {
    throw new TypeError("The file does not contain a config object")
  }

  // Every section starts at what this build writes for a fresh install, cloned so
  // the repairs below can never write into the shared default. A fresh-install
  // config rather than `DEFAULT_CONFIG`, because the two differ in fields a
  // payload may leave out: importing over `DEFAULT_CONFIG` would materialise an
  // explicit default shortcut no code ever stores, which then reads as a change
  // against the same config in a Drive copy.
  const base = structuredClone(buildFreshDefaultConfig())
  const draft: Record<string, unknown> = { ...base }

  for (const [sectionKey, sectionSchema] of Object.entries(sectionSchemas)) {
    if (sectionKey === "providersConfig") continue
    if (!(sectionKey in payload)) continue

    draft[sectionKey] = parseOverDefaults(
      sectionSchema,
      base[sectionKey as keyof Config],
      normalizeSectionCandidate(sectionKey, payload[sectionKey]),
    )
  }

  draft.providersConfig = readProvidersConfig(payload.providersConfig, base.providersConfig)

  const config = repairProviderReferences(draft as unknown as Config)
  const parsed = configSchema.safeParse(config)
  if (parsed.success) return parsed.data

  // Every section above was already reduced to something this build reads, so a
  // config that still fails is this reader's bug rather than a bad file. Say so
  // instead of answering with the defaults, which would look like the import
  // worked while replacing everything in it.
  logger.warn("Imported config still does not validate", parsed.error)
  throw new Error(parsed.error.message)
}

/* ──────────────────────────────
  Reading the payload
  ────────────────────────────── */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * An exported file wraps the config in `{ config }`; a stored value, a backup
 * record and a last-synced mirror are the config itself. Read either shape,
 * because a file written by an older build is still one of them.
 */
function unwrapConfigPayload(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new TypeError("The file does not contain a config object")
  }
  return isPlainObject(value.config) ? value.config : value
}

/**
 * The payload's value for `field`, over the default one. Objects are matched key
 * by key; anything else — an array, a number, null — replaces the default whole,
 * because a list of the reader's own is not a merge.
 */
function mergeOverDefaults(fallback: unknown, candidate: unknown): unknown {
  if (!isPlainObject(fallback) || !isPlainObject(candidate)) return candidate

  const merged: Record<string, unknown> = { ...fallback }
  for (const [key, value] of Object.entries(candidate)) {
    merged[key] = key in merged ? mergeOverDefaults(merged[key], value) : value
  }
  return merged
}

type SchemaNode = {
  shape?: Record<string, ZodType>
  def?: { innerType?: SchemaNode; in?: SchemaNode; out?: SchemaNode }
}

/**
 * The object a schema describes, seen through its defaults, optionals and
 * transforms — `selectionToolbarSchema` is an object with a `.transform()` on it,
 * and a field-by-field read still wants the fields underneath.
 */
function getObjectShape(schema: ZodType): Record<string, ZodType> | null {
  const pending: SchemaNode[] = [schema as unknown as SchemaNode]
  const visited = new Set<SchemaNode>()

  while (pending.length > 0) {
    const node = pending.shift()!
    if (visited.has(node)) continue
    visited.add(node)

    if (node.shape) return node.shape

    const def = node.def
    if (!def) continue
    for (const inner of [def.innerType, def.in, def.out]) {
      if (inner) pending.push(inner)
    }
  }

  return null
}

/**
 * Take the payload's value for a section where this build can read it, and the
 * default everywhere else. Whole-section first; when that fails, field group by
 * field group, so one out-of-range number costs that number rather than the
 * section around it.
 */
function parseOverDefaults(schema: ZodType, fallback: unknown, candidate: unknown): unknown {
  const parsed = schema.safeParse(mergeOverDefaults(fallback, candidate))
  if (parsed.success) return parsed.data

  const shape = getObjectShape(schema)
  if (!shape || !isPlainObject(fallback) || !isPlainObject(candidate)) return fallback

  const repaired: Record<string, unknown> = { ...fallback }
  for (const [fieldKey, fieldSchema] of Object.entries(shape)) {
    if (!(fieldKey in candidate)) continue
    repaired[fieldKey] = parseOverDefaults(fieldSchema, fallback[fieldKey], candidate[fieldKey])
  }

  const retried = schema.safeParse(repaired)
  return retried.success ? retried.data : fallback
}

/**
 * Apply the field-level rules that a plain merge cannot express: fields the
 * build owns (a file's value for them is not the reader's choice) and lists
 * whose entries this build has to read one at a time.
 */
function normalizeSectionCandidate(sectionKey: string, candidate: unknown): unknown {
  if (!isPlainObject(candidate)) return candidate

  if (sectionKey === "language") {
    // `level` is fixed by the schema, so a payload's value for it is ignored
    // either way; dropping it here as well keeps a value this build cannot read
    // (an old name, a number) from costing the languages around it.
    const { level: _level, ...language } = candidate
    return language
  }

  if (sectionKey === "tts" && "languageVoices" in candidate) {
    return { ...candidate, languageVoices: readLanguageVoices(candidate.languageVoices) }
  }

  if (sectionKey === "selectionToolbar" && "customActions" in candidate) {
    return { ...candidate, customActions: readCustomActions(candidate.customActions) }
  }

  return candidate
}

/**
 * Drop the voices of languages this build does not have, so one unknown entry
 * does not cost the whole table (the schema rejects an unknown key).
 */
function readLanguageVoices(candidate: unknown): unknown {
  if (!isPlainObject(candidate)) return candidate

  const knownVoices = createDefaultTTSLanguageVoices()
  const voices: Record<string, unknown> = {}
  for (const [langCode, voice] of Object.entries(candidate)) {
    if (!(langCode in knownVoices)) continue
    voices[langCode] = voice
  }
  return voices
}

/**
 * Read the custom actions one at a time: an action this build cannot read (or
 * one that clashes with a built-in id) is dropped on its own, taking the toolbar
 * around it down with it otherwise.
 */
function readCustomActions(candidate: unknown): unknown {
  if (!Array.isArray(candidate)) return candidate

  const actions: Config["selectionToolbar"]["customActions"] = []
  const ids = new Set<string>()
  const names = new Set<string>()

  for (const entry of candidate) {
    const parsed = selectionToolbarCustomActionSchema.safeParse(entry)
    if (!parsed.success) continue

    const action = parsed.data
    // A built-in action's id is reserved: the toolbar derives that action from
    // code and would render two items for one id.
    if (isBuiltInActionId(action.id) || ids.has(action.id)) continue

    action.name = getUniqueName(action.name, names)
    ids.add(action.id)
    names.add(action.name)
    actions.push(action)
  }

  return actions
}

/* ──────────────────────────────
  Reading providers
  ────────────────────────────── */

/**
 * The fields this build's schema knows for a provider type. The provider schema
 * is strict, so a field from another build has to be dropped rather than passed
 * through — without this, an unknown field costs the row, and the row's key.
 */
function getProviderFieldKeys(providerType: unknown): string[] | null {
  if (typeof providerType !== "string") return null

  const schema = providerConfigSchemaList.find(
    (item) => item.shape.provider.safeParse(providerType).success,
  )
  return schema ? Object.keys(schema.shape) : null
}

/** One provider row, or nothing when this build cannot read it at all. */
function readProviderRow(value: unknown): ProviderConfig | undefined {
  if (!isPlainObject(value)) return undefined

  const fieldKeys = getProviderFieldKeys(value.provider)
  // A provider type this build does not have: the row goes, and whatever pointed
  // at it is re-pointed below.
  if (!fieldKeys) return undefined

  const row: Record<string, unknown> = {}
  for (const key of fieldKeys) {
    if (key in value) row[key] = value[key]
  }

  // A row is only usable if something can refer to it, so an id is required; the
  // rest can be filled in without inventing what the reader configured.
  if (typeof row.id !== "string" || row.id.length === 0) return undefined
  if (typeof row.name !== "string" || row.name.trim().length === 0) row.name = row.id
  if (typeof row.enabled !== "boolean") row.enabled = true

  const providerType = typeof row.provider === "string" ? row.provider : ""
  if (isCustomModelOnlyProvider(providerType)) {
    // Put back the two model fields an export leaves out: the provider type fixes
    // them, and only the model name the reader typed is theirs.
    const model = isPlainObject(row.model) ? row.model : {}
    row.model = {
      ...DEFAULT_LLM_PROVIDER_MODELS[providerType],
      customModel: typeof model.customModel === "string" ? model.customModel : null,
    }
  }

  const parsed = providerConfigItemSchema.safeParse(row)
  return parsed.success ? parsed.data : undefined
}

/** Keep the first row per id, and give the ones left a name that is free. */
function dedupeProviders(providers: ProvidersConfig): ProvidersConfig {
  const ids = new Set<string>()
  const names = new Set<string>()
  const unique: ProvidersConfig = []

  for (const provider of providers) {
    // Features refer to a provider by id, so two rows with one id are ambiguous
    // and the later one cannot be kept.
    if (ids.has(provider.id)) continue

    provider.name = getUniqueName(provider.name, names)
    ids.add(provider.id)
    names.add(provider.name)
    unique.push(provider)
  }

  return unique
}

function readProvidersConfig(candidate: unknown, fallback: ProvidersConfig): ProvidersConfig {
  // A payload that carries no provider list at all keeps this build's own: a key
  // it lacks is not a list the reader emptied. A list it does carry is used as
  // it stands, even when empty — every feature can be turned off, so a config
  // that names no provider is one this build writes.
  if (!Array.isArray(candidate)) return fallback

  return dedupeProviders(
    candidate
      .map((entry) => readProviderRow(entry))
      .filter((provider): provider is ProviderConfig => provider !== undefined),
  )
}

/* ──────────────────────────────
  Repairing provider references
  ────────────────────────────── */

/**
 * Add the keyless built-in preset when nothing in the list can run a capability.
 * It is both translate- and LLM-capable, so one row covers every capability a
 * config can refer to.
 */
function withUsableProvider(
  capability: ProviderCapability,
  providersConfig: ProvidersConfig,
): ProvidersConfig {
  if (getUsableProviderIdsForCapability(capability, providersConfig).length > 0) {
    return providersConfig
  }

  const ids = new Set(providersConfig.map((provider) => provider.id))
  const names = new Set(providersConfig.map((provider) => provider.name))
  const preset: ProviderConfig = {
    ...structuredClone(BILIBILI_PRESET_PROVIDER_CONFIG),
    id: getUniqueName(BILIBILI_PRESET_PROVIDER_CONFIG.id, ids, "-"),
    name: getUniqueName(BILIBILI_PRESET_PROVIDER_CONFIG.name, names),
  }

  return [...providersConfig, preset]
}

function assignProviderId(config: Config, path: readonly string[], providerId: string): void {
  let current = config as unknown as Record<string, unknown>
  for (const key of path.slice(0, -1)) {
    const next = current[key]
    if (!isPlainObject(next)) return
    current = next
  }
  current[path[path.length - 1]!] = providerId
}

/**
 * Point every feature, action and language-detection provider reference at a
 * provider this file actually carries, since `configSchema` refuses a config
 * whose references do not resolve to an enabled, capable row.
 *
 * The reference is re-pointed at the first usable provider rather than the
 * feature being turned off: the reader asked for translation, and the toolbar
 * and the schema both expect something to run it.
 *
 * The keyless preset is added only where a reference has nothing to point at.
 * It answers a reference this build cannot resolve, not an empty provider list:
 * a config whose reader turned every feature off may name no provider, and
 * reading it back must leave it that way.
 */
function repairProviderReferences(draft: Config): Config {
  const config: Config = { ...draft }

  /** The first provider that can run `capability`, adding the preset if none can. */
  const getFallbackProviderId = (capability: ProviderCapability): string | undefined => {
    let [fallbackId] = getUsableProviderIdsForCapability(capability, config.providersConfig)
    if (fallbackId) return fallbackId

    config.providersConfig = withUsableProvider(capability, config.providersConfig)
    ;[fallbackId] = getUsableProviderIdsForCapability(capability, config.providersConfig)
    return fallbackId
  }

  for (const featureKey of FEATURE_KEYS) {
    const def = FEATURE_PROVIDER_DEFS[featureKey]
    const providerId = def.getProviderId(config)
    // An empty provider is the reader's "off", and a switched-off feature keeps
    // its provider as the memory of what to resume; `configSchema` validates
    // neither, so there is nothing here to repair.
    if (!providerId || !isFeatureEnabled(config, featureKey)) continue
    const isUsable = doesProviderSupportsCapability(featureKey, config.providersConfig, providerId, {
      requireEnable: true,
    })
    if (isUsable) continue

    const fallbackId = getFallbackProviderId(featureKey)
    if (fallbackId) assignProviderId(config, def.configPath, fallbackId)
  }

  const { languageDetection, selectionToolbar } = config

  if (languageDetection.mode === "llm") {
    const providerId = languageDetection.providerId
    const isUsable =
      providerId !== undefined &&
      doesProviderSupportsCapability("languageDetection", config.providersConfig, providerId, {
        requireEnable: true,
      })

    if (!isUsable) {
      const fallbackId = getFallbackProviderId("languageDetection")
      // Nothing promptable to detect with: the locale-based mode is the only
      // answer left, and it needs no provider at all.
      if (fallbackId) languageDetection.providerId = fallbackId
      else languageDetection.mode = "basic"
    }
  }

  const assignActionProviderId = (action: { providerId: string; enabled?: boolean }) => {
    // An empty or switched-off action keeps its provider as the memory of what
    // to resume, and `configSchema` does not validate it — the reader's off.
    if (!action.providerId || action.enabled === false) return

    const isUsable = doesProviderSupportsCapability(
      "customAction",
      config.providersConfig,
      action.providerId,
      { requireEnable: true },
    )
    if (isUsable) return

    const fallbackId = getFallbackProviderId("customAction")
    if (fallbackId) action.providerId = fallbackId
  }

  for (const actionId of BUILT_IN_ACTION_IDS) {
    assignActionProviderId(selectionToolbar.builtInActions[BUILT_IN_ACTION_KEYS[actionId]])
  }
  for (const action of selectionToolbar.customActions) {
    assignActionProviderId(action)
  }

  return config
}
