import type { PortableConfig } from "@/utils/config/portable-config"

/**
 * A backup is one config record, kept so it can be put back.
 *
 * It holds the same projected config an exported file does — see
 * `config/portable-config` for what that leaves out — so a backup never pins a
 * value this build generates itself. Reading it back (`config/parse-imported`)
 * rebuilds those values from the code that runs then, which is what makes an old
 * backup still mean the reader's choices rather than an old build's defaults.
 *
 * No schema version: nothing upgrades a stored config by one any more.
 */
export interface ConfigBackup {
  config: PortableConfig
}

export interface ConfigBackupMetadata extends Record<string, unknown> {
  createdAt: number
  extensionVersion: string
}

export interface ConfigBackupWithMetadata extends ConfigBackup {
  metadata: ConfigBackupMetadata
  id: string
}
