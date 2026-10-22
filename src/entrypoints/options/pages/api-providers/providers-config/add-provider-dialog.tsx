import type { ProviderPreset } from "@/utils/constants/providers"
import { useSetAtom, useStore } from "jotai"
import { requestEditorNavigationAtom } from "@/components/form/autosave-navigation"
import ProviderIcon from "@/components/provider-icon"
import { useTheme } from "@/components/providers/theme-provider"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/base-ui/dialog"
import { toastManager } from "@/components/ui/base-ui/toast"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { PROVIDER_PRESETS } from "@/utils/constants/providers"
import { i18n } from "@/utils/i18n"
import { logger } from "@/utils/logger"
import { selectedProviderIdAtom } from "./atoms"
import { addProvider } from "./utils"

export default function AddProviderDialog({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const requestNavigation = useSetAtom(requestEditorNavigationAtom)
  const setProvidersConfig = useSetAtom(configFieldsAtomMap.providersConfig)
  const setSelectedProviderId = useSetAtom(selectedProviderIdAtom)

  const handleAddProvider = async (preset: ProviderPreset) => {
    await requestNavigation(async () => {
      try {
        await addProvider(
          preset,
          store.get(configFieldsAtomMap.providersConfig),
          setProvidersConfig,
          setSelectedProviderId,
        )
      } catch (error) {
        // Writing the provider can be rejected — the config it would produce is
        // invalid, or storage refused it. Without this the promise rejection was
        // swallowed and the dialog simply stayed open, which reads as "adding a
        // provider does nothing at all".
        logger.error("Failed to add provider", error)
        toastManager.add({
          type: "error",
          title: i18n.t("options.autosave.failed"),
        })
        return
      }
      onClose()
    })
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-xl">
      <DialogHeader>
        <DialogTitle>{i18n.t("options.apiProviders.dialog.title")}</DialogTitle>
      </DialogHeader>
      {/* One tile per preset: the grid is here to keep the tiles the same
          size, not to hold a catalogue. Two tiles write the same custom-endpoint
          type (Bilibili is that type pre-filled), two are the DeepL-family
          translators, and the rest are the vendor translators. */}
      <div className="my-2.5">
        <div className="grid grid-cols-2 gap-1.5 py-2 sm:grid-cols-3">
          {PROVIDER_PRESETS.map((preset) => (
            <ProviderButton key={preset.id} preset={preset} handleAddProvider={handleAddProvider} />
          ))}
        </div>
      </div>
    </DialogContent>
  )
}

function ProviderButton({
  preset,
  handleAddProvider,
}: {
  preset: ProviderPreset
  handleAddProvider: (preset: ProviderPreset) => void
}) {
  const { theme } = useTheme()
  return (
    <button
      type="button"
      className="relative flex h-auto flex-col items-center space-y-1.5 rounded-lg p-2 hover:bg-muted/70"
      onClick={() => handleAddProvider(preset)}
    >
      <ProviderIcon logo={preset.logo(theme)} size="md" />
      <span className="line-clamp-2 flex w-full flex-1 items-center justify-center text-xs font-light">
        {preset.name}
      </span>
    </button>
  )
}
