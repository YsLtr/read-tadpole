export const EXTENSION_ENV_DEFAULTS = {} as const

type RawEnvValue = string | boolean | undefined
export type RawExtensionEnv = Record<string, RawEnvValue>

function readString(rawEnv: RawExtensionEnv, key: string) {
  const value = rawEnv[key]
  if (typeof value !== "string") return undefined

  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}

export function resolveExtensionEnv(rawEnv: RawExtensionEnv) {
  return {
    WXT_GOOGLE_CLIENT_ID: readString(rawEnv, "WXT_GOOGLE_CLIENT_ID"),
  }
}
