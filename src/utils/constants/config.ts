import type { Config } from "@/types/config/config"
import type {
  SelectionToolbarCustomAction,
  SelectionToolbarCustomActionOutputField,
} from "@/types/config/selection-toolbar"
import type { PageTranslateRange } from "@/types/config/translate"
import { DEFAULT_LAYOUT } from "@read-frog/layout-engine/presets"
import { DEFAULT_BUILT_IN_ACTION_PROVIDER_ID } from "@/types/config/selection-toolbar"
import { buildDictionaryActionLayout } from "@/utils/layout-host/slots"
import { BUILT_IN_ACTION_DEFAULT_SHORTCUTS, BUILT_IN_DICTIONARY_ACTION_ID } from "./custom-action"
import { createDictionaryDefinition } from "./custom-action-templates"
import {
  DEFAULT_SUBTITLE_TRANSLATE_PROMPTS_CONFIG,
  DEFAULT_TRANSLATE_PROMPTS_CONFIG,
} from "./prompt"
import {
  BILIBILI_PRESET_PROVIDER_ID,
  buildDefaultProviderConfigList,
  DEFAULT_PROVIDER_CONFIG_LIST,
} from "./providers"
import {
  DEFAULT_SELECTION_OVERLAY_OPACITY,
  DEFAULT_SELECTION_SPEAK_SHORTCUT_KEY,
  SELECTION_TOOLBAR_FEATURE_IDS,
} from "./selection"
import {
  DEFAULT_BACKGROUND_OPACITY,
  DEFAULT_DISPLAY_MODE,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SCALE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_SUBTITLE_COLOR,
  DEFAULT_SUBTITLE_POSITION,
  DEFAULT_SUBTITLES_TOGGLE_SHORTCUT_KEY,
  DEFAULT_TRANSLATION_POSITION,
} from "./subtitles"
import {
  DEFAULT_AUTO_TRANSLATE_SHORTCUT_KEY,
  DEFAULT_BATCH_CONFIG,
  DEFAULT_MIN_CHARACTERS_PER_NODE,
  DEFAULT_MIN_WORDS_PER_NODE,
  DEFAULT_PRELOAD_MARGIN,
  DEFAULT_PRELOAD_THRESHOLD,
  DEFAULT_REQUEST_CAPACITY,
  DEFAULT_REQUEST_RATE,
  DEFAULT_SELECTION_TRANSLATION_SHORTCUT_KEY,
  DEFAULT_TRANSLATION_MODE_SHORTCUT_KEY,
} from "./translate"
import { DEFAULT_NODE_TRANSLATION_SHORTCUT_KEY } from "./hotkeys"
import { DEFAULT_TRANSLATION_HUB_SHORTCUT_KEY } from "./translation-hub"
import { TRANSLATION_NODE_STYLE_ON_INSTALLED } from "./translation-node-style"
import { DEFAULT_TTS_CONFIG } from "./tts"

export { CONFIG_STORAGE_KEY } from "./config-storage-key"
export const LAST_SYNCED_CONFIG_STORAGE_KEY = "lastSyncedConfig"
export const GOOGLE_DRIVE_TOKEN_STORAGE_KEY = "__googleDriveToken"

export const THEME_STORAGE_KEY = "theme"
export const DEFAULT_DETECTED_CODE = "eng" as const


/**
 * The shape of the stored config. Nothing upgrades a config written by an older
 * build any more — the migration chain is gone — so this is only the stamp written
 * alongside a config (and into exports) to say what produced it. A stored config
 * that does not match the current schema is replaced by the defaults.
 */
export const CONFIG_SCHEMA_VERSION = 115

type OutputSchema = SelectionToolbarCustomActionOutputField[]

