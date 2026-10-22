import type { ComponentProps } from "react"
import type { Theme } from "@/types/config/theme"
import type { ProviderSelectorOption } from "@/utils/providers/provider-display"
import { IconBan } from "@tabler/icons-react"
import ProviderIcon from "@/components/provider-icon"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base-ui/select"
import { isLLMProviderConfig, isPureTranslateProviderConfig } from "@/types/config/provider"
import { i18n } from "@/utils/i18n"
import { getProviderLogo, getProviderName } from "@/utils/providers/provider-display"
import { useTheme } from "../providers/theme-provider"

type ProviderSelectorLabelKey = "translateService.llmModels" | "translateService.normalTranslator"
type ProviderSelectorTriggerSize = ComponentProps<typeof SelectTrigger>["size"]

/**
 * The "none" row's select value. A provider id comes from a preset or a UUID, so
 * this cannot collide with one, and it is a plain string so it is safe in the
 * DOM attributes Base UI puts a select value in.
 */
const NO_PROVIDER_VALUE = "__no_provider__"

export interface ProviderSelectorGroup {
  labelKey: ProviderSelectorLabelKey
  providers: ProviderSelectorOption[]
}

interface ProviderSelectorProps {
  providers: ProviderSelectorOption[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  className?: string
  /** Applied to the selected provider's name in the trigger, not to the list items. */
  triggerNameClassName?: string
  triggerSize?: ProviderSelectorTriggerSize
  /** Offer a row that reports an empty provider id: the feature has no provider, i.e. it is off. */
  allowNone?: boolean
  noneLabel?: string
  selectContentProps?: Pick<
    ComponentProps<typeof SelectContent>,
    "container" | "positionerClassName" | "align"
  >
}

export function getProviderSelectorGroups(
  providers: ProviderSelectorOption[],
): ProviderSelectorGroup[] {
  const llmProviders = providers.filter(isLLMProviderConfig)
  const pureTranslateProviders = providers.filter(isPureTranslateProviderConfig)

  const groups: ProviderSelectorGroup[] = [
    { labelKey: "translateService.llmModels", providers: llmProviders },
    { labelKey: "translateService.normalTranslator", providers: pureTranslateProviders },
  ]

  return groups.filter((group) => group.providers.length > 0)
}

function ProviderOptionContent({
  provider,
  theme,
}: {
  provider: ProviderSelectorOption
  theme: Theme
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
      <ProviderIcon
        logo={getProviderLogo(provider, theme)}
        name={getProviderName(provider)}
        size="sm"
      />
    </div>
  )
}

/** The row that names no provider: a provider row's badge and name, so it lines up with them. */
function NoProviderLabel({ label }: { label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="flex size-5 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:bg-muted">
        <IconBan className="size-[11px] text-muted-foreground" />
      </div>
      <span className="truncate text-sm">{label}</span>
    </div>
  )
}

/** In the list, wrapped like a provider row is, so the row keeps the same width and height. */
function NoProviderOptionContent({ label }: { label: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
      <NoProviderLabel label={label} />
    </div>
  )
}

function SelectedProviderValue({
  value,
  providers,
  theme,
  placeholder,
  triggerNameClassName,
  allowNone,
  noneLabel,
}: {
  value: string
  providers: ProviderSelectorOption[]
  theme: Theme
  placeholder?: string
  triggerNameClassName?: string
  allowNone: boolean
  noneLabel: string
}) {
  const provider = providers.find((candidate) => candidate.id === value)
  if (provider) {
    return (
      <ProviderIcon
        logo={getProviderLogo(provider, theme)}
        name={getProviderName(provider)}
        size="sm"
        textClassName={triggerNameClassName}
      />
    )
  }

  if (allowNone && value === NO_PROVIDER_VALUE) {
    return <NoProviderLabel label={noneLabel} />
  }

  return placeholder ? <span className="truncate text-muted-foreground">{placeholder}</span> : null
}

function selectValueFor(value: string, allowNone: boolean): string | null {
  if (value) return value
  return allowNone ? NO_PROVIDER_VALUE : null
}

function handleSelectValueChange(value: string | null, onChange: (id: string) => void) {
  if (value === null) return
  onChange(value === NO_PROVIDER_VALUE ? "" : value)
}

/** The list row that reports an empty provider id. Rendered inside a group like every provider row. */
function NoProviderOptionItem({ noneLabel }: { noneLabel: string }) {
  return (
    <SelectItem value={NO_PROVIDER_VALUE}>
      <NoProviderOptionContent label={noneLabel} />
    </SelectItem>
  )
}

export default function ProviderSelector({
  providers,
  value,
  onChange,
  placeholder,
  className,
  triggerNameClassName,
  triggerSize = "default",
  allowNone = false,
  noneLabel = i18n.t("options.apiProviders.featureProviders.none"),
  selectContentProps,
}: ProviderSelectorProps) {
  const { theme } = useTheme()
  const providerGroups = getProviderSelectorGroups(providers)
  const selectValue = selectValueFor(value, allowNone)

  if (providerGroups.length > 1) {
    return (
      <GroupedSelect
        providerGroups={providerGroups}
        providers={providers}
        selectValue={selectValue}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        triggerNameClassName={triggerNameClassName}
        triggerSize={triggerSize}
        allowNone={allowNone}
        noneLabel={noneLabel}
        selectContentProps={selectContentProps}
        theme={theme}
      />
    )
  }

  return (
    <UngroupedSelect
      providers={providers}
      selectValue={selectValue}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      triggerNameClassName={triggerNameClassName}
      triggerSize={triggerSize}
      allowNone={allowNone}
      noneLabel={noneLabel}
      selectContentProps={selectContentProps}
      theme={theme}
    />
  )
}

function GroupedSelect({
  providerGroups,
  providers,
  selectValue,
  onChange,
  placeholder,
  className,
  triggerNameClassName,
  triggerSize,
  allowNone,
  noneLabel,
  theme,
  selectContentProps,
}: {
  providerGroups: ProviderSelectorGroup[]
  providers: ProviderSelectorOption[]
  selectValue: string | null
  onChange: (id: string) => void
  placeholder?: string
  className?: string
  triggerNameClassName?: string
  triggerSize: ProviderSelectorTriggerSize
  allowNone: boolean
  noneLabel: string
  selectContentProps?: Pick<
    ComponentProps<typeof SelectContent>,
    "container" | "positionerClassName" | "align"
  >
  theme: Theme
}) {
  return (
    <Select<string>
      value={selectValue}
      onValueChange={(value) => handleSelectValueChange(value, onChange)}
      itemToStringValue={(value) => value}
    >
      <SelectTrigger className={className} size={triggerSize}>
        <SelectValue placeholder={placeholder}>
          {(value: string | null) => (
            <SelectedProviderValue
              value={value ?? ""}
              providers={providers}
              theme={theme}
              placeholder={placeholder}
              triggerNameClassName={triggerNameClassName}
              allowNone={allowNone}
              noneLabel={noneLabel}
            />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent {...selectContentProps}>
        {providerGroups.map((group, index) => (
          <SelectGroup key={group.labelKey}>
            <SelectLabel>{i18n.t(group.labelKey)}</SelectLabel>
            {group.providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                <ProviderOptionContent provider={provider} theme={theme} />
              </SelectItem>
            ))}
            {/* Last row of the last group: same inset, same gap, so it reads as
                one more choice rather than a separate block. */}
            {allowNone && index === providerGroups.length - 1 && (
              <NoProviderOptionItem noneLabel={noneLabel} />
            )}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

function UngroupedSelect({
  providers,
  selectValue,
  onChange,
  placeholder,
  className,
  triggerNameClassName,
  triggerSize,
  allowNone,
  noneLabel,
  theme,
  selectContentProps,
}: {
  providers: ProviderSelectorOption[]
  selectValue: string | null
  onChange: (id: string) => void
  placeholder?: string
  className?: string
  triggerNameClassName?: string
  triggerSize: ProviderSelectorTriggerSize
  allowNone: boolean
  noneLabel: string
  selectContentProps?: Pick<
    ComponentProps<typeof SelectContent>,
    "container" | "positionerClassName" | "align"
  >
  theme: Theme
}) {
  return (
    <Select<string>
      value={selectValue}
      onValueChange={(value) => handleSelectValueChange(value, onChange)}
      itemToStringValue={(value) => value}
      disabled={providers.length === 0 && !allowNone}
    >
      <SelectTrigger className={className} size={triggerSize}>
        <SelectValue placeholder={placeholder}>
          {(value: string | null) => (
            <SelectedProviderValue
              value={value ?? ""}
              providers={providers}
              theme={theme}
              placeholder={placeholder}
              triggerNameClassName={triggerNameClassName}
              allowNone={allowNone}
              noneLabel={noneLabel}
            />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent {...selectContentProps}>
        <SelectGroup>
          {providers.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              <ProviderOptionContent provider={provider} theme={theme} />
            </SelectItem>
          ))}
          {allowNone && <NoProviderOptionItem noneLabel={noneLabel} />}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
