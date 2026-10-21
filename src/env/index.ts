import { resolveExtensionEnv, type RawExtensionEnv } from "./shared"

export const env = resolveExtensionEnv(import.meta.env as RawExtensionEnv)
