import "@/utils/zod-config"
import type { Config, UiLanguage } from "@/types/config/config"
import { browser, defineBackground } from "#imports"
import { storageAdapter } from "@/utils/atoms/storage-adapter"
import { CONFIG_STORAGE_KEY } from "@/utils/constants/config"
import { initI18n, setUiLanguage } from "@/utils/i18n"
import { ensureInstalledAtRecorded } from "@/utils/install-time"
import { logger } from "@/utils/logger"
import { onMessage } from "@/utils/message"
import { openOptionsPage } from "@/utils/navigation"
import { runAiSegmentSubtitles } from "./ai-segmentation"
import { dispatchBackgroundStreamPort } from "./background-stream"
import { initializeActionIcons, registerActionIconListeners } from "./browser-action-icon"
import { ensureInitializedConfig } from "./config"
import { setUpConfigBackup } from "./config-backup"
import {
  cleanupAllAiSegmentationCache,
  cleanupAllSummaryCache,
  cleanupAllTranslationCache,
  setUpDatabaseCleanup,
} from "./db-cleanup"
import { setupEdgeTTSMessageHandlers } from "./edge-tts"
import { setupIframeInjection } from "./iframe-injection"
import { setupLLMGenerateTextMessageHandlers } from "./llm-generate-text"
import { setupPageTranslationHandlers } from "./page-translation"
import { proxyFetch } from "./proxy-fetch"
import { setupSubtitlesTranslationHandlers } from "./subtitles-translation"
import { translationMessage } from "./translation-signal"
import { setupTTSPlaybackMessageHandlers } from "./tts-playback"

export default defineBackground({
  type: "module",
  main: () => {
    logger.info("Hello background!", { id: browser.runtime.id })

    browser.runtime.onInstalled.addListener(async () => {
      // First, and for every reason rather than just "install": this is the only place the
      // install time is ever recorded, and it must not be lost to a service worker dying
      // during the slower work below.
      await ensureInstalledAtRecorded()

      await ensureInitializedConfig()
    })

    onMessage("openPage", async (message) => {
      const { url, active } = message.data
      logger.info("openPage", { url, active })
      await browser.tabs.create({ url, active: active ?? true })
    })

    onMessage("openOptionsPage", async (message) => {
      logger.info("openOptionsPage", message.data)
      await openOptionsPage(message.data)
    })

    // The background is the only context that initialises the config, so it is
    // the only one that can answer with a config that is current. Every other
    // one asks here instead of parsing raw storage, which would hand back
    // DEFAULT_CONFIG for a config this build has not accepted yet.
    onMessage("getInitialConfig", async () => ensureInitializedConfig())

    onMessage("aiSegmentSubtitles", async (message) => {
      try {
        return await runAiSegmentSubtitles(message.data)
      } catch (error) {
        logger.error("[Background] aiSegmentSubtitles failed", error)
        throw error
      }
    })

    browser.runtime.onConnect.addListener((port) => {
      dispatchBackgroundStreamPort(port)
    })

    onMessage("clearAllTranslationRelatedCache", async () => {
      await cleanupAllTranslationCache()
      await cleanupAllSummaryCache()
    })

    onMessage("clearAiSegmentationCache", async () => {
      await cleanupAllAiSegmentationCache()
    })

    registerActionIconListeners()

    // Page-translation state: the handlers the popup, the toolbar and every
    // content script ask for the tab's translation state, plus the tab/navigation
    // listeners that keep that state scoped to the right origin. Registering it
    // is what makes `getEnablePageTranslationByTabId` answer at all — without it
    // the popup's own init rejects and the whole popup renders nothing.
    translationMessage()

    // Initialize action icons asynchronously
    void initializeActionIcons()

    // Synchronous: all translation handlers register in the first turn of the SW
    // so wake-triggering messages are never dropped during init.
    setupPageTranslationHandlers()
    setupSubtitlesTranslationHandlers()
    void setUpDatabaseCleanup()
    setUpConfigBackup()

    // Start config and i18n initialization without delaying synchronous listener
    // registration. Consumers that materialize localized config-derived data await
    // this shared barrier before reading it.
    let currentUiLanguage: UiLanguage | undefined
    const backgroundReady = (async () => {
      const config = await ensureInitializedConfig()
      currentUiLanguage = config?.uiLanguage ?? "auto"
      await initI18n(currentUiLanguage)
    })()

    proxyFetch()
    setupEdgeTTSMessageHandlers()
    setupLLMGenerateTextMessageHandlers()
    setupTTSPlaybackMessageHandlers()

    // Setup on-demand iframe injection after page translation is enabled.
    setupIframeInjection()

    // Keep background-resolved strings in the selected language when it changes.
    // The UI contexts re-render through their own language boundary; this drives
    // the background's i18next singleton.
    storageAdapter.watch<Config>(CONFIG_STORAGE_KEY, (newConfig) => {
      void (async () => {
        await backgroundReady
        if (newConfig.uiLanguage === currentUiLanguage) return
        currentUiLanguage = newConfig.uiLanguage
        await setUiLanguage(newConfig.uiLanguage)
      })()
    })
  },
})
