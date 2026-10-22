import type { VariantProps } from "class-variance-authority"
import type { buttonVariants } from "@/components/ui/base-ui/button"
import type { Config } from "@/types/config/config"
import type { PortableConfig } from "@/utils/config/portable-config"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/base-ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/base-ui/dialog"
import { ScrollArea } from "@/components/ui/base-ui/scroll-area"
import { i18n } from "@/utils/i18n"

/**
 * The config as it lies in storage, which is what this is for: inspecting it.
 *
 * That is the whole config for the install, and the projected record for a backup,
 * because that is what a backup stores. Both are shown as they are — this is the
 * one place that does not tidy anything up.
 */
export function ViewConfig({
  config,
  size = "default",
  className,
}: {
  config: Config | PortableConfig
  size?: VariantProps<typeof buttonVariants>["size"]
  className?: string
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size={size} className={className} />}>
        <Icon icon="tabler:braces" />
        {i18n.t("options.preference.config.viewConfig.open")}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{i18n.t("options.preference.config.viewConfig.title")}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96 w-full rounded-lg border bg-muted">
          <pre className="overflow-wrap-anywhere p-4 text-xs break-all whitespace-pre-wrap">
            {JSON.stringify({ config }, null, 2)}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
