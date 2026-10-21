import type { LangCodeISO6393 } from "@read-frog/definitions"
import type { DictionarySlot } from "@read-frog/layout-engine/presets"
import type {
  SelectionToolbarCustomActionOutputField,
  SelectionToolbarCustomActionSampleData,
} from "@/types/config/selection-toolbar"
import type { SupportedUiLocale } from "@/utils/i18n/locales"
import { contentLocaleFor, langCodeOfLocale } from "./labels"
import { getDictionarySlots } from "./slots"

// Sample data for the layout preview on the options page: the selection, the
// language the answer is written for, and a value per output field, keyed by
// field id so it survives a rename. A custom action saves its sample data; a
// built-in action's preview generates it. v107-to-v108 holds a frozen copy of
// what is generated here, for the custom actions it gave sample data to.
//
// Samples are answers written in a language the extension has words in, keyed
// by that language's UI locale: a new sample is written in the reader's
// language (see contentLocaleFor), and its target language is the locale's own.

// A worked Dictionary answer per language, so the preview reads like a lookup
// by someone who reads that language: an English word explained in it, or, in
// English, a Chinese word explained in English.
interface DictionarySample {
  selection: string
  values: Record<DictionarySlot, string>
}

function englishWordSample(
  definition: string,
  contextTranslation: string,
  memoryTips: string,
): DictionarySample {
  return {
    selection: "blossoms",
    values: {
      term: "blossom",
      phonetic: "/ˈblɒs.əm/",
      partOfSpeech: "noun",
      definition,
      context: "The ephemeral beauty of cherry blossoms reminds us to cherish each moment.",
      contextTerm: '[{"text":"blossoms"}]',
      contextTranslation,
      difficulty: "B2",
      memoryTips,
    },
  }
}

const DICTIONARY_SAMPLES: Record<SupportedUiLocale, DictionarySample> = {
  en: {
    selection: "珍惜",
    values: {
      term: "珍惜",
      phonetic: "zhēnxī",
      partOfSpeech: "verb",
      definition: "to cherish; to treasure; to value highly",
      context: "樱花短暂的美丽提醒我们珍惜每一刻。",
      contextTerm: '[{"text":"珍惜"}]',
      contextTranslation:
        "The fleeting beauty of cherry blossoms reminds us to cherish every moment.",
      difficulty: "B1",
      memoryTips:
        "Characters: 珍 (treasure, with 王 for jade) + 惜 (to value, with 忄 for heart): hold something dear like jade.\nCollocation: 珍惜时间 = to make the most of your time; 珍惜机会 = to value a chance.",
    },
  },
  "zh-CN": englishWordSample(
    "花；花朵（尤指果树的花）",
    "樱花短暂的美丽提醒我们珍惜每一刻。",
    "词源：和 bloom（开花）同源，bl- 开头的 bloom、blossom 都和开花有关\n近义词：bloom 多指花开的状态，blossom 常指果树（樱桃、苹果）的花",
  ),
  "zh-TW": englishWordSample(
    "花；花朵（尤指果樹的花）",
    "櫻花短暫的美麗提醒我們珍惜每一刻。",
    "字源：和 bloom（開花）同源，bl- 開頭的 bloom、blossom 都和開花有關\n近義詞：bloom 多指花開的狀態，blossom 常指果樹（櫻桃、蘋果）的花",
  ),
  ja: englishWordSample(
    "花（特に果樹の花）",
    "桜のはかない美しさは、一瞬一瞬を大切にするよう私たちに思い出させてくれる。",
    "語源：bloom（花が咲く）と同じ語源で、bl- で始まる bloom・blossom はどちらも花に関わる語\n類義語：bloom は花が咲いている状態、blossom は特に果樹（桜・りんご）の花",
  ),
  ko: englishWordSample(
    "꽃 (특히 과일나무의 꽃)",
    "벚꽃의 덧없는 아름다움은 매 순간을 소중히 여기라고 우리에게 일깨워 준다.",
    "어원: bloom(꽃이 피다)과 어원이 같아, bl-로 시작하는 bloom·blossom은 모두 꽃과 관련된 말\n유의어: bloom은 꽃이 핀 상태, blossom은 특히 과일나무(벚나무·사과나무)의 꽃",
  ),
  ru: englishWordSample(
    "цветок; цветение (особенно плодовых деревьев)",
    "Мимолётная красота цветущей вишни напоминает нам ценить каждое мгновение.",
    "Происхождение: однокоренное с bloom («цвести»), и оба слова на bl- связаны с цветением\nСиноним: bloom — само цветение, blossom — цветы плодовых деревьев (вишни, яблони)",
  ),
  tr: englishWordSample(
    "çiçek (özellikle meyve ağaçlarının çiçeği)",
    "Kiraz çiçeklerinin geçici güzelliği bize her anın kıymetini bilmemizi hatırlatır.",
    "Köken: bloom (çiçek açmak) ile aynı kökten gelir; bl- ile başlayan iki kelime de çiçekle ilgilidir\nEş anlamlı: bloom çiçek açma hâlidir, blossom ise özellikle meyve ağaçlarının (kiraz, elma) çiçeğidir",
  ),
  vi: englishWordSample(
    "hoa (đặc biệt là hoa của cây ăn quả)",
    "Vẻ đẹp phù du của hoa anh đào nhắc nhở chúng ta trân trọng từng khoảnh khắc.",
    "Nguồn gốc: cùng gốc với bloom (nở hoa); hai từ bắt đầu bằng bl- này đều liên quan đến hoa\nTừ đồng nghĩa: bloom là trạng thái nở hoa, blossom thường là hoa của cây ăn quả (anh đào, táo)",
  ),
  es: englishWordSample(
    "flor (especialmente la de un árbol frutal)",
    "La belleza efímera de los cerezos en flor nos recuerda valorar cada momento.",
    "Origen: comparte raíz con bloom (florecer); las dos palabras con bl- tienen que ver con las flores\nSinónimo: bloom es el hecho de florecer; blossom, la flor de un árbol frutal (cerezo, manzano)",
  ),
}

