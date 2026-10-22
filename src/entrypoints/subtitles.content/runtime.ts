import type { ContentScriptContext } from "#imports"
import { getLocalConfig } from "@/utils/config/storage"
import { initI18n } from "@/utils/i18n"
import { initNetflixSubtitles } from "./init-netflix-subtitles"
import { initXcomSubtitles } from "./init-xcom-subtitles"
import { initYoutubeSubtitles } from "./init-youtube-subtitles"

declare global {
  interface Window {
    __READ_TADPOLE_SUBTITLES_INJECTED__?: boolean
  }
}

export async function bootstrapSubtitlesRuntime(ctx: ContentScriptContext) {
  // The manifest's subtitles content script and the shared content runtime reach
  // this function in the same frame, so the flag also keeps them to one run.
  // `isPartRunning` in the runtime reads the same flag.
  if (window.__READ_TADPOLE_SUBTITLES_INJECTED__) return
  window.__READ_TADPOLE_SUBTITLES_INJECTED__ = true

  const config = await getLocalConfig()
  // No provider is the feature's "off" state, even if the switch is still on.
  if (!config?.videoSubtitles?.enabled || !config.videoSubtitles.providerId) {
    window.__READ_TADPOLE_SUBTITLES_INJECTED__ = false
    return
  }

  await initI18n(config.uiLanguage)

  ctx.onInvalidated(() => {
    window.__READ_TADPOLE_SUBTITLES_INJECTED__ = false
  })

  initYoutubeSubtitles(ctx)
  initXcomSubtitles(ctx)
  initNetflixSubtitles(ctx)
}
