import type { PortableConfig } from "../config/portable-config"
import type { Config } from "@/types/config/config"
import type { ConfigValueAndMeta } from "@/types/config/meta"
import { getPortableConfig } from "../config/portable-config"
import { parseImportedConfig } from "../config/parse-imported"
import { logger } from "../logger"
import { downloadFile, findFileInAppData, uploadFile } from "./api"
import { getGoogleUserInfo, getValidAccessToken } from "./auth"
import { GOOGLE_DRIVE_CONFIG_FILENAME } from "./constants"

/**
 * What a Drive copy holds: the same projected config an exported file carries
 * (see `config/portable-config`), plus the moment it changed.
 *
 * No schema version, for the same reason an export carries none — nothing
 * upgrades a file by one, so the field would only claim a compatibility this
 * build does not have. `lastModifiedAt` stays: it is what tells a later sync
 * whether the remote moved.
 */
interface RemoteConfigFile {
  value: PortableConfig
  meta: { lastModifiedAt: number }
}

/**
 * `token` binds every request here to one account. Resolving it per helper
 * instead lets another tab switch accounts mid-sync, which can put the config
 * in one Drive and the read in another under a single click.
 */
export async function getRemoteConfigAndMetaWithUserEmail(token?: string): Promise<{
  configValueAndMeta: ConfigValueAndMeta | null
  email: string
}> {
  try {
    const accessToken = token ?? (await getValidAccessToken())

    // Fetch user email from Google API
    const userInfo = await getGoogleUserInfo(accessToken)

    const file = await findFileInAppData(GOOGLE_DRIVE_CONFIG_FILENAME, accessToken)

    if (!file) {
      return { configValueAndMeta: null, email: userInfo.email }
    }

    const content = await downloadFile(file.id, accessToken)
    // A Drive copy written by another build is read the same way an imported file
    // is: field by field, with the projection projected back.
    const remoteData = JSON.parse(content) as {
      value?: unknown
      meta?: { lastModifiedAt?: unknown }
    }

    let migratedConfig: Config
    try {
      migratedConfig = parseImportedConfig(remoteData.value)
    } catch (error) {
      logger.error("Failed to read remote config", error)
      return { configValueAndMeta: null, email: userInfo.email }
    }

    const lastModifiedAt = remoteData.meta?.lastModifiedAt
    if (typeof lastModifiedAt !== "number") {
      // Nothing to compare a local change against; treat the copy as just
      // written so the next sync takes it seriously instead of skipping it.
      logger.warn("Remote config has no usable lastModifiedAt")
    }

    return {
      configValueAndMeta: {
        value: migratedConfig,
        meta: {
          lastModifiedAt: typeof lastModifiedAt === "number" ? lastModifiedAt : Date.now(),
        },
      },
      email: userInfo.email,
    }
  } catch (error) {
    logger.error("Failed to get remote config", error)
    throw error
  }
}

export async function setRemoteConfigAndMeta(
  configValueAndMeta: ConfigValueAndMeta,
  token?: string,
): Promise<void> {
  try {
    const existingFile = await findFileInAppData(GOOGLE_DRIVE_CONFIG_FILENAME, token)

    // The config is projected here, at the one place that writes the Drive copy:
    // every field left out is rebuilt from this build's own code on the way back
    // in (`config/parse-imported`), so the copy holds only what the reader chose.
    const file: RemoteConfigFile = {
      value: getPortableConfig(configValueAndMeta.value),
      meta: { lastModifiedAt: configValueAndMeta.meta.lastModifiedAt },
    }

    const content = JSON.stringify(file, null, 2)
    await uploadFile(GOOGLE_DRIVE_CONFIG_FILENAME, content, existingFile?.id, token)
  } catch (error) {
    logger.error("Failed to upload local config", error)
    throw error
  }
}
