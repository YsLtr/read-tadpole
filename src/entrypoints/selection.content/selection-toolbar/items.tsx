import { useAtomValue } from "jotai"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { getSelectionToolbarItems } from "@/utils/selection-toolbar-items"
import { SelectionToolbarCustomActionTrigger } from "./custom-action-button/custom-action-trigger"
import { SpeakButton } from "./speak-button"
import { TranslateButton } from "./translate-button"

// The buttons of the enabled items, in the toolbar's order.
export function SelectionToolbarItems() {
  const selectionToolbar = useAtomValue(configFieldsAtomMap.selectionToolbar)

  return getSelectionToolbarItems(selectionToolbar)
    .filter((item) => item.enabled)
    .map((item) => {
      if (item.kind === "action") {
        return <SelectionToolbarCustomActionTrigger key={item.id} action={item.action} />
      }
      return item.id === "translate" ? (
        <TranslateButton key={item.id} />
      ) : (
        <SpeakButton key={item.id} />
      )
    })
}
