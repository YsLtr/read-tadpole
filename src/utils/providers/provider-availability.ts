import type { ProviderCapability } from "./provider-registry"
import type { ProvidersConfig } from "@/types/config/provider"
import { getProviderIdsForCapability } from "./provider-registry"

/**
 * The provider ids that can actually run this capability: enabled rows whose
 * config is promptable/translatable for it.
 *
 * Every caller that gates an action on "is a provider configured" wants this
 * one rather than a bare config lookup — a row can exist while being disabled,
 * in which case nothing runs.
 */
export function getUsableProviderIdsForCapability(
  capability: ProviderCapability,
  providersConfig: ProvidersConfig,
): string[] {
  return getProviderIdsForCapability(capability, providersConfig, { requireEnable: true })
}
