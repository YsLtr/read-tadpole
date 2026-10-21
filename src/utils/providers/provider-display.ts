import type { ProviderConfig } from "@/types/config/provider"
import type { Theme } from "@/types/config/theme"
import {
  BILIBILI_PRESET_LOGO,
  isBilibiliPresetProvider,
  PROVIDER_ITEMS,
} from "@/utils/constants/providers"

/**
 * Everything a provider picker renders. Every option is a provider row the user
 * configured, so the type is now the config itself; the alias stays so pickers
 * keep reading as "an option" rather than "a config row".
 */
export type ProviderSelectorOption = ProviderConfig

export function getProviderLogo(provider: ProviderSelectorOption, theme: Theme): string {
  // The Bilibili preset is a row of the custom provider, but the user picked it
  // by its own name, so it keeps its own mark instead of the generic one.
  if (provider.provider === "openai-compatible" && isBilibiliPresetProvider(provider)) {
    return BILIBILI_PRESET_LOGO
  }
  return PROVIDER_ITEMS[provider.provider].logo(theme)
}

export function getProviderName(provider: ProviderSelectorOption): string {
  return provider.name
}
