import type { LangCodeISO6393 } from "@read-frog/definitions"
import type {
  BackgroundGenerateTextPayload,
  BackgroundGenerateTextResponse,
} from "@/types/background-generate-text"
import type { Config } from "@/types/config/config"
import type { TranslationTextFormat } from "@/types/config/translate"
import type {
  EdgeTTSHealthStatus,
  EdgeTTSSynthesizeRequest,
  EdgeTTSSynthesizeWireResponse,
} from "@/types/edge-tts"
import type { ProviderRequestRouting } from "@/types/provider-request"
import type { ProxyRequest, ProxyResponse } from "@/types/proxy-fetch"
import type {
  TTSPlaybackStartRequest,
  TTSPlaybackStartResponse,
  TTSPlaybackStopRequest,
} from "@/types/tts-playback"
import type { PromptableProviderRef, SerializableProviderRef } from "@/utils/providers/provider-ref"
import type { EdgeTTSVoice } from "@/utils/server/edge-tts/types"
import { defineExtensionMessaging } from "@webext-core/messaging"

interface ProtocolMap {
  // navigation
  openPage: (data: { url: string; active?: boolean }) => void
  openOptionsPage: (data?: { route?: `/${string}` }) => void
  // config
  getInitialConfig: () => Config | null
  // translation state
  getEnablePageTranslationByTabId: (data: { tabId: number }) => boolean | undefined
  getEnablePageTranslationFromContentScript: () => Promise<boolean>
  tryToSetEnablePageTranslationByTabId: (data: {
    tabId: number
    enabled: boolean
  }) => void
  tryToSetEnablePageTranslationOnContentScript: (data: { enabled: boolean }) => void
  setAndNotifyPageTranslationStateChangedByManager: (data: {
    enabled: boolean
    url?: string
    userInitiated?: boolean
  }) => void
  notifyTranslationStateChanged: (data: { enabled: boolean }) => void
  ensureIframeHostContentInjected: (data: { tabId?: number }) => void
  injectCurrentIframesAfterTopFrameNodeTranslation: () => void
  activateSameOriginIframeSelectionRuntime: () => boolean
  reportDetectedPageLanguage: (data: {
    detectedCodeOrUnd: LangCodeISO6393 | "und"
    url: string
  }) => void
  refreshDetectedPageLanguage: () => void
  getDetectedCode: () => LangCodeISO6393
  detectedPageLanguageChanged: (data: { detectedCode: LangCodeISO6393 }) => void
  // ask host to start page translation
  askManagerToTogglePageTranslation: (data: { enabled: boolean }) => void
  // request
  enqueueTranslateRequest: (
    data: ProviderRequestRouting & {
      text: string
      langConfig: Config["language"]
      scheduleAt: number
      hash: string
      textFormat?: TranslationTextFormat
      webTitle?: string | null
      webDescription?: string | null
      webContent?: string | null
      webSummary?: string | null
      // Page-translation session this request belongs to; scopes the request
      // for cancelPageTranslationRequests. Absent for non-page requests
      // (input/selection translation), which are never cancellable.
      sessionId?: string
      forceRetranslation?: boolean
    },
  ) => Promise<string>
  // Drain queued/in-flight page-translation requests of one session (#1881).
  // The background composes the scope as `${sender.tab.id}:${sessionId}`, so a
  // tab can only ever cancel its own requests.
  cancelPageTranslationRequests: (data: { sessionId: string }) => void
  getOrGenerateWebPageSummary: (
    data: ProviderRequestRouting<PromptableProviderRef> & {
      webTitle: string
      webContent: string
    },
  ) => Promise<string | null>
  enqueueSubtitlesTranslateRequest: (data: {
    text: string
    langConfig: Config["language"]
    providerRef: SerializableProviderRef
    scheduleAt: number
    hash: string
    webTitle?: string | null
    webDescription?: string | null
    summary?: string | null
  }) => Promise<string>
  getSubtitlesSummary: (data: {
    videoTitle: string
    subtitlesContext: string
    providerRef: PromptableProviderRef
  }) => Promise<string | null>
  getCachedVideoSummary: (data: {
    transcript: string
    targetLanguage: string
    providerRef: PromptableProviderRef
  }) => Promise<string | null>
  saveVideoSummary: (data: {
    transcript: string
    targetLanguage: string
    providerRef: PromptableProviderRef
    summary: string
  }) => Promise<void>
  backgroundGenerateText: (
    data: BackgroundGenerateTextPayload,
  ) => Promise<BackgroundGenerateTextResponse>
  // AI subtitle segmentation
  aiSegmentSubtitles: (data: {
    jsonContent: string
    providerRef: PromptableProviderRef
  }) => Promise<string>
  // network proxy
  backgroundFetch: (data: ProxyRequest) => Promise<ProxyResponse>
  // cache management
  clearAllTranslationRelatedCache: () => Promise<void>
  clearAiSegmentationCache: () => Promise<void>
  // Drops the cached session verdict. Granting a host permission changes no
  // cookie, so the background's cookie listener never fires — without this the
  // "signed out" entry cached while the permission was missing would outlive
  // the grant. Awaiting it before refetching keeps the two ordered.
  // edge tts
  edgeTtsSynthesize: (data: EdgeTTSSynthesizeRequest) => Promise<EdgeTTSSynthesizeWireResponse>
  edgeTtsListVoices: () => Promise<EdgeTTSVoice[]>
  edgeTtsHealthCheck: () => Promise<EdgeTTSHealthStatus>
  // tts playback
  ttsPlaybackPrepare: () => Promise<{ ok: true }>
  ttsPlaybackStart: (data: TTSPlaybackStartRequest) => Promise<TTSPlaybackStartResponse>
  ttsPlaybackStop: (data: TTSPlaybackStopRequest) => Promise<{ ok: true }>
  // offscreen internal
  ttsOffscreenPlay: (data: TTSPlaybackStartRequest) => Promise<TTSPlaybackStartResponse>
  ttsOffscreenStop: (data: TTSPlaybackStopRequest) => Promise<{ ok: true }>
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>()
