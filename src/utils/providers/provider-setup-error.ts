export const PROVIDER_SETUP_ERROR_NAME = "ProviderSetupError"

/**
 * A provider that cannot be used as configured: no model selected, or no
 * config for its id. The name survives the content↔background messaging
 * boundary, so a caller can tell a broken setup from an outage.
 */
export class ProviderSetupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = PROVIDER_SETUP_ERROR_NAME
  }
}
