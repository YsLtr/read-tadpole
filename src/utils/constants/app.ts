import { browser } from "#imports"

/**
 * Product name, used to derive the database name, export file names and the
 * prompt file name. Owned here rather than imported from `@read-frog/definitions`
 * so the upstream package keeps supplying language data only.
 */
export const APP_NAME = "ReadTadpole"

const manifest = browser.runtime.getManifest()
export const EXTENSION_VERSION = manifest.version
