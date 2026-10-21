import type { SelectionRangeSnapshot } from "../utils"
import type { SelectionSession } from "./atoms"
import { useCallback } from "react"
import { toLiveRange } from "../utils"

interface SelectionAnchor {
  x: number
  y: number
}

export interface SelectionOpenRequest {
  anchor: SelectionAnchor
  session: SelectionSession
}

function getSelectionAnchorFromRange(rangeSnapshot: SelectionRangeSnapshot) {
  try {
    const range = toLiveRange(rangeSnapshot)
    const clientRects = [...range.getClientRects()]
    const targetRect =
      clientRects.toReversed().find((rect) => rect.width > 0 || rect.height > 0) ??
      range.getBoundingClientRect()

    if (targetRect.width === 0 && targetRect.height === 0) {
      return null
    }

    return {
      x: Math.max(targetRect.left, targetRect.right),
      y: Math.max(targetRect.top, targetRect.bottom),
    }
  } catch {
    return null
  }
}

function getSelectionAnchor(session: SelectionSession | null) {
  if (!session) {
    return null
  }

  for (const rangeSnapshot of session.selectionSnapshot.ranges.toReversed()) {
    const anchor = getSelectionAnchorFromRange(rangeSnapshot)
    if (anchor) {
      return anchor
    }
  }

  return null
}

function getViewportCenterAnchor(): SelectionAnchor {
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }
}

export function useSelectionOpenRequestResolver(selectionSession: SelectionSession | null) {
  const resolveShortcutOpenRequest = useCallback((): SelectionOpenRequest | null => {
    if (!selectionSession) {
      return null
    }

    return {
      anchor: getSelectionAnchor(selectionSession) ?? getViewportCenterAnchor(),
      session: selectionSession,
    }
  }, [selectionSession])

  return { resolveShortcutOpenRequest }
}
