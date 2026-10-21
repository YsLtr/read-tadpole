import type { ResolvedProviderRef } from "./provider-registry"
import type { Config } from "@/types/config/config"
import type { LLMProviderConfig, TranslateProviderConfig } from "@/types/config/provider"
import { isLLMProviderConfig } from "@/types/config/provider"
import { resolveProviderRefForCapability } from "./provider-registry"

/**
 * A provider flattened for structured-clone transport to the background. It
 * carries the whole config, so the background never has to re-read storage to
 * answer a request — and so a config edited in another tab cannot change the
 * meaning of a request already in flight.
 */
export type SerializableProviderRef = { kind: "local"; config: TranslateProviderConfig }

/**
 * A ref that can be prompted for free-form text. Structural, not branded:
 * `LLMProviderConfig` is a real subtype of `TranslateProviderConfig`, so this
 * stays assignable to `SerializableProviderRef` — caches, transport and
 * `getProviderCacheIdentity` see no difference.
 *
 * Message payloads that prompt a model require this type, which turns
 * "forgot the promptability check" from a silent per-request failure into a
 * compile error at the sender: the only way to produce one is
 * `canProviderRefGenerateText` or a resolution that applied it.
 */
export type PromptableProviderRef = { kind: "local"; config: LLMProviderConfig }

export function resolvePageTranslationProvider(
  config: Config,
): ResolvedProviderRef<TranslateProviderConfig> {
  const resolved = resolveProviderRefForCapability(
    "pageTranslation",
    config.providersConfig,
    config.pageTranslation.providerId,
  )
  if (!resolved) {
    throw new Error(`No page translation provider for id "${config.pageTranslation.providerId}"`)
  }
  return resolved
}

export function resolvePageTranslationProviderOrNull(
  config: Config,
): ResolvedProviderRef<TranslateProviderConfig> | null {
  try {
    return resolvePageTranslationProvider(config)
  } catch {
    return null
  }
}

/**
 * Cache identity for a provider: the whole config, hashed, so a changed key,
 * endpoint or temperature invalidates. One helper so every cache (page,
 * subtitles, summaries, segmentation) keys the same way — the string is
 * byte-identical to what those caches used before, so existing entries survive.
 */
export function getProviderCacheIdentity(ref: SerializableProviderRef): string {
  return JSON.stringify(ref.config)
}

/**
 * Whether this ref can be prompted for free-form text.
 *
 * Capability and promptability are not the same question. A feature's provider
 * list is capability-gated — `videoSubtitles` admits any translate provider —
 * but a summary is a generation, and Google, Microsoft and DeepLX have no model
 * to prompt. Without this, enqueueing a summary for a translate-only subtitles
 * provider is admitted to the queue and can only ever throw, after burning its
 * retries.
 */
export function canProviderRefGenerateText(
  ref: SerializableProviderRef,
): ref is PromptableProviderRef {
  return isLLMProviderConfig(ref.config)
}

/**
 * Pre-serialization twin of `canProviderRefGenerateText`: the same
 * promptability question, asked of the registry's resolved ref before a request
 * is enqueued. Keep the pair in sync.
 */
export function canResolvedProviderRefGenerateText(
  ref: ResolvedProviderRef,
): ref is ResolvedProviderRef<LLMProviderConfig> {
  return isLLMProviderConfig(ref.config)
}

export function serializeProviderRef(
  provider: ResolvedProviderRef<LLMProviderConfig>,
): Promise<PromptableProviderRef>
export function serializeProviderRef(
  provider: ResolvedProviderRef<TranslateProviderConfig>,
): Promise<SerializableProviderRef>
export function serializeProviderRef(
  provider: ResolvedProviderRef<TranslateProviderConfig>,
): Promise<SerializableProviderRef> {
  return Promise.resolve({ kind: "local", config: provider.config })
}

export type ProviderAvailability<Ref extends SerializableProviderRef = SerializableProviderRef> =
  | { available: true; providerRef: Ref }
  | { available: false; message: string }

export async function checkProviderAvailability(
  provider: ResolvedProviderRef<LLMProviderConfig>,
): Promise<ProviderAvailability<PromptableProviderRef>>
export async function checkProviderAvailability(
  provider: ResolvedProviderRef<TranslateProviderConfig>,
): Promise<ProviderAvailability>
export async function checkProviderAvailability(
  provider: ResolvedProviderRef<TranslateProviderConfig>,
): Promise<ProviderAvailability> {
  return { available: true, providerRef: await serializeProviderRef(provider) }
}