// A built-in action's card, rebuilt only when its fields' ids change: it is
// resolved on every read of the action. Cards place fields by id and hold no
// words of their own, so nothing else about the language or the names goes into
// one.
function memoizeBuiltInLayout(build: (outputSchema: OutputSchema) => string | null) {
  let memo: { key: string; layout: string } | null = null
  return (outputSchema: OutputSchema): string => {
    const key = JSON.stringify(outputSchema.map((field) => field.id))
    if (memo?.key !== key) memo = { key, layout: build(outputSchema) ?? DEFAULT_LAYOUT }
    return memo.layout
  }
}

const getBuiltInDictionaryLayout = memoizeBuiltInLayout(buildDictionaryActionLayout)

/**
 * Build the code-owned Dictionary action definition in the current UI locale.
 * Only enabled/provider state is persisted; callers merge those mutable
 * fields onto this definition at read time. The layout is generated here too
 * (never persisted), so it always follows the current locale's field names.
 */
export function createDefaultDictionaryAction(): SelectionToolbarCustomAction {
  const action = createDictionaryDefinition(DEFAULT_BUILT_IN_ACTION_PROVIDER_ID)
  const outputSchema = action.outputSchema.map((field) => ({
    ...field,
    id: field.id.startsWith("dictionary-")
      ? `default-${field.id}`
      : `default-dictionary-${field.id}`,
  }))
  return {
    ...action,
    id: BUILT_IN_DICTIONARY_ACTION_ID,
    outputSchema,
    // Built for the renamed ids: the card's tail matches the fields it has
    // already placed by id, so the preset's card (keyed on `dictionary-*`)
    // would list every slot field a second time.
    layout: getBuiltInDictionaryLayout(outputSchema),
  }
}

