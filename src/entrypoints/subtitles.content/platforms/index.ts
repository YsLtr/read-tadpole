import type { SubtitlesPlatform } from "@/types/config/subtitles"

export interface ControlsConfig {
  findVideoContainer?: () => HTMLElement | null
  measureHeight: (container: HTMLElement) => number
  checkVisibility: (container: HTMLElement) => boolean
}

export interface PlatformConfig {
  /** Which site's player this is; picks that site's translate-on-open switch. */
  platform: SubtitlesPlatform
  embedded?: boolean
  silentErrors?: boolean
  containerShrinkRatio?: (container: HTMLElement) => number | null
  subtitlesZIndex?: number

  selectors: {
    video: string
    playerContainer: string
    controlsBar?: string
    /** First child of the controls bar that belongs to the player itself; the translate button goes in front of it. */
    controlsPlayerOwned?: string
    nativeSubtitles?: string
  }

  events: {
    navigateStart?: string
    navigateFinish?: string
  }

  controls?: ControlsConfig

  supportsSidebar?: boolean

  getVideoId?: () => string | null

  /**
   * When true, the host player is showing an ad. Overlay captions for the main
   * video should be suppressed until the ad ends.
   */
  isAdPlaying?: (playerContainer: HTMLElement) => boolean
}
