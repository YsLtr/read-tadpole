import type { Config } from "@/types/config/config"
import type { ConfigMeta } from "@/types/config/meta"
import { storage } from "#imports"
import { configSchema } from "@/types/config/config"
import { isAPIProviderConfig } from "@/types/config/provider"
import { initI18n } from "@/utils/i18n"
import {
  buildFreshDefaultConfig,
  CONFIG_STORAGE_KEY,
  DEFAULT_CONFIG,
} from "../constants/config"
import { logger } from "../logger"

/**
 * Initialize the config, this function should only be called once in the background script
 * @returns The extension config
 */
export async function initializeConfig(): Promise<void> {
  const [storedConfig, configMeta] = await Promise.all([
    storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`),
    storage.getMeta<ConfigMeta>(`local:${CONFIG_STORAGE_KEY}`),
  ])

  let config: Config
  let didConfigChange = false

  if (!storedConfig) {
    // Initialize locale before building defaults used by this browser context.
    await initI18n(DEFAULT_CONFIG.uiLanguage)
    config = buildFreshDefaultConfig()
    didConfigChange = true
  } else {
    config = storedConfig
  }

  const parsedConfig = configSchema.safeParse(config)
  if (parsedConfig.success) {
    // Stored as every reader gets it: defaults filled in, the selection
    // toolbar's order and pins in step with its actions.
    config = parsedConfig.data
  } else {
    logger.warn("Config is invalid, using default config")
    await initI18n(DEFAULT_CONFIG.uiLanguage)
    config = buildFreshDefaultConfig()
    didConfigChange = true
  }

  if (import.meta.env.DEV) {
    const apiKeyResult = applyAPIKeysFromEnv(config)
    config = apiKeyResult.config
    didConfigChange = didConfigChange || apiKeyResult.changed
  }

  const didMetaNeedUpdate = configMeta?.lastModifiedAt === undefined

  if (didConfigChange) {
    await storage.setItem<Config>(`local:${CONFIG_STORAGE_KEY}`, config)
  }

  if (didConfigChange || didMetaNeedUpdate) {
    await storage.setMeta<ConfigMeta>(`local:${CONFIG_STORAGE_KEY}`, {
      lastModifiedAt: configMeta?.lastModifiedAt ?? Date.now(),
    })
  }
}

function applyAPIKeysFromEnv(config: Config): { config: Config; changed: boolean } {
  let changed = false

  const providersConfig = config.providersConfig.map((providerConfig) => {
    if (!isAPIProviderConfig(providerConfig)) {
      return providerConfig
    }

    const apiKeyEnvName = `WXT_${providerConfig.provider.toUpperCase()}_API_KEY`
    const envApiKey = import.meta.env[apiKeyEnvName] as string | undefined
    if (!envApiKey || providerConfig.apiKey === envApiKey) {
      return providerConfig
    }

    changed = true
    return {
      ...providerConfig,
      apiKey: envApiKey,
    }
  })

  if (!changed) {
    return { config, changed: false }
  }

  return {
    config: {
      ...config,
      providersConfig,
    },
    changed: true,
  }
}
