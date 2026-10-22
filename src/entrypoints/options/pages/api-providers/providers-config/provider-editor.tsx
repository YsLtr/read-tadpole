import type { AutosaveController } from "@/components/form/autosave-controller"
import type { APIProviderConfig } from "@/types/config/provider"
import { useSelector } from "@tanstack/react-store"
import { useAtomValue } from "jotai"
import { createContext, use, useState } from "react"
import { useAutosave } from "@/components/form/use-autosave"
import ProviderIcon from "@/components/provider-icon"
import { useTheme } from "@/components/providers/theme-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/base-ui/alert-dialog"
import { Button } from "@/components/ui/base-ui/button"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { getProviderLogo } from "@/utils/providers/provider-display"
import { i18n } from "@/utils/i18n"
import { APIKeyField } from "./provider-config-form/api-key-field"
import { AdvancedOptionsSection } from "./provider-config-form/components/advanced-options-section"
import { ConfigHeader as ProviderConfigHeader } from "./provider-config-form/config-header"
import { DoubaoCookieField } from "./provider-config-form/doubao-cookie-field"
import { EndpointFormatField } from "./provider-config-form/endpoint-format-field"
import { formOpts, useAppForm } from "./provider-config-form/form"
import { ProviderHeadersField } from "./provider-config-form/provider-headers-field"
import { ProviderOptionsField } from "./provider-config-form/provider-options-field"
import { ProviderURLField } from "./provider-config-form/provider-url-field"
import { ReasoningField } from "./provider-config-form/reasoning-field"
import { TemperatureField } from "./provider-config-form/temperature-field"
import { TranslateModelSelector } from "./provider-config-form/translate-model-selector"

interface ProviderIdentity {
  id: string
  logo: string
  name: string
}

interface ProviderEditorContextValue {
  state: {
    identity: ProviderIdentity
  }
  actions: {
    duplicate?: () => Promise<void>
    delete?: () => Promise<void>
  }
}

const ProviderEditorContext = createContext<ProviderEditorContextValue | null>(null)

export function useProviderEditor() {
  const context = use(ProviderEditorContext)
  if (!context) {
    throw new Error("ProviderEditor components must be rendered inside a ProviderEditor Provider")
  }
  return context
}

function useRequiredProviderCommand(command: "duplicate" | "delete") {
  const action = useProviderEditor().actions[command]
  if (!action) {
    throw new Error(`ProviderEditor.${command} is unavailable in this composition`)
  }
  return action
}

function useProviderEditorValue({
  identity,
  duplicate,
  delete: deleteProvider,
}: {
  identity: ProviderIdentity
  duplicate?: () => Promise<void>
  delete?: () => Promise<void>
}): ProviderEditorContextValue {
  return {
    state: {
      identity,
    },
    actions: {
      ...(duplicate ? { duplicate } : {}),
      ...(deleteProvider ? { delete: deleteProvider } : {}),
    },
  }
}

export function useProviderForm(
  providerConfig: APIProviderConfig,
  save: (providerConfig: APIProviderConfig, changes: Partial<APIProviderConfig>) => Promise<void>,
) {
  const form = useAppForm({
    ...formOpts,
    defaultValues: providerConfig,
    onSubmitMeta: { revision: 0 },
    onSubmit: async ({ value, meta }) => {
      await autosave.commit(value, meta.revision)
    },
  })
  const autosave: AutosaveController<APIProviderConfig> = useAutosave({
    initialValue: providerConfig,
    getDraft: () => form.state.values,
    setField: (key, value) =>
      form.setFieldValue(key, value as never, { dontUpdateMeta: true, dontRunListeners: true }),
    reset: (value) => form.reset(value),
    submit: (revision) => form.handleSubmit({ revision }),
    persist: save,
  })
  return { form, autosave }
}

type ProviderForm = ReturnType<typeof useProviderForm>["form"]

const ApiProviderFormContext = createContext<ProviderForm | null>(null)

function useApiProviderForm() {
  const form = use(ApiProviderFormContext)
  if (!form) {
    throw new Error("ProviderEditor form fields require a CustomProviderEditor Provider")
  }
  return form
}

