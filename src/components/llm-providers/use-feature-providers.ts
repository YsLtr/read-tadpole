import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import type { FeatureKey } from "@/utils/constants/feature-providers"
import type { ProviderSelectorOption } from "@/utils/providers/provider-display"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useMemo } from "react"
import { toastManager } from "@/components/ui/base-ui/toast"
import { configAtom, configFieldsAtomMap, writeConfigAtom } from "@/utils/atoms/config"
import {
  buildFeatureEnabledPatch,
  buildFeatureProviderAssignment,
  getFeatureProviderId,
  resolveProviderToResumeFrom,
} from "@/utils/constants/feature-providers"
import {
  findSelectionToolbarAction,
  getSelectionToolbarActions,
  patchSelectionToolbarAction,
} from "@/utils/custom-actions"
import { i18n } from "@/utils/i18n"
import { getSelectableProvidersForCapability } from "@/utils/providers/provider-registry"
import { providerSupportsTranslationOnlyMode } from "@/utils/providers/translation-only-gate"

export interface FeatureProviderBinding {
  providers: ProviderSelectorOption[]
  providerId: string
  setProviderId: (providerId: string) => void
}

/** Reads and writes the provider a built-in feature runs on, independent of how it is laid out. */
export function useFeatureProvider(featureKey: FeatureKey): FeatureProviderBinding {
  const config = useAtomValue(configAtom)
  const setConfig = useSetAtom(writeConfigAtom)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)
  const translationMode = useAtomValue(configFieldsAtomMap.pageTranslation).mode

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
    // No provider turns the feature off; its own switch is kept in step, so the
    // rest of the UI reads the same state wherever it looks.
    (id: string) => void setConfig(buildFeatureProviderAssignment(featureKey, id)),
    [featureKey, setConfig],
  )

  return {
    providers,
    // Empty while the feature is off: the row shows "none" without losing the
    // provider it comes back to.
    providerId: getFeatureProviderId(config, featureKey),
    setProviderId,
  }
}

/**
 * Flips a feature's own switch, keeping its provider in step: off leaves the
 * provider stored, on resumes it (or the first one that can still run the
 * feature). With nothing to resume, the switch refuses and says why.
 */
export function useFeatureEnabledToggle(featureKey: FeatureKey): (enabled: boolean) => void {
  const config = useAtomValue(configAtom)
  const setConfig = useSetAtom(writeConfigAtom)

  return useCallback(
    (enabled: boolean) => {
      const patch = buildFeatureEnabledPatch(config, featureKey, enabled)
      if (!patch) {
        toastManager.add({
          type: "error",
          title: i18n.t("options.apiProviders.form.atLeastOneLLMProvider"),
        })
        return
      }
      void setConfig(patch)
    },
    [config, featureKey, setConfig],
  )
}

/**
 * Flips an action's switch the way a feature's works: off keeps the provider it
 * ran on (an action cannot run without one), on resumes that provider or the
 * first one that can still run an action. With nothing to resume, the switch
 * refuses instead of writing a config that would not parse.
 */
export function useActionEnabledToggle(actionId: string): (enabled: boolean) => void {
  const config = useAtomValue(configAtom)
  const setConfig = useSetAtom(writeConfigAtom)

  return useCallback(
    (enabled: boolean) => {
      const { selectionToolbar } = config
      const patch = (changes: { enabled: boolean; providerId?: string }) => ({
        selectionToolbar: patchSelectionToolbarAction(selectionToolbar, actionId, changes),
      })

      if (!enabled) {
        void setConfig(patch({ enabled: false }))
        return
      }

      const storedProviderId =
        findSelectionToolbarAction(selectionToolbar, actionId)?.providerId ?? ""
      const providerId = resolveProviderToResumeFrom(config, "customAction", storedProviderId)
      if (!providerId) {
        toastManager.add({
          type: "error",
          title: i18n.t("options.apiProviders.form.atLeastOneLLMProvider"),
        })
        return
      }
      void setConfig(patch({ enabled: true, providerId }))
    },
    [actionId, config, setConfig],
  )
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
