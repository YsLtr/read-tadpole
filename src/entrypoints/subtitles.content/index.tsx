import { browser, defineContentScript } from "#imports"
import { CONTENT_RUNTIME_MODULE_FILE } from "@/utils/content-runtime/parts"
import { subtitlesContentScriptMatches } from "./content-script-matches"

// Kept as its own manifest entry (`allFrames`): the background only injects the
// host/selection parts into iframes, so embedded players rely on this script to
// request the subtitles part from the shared content runtime.
export default defineContentScript({
  matches: subtitlesContentScriptMatches,
  allFrames: true,
  async main() {
    if (window.__READ_TADPOLE_SUBTITLES_INJECTED__) return
    const runtimeModule = await import(
      /* @vite-ignore */ browser.runtime.getURL(CONTENT_RUNTIME_MODULE_FILE)
    )
    await (await runtimeModule.default).runContentParts(["subtitles"])
  },
})
