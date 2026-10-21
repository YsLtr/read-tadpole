import type { APIProviderConfig } from "@/types/config/provider"
import ProviderIcon from "@/components/provider-icon"
import { useTheme } from "@/components/providers/theme-provider"
import { getProviderItemName, isBilibiliPresetProvider } from "@/utils/constants/providers"
import { getProviderLogo } from "@/utils/providers/provider-display"

/**
 * The provider type's own name and mark, shown above the form.
 *
 * A row of the custom provider has no single identity — the Bilibili preset is
 * that same type pre-filled — so the row, not just its type, decides what is
 * shown.
 */
export function ConfigHeader({ providerConfig }: { providerConfig: APIProviderConfig }) {
  const { theme } = useTheme()
  const name = isBilibiliPresetProvider(providerConfig)
    ? providerConfig.name
    : getProviderItemName(providerConfig.provider)

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <ProviderIcon
          logo={getProviderLogo(providerConfig, theme)}
          name={name}
          size="base"
          textClassName="font-medium"
        />
      </div>
    </div>
  )
}
