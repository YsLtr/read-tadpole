import type { Config } from "@/types/config/config"
import type { APIProviderConfig, ProviderConfig } from "@/types/config/provider"
import type { ProviderPreset } from "@/utils/constants/providers"
import { getRandomUUID } from "@/utils/crypto-polyfill"
import { getUniqueName } from "@/utils/name"

/**
 * Add a provider from a preset. The preset supplies the row — the provider type,
 * and for the custom endpoint the base URL and model, which is how the free
 * Bilibili gateway arrives already filled in — and this only makes its name
 * unique and gives it an id.
 */
export async function addProvider(
  preset: ProviderPreset,
  providersConfig: Config["providersConfig"],
  setProvidersConfig: (config: Partial<Config["providersConfig"]>) => Promise<void>,
  setSelectedProviderId?: (id: string) => void,
): Promise<string> {
  const existingNames = new Set(providersConfig.map((p) => p.name))
  const providerName = getUniqueName(preset.name, existingNames)

  const description = preset.description()
  const newProvider: ProviderConfig = {
    ...structuredClone(preset.config),
    ...(description ? { description } : {}),
    id: getRandomUUID(),
    name: providerName,
  }

  const updatedProviders = [...providersConfig, newProvider]
  await setProvidersConfig(updatedProviders)

  if (setSelectedProviderId) {
    setSelectedProviderId(newProvider.id)
  }

  return newProvider.id
}

export async function duplicateProvider(
  providerConfig: APIProviderConfig,
  providersConfig: Config["providersConfig"],
  setProvidersConfig: (config: Partial<Config["providersConfig"]>) => Promise<void>,
  setSelectedProviderId?: (id: string) => void,
): Promise<string> {
  const existingNames = new Set(providersConfig.map((p) => p.name))
  const newProvider: APIProviderConfig = {
    ...structuredClone(providerConfig),
    id: getRandomUUID(),
    name: getUniqueName(providerConfig.name, existingNames),
  }

  const updatedProviders = [...providersConfig, newProvider]
  await setProvidersConfig(updatedProviders)

  if (setSelectedProviderId) {
    setSelectedProviderId(newProvider.id)
  }

  return newProvider.id
}
