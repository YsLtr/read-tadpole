import type { Config } from "@/types/config/config"
import { configSchema } from "@/types/config/config"

/**
 * Check a config that came from outside this install — an imported file, a Drive
 * blob, the sync mirror — against the schema this build actually reads.
 *
 * There is no version to migrate from any more: the upgrade chain was removed
 * along with the provider types it used to rescue. A config written by an older
 * build therefore simply does not validate, and the caller reports that rather
 * than silently substituting defaults, which would look like the import worked
 * while quietly discarding everything in the file.
 */
export function parseImportedConfig(value: unknown): Config {
  const result = configSchema.safeParse(value)
  if (!result.success) {
    throw new Error(result.error.message)
  }
  return result.data
}
