// The Translation Hub is a page in the settings app, so every entry point
// (options sidebar, keyboard shortcut) routes to this path there.
export const TRANSLATION_HUB_ROUTE = "/translation-hub"

// Three keys on purpose: the hub is opened far less often than the reading
// shortcuts, so it takes the roomier `Alt+Shift+` prefix rather than a bare
// `Alt+<letter>` that users would rather keep for something else.
export const DEFAULT_TRANSLATION_HUB_SHORTCUT_KEY = "Alt+Shift+H"
