import type { Config } from "./config"

// A stored config carries the moment it changed, and nothing else. It used to
// carry a schema version too; nothing upgrades a config by one any more (a file,
// a Drive copy and a backup are read field by field — see `config/parse-imported`),
// and a stored config the current schema cannot read is replaced by the defaults,
// which is a decision the schema itself makes.
//
// The interfaces are open (`Record<string, unknown>`) because WXT keeps whatever
// an older build wrote alongside the fields read here: an old `schemaVersion` is
// left where it lies rather than rewritten.

/**
 * Metadata stored with config via WXT storage.setMeta
 */
export interface ConfigMetaFields {
  lastModifiedAt: number
}

export interface ConfigMeta extends ConfigMetaFields, Record<string, unknown> {}

export interface ConfigValueAndMeta {
  value: Config
  meta: ConfigMeta
}

/**
 * Metadata stored with lastSyncedConfig via WXT storage.setMeta
 */
export interface LastSyncedConfigMetaFields {
  lastModifiedAt: number
  lastSyncedAt: number
  email: string
}

export interface LastSyncedConfigMeta extends LastSyncedConfigMetaFields, Record<string, unknown> {}

export interface LastSyncedConfigValueAndMeta {
  value: Config
  meta: LastSyncedConfigMeta
}
