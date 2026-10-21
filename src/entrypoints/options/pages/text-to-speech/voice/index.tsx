import { useAtom } from "jotai"
import { useState } from "react"
import { Input } from "@/components/ui/base-ui/input"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { i18n } from "@/utils/i18n"
import { ConfigItem } from "../../../components/config-item"
import { ConfigSection } from "../../../components/config-section"
import { LanguageVoiceItem } from "./language-voice-item"
import { TTSVoiceCombobox } from "./voice-combobox"

/** Which voice speaks: the one a language is read in, and the one it falls back to without a pick. */
export function VoiceSection() {
  // The preview wording is scratch text, like the language picked above it: it is never
  // written to the config, so it lives for as long as the page does.
  const [previewText, setPreviewText] = useState("")

  return (
    <ConfigSection id="voice" title={i18n.t("options.tts.voice.title")}>
      <LanguageVoiceItem previewText={previewText} />
      <PreviewTextItem value={previewText} onValueChange={setPreviewText} />
      <FallbackVoiceItem />
    </ConfigSection>
  )
}

function PreviewTextItem({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <ConfigItem
      id="tts-preview-text"
      orientation="vertical"
      title={i18n.t("options.tts.voice.previewText.title")}
      description={i18n.t("options.tts.voice.previewText.description")}
    >
      <Input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        // The sample the preview reads when this is empty, so the field shows what pressing
        // play would say right now.
        placeholder={i18n.t("options.tts.voice.language.previewSample")}
        aria-label={i18n.t("options.tts.voice.previewText.title")}
      />
    </ConfigItem>
  )
}

function FallbackVoiceItem() {
  const [ttsConfig, setTtsConfig] = useAtom(configFieldsAtomMap.tts)

  return (
    <ConfigItem
      id="tts-voice"
      title={i18n.t("options.tts.voice.fallback.title")}
      description={i18n.t("options.tts.voice.fallback.description")}
    >
      <TTSVoiceCombobox
        className="w-fit max-w-full"
        aria-label={i18n.t("options.tts.voice.fallback.title")}
        value={ttsConfig.defaultVoice}
        onValueChange={(voice) => {
          void setTtsConfig({ defaultVoice: voice })
        }}
      />
    </ConfigItem>
  )
}
