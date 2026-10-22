import type { APIProviderConfig } from "@/types/config/provider"
import { useSelector } from "@tanstack/react-store"
import { useCallback } from "react"
import { HelpTooltip } from "@/components/help-tooltip"
import { isLLMProviderConfig } from "@/types/config/provider"
import { i18n } from "@/utils/i18n"
import { AutosavedJsonCodeEditorField } from "./components/autosaved-json-code-editor-field"
import { withForm } from "./form"

function parseJson(
  input: string,
): { valid: true; value: Record<string, unknown> | undefined } | { valid: false; error: string } {
  if (!input.trim()) {
    return { valid: true, value: undefined }
  }
  try {
    return { valid: true, value: JSON.parse(input) }
  } catch {
    return { valid: false, error: i18n.t("options.apiProviders.form.invalidJson") }
  }
}

function toJson(options: APIProviderConfig["providerOptions"]) {
  return options ? JSON.stringify(options, null, 2) : ""
}

export const ProviderOptionsField = withForm({
  ...{ defaultValues: {} as APIProviderConfig },
  render: function Render({ form }) {
    const providerConfig = useSelector(form.store, (state) => state.values)
    const isLLMProvider = isLLMProviderConfig(providerConfig)

    const handleProviderOptionsCommit = useCallback(
      (value: Record<string, unknown> | undefined) => {
        form.setFieldValue("providerOptions", value)
      },
      [form],
    )

    if (!isLLMProvider) {
      return null
    }

    return (
      <AutosavedJsonCodeEditorField
        value={providerConfig.providerOptions}
        fieldName="providerOptions"
        parse={parseJson}
        serialize={toJson}
        onCommit={handleProviderOptionsCommit}
        editorAriaLabel="provider-options-editor"
        placeholder={JSON.stringify({ field: "value" }, null, 2)}
        label={
          <div className="flex items-center gap-1.5">
            <span>{i18n.t("options.apiProviders.form.providerOptions")}</span>
            <HelpTooltip>{i18n.t("options.apiProviders.form.providerOptionsHint")}</HelpTooltip>
          </div>
        }
      />
    )
  },
})
