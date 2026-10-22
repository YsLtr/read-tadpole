import type { Config } from "@/types/config/config"
import type { PortableConfig } from "@/utils/config/portable-config"
import { useMutation } from "@tanstack/react-query"
import { kebabCase } from "case-anything"
import { saveAs } from "file-saver"
import { toastManager } from "@/components/ui/base-ui/toast"
import { getObjectWithoutAPIKeys } from "@/utils/config/api"
import { getPortableConfig } from "@/utils/config/portable-config"
import { APP_NAME } from "@/utils/constants/app"
import { i18n } from "@/utils/i18n"

interface UseExportConfigOptions {
  /** The live config, or a record that already holds the projected shape (a backup). */
  config: Config | PortableConfig
}

/** `2026-10-22-101204`: reads as the moment the file was written, and sorts like it. */
function getExportTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `${day}-${time}`
}

export function useExportConfig({ config }: UseExportConfigOptions) {
  return useMutation({
    mutationFn: async (includeApiKeys: boolean) => {
      const portableConfig = getPortableConfig(config)
      const exportConfig = includeApiKeys ? portableConfig : getObjectWithoutAPIKeys(portableConfig)
      const exportedAt = new Date()

      // No schema version: nothing upgrades a file by version any more, so what
      // the reader can act on is what the file was written from and when.
      const json = JSON.stringify(
        { config: exportConfig, exportedAt: exportedAt.toISOString() },
        null,
        2,
      )
      const blob = new Blob([json], { type: "text/json" })
      saveAs(blob, `${kebabCase(APP_NAME)}-config-${getExportTimestamp(exportedAt)}.json`)
    },
    onSuccess: () => {
      toastManager.add({
        type: "success",
        title: i18n.t("options.preference.config.manualSync.exportSuccess"),
      })
    },
  })
}