function CustomProvider({
  providerConfig,
  form,
  duplicate,
  delete: deleteProvider,
  children,
}: {
  providerConfig: APIProviderConfig
  form: ProviderForm
  duplicate: () => Promise<void>
  delete: () => Promise<void>
  children: React.ReactNode
}) {
  const { theme } = useTheme()
  const value = useProviderEditorValue({
    identity: {
      id: providerConfig.id,
      logo: getProviderLogo(providerConfig, theme),
      name: providerConfig.name,
    },
    duplicate,
    delete: deleteProvider,
  })

  return (
    <ProviderEditorContext value={value}>
      <ApiProviderFormContext value={form}>{children}</ApiProviderFormContext>
    </ProviderEditorContext>
  )
}

function Form({ children }: { children: React.ReactNode }) {
  const form = useApiProviderForm()
  return <form.AppForm>{children}</form.AppForm>
}

function Identity() {
  const { identity } = useProviderEditor().state
  return (
    <ProviderIcon
      logo={identity.logo}
      name={identity.name}
      size="base"
      textClassName="font-medium"
    />
  )
}

function Attribution({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-6 text-muted-foreground">{children}</p>
}

function ConfigHeader() {
  const form = useApiProviderForm()
  const providerConfig = useSelector(form.store, (state) => state.values)
  return <ProviderConfigHeader providerConfig={providerConfig} />
}

function NameField() {
  const form = useApiProviderForm()
  const providerId = useProviderEditor().state.identity.id
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)

  return (
    <form.AppField
      name="name"
      validators={{
        onChange: ({ value }) => {
          const providerWithSameName = providersConfig.find(
            (provider) => provider.name === value && provider.id !== providerId,
          )
          return providerWithSameName
            ? i18n.t("options.apiProviders.form.duplicateProviderName", [value])
            : undefined
        },
      }}
    >
      {(field) => (
        <field.InputFieldAutoSave label={i18n.t("options.apiProviders.form.fields.name")} />
      )}
    </form.AppField>
  )
}

function DescriptionField() {
  const form = useApiProviderForm()
  return (
    <form.AppField name="description">
      {(field) => (
        <field.InputFieldAutoSave label={i18n.t("options.apiProviders.form.fields.description")} />
      )}
    </form.AppField>
  )
}

function ConnectionFields() {
  const form = useApiProviderForm()
  const providerType = useSelector(form.store, (state) => state.values.provider)
  // Doubao has no key to type: the credential it wants is the browser's own
  // Doubao login cookie, which the cookie field captures.
  const isDoubao = providerType === "doubao-translate"
  return (
    <>
      {isDoubao ? <DoubaoCookieField form={form} /> : <APIKeyField form={form} />}
      <ProviderURLField form={form} />
      <EndpointFormatField form={form} />
    </>
  )
}

function TranslationModelFields() {
  const form = useApiProviderForm()
  return (
    <>
      <TranslateModelSelector form={form} />
      <ReasoningField form={form} />
    </>
  )
}

function AdvancedFields() {
  const form = useApiProviderForm()
  return (
    <AdvancedOptionsSection>
      <TemperatureField form={form} />
      <ProviderOptionsField form={form} />
      <ProviderHeadersField form={form} />
    </AdvancedOptionsSection>
  )
}

function DuplicateButton() {
  const duplicate = useRequiredProviderCommand("duplicate")
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void duplicate()}>
      {i18n.t("options.apiProviders.form.duplicate")}
    </Button>
  )
}

function DeleteButton() {
  const deleteProvider = useRequiredProviderCommand("delete")
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>
        {i18n.t("options.apiProviders.form.delete")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {i18n.t("options.apiProviders.form.deleteDialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {i18n.t("options.apiProviders.form.deleteDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {i18n.t("options.apiProviders.form.deleteDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void deleteProvider()}>
            {i18n.t("options.apiProviders.form.deleteDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const ProviderEditor = {
  Form,
  Identity,
  Attribution,
  ConfigHeader,
  NameField,
  DescriptionField,
  ConnectionFields,
  TranslationModelFields,
  AdvancedFields,
  DuplicateButton,
  DeleteButton,
}

export const CustomProviderEditor = {
  Provider: CustomProvider,
}
