import type { PromptResolver } from "./api/ai"
import type { Config } from "@/types/config/config"
import type { ProviderConfig } from "@/types/config/provider"
import type { TranslationTextFormat } from "@/types/config/translate"
import { ISO6393_TO_6391, LANG_CODE_TO_EN_NAME } from "@read-frog/definitions"
import { isLLMProviderConfig } from "@/types/config/provider"
import { aiTranslate } from "./api/ai"
import { deeplTranslate } from "./api/deepl"
import { deeplxTranslate } from "./api/deeplx"
import { googleTranslate } from "./api/google"
import { microsoftTranslate } from "./api/microsoft"
import { prepareTranslationText } from "./text-preparation"
import { normalizeTranslationOutput } from "./translation-output-normalization"

export async function executeTranslate<TContext>(
  text: string,
  langConfig: Config["language"],
  providerConfig: ProviderConfig,
  promptResolver: PromptResolver<TContext>,
  options?: {
    isBatch?: boolean
    context?: TContext
    textFormat?: TranslationTextFormat
    /**
     * Only Google needs this: its translateHtml transport collapses a literal
     * "\n" as HTML whitespace, so multi-line plain text loses its line
     * structure. Microsoft keeps newlines in both text types, and LLM prompts
     * already mandate format preservation.
     */
    preserveLineBreaks?: boolean
    signal?: AbortSignal
  },
) {
  const preparedText = prepareTranslationText(text)
  if (preparedText === "") {
    return ""
  }

  const { provider } = providerConfig
  let translatedText = ""

  if (provider === "google-translate" || provider === "microsoft-translate") {
    const sourceLang =
      langConfig.sourceCode === "auto" ? "auto" : (ISO6393_TO_6391[langConfig.sourceCode] ?? "auto")
    const targetLang = ISO6393_TO_6391[langConfig.targetCode]
    if (!targetLang) {
      throw new Error(`Invalid target language code: ${langConfig.targetCode}`)
    }
    const { baseURL, apiKey, headers } = providerConfig
    if (provider === "google-translate") {
      translatedText = await googleTranslate(preparedText, sourceLang, targetLang, {
        textFormat: options?.textFormat,
        preserveLineBreaks: options?.preserveLineBreaks,
        signal: options?.signal,
        baseURL,
        apiKey,
        headers,
      })
    } else {
      translatedText = await microsoftTranslate(preparedText, sourceLang, targetLang, {
        textFormat: options?.textFormat,
        signal: options?.signal,
        baseURL,
        apiKey,
        headers,
      })
    }
  } else if (provider === "deeplx" || provider === "deepl") {
    const sourceLang =
      langConfig.sourceCode === "auto" ? "auto" : (ISO6393_TO_6391[langConfig.sourceCode] ?? "auto")
    const targetLang = ISO6393_TO_6391[langConfig.targetCode]
    if (!targetLang) {
      throw new Error(`Invalid target language code: ${langConfig.targetCode}`)
    }
    const requestOptions = { textFormat: options?.textFormat, signal: options?.signal }
    translatedText =
      provider === "deeplx"
        ? await deeplxTranslate(preparedText, sourceLang, targetLang, providerConfig, requestOptions)
        : await deeplTranslate(preparedText, sourceLang, targetLang, providerConfig, requestOptions)
  } else if (isLLMProviderConfig(providerConfig)) {
    const targetLangName = LANG_CODE_TO_EN_NAME[langConfig.targetCode]
    translatedText = await aiTranslate(
      preparedText,
      targetLangName,
      providerConfig,
      promptResolver,
      options,
    )
  } else {
    throw new Error(`Unknown provider: ${provider}`)
  }

  return normalizeTranslationOutput(providerConfig, translatedText).trim()
}