export const DEFAULT_CONFIG: Config = {
  language: {
    sourceCode: "auto",
    targetCode: "cmn",
    level: "intermediate",
  },
  providersConfig: DEFAULT_PROVIDER_CONFIG_LIST,
  pageTranslation: {
    providerId: BILIBILI_PRESET_PROVIDER_ID,
    mode: "bilingual",
    modeShortcut: DEFAULT_TRANSLATION_MODE_SHORTCUT_KEY,
    node: {
      enabled: false,
      hotkey: "control",
      shortcut: DEFAULT_NODE_TRANSLATION_SHORTCUT_KEY,
      forceRetranslation: false,
    },
    page: {
      range: "all",
      translateTitle: true,
      autoTranslatePatterns: ["*.news.ycombinator.com"],
      neverAutoTranslatePatterns: [],
      autoTranslateLanguages: [],
      shortcut: DEFAULT_AUTO_TRANSLATE_SHORTCUT_KEY,
      preload: {
        margin: DEFAULT_PRELOAD_MARGIN,
        threshold: DEFAULT_PRELOAD_THRESHOLD,
      },
      minCharactersPerNode: DEFAULT_MIN_CHARACTERS_PER_NODE,
      minWordsPerNode: DEFAULT_MIN_WORDS_PER_NODE,
      enableTargetLanguageSkip: true,
      skipLanguages: [],
    },
    enableAIContentAware: false,
    customPromptsConfig: DEFAULT_TRANSLATE_PROMPTS_CONFIG,
    requestQueueConfig: {
      capacity: DEFAULT_REQUEST_CAPACITY,
      rate: DEFAULT_REQUEST_RATE,
    },
    batchQueueConfig: {
      maxCharactersPerBatch: DEFAULT_BATCH_CONFIG.maxCharactersPerBatch,
      maxItemsPerBatch: DEFAULT_BATCH_CONFIG.maxItemsPerBatch,
    },
    translationNodeStyle: {
      preset: TRANSLATION_NODE_STYLE_ON_INSTALLED,
      isCustom: false,
      customCSS: null,
    },
  },
  languageDetection: {
    mode: "basic",
  },
  tts: DEFAULT_TTS_CONFIG,
  selectionToolbar: {
    enabled: true,
    disabledSelectionToolbarPatterns: [],
    opacity: DEFAULT_SELECTION_OVERLAY_OPACITY,
    features: {
      translate: {
        enabled: true,
        providerId: BILIBILI_PRESET_PROVIDER_ID,
        shortcut: DEFAULT_SELECTION_TRANSLATION_SHORTCUT_KEY,
      },
      speak: {
        enabled: true,
        shortcut: DEFAULT_SELECTION_SPEAK_SHORTCUT_KEY,
      },
    },
    builtInActions: {
      dictionary: {
        enabled: true,
        providerId: DEFAULT_BUILT_IN_ACTION_PROVIDER_ID,
        shortcut: BUILT_IN_ACTION_DEFAULT_SHORTCUTS[BUILT_IN_DICTIONARY_ACTION_ID],
      },
    },
    customActions: [],
    order: [...SELECTION_TOOLBAR_FEATURE_IDS, BUILT_IN_DICTIONARY_ACTION_ID],
    unpinned: [],
  },
  inputTranslation: {
    enabled: true,
    providerId: BILIBILI_PRESET_PROVIDER_ID,
    fromLang: "targetCode",
    toLang: "sourceCode",
    enableCycle: false,
    timeThreshold: 300,
  },
  videoSubtitles: {
    enabled: true,
    autoStart: { youtube: false, xcom: false, netflix: false },
    toggleShortcut: DEFAULT_SUBTITLES_TOGGLE_SHORTCUT_KEY,
    providerId: BILIBILI_PRESET_PROVIDER_ID,
    style: {
      displayMode: DEFAULT_DISPLAY_MODE,
      translationPosition: DEFAULT_TRANSLATION_POSITION,
      main: {
        fontFamily: DEFAULT_FONT_FAMILY,
        fontScale: DEFAULT_FONT_SCALE,
        color: DEFAULT_SUBTITLE_COLOR,
        fontWeight: DEFAULT_FONT_WEIGHT,
      },
      translation: {
        fontFamily: DEFAULT_FONT_FAMILY,
        fontScale: DEFAULT_FONT_SCALE,
        color: DEFAULT_SUBTITLE_COLOR,
        fontWeight: DEFAULT_FONT_WEIGHT,
      },
      container: {
        backgroundOpacity: DEFAULT_BACKGROUND_OPACITY,
      },
      customCSS: null,
    },
    aiSegmentation: false,
    requestQueueConfig: {
      capacity: DEFAULT_REQUEST_CAPACITY,
      rate: DEFAULT_REQUEST_RATE,
    },
    batchQueueConfig: {
      maxCharactersPerBatch: DEFAULT_BATCH_CONFIG.maxCharactersPerBatch,
      maxItemsPerBatch: DEFAULT_BATCH_CONFIG.maxItemsPerBatch,
    },
    customPromptsConfig: DEFAULT_SUBTITLE_TRANSLATE_PROMPTS_CONFIG,
    position: DEFAULT_SUBTITLE_POSITION,
  },
  siteControl: {
    mode: "blacklist",
    blacklistPatterns: [],
    whitelistPatterns: [],
  },
  siteRules: {
    userRules: [],
    disabledBuiltInRules: [],
  },
  uiLanguage: "auto",
  translationHub: {
    shortcut: DEFAULT_TRANSLATION_HUB_SHORTCUT_KEY,
    selectedProviderIds: null,
    sourceCode: null,
    targetCode: null,
    promptId: DEFAULT_TRANSLATE_PROMPTS_CONFIG.promptId,
  },
}

/**
 * A fresh config ships with the free Bilibili preset already selected for every
 * translate feature, so translation works before the user adds a key.
 */
export function buildFreshDefaultConfig(): Config {
  return {
    ...DEFAULT_CONFIG,
    providersConfig: buildDefaultProviderConfigList(),
    selectionToolbar: {
      ...DEFAULT_CONFIG.selectionToolbar,
      builtInActions: {
        dictionary: {
          enabled: true,
          providerId: DEFAULT_BUILT_IN_ACTION_PROVIDER_ID,
        },
      },
      customActions: [],
    },
  }
}

export const PAGE_TRANSLATE_RANGE_ITEMS: Record<PageTranslateRange, { label: string }> = {
  main: { label: "Main" },
  all: { label: "All" },
}
