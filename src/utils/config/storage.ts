import type { Config } from "@/types/config/config"
import type { ConfigMeta, ConfigValueAndMeta } from "@/types/config/meta"
import { storage } from "#imports"
import { configSchema } from "@/types/config/config"
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from "../constants/config"
import { logger } from "../logger"
import { sendMessage } from "../message"

/**
 * Parse the stored config exactly as it lies in storage.
 *
 * Private on purpose: this is the read that answers with `DEFAULT_CONFIG` when
 * the stored config does not match the current schema, so it may only back
 * `getLocalConfig`, and only when the background cannot be reached.
 */
async function readStoredConfig(): Promise<Config | null> {
  const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
  if (!config) {
    logger.warn("No config found in storage")
    return null
  }
  const parsedConfig = configSchema.safeParse(config)
  if (!parsedConfig.success) {
    logger.error("Config is invalid, using default config")
    return DEFAULT_CONFIG
  }
  return parsedConfig.data
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

    const parsedConfig = configSchema.safeParse(config)
    if (!parsedConfig.success) {
      throw new Error("Local config is invalid")
    }

    return {
      value: parsedConfig.data,
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
