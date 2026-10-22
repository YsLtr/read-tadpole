import type { Config } from "@/types/config/config"
import type { ConfigMeta, ConfigValueAndMeta } from "@/types/config/meta"
import { storage } from "#imports"
import { configSchema } from "@/types/config/config"
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from "../constants/config"
import { logger } from "../logger"
import { sendMessage } from "../message"
import { parseImportedConfig } from "./parse-imported"

/**
 * Parse the stored config exactly as it lies in storage.
 *
 * Private on purpose: this is the read that answers with `DEFAULT_CONFIG` when
 * the stored config cannot be read at all, so it may only back `getLocalConfig`,
 * and only when the background cannot be reached.
 *
 * Read field by field like any other config this build did not write itself, so
 * a value whose shape changed costs that value instead of every setting the
 * reader made — the fallback answer is only for a value that is not a config.
 */
async function readStoredConfig(): Promise<Config | null> {
  const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
  if (!config) {
    logger.warn("No config found in storage")
    return null
  }
  try {
    return parseImportedConfig(config)
  } catch (error) {
    logger.error("Stored config is unreadable, using default config", error)
    return DEFAULT_CONFIG
  }
}

/**
 * The config every context outside the background reads.
 *
 * The background owns initialisation — it builds the first config, fills in
 * defaults and replaces a stored config the current schema rejects — so ask it
 * for the config instead of parsing the stored value here. Parsing locally would
 * answer `DEFAULT_CONFIG` in exactly those cases, which for a content script
 * means silently starting from defaults: nothing errors, the feature is simply
 * dead.
 *
 * The fallback covers the contexts that cannot reach the background.
 */
export async function getLocalConfig(): Promise<Config | null> {
  try {
    return await sendMessage("getInitialConfig")
  } catch (error) {
    logger.warn("Could not ask the background for the config, reading storage instead", error)
  }
  return readStoredConfig()
}

export async function setLocalConfig(config: Config) {
  const parsedConfig = configSchema.safeParse(config)
  if (!parsedConfig.success) {
    throw new Error("Config is invalid")
  }
  await storage.setItem<Config>(`local:${CONFIG_STORAGE_KEY}`, parsedConfig.data)
  await storage.setMeta<Partial<ConfigMeta>>(`local:${CONFIG_STORAGE_KEY}`, {
    lastModifiedAt: Date.now(),
  })
}

export async function getLocalConfigAndMeta(): Promise<ConfigValueAndMeta> {
  try {
    const [config, meta] = await Promise.all([
      storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`),
      storage.getMeta<ConfigMeta>(`local:${CONFIG_STORAGE_KEY}`),
    ])

    if (!config) {
      throw new Error("Local config not found")
    }

    // Read, so field by field: a stored value this build cannot read whole is
    // answered the way every other config read is, not refused outright.
    const value = parseImportedConfig(config)

    return {
      value,
      meta: {
        lastModifiedAt: meta?.lastModifiedAt ?? Date.now(),
      },
    }
  } catch (error) {
    logger.error("Failed to get local config", error)
    throw error
  }
}

export async function setLocalConfigAndMeta(config: Config, meta: Partial<ConfigMeta>) {
  const lastModifiedAt = meta.lastModifiedAt ?? Date.now()
  const parsedConfig = configSchema.safeParse(config)
  if (!parsedConfig.success) {
    throw new Error("Config is invalid")
  }
  await storage.setItem<Config>(`local:${CONFIG_STORAGE_KEY}`, parsedConfig.data)
  await storage.setMeta<Partial<ConfigMeta>>(`local:${CONFIG_STORAGE_KEY}`, {
    ...meta,
    lastModifiedAt,
  })
}
