import type { LangCodeISO6393 } from "@read-frog/definitions"
import type { SupportedUiLocale } from "@/utils/i18n/locales"
import { getUiLocale, translateIn } from "@/utils/i18n"

// A result card speaks the reader's language, not the UI's. The model writes
// its answers in the target language (`language.targetCode`, the prompt's
// {{targetLanguage}}), so the sample a card previews follows that language
// too. The extension has words in its UI languages; a target language outside
// them gets the UI language's, which the reader reads too.

// The language each UI locale is written in.
const LANG_CODE_OF_UI_LOCALE: Readonly<Record<SupportedUiLocale, LangCodeISO6393>> = {
  en: "eng",
  "zh-CN": "cmn",
  "zh-TW": "cmn-Hant",
  ja: "jpn",
  ko: "kor",
  ru: "rus",
  tr: "tur",
  vi: "vie",
  es: "spa",
}

const UI_LOCALE_OF_LANG_CODE = new Map(
  Object.entries(LANG_CODE_OF_UI_LOCALE).map(([locale, code]) => [
    code,
    locale as SupportedUiLocale,
  ]),
)

// The locale whose words a card shows a reader of `targetCode`.
export function contentLocaleFor(targetCode: LangCodeISO6393): SupportedUiLocale {
  return UI_LOCALE_OF_LANG_CODE.get(targetCode) ?? getUiLocale()
}

// The language a locale's words are in.
export function langCodeOfLocale(locale: SupportedUiLocale): LangCodeISO6393 {
  return LANG_CODE_OF_UI_LOCALE[locale]
}
