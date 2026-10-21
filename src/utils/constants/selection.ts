export const MARGIN = 25

export const MIN_SELECTION_OVERLAY_OPACITY = 1
export const MAX_SELECTION_OVERLAY_OPACITY = 100
export const DEFAULT_SELECTION_OVERLAY_OPACITY = 100

/** The lazy iframe trigger replays the gesture after React installs its listeners. */
export const DEFERRED_SELECTION_OPEN_EVENT = "read-tadpole:deferred-selection-open"
export const SELECTION_TOOLBAR_READY_EVENT = "read-tadpole:selection-toolbar-ready"

export interface DeferredSelectionOpenDetail {
  text: string
  x: number
  y: number
}

declare global {
  interface Window {
    __READ_TADPOLE_SELECTION_TOOLBAR_READY__?: boolean
  }
}

// The toolbar's own buttons, by the ids they have in `selectionToolbar.order`
// beside the actions' ids.
export const SELECTION_TOOLBAR_FEATURE_IDS = ["translate", "speak"] as const
export type SelectionToolbarFeatureId = (typeof SELECTION_TOOLBAR_FEATURE_IDS)[number]
