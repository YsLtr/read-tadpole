import type { GeneratedI18nStructure } from "#i18n"
import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import { DEFAULT_LAYOUT } from "@read-frog/layout-engine/presets"
import { getRandomUUID } from "@/utils/crypto-polyfill"
import { i18n } from "@/utils/i18n"
import { buildDictionaryActionLayout } from "@/utils/layout-host/slots"
import { createOutputSchemaField } from "./custom-action"

const T_PREFIX = "options.selectionToolbar.customActions.templates"
type I18nKey = keyof GeneratedI18nStructure

export interface CustomActionTemplate {
  id: string
  nameKey: string
  descriptionKey: string
  icon: string
  createAction: (providerId: string) => SelectionToolbarCustomAction
}

type CustomActionTemplateDefinition = Omit<CustomActionTemplate, "nameKey" | "descriptionKey"> & {
  nameKey: I18nKey
  descriptionKey: I18nKey
}

// An action as a preset defines it, before its card is built: the built-in
// actions rename the field ids first and build the card for those.
export type CustomActionDefinition = Omit<SelectionToolbarCustomAction, "layout">

export function createDictionaryDefinition(providerId: string): CustomActionDefinition {
  return {
    id: getRandomUUID(),
    name: i18n.t(`${T_PREFIX}.dictionary.name`),
    enabled: true,
    icon: "streamline-color:dictionary-language-book-flat",
    providerId,
    systemPrompt: i18n.t(`${T_PREFIX}.dictionary.systemPrompt`),
    prompt: i18n.t(`${T_PREFIX}.dictionary.prompt`),
    outputSchema: [
      createOutputSchemaField(
        i18n.t(`${T_PREFIX}.dictionary.fieldTerm`),
        "string",
        i18n.t(`${T_PREFIX}.dictionary.fieldTermDescription`),
        "dictionary-term",
      ),
      createOutputSchemaField(
        i18n.t(`${T_PREFIX}.dictionary.fieldPhonetic`),
        "string",
        i18n.t(`${T_PREFIX}.dictionary.fieldPhoneticDescription`),
        "dictionary-phonetic",
      ),
      createOutputSchemaField(
        i18n.t(`${T_PREFIX}.dictionary.fieldPartOfSpeech`),
        "string",
        i18n.t(`${T_PREFIX}.dictionary.fieldPartOfSpeechDescription`),
        "dictionary-part-of-speech",
      ),
      createOutputSchemaField(
        i18n.t(`${T_PREFIX}.dictionary.fieldDefinition`),
        "string",
        i18n.t(`${T_PREFIX}.dictionary.fieldDefinitionDescription`),
        "dictionary-definition",
      ),
      createOutputSchemaField(
        i18n.t(`${T_PREFIX}.dictionary.fieldSentence`),
        "string",
        i18n.t(`${T_PREFIX}.dictionary.fieldSentenceDescription`),
        "dictionary-context",
      ),
      // Where the term stands in the sentence, as annotations for the card
      // to mark (a JSON array of {"text": …} quotes).
      createOutputSchemaField(
        i18n.t(`${T_PREFIX}.dictionary.fieldSentenceTerm`),
        "string",
        i18n.t(`${T_PREFIX}.dictionary.fieldSentenceTermDescription`),
        "dictionary-context-term",
      ),
      createOutputSchemaField(
        i18n.t(`${T_PREFIX}.dictionary.fieldSentenceTranslation`),
        "string",
        i18n.t(`${T_PREFIX}.dictionary.fieldSentenceTranslationDescription`),
        "dictionary-context-translation",
      ),
      // Plain text, one tip per line, and empty when nothing helps: a JSON
      // array here lost every tip on some answers (models cut the inner string
      // short), and plain lines read as they would in a note card. Not the
      // last field: after this long value, deepseek-v4-flash broke the end of
      // its JSON on 4% of answers; a short Difficulty last keeps it closing.
      createOutputSchemaField(
        i18n.t(`${T_PREFIX}.dictionary.fieldMemoryTips`),
        "string",
        i18n.t(`${T_PREFIX}.dictionary.fieldMemoryTipsDescription`),
        "dictionary-memory-tips",
      ),
      createOutputSchemaField(
        i18n.t(`${T_PREFIX}.dictionary.fieldDifficulty`),
        "string",
        i18n.t(`${T_PREFIX}.dictionary.fieldDifficultyDescription`),
        "dictionary-difficulty",
      ),
    ],
  }
}

export const CUSTOM_ACTION_TEMPLATES: CustomActionTemplate[] = [
  {
    id: "dictionary",
    nameKey: `${T_PREFIX}.dictionary.name`,
    descriptionKey: `${T_PREFIX}.dictionary.description`,
    icon: "streamline-color:dictionary-language-book-flat",
    createAction: (providerId: string): SelectionToolbarCustomAction => {
      const action = createDictionaryDefinition(providerId)
      // The card names its fields, so it is built from this schema; the
      // preset always has the term and definition slots, so it is never null.
      return {
        ...action,
        layout: buildDictionaryActionLayout(action.outputSchema) ?? DEFAULT_LAYOUT,
      }
    },
  },
  {
    id: "blank",
    nameKey: `${T_PREFIX}.blank.name`,
    descriptionKey: `${T_PREFIX}.blank.description`,
    icon: "tabler:sparkles",
    createAction: (providerId: string): SelectionToolbarCustomAction => ({
      id: getRandomUUID(),
      name: i18n.t(`${T_PREFIX}.blank.name`),
      enabled: true,
      icon: "tabler:sparkles",
      providerId,
      systemPrompt: "",
      // Not empty: an LLM provider rejects a request without a prompt.
      prompt: i18n.t(`${T_PREFIX}.blank.prompt`),
      outputSchema: [
        createOutputSchemaField(
          i18n.t("options.selectionToolbar.customActions.form.defaultFieldName"),
        ),
      ],
      layout: DEFAULT_LAYOUT,
    }),
  },
] satisfies CustomActionTemplateDefinition[]
