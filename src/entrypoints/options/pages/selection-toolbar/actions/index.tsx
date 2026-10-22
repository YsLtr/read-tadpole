import { useAtom } from "jotai"
import { useFeatureEnabledToggle } from "@/components/llm-providers/use-feature-providers"
import { Switch } from "@/components/ui/base-ui/switch"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { i18n } from "@/utils/i18n"
import { ConfigItem } from "../../../components/config-item"
import { ConfigSection } from "../../../components/config-section"
import { ShortcutLink } from "../../../components/shortcut-link"

/** What the toolbar can do with a selection: the two built-in buttons. */
export function ActionsSection() {
  const [selectionToolbar, setSelectionToolbar] = useAtom(configFieldsAtomMap.selectionToolbar)
  const { features } = selectionToolbar
  // Translating turns the feature's provider off and back on with it.
  const setTranslationEnabled = useFeatureEnabledToggle("selectionTranslation")

  const setSpeakEnabled = (enabled: boolean) => {
    void setSelectionToolbar({
      ...selectionToolbar,
      features: { ...features, speak: { ...features.speak, enabled } },
    })
  }

  return (
    <ConfigSection
      id="selection-toolbar-actions"
      title={i18n.t("options.selectionToolbar.actions.title")}
    >
      <ConfigItem
        id="selection-toolbar-translate"
        title={i18n.t("options.selectionToolbar.actions.translate.title")}
        description={
          <>
            {i18n.t("options.selectionToolbar.actions.translate.description")}
            <ShortcutLink sectionId="selection-translation-shortcut" />
          </>
        }
      >
        <Switch
          checked={features.translate.enabled}
          onCheckedChange={setTranslationEnabled}
        />
      </ConfigItem>
      <ConfigItem
        id="selection-toolbar-speak"
        title={i18n.t("options.selectionToolbar.actions.speak.title")}
        description={
          <>
            {i18n.t("options.selectionToolbar.actions.speak.description")}
            <ShortcutLink sectionId="selection-speak-shortcut" />
          </>
        }
      >
        <Switch
          checked={features.speak.enabled}
          onCheckedChange={setSpeakEnabled}
        />
      </ConfigItem>
    </ConfigSection>
  )
}
