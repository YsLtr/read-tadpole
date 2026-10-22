import type { Config } from "@/types/config/config"
import type { ProviderConfig } from "@/types/config/provider"
import { isCustomModelOnlyProvider } from "@/types/config/provider"
import { createDefaultTTSLanguageVoices } from "@/types/config/tts"

/**
 * A provider row with the model fields its type fixes stripped, member by member
 * of the provider union (hence the `T extends unknown` step, which is what makes
 * the conditional distribute over a union rather than test the union whole).
 */
type OmitModelConstants<T> = T extends unknown
  ? T extends { model: infer TModel }
    ? Omit<T, "model"> & { model: Omit<TModel, "model" | "isCustomModel"> }
    : T
  : never

export type PortableProviderConfig = OmitModelConstants<ProviderConfig>

/** The model settings a custom-endpoint provider carries, before they are stripped. */
type ProviderModelConfig = Extract<ProviderConfig, { model: unknown }>["model"]

export type PortableTTSLanguageVoices = Partial<Config["tts"]["languageVoices"]>

/**
 * What leaves this install — an exported file, a Google Drive copy, a local backup
 * — which is the stored config minus everything the reader cannot change, and
 * therefore everything this build can rebuild on its own when the config comes
 * back. All three carry this same projection, so one of them can stand in for
 * another.
 *
 * Three things are left out today, and each has a counterpart in
 * `parse-imported.ts` that puts it back:
 *
 * - `language.level` — read when a prompt is built, but no setting writes it, so
 *   `languageSchema` reads every config at this build's level and the stored
 *   value is never the reader's.
 * - `model.model` and `model.isCustomModel` on a custom-model-only provider —
 *   fixed by the provider type (one model, always custom), so the two fields
 *   carry nothing the reader could have chosen.
 * - `tts.languageVoices` — one entry per language, generated from the built-in
 *   voice table; only the languages whose voice the reader changed are carried.
 *
 * Leaving them out keeps what leaves the extension readable: a config the reader
 * never touched stays a handful of lines instead of a few hundred generated ones.
 */
export type PortableConfig = Omit<Config, "language" | "providersConfig" | "tts"> & {
  language: Omit<Config["language"], "level">
  providersConfig: PortableProviderConfig[]
  tts: Omit<Config["tts"], "languageVoices"> & { languageVoices: PortableTTSLanguageVoices }
}

/**
 * A provider row as a record carries it: the model fields the type itself fixes are
 * gone. Projecting an already-projected row leaves it as it is, which is what makes
 * a second projection harmless.
 */
export function getPortableProviderConfig(
  provider: ProviderConfig | PortableProviderConfig,
): PortableProviderConfig {
  if (!isCustomModelOnlyProvider(provider.provider)) return provider

  const model = (provider as { model?: ProviderModelConfig }).model
  if (!model) return provider

  const { isCustomModel: _isCustomModel, model: _model, ...rest } = model
  return { ...provider, model: rest } as PortableProviderConfig
}

/**
 * The languages whose voice differs from the one this build generates for them.
 *
 * The comparison is against the built-in table rather than the stored default
 * voice, because that is what fills the entry in when a reader picks nothing.
 */
function getPortableTTSLanguageVoices(
  languageVoices: Config["tts"]["languageVoices"] | PortableTTSLanguageVoices,
): PortableTTSLanguageVoices {
  const builtInVoices = createDefaultTTSLanguageVoices()
  const overrides: PortableTTSLanguageVoices = {}

  for (const [langCode, voice] of Object.entries(languageVoices)) {
    const key = langCode as keyof Config["tts"]["languageVoices"]
    if (builtInVoices[key] === voice) continue
    overrides[key] = voice
  }

  return overrides
}

/**
 * Project a stored config onto what leaves this install: an exported file, a Drive
 * copy, a backup.
 *
 * Projecting twice is a no-op, so this also accepts an already-projected config —
 * which is what a backup holds, and what an exported file carries. That is why the
 * same function serves the live config and a record read back from storage.
 */
export function getPortableConfig(config: Config | PortableConfig): PortableConfig {
  const { level: _level, ...language } = config.language as Config["language"]

  return {
    ...config,
    language,
    providersConfig: config.providersConfig.map((provider) =>
      getPortableProviderConfig(provider),
    ),
    tts: {
      ...config.tts,
      languageVoices: getPortableTTSLanguageVoices(config.tts.languageVoices),
    },
  }
}
