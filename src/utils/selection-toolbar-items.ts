import type { Config } from "@/types/config/config"
import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import type { SelectionToolbarFeatureId } from "@/utils/constants/selection"
import { SELECTION_TOOLBAR_FEATURE_IDS } from "@/utils/constants/selection"
import { getSelectionToolbarActions } from "@/utils/custom-actions"
import { normalizeSelectionToolbarLists } from "@/utils/selection-toolbar-order"

type SelectionToolbarConfig = Config["selectionToolbar"]

// Everything the selection toolbar can show, in one list: its own translate
// and speak buttons and every action, built-in or custom. An enabled item has
// its button on the toolbar; a disabled one is nowhere.
export type SelectionToolbarItem =
  | { kind: "feature"; id: SelectionToolbarFeatureId; enabled: boolean }
  | {
      kind: "action"
      id: string
      enabled: boolean
      action: SelectionToolbarCustomAction
    }

function isFeatureId(id: string): id is SelectionToolbarFeatureId {
  return (SELECTION_TOOLBAR_FEATURE_IDS as readonly string[]).includes(id)
}

// Every item in the toolbar's order, whether its own switch is on or off.
export function getSelectionToolbarItems(
  selectionToolbar: SelectionToolbarConfig,
): SelectionToolbarItem[] {
  const { order } = normalizeSelectionToolbarLists(selectionToolbar)
  const actions = new Map(
    getSelectionToolbarActions(selectionToolbar).map((action) => [action.id, action]),
  )
  return order.flatMap((id): SelectionToolbarItem[] => {
    if (isFeatureId(id)) {
      // No provider is "off": the feature's own switch may still be on after an
      // old config or an import, but there is nothing to run it.
      const enabled =
        selectionToolbar.features[id].enabled &&
        (id !== "translate" || selectionToolbar.features.translate.providerId !== "")
      return [{ kind: "feature", id, enabled }]
    }
    const action = actions.get(id)
    return action ? [{ kind: "action", id, enabled: action.enabled !== false, action }] : []
  })
}

// `allIds` with the ids of `moved` put in the order `moved` gives them, each
// in a place one of them held: every other id stays where it was.
function reslot(allIds: readonly string[], moved: readonly string[]): string[] {
  const movedIds = new Set(moved)
  let next = 0
  return allIds.map((id) => (movedIds.has(id) ? (moved[next++] ?? id) : id))
}

// The custom actions in a new order of their own (the options page's list):
// they take the places custom actions already hold in the toolbar order, in
// their new order, so both orders agree and nothing else moves.
export function setSelectionToolbarCustomActions(
  selectionToolbar: SelectionToolbarConfig,
  customActions: SelectionToolbarCustomAction[],
): SelectionToolbarConfig {
  const next = { ...selectionToolbar, customActions }
  const order = reslot(
    getSelectionToolbarItems(next).map((item) => item.id),
    customActions.map((action) => action.id),
  )
  return { ...next, order }
}
