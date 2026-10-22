import type { FeatureKey } from "@/utils/constants/feature-providers"
import { useAtomValue } from "jotai"
import { useMemo } from "react"
import { configAtom, configFieldsAtomMap } from "@/utils/atoms/config"
import {
  getFeatureLabelI18nKey,
  getFeatureProviderId,
} from "@/utils/constants/feature-providers"
import { i18n } from "@/utils/i18n"
import { canResolvedProviderRefGenerateText } from "@/utils/providers/provider-ref"
import { resolveProviderRefForCapability } from "@/utils/providers/provider-registry"
import { cn } from "@/utils/styles/utils"

/**
 * Per-feature "is this running on an LLM provider" status.
 *
 * Used by every setting that only works on a prompt-driven provider. Each
 * feature picks its own provider, so a single global verdict would be wrong — a
 * user can easily have a setting working on selection translation while page
 * translation quietly ignores it.
 *
 * The resolution is capability-based on purpose: `kind` answers "is it
 * prompt-driven", and a pure translate provider assigned to a feature that
 * needs a model would otherwise report as configured.
 *
 * Renders as `span`s so it can sit inside a `ConfigItem` description, and names
 * no way out of itself: the Feature providers section is on this same page.
 */
export function LlmFeatureStatusList({
  featureKeys,
  className,
}: {
  featureKeys: readonly FeatureKey[]
  className?: string
}) {
  const config = useAtomValue(configAtom)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)

  const statuses = useMemo(
    () =>
      featureKeys.map((featureKey) => {
        const providerId = getFeatureProviderId(config, featureKey)
        const providerRef = resolveProviderRefForCapability(featureKey, providersConfig, providerId)
        const featureName = i18n.t(getFeatureLabelI18nKey(featureKey))
        const hasLLMProvider = providerRef ? canResolvedProviderRefGenerateText(providerRef) : false

        return {
          featureKey,
          hasLLMProvider,
          text: hasLLMProvider
            ? i18n.t("options.apiProviders.aiContentAware.llmProviderConfigured", [featureName])
            : i18n.t("options.apiProviders.aiContentAware.llmProviderNotConfigured", [featureName]),
        }
      }),
    [config, providersConfig, featureKeys],
  )

  return (
    <span className={cn("mt-2 flex flex-col items-start gap-1", className)}>
      {statuses.map(({ featureKey, hasLLMProvider, text }) => (
        <span key={featureKey} className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              hasLLMProvider ? "bg-success" : "bg-warning",
            )}
          />
          <span className="text-[13px]">{text}</span>
        </span>
      ))}
    </span>
  )
}
