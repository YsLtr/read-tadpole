import type { Config } from "@/types/config/config"
import type {
  SelectionToolbarBuiltInActionState,
  SelectionToolbarCustomAction,
} from "@/types/config/selection-toolbar"
import type { BuiltInActionId } from "@/utils/constants/custom-action"
import { createDefaultDictionaryAction } from "@/utils/constants/config"
import {
  BUILT_IN_ACTION_IDS,
  BUILT_IN_ACTION_KEYS,
  BUILT_IN_DICTIONARY_ACTION_ID,
  isBuiltInActionId,
} from "@/utils/constants/custom-action"
import { getRandomUUID } from "@/utils/crypto-polyfill"
import { getUniqueName } from "@/utils/name"

type SelectionToolbarConfig = Config["selectionToolbar"]

const BUILT_IN_ACTION_DEFINITIONS: Record<BuiltInActionId, () => SelectionToolbarCustomAction> = {
  [BUILT_IN_DICTIONARY_ACTION_ID]: createDefaultDictionaryAction,
}

// A built-in action as it reads: its code-owned definition in the current UI
// language, with the persisted enabled/provider state merged on.
export function getBuiltInAction(
  selectionToolbar: SelectionToolbarConfig,
  id: BuiltInActionId,
): SelectionToolbarCustomAction {
  const definition = BUILT_IN_ACTION_DEFINITIONS[id]()
  const state = selectionToolbar.builtInActions?.[BUILT_IN_ACTION_KEYS[id]] ?? {
    enabled: definition.enabled !== false,
    providerId: definition.providerId,
  }
  return {
    ...definition,
    enabled: state.enabled,
    providerId: state.providerId,
  }
}

export function getBuiltInDictionaryAction(
  selectionToolbar: SelectionToolbarConfig,
): SelectionToolbarCustomAction {
  return getBuiltInAction(selectionToolbar, BUILT_IN_DICTIONARY_ACTION_ID)
}

export function getBuiltInActions(
  selectionToolbar: SelectionToolbarConfig,
): SelectionToolbarCustomAction[] {
  return BUILT_IN_ACTION_IDS.map((id) => getBuiltInAction(selectionToolbar, id))
}

export function getSelectionToolbarActions(
  selectionToolbar: SelectionToolbarConfig,
): SelectionToolbarCustomAction[] {
  return [...getBuiltInActions(selectionToolbar), ...selectionToolbar.customActions]
}

export function findSelectionToolbarAction(
  selectionToolbar: SelectionToolbarConfig,
  actionId: string,
): SelectionToolbarCustomAction | undefined {
  if (isBuiltInActionId(actionId)) {
    return getBuiltInAction(selectionToolbar, actionId)
  }
  return selectionToolbar.customActions.find((action) => action.id === actionId)
}

function toBuiltInState(action: SelectionToolbarCustomAction): SelectionToolbarBuiltInActionState {
  return {
    enabled: action.enabled !== false,
    providerId: action.providerId,
  }
}

export function replaceSelectionToolbarAction(
  selectionToolbar: SelectionToolbarConfig,
  action: SelectionToolbarCustomAction,
): SelectionToolbarConfig {
  if (isBuiltInActionId(action.id)) {
    return {
      ...selectionToolbar,
      builtInActions: {
        ...selectionToolbar.builtInActions,
        [BUILT_IN_ACTION_KEYS[action.id]]: toBuiltInState(action),
      },
    }
  }

  return {
    ...selectionToolbar,
    customActions: selectionToolbar.customActions.map((current) =>
      current.id === action.id ? action : current,
    ),
  }
}

export function patchSelectionToolbarAction(
  selectionToolbar: SelectionToolbarConfig,
  actionId: string,
  patch: Partial<Pick<SelectionToolbarCustomAction, "enabled" | "providerId">>,
): SelectionToolbarConfig {
  const action = findSelectionToolbarAction(selectionToolbar, actionId)
  if (!action) {
    return selectionToolbar
  }

  return replaceSelectionToolbarAction(selectionToolbar, { ...action, ...patch })
}

export function duplicateSelectionToolbarAction(
  action: SelectionToolbarCustomAction,
  allActions: SelectionToolbarCustomAction[],
): SelectionToolbarCustomAction {
  return {
    ...structuredClone(action),
    id: getRandomUUID(),
    name: getUniqueName(action.name, new Set(allActions.map((candidate) => candidate.name))),
  }
}
