// Shared by the loader content script, the content runtime and the background,
// so it must stay free of imports: the loader is injected into every page.

/**
 * The parts of the content runtime, each formerly its own content script.
 * `subtitles` runs from its own content script entry, which the manifest
 * injects into every matching frame.
 */
export const CONTENT_RUNTIME_PARTS = ["host", "selection", "subtitles"] as const

export type ContentRuntimePart = (typeof CONTENT_RUNTIME_PARTS)[number]

// The parts the manifest-injected loader runs in the top frame. Subtitles has
// its own content script (`allFrames`) so embedded players are covered; running
// it here would start subtitles on every site.
const TOP_FRAME_PARTS: readonly ContentRuntimePart[] = ["host", "selection"]

/** The script the manifest injects into every page and the background into iframes. */
export const CONTENT_LOADER_SCRIPT_FILE = "/content-scripts/loader.js" as const

/** The shared ES module the loader imports; listed in web_accessible_resources. */
export const CONTENT_RUNTIME_MODULE_FILE = "/content-runtime.js" as const

// The background writes the parts an iframe needs here before it injects the
// loader. The manifest injects only the top frame, which runs TOP_FRAME_PARTS.
export const CONTENT_RUNTIME_PARTS_WINDOW_KEY = "__READ_TADPOLE_CONTENT_PARTS__" as const

/**
 * The parts this loader should run, taken so a later loader in the frame does
 * not run them again. An iframe whose parts an earlier loader already took
 * gets none: falling back to every part would mount the top-frame-only side UI.
 *
 * Read from the content script's global, where the background's setter wrote
 * them. In Firefox that is the extension's sandbox, not `window`.
 */
export function takeRequestedParts(
  scriptGlobal: Record<string, unknown>,
  isTopFrame: boolean,
): readonly ContentRuntimePart[] {
  const requested = scriptGlobal[CONTENT_RUNTIME_PARTS_WINDOW_KEY]
  delete scriptGlobal[CONTENT_RUNTIME_PARTS_WINDOW_KEY]
  if (Array.isArray(requested)) return requested as ContentRuntimePart[]
  return isTopFrame ? TOP_FRAME_PARTS : []
}

export interface ContentRuntime {
  runContentParts: (parts: readonly ContentRuntimePart[]) => Promise<void>
}
