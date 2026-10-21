export const EXTENSION_ENV_DEFAULTS = {} as const

type RawEnvValue = string | boolean | undefined
export type RawExtensionEnv = Record<string, RawEnvValue>

function readString(rawEnv: RawExtensionEnv, key: string) {
  const value = rawEnv[key]
  if (typeof value !== "string") return undefined

  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}

// With local packages, the aliased layout engine source lives in the monorepo
// and imports these (its peer dependencies) from there. Vite must resolve them
// from here instead, or the bundle and the tests get a second React or
// CodeMirror.
export const LOCAL_PACKAGES_DEDUPE = [
  "react",
  "react-dom",
  "liquidjs",
  "dompurify",
  "morphdom",
  "@codemirror/lang-liquid",
  "@codemirror/lint",
  "@codemirror/state",
  "@codemirror/view",
]

export function resolveExtensionEnv(rawEnv: RawExtensionEnv) {
  return {
    WXT_GOOGLE_CLIENT_ID: readString(rawEnv, "WXT_GOOGLE_CLIENT_ID"),
  }
}
