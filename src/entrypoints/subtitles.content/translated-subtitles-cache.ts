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
const MAX_CACHED_VIDEOS = 3

export function translatedSubtitlesCacheKey(videoId: string, settingsIdentity: string): string {
  return `${CACHE_KEY_PREFIX}:${videoId}:${settingsIdentity}`
}

function isCacheEntry(value: unknown): value is CacheEntry {
  if (!value || typeof value !== "object") return false
  const entry = value as Partial<CacheEntry>
  return typeof entry.savedAt === "number" && Array.isArray(entry.cues)
}

export function readTranslatedSubtitles(key: string): CachedTranslatedCue[] | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null

    const entry: unknown = JSON.parse(raw)
    if (!isCacheEntry(entry) || Date.now() - entry.savedAt > TRANSLATED_SUBTITLES_CACHE_TTL_MS) {
      sessionStorage.removeItem(key)
      return null
    }

    return entry.cues
  } catch {
    // Unreadable or foreign value: treat as a miss rather than break the session.
    return null
  }
}

export function writeTranslatedSubtitles(key: string, cues: CachedTranslatedCue[]): void {
  if (cues.length === 0) return

  const entry: CacheEntry = {
    savedAt: Date.now(),
    cues: [...cues].sort((a, b) => a.start - b.start).slice(0, MAX_CACHED_CUES),
  }

  try {
    sessionStorage.setItem(key, JSON.stringify(entry))
    pruneOtherEntries(key)
  } catch {
    // The quota is shared with the page; a video too long to fit simply is not cached.
  }
}

/**
 * Nothing sweeps this store on a timer — it is the tab's, so closing the tab is the
 * bulk cleanup. This keeps what stays behind in a long-lived tab bounded: entries
 * old enough to be a miss anyway are dropped, and only the newest few videos stay.
 */
function pruneOtherEntries(keepKey: string) {
  const others: Array<{ key: string; savedAt: number }> = []

  for (let index = 0; index < sessionStorage.length; index++) {
    const key = sessionStorage.key(index)
    if (!key || !key.startsWith(CACHE_KEY_PREFIX) || key === keepKey) continue

    let savedAt = 0
    try {
      const entry: unknown = JSON.parse(sessionStorage.getItem(key) ?? "")
      savedAt = isCacheEntry(entry) ? entry.savedAt : 0
    } catch {
      savedAt = 0
    }
    others.push({ key, savedAt })
  }

  const cutoff = Date.now() - TRANSLATED_SUBTITLES_CACHE_TTL_MS
  others
    .sort((a, b) => b.savedAt - a.savedAt)
    .forEach((entry, index) => {
      if (entry.savedAt < cutoff || index >= MAX_CACHED_VIDEOS - 1) {
        sessionStorage.removeItem(entry.key)
      }
    })
}
