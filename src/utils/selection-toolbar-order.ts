import { BUILT_IN_ACTION_IDS } from "@/utils/constants/custom-action"
import { SELECTION_TOOLBAR_FEATURE_IDS } from "@/utils/constants/selection"

// Only the constants modules: the config schema applies this, so it must not
// pull in the action definitions.

interface SelectionToolbarLists {
  customActions: readonly { id: string }[]
  order?: readonly string[]
}

// The selection toolbar's `order` in step with the items it has: its own
// translate and speak buttons, the built-in actions and the custom actions.
// `order` names every item exactly once: the saved ones in their saved order,
// then any it does not name yet (an action added since) in the default order —
// translate and speak, the built-in actions, the custom actions as listed. Ids
// no item has (an action deleted since) and repeats are dropped.
//
// The config schema applies it on every parse, so every reader gets the list in
// step and every write stores it that way: code that adds or deletes an action
// never touches the list.
export function normalizeSelectionToolbarLists<T extends SelectionToolbarLists>(
  selectionToolbar: T,
): T & { order: string[] } {
  const itemIds = [
    ...new Set<string>([
      ...SELECTION_TOOLBAR_FEATURE_IDS,
      ...BUILT_IN_ACTION_IDS,
      ...selectionToolbar.customActions.map((action) => action.id),
    ]),
  ]
  const exists = new Set(itemIds)
  const saved = [...new Set(selectionToolbar.order ?? [])].filter((id) => exists.has(id))
  const savedIds = new Set(saved)
  return {
    ...selectionToolbar,
    order: [...saved, ...itemIds.filter((id) => !savedIds.has(id))],
  }
}
