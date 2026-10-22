import "@/utils/zod-config"
import { defineContentScript } from "#imports"
import { getLocalConfig } from "@/utils/config/storage"
import { initI18n } from "@/utils/i18n"
import { subtitlesContentScriptMatches } from "./content-script-matches"

declare global {
  interface Window {
    __READ_TADPOLE_SUBTITLES_INJECTED__?: boolean
  }
}

export default defineContentScript({
  matches: subtitlesContentScriptMatches,
  allFrames: true,
  cssInjectionMode: "manifest",
  async main(ctx) {
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

    const { bootstrapSubtitlesRuntime } = await import("./runtime")
    bootstrapSubtitlesRuntime(ctx)
  },
})
