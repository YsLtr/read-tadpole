import type { ProviderConfig } from "@/types/config/provider"
import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import type { FeatureKey } from "@/utils/constants/feature-providers"
import type { ProviderSelectorOption } from "@/utils/providers/provider-display"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useMemo } from "react"
import { configAtom, configFieldsAtomMap, writeConfigAtom } from "@/utils/atoms/config"
import { getProviderConfigById } from "@/utils/config/helpers"
import {
  buildFeatureProviderAssignment,
  buildFeatureProviderPatch,
  FEATURE_PROVIDER_DEFS,
} from "@/utils/constants/feature-providers"
import { getSelectionToolbarActions, patchSelectionToolbarAction } from "@/utils/custom-actions"
import { getSelectableProvidersForCapability } from "@/utils/providers/provider-registry"
import { providerSupportsTranslationOnlyMode } from "@/utils/providers/translation-only-gate"

export interface FeatureProviderBinding {
  providers: ProviderSelectorOption[]
  providerId: string
  providerConfig: ProviderConfig | null
  setProviderId: (providerId: string) => void
}

/** Reads and writes the provider a built-in feature runs on, independent of how it is laid out. */
export function useFeatureProvider(featureKey: FeatureKey): FeatureProviderBinding {
  const config = useAtomValue(configAtom)
  const setConfig = useSetAtom(writeConfigAtom)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)
  const translationMode = useAtomValue(configFieldsAtomMap.pageTranslation).mode
  const providerId = FEATURE_PROVIDER_DEFS[featureKey].getProviderId(config)

  // Page translate in translationOnly mode cannot run on providers without
  // markup support (see translation-only-gate.ts) — hide them so the blocked
  // combination cannot be formed from a provider picker. Other features keep
  // the full list.
  const hideTranslationOnlyUnsupported =
    featureKey === "pageTranslation" && translationMode === "translationOnly"
  const providers = useMemo(() => {
    const candidates = getSelectableProvidersForCapability(featureKey, providersConfig)
    if (!hideTranslationOnlyUnsupported) {
      return candidates
    }
    return candidates.filter((option) => providerSupportsTranslationOnlyMode(option.provider))
  }, [featureKey, providersConfig, hideTranslationOnlyUnsupported])

  const setProviderId = useCallback(
    // No provider is the feature's "off": keeps its own switch in step too, so
    // the rest of the UI (and an import/export round trip) reads the same.
    (id: string) => void setConfig(buildFeatureProviderAssignment(featureKey, id)),
    [featureKey, setConfig],
  )

  return {
    providers,
    providerId,
    providerConfig: getProviderConfigById(providersConfig, providerId) ?? null,
    setProviderId,
  }
}

export interface CustomActionProvidersBinding {
  /** Every action, off ones included: the picker reports an off action as "none". */
  actions: SelectionToolbarCustomAction[]
  providers: ProviderSelectorOption[]
  /** The provider to show for an action: empty when the action is off. */
  getActionProviderId: (action: SelectionToolbarCustomAction) => string
  setActionProviderId: (actionId: string, providerId: string) => void
}

/** Same as `useFeatureProvider`, for the custom AI actions in the selection toolbar. */
export function useCustomActionProviders(): CustomActionProvidersBinding {
  const config = useAtomValue(configAtom)
  const setConfig = useSetAtom(writeConfigAtom)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)

  const providers = useMemo(
    () => getSelectableProvidersForCapability("customAction", providersConfig),
    [providersConfig],
  )

  const actions = useMemo(
    () => getSelectionToolbarActions(config.selectionToolbar),
    [config.selectionToolbar],
  )

  const setActionProviderId = useCallback(
    (actionId: string, providerId: string) =>
      void setConfig({
        selectionToolbar: patchSelectionToolbarAction(
          config.selectionToolbar,
          actionId,
          // An action cannot run without a provider, so "none" is the action's own
          // switch. Its last provider is kept: picking one again restores it.
          providerId === "" ? { enabled: false } : { enabled: true, providerId },
        ),
      }),
    [config.selectionToolbar, setConfig],
  )

  const getActionProviderId = useCallback(
    (action: SelectionToolbarCustomAction) => (action.enabled === false ? "" : action.providerId),
    [],
  )

  return { actions, providers, getActionProviderId, setActionProviderId }
}
