import type { LangLevel } from "@read-frog/definitions"

/**
 * The language level a prompt is built for.
 *
 * This build has no setting for it, so it is a constant rather than a stored
 * choice: `languageSchema` reads every config at this level, and therefore no
 * config file, Drive copy or fresh default needs to carry it.
 */
export const DEFAULT_LANGUAGE_LEVEL: LangLevel = "intermediate"