type Field = SelectionToolbarCustomActionOutputField
type SampleData = SelectionToolbarCustomActionSampleData

// A number field's sample. Every sample value is text, like a model's answer;
// the layout scope converts a number field's.
const SAMPLE_NUMBER = "3"

// The value a new sample gives a field of `outputSchema`, written in `locale`:
// a number for a number field, the curated text for a field a generated card
// places, else the field's own name.
function sampleValueFor(
  outputSchema: readonly Field[],
  locale: SupportedUiLocale,
): (field: Field) => string {
  const curatedByFieldId = new Map<string, string>()
  const place = <S extends string>(
    slots: Partial<Record<S, Field>>,
    curated: Readonly<Record<S, string>>,
  ) => {
    for (const [slot, field] of Object.entries(slots) as Array<[S, Field | undefined]>) {
      if (field) curatedByFieldId.set(field.id, curated[slot])
    }
  }
  place<DictionarySlot>(getDictionarySlots(outputSchema), DICTIONARY_SAMPLES[locale].values)
  return (field) =>
    field.type === "number" ? SAMPLE_NUMBER : (curatedByFieldId.get(field.id) ?? field.name)
}

// A new sample for an action with `outputSchema`, written for a reader of
// `targetCode`. Its selection is the dictionary sample's.
export function createLayoutSampleData(
  outputSchema: readonly Field[],
  targetCode: LangCodeISO6393,
): SampleData {
  const locale = contentLocaleFor(targetCode)
  const { selection } = DICTIONARY_SAMPLES[locale]
  const valueOf = sampleValueFor(outputSchema, locale)
  return {
    selection,
    targetCode: langCodeOfLocale(locale),
    values: Object.fromEntries(outputSchema.map((field) => [field.id, valueOf(field)])),
  }
}

// `sampleData` kept in step with `outputSchema`: a field it has no value for
// gets a new one, in the sample's language, and the values of fields that are
// gone are dropped. Without sample data (a built-in action, or sample data
// that could not be read), a new sample for a reader of `targetCode`.
export function syncLayoutSampleData(
  sampleData: SampleData | undefined,
  outputSchema: readonly Field[],
  targetCode: LangCodeISO6393,
): SampleData {
  if (!sampleData) return createLayoutSampleData(outputSchema, targetCode)
  const valueOf = sampleValueFor(outputSchema, contentLocaleFor(sampleData.targetCode))
  const { values } = sampleData
  return {
    ...sampleData,
    values: Object.fromEntries(
      outputSchema.map((field) => [
        field.id,
        Object.hasOwn(values, field.id) ? values[field.id]! : valueOf(field),
      ]),
    ),
  }
}

// The values a layout reads, keyed by field NAME like a model's structured
// output. `sampleData` is in step with `outputSchema` (syncLayoutSampleData);
// a field it has no value for reads as blank.
export function layoutSampleValues(
  sampleData: SampleData,
  outputSchema: readonly Field[],
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of outputSchema) {
    // defineProperty: a field named `__proto__` must stay an own key.
    Object.defineProperty(values, field.name, {
      value: Object.hasOwn(sampleData.values, field.id) ? sampleData.values[field.id] : "",
      enumerable: true,
      writable: true,
      configurable: true,
    })
  }
  return values
}

// The partial results a stream would deliver on the way to `values`: fields
// arrive in schema order, strings grow a chunk at a time (never splitting a
// surrogate pair), and every frame extends the one before it. Starts with {}
// (everything pending) and ends with the complete values.
export function buildStreamingFrames(
  values: Readonly<Record<string, unknown>>,
  outputSchema: SelectionToolbarCustomActionOutputField[],
  options: { maxFrames?: number } = {},
): Array<Record<string, unknown>> {
  const entries: Array<[name: string, value: unknown]> = []
  const seen = new Set<string>()
  for (const field of outputSchema) {
    if (seen.has(field.name) || !Object.hasOwn(values, field.name)) continue
    seen.add(field.name)
    entries.push([field.name, values[field.name]])
  }

  const totalChars = entries.reduce(
    (sum, [, value]) => sum + (typeof value === "string" ? Array.from(value).length : 0),
    0,
  )
  const step = Math.max(1, Math.ceil(totalChars / Math.max(1, options.maxFrames ?? 60)))

  const frames: Array<Record<string, unknown>> = [{}]
  let current: Record<string, unknown> = {}
  const push = (name: string, value: unknown) => {
    current = { ...current }
    Object.defineProperty(current, name, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    })
    frames.push(current)
  }

  for (const [name, value] of entries) {
    if (typeof value !== "string" || value === "") {
      push(name, value)
      continue
    }
    const chars = Array.from(value)
    for (let end = step; ; end += step) {
      push(name, chars.slice(0, Math.min(end, chars.length)).join(""))
      if (end >= chars.length) break
    }
  }
  return frames
}
