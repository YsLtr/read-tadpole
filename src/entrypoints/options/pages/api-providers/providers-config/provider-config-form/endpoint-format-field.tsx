import type { APIProviderConfig } from "@/types/config/provider"
import { useSelector } from "@tanstack/react-store"
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base-ui/select"
import { API_ENDPOINT_FORMATS, DEFAULT_API_ENDPOINT_FORMAT } from "@/types/config/provider"
import { i18n } from "@/utils/i18n"
import { withForm } from "./form"

/**
 * Which wire format the custom endpoint speaks. Chat Completions and the
 * Responses API take different request shapes and are not interchangeable, so a
 * gateway that only implements one of them has to be able to say so.
 */
export const EndpointFormatField = withForm({
  ...{ defaultValues: {} as APIProviderConfig },
  render: function Render({ form }) {
    const providerConfig = useSelector(form.store, (state) => state.values)

    if (providerConfig.provider !== "openai-compatible") {
      return null
    }

    return (
      <form.AppField name="endpointFormat">
        {(field) => (
          <field.SelectFieldAutoSave
            label={i18n.t("options.apiProviders.form.fields.endpointFormat")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={DEFAULT_API_ENDPOINT_FORMAT} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {API_ENDPOINT_FORMATS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {i18n.t(`options.apiProviders.form.endpointFormats.${format}` as never)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </field.SelectFieldAutoSave>
        )}
      </form.AppField>
    )
  },
})
