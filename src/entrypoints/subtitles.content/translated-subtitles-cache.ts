import { TRANSLATED_SUBTITLES_CACHE_TTL_MS } from "@/utils/constants/subtitles"

/** A translated cue as stored: the cue it belongs to, plus what it became. */
export interface CachedTranslatedCue {
  start: number
  end: number
  text: string
  translation: string
}

interface CacheEntry {
  savedAt: number
  cues: CachedTranslatedCue[]
}

// A tab's own storage: a reload keeps it, a new tab or a closed browser does not.
// The settings identity rides in the key, so changing the provider, the languages
// or the prompt cannot be answered from an older run's translations.
const CACHE_KEY_PREFIX = "read-tadpole:subtitles-translations:v1"
const MAX_CACHED_CUES = 2000
// A long-lived tab watches many videos; only the newest few are worth the quota.
const MAX_CACHED_VIDEOS = 3

export function translatedSubtitlesCacheKey(videoId: string, settingsIdentity: string): string {
  return `${CACHE_KEY_PREFIX}:${videoId}:${settingsIdentity}`
}

function isCacheEntry(value: unknown): value is CacheEntry {
  if (!value || typeof value !== "object") return false
  const entry = value as Partial<CacheEntry>
  return typeof entry.savedAt === "number" && Array.isArray(entry.cues)
}

function ourKeys(): string[] {
  const keys: string[] = []
  for (let index = 0; index < sessionStorage.length; index++) {
    const key = sessionStorage.key(index)
    if (key?.startsWith(CACHE_KEY_PREFIX)) {
      keys.push(key)
    }
  }
  return keys
}

/** When an entry was last written, or null if it is unreadable / not one of ours. */
function savedAtOf(key: string): number | null {
  try {
    const entry: unknown = JSON.parse(sessionStorage.getItem(key) ?? "")
    return isCacheEntry(entry) ? entry.savedAt : null
  } catch {
    return null
  }
}

/**
 * Nothing sweeps this store on a timer, so the only way an idle tab's entries stop
 * occupying the quota it shares with the page is for a read or a write to drop them:
 * everything past the window goes, and so does anything unreadable.
 */
function pruneExpiredEntries(except?: string) {
  const cutoff = Date.now() - TRANSLATED_SUBTITLES_CACHE_TTL_MS

  for (const key of ourKeys()) {
    if (key === except) continue

    const savedAt = savedAtOf(key)
    if (savedAt === null || savedAt < cutoff) {
      sessionStorage.removeItem(key)
    }
  }
}

/** Keep the newest few videos, so watching many in one tab cannot fill the quota. */
function pruneOldestBeyondLimit(except: string) {
  const others = ourKeys()
    .filter((key) => key !== except)
    .map((key) => ({ key, savedAt: savedAtOf(key) ?? 0 }))
    .sort((a, b) => b.savedAt - a.savedAt)

  for (const entry of others.slice(MAX_CACHED_VIDEOS - 1)) {
    sessionStorage.removeItem(entry.key)
  }
}

export function readTranslatedSubtitles(key: string): CachedTranslatedCue[] | null {
  // Every session start is also a chance to drop what has aged out, so a tab left
  // open does not keep old videos around until it closes. This removes `key` too
  // when it is past the window, which is how the miss below happens.
  pruneExpiredEntries()

  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null

    const entry: unknown = JSON.parse(raw)
    if (!isCacheEntry(entry)) {
      sessionStorage.removeItem(key)
      return null
    }

    return entry.cues
  } catch {
    // Unreadable or foreign value: drop it rather than break the session.
    sessionStorage.removeItem(key)
    return null
  }
}

export function writeTranslatedSubtitles(key: string, cues: CachedTranslatedCue[]): void {
  if (cues.length === 0) return

  const payload = JSON.stringify({
    savedAt: Date.now(),
    cues: [...cues].sort((a, b) => a.start - b.start).slice(0, MAX_CACHED_CUES),
  } satisfies CacheEntry)

  try {
    sessionStorage.setItem(key, payload)
  } catch {
    // The quota is shared with the page. Free what is stale and what is past the
    // newest few, retry once, and otherwise leave the cache off rather than throw
    // into the subtitle pipeline.
    pruneExpiredEntries(key)
    pruneOldestBeyondLimit(key)
    try {
      sessionStorage.setItem(key, payload)
    } catch {
      return
    }
  }

  pruneExpiredEntries(key)
  pruneOldestBeyondLimit(key)
}
