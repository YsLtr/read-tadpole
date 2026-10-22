import { IconFileText, IconX } from "@tabler/icons-react"
import { useSetAtom } from "jotai"
import { Button } from "@/components/ui/base-ui/button"
import { ScrollArea } from "@/components/ui/base-ui/scroll-area"
import { i18n } from "@/utils/i18n"
import { subtitlesSidebarOpenAtom } from "../../atoms"
import { TranscriptSection } from "./sections/transcript"

export function SidebarShell() {
  const setOpen = useSetAtom(subtitlesSidebarOpenAtom)

  return (
    <div
      data-slot="subtitles-sidebar"
      className="pointer-events-auto flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-popover/90 font-light text-popover-foreground shadow-lg backdrop-blur-2xl backdrop-saturate-150"
    >
      <div className="flex items-center gap-2 border-b border-border px-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2 text-sm font-medium">
          <IconFileText className="size-4" />
          {i18n.t("subtitles.sidebar.transcript.tab")}
        </div>
        <Button
          type="button"
          variant="ghost-secondary"
          size="icon-sm"
          aria-label={i18n.t("subtitles.sidebar.close")}
          onClick={() => setOpen(false)}
          className="ml-auto shrink-0 rounded-full"
        >
          <IconX className="size-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <TranscriptSection />
      </ScrollArea>
    </div>
  )
}
