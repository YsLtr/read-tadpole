import type { APIProviderConfig } from "@/types/config/provider"
import { useSelector } from "@tanstack/react-store"
import { useAutosaveContext } from "@/components/form/use-autosave"
import { isLLMProviderConfig, isProtocolCompatibleLLMProviderConfig } from "@/types/config/provider"
import { i18n } from "@/utils/i18n"
import { ModelSuggestionButton } from "./components/model-suggestion-button"
import { withForm } from "./form"

/**
 * A custom endpoint always names its model by hand: there is no catalog to pick
 * from, and the model id says nothing about which vendor-specific options the
 * endpoint accepts.
 */
export const TranslateModelSelector = withForm({
  ...{ defaultValues: {} as APIProviderConfig },
  render: function Render({ form }) {
    const providerConfig = useSelector(form.store, (state) => state.values)
    const autosave = useAutosaveContext()
    if (!isLLMProviderConfig(providerConfig)) return null

    return (
      <form.AppField name="model.customModel">
        {(field) => (
          <field.InputFieldAutoSave
            label={i18n.t("options.apiProviders.form.models.label")}
            labelExtra={
              isProtocolCompatibleLLMProviderConfig(providerConfig) && (
                <ModelSuggestionButton
                  providerConfig={providerConfig}
                  onSelect={(selectedModel) => {
                    autosave.edit(() => field.handleChange(selectedModel), {
                      immediate: true,
                    })
                  }}
                />
              )
            }
            value={field.state.value ?? ""}
          />
        )}
      </form.AppField>
    )
  },
})
