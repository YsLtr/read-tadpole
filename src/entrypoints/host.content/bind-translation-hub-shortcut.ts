import type { Hotkey } from "@tanstack/hotkeys"
import { HotkeyManager } from "@tanstack/hotkeys"
import { getLocalConfig } from "@/utils/config/storage"
import { TRANSLATION_HUB_ROUTE } from "@/utils/constants/translation-hub"
import { sendMessage } from "@/utils/message"
import {
  isPageTranslationShortcutEmpty,
  isValidConfiguredPageTranslationShortcut,
} from "@/utils/page-translation-shortcut"

/**
 * Opens the Translation Hub from any page. A content script cannot open a tab
 * itself, so the background does it — the same route the options sidebar link
 * already uses.
 */
export async function bindTranslationHubShortcutKey() {
  const config = await getLocalConfig()
  if (!config || isPageTranslationShortcutEmpty(config.translationHub.shortcut)) {
    return () => {}
  }

  const shortcut = config.translationHub.shortcut
  if (!isValidConfiguredPageTranslationShortcut(shortcut)) {
    return () => {}
  }

  const registration = HotkeyManager.getInstance().register(
    shortcut as Hotkey,
    () => {
      void sendMessage("openOptionsPage", { route: TRANSLATION_HUB_ROUTE })
    },
    {
      ignoreInputs: true,
      preventDefault: true,
      stopPropagation: true,
    },
  )

  return () => {
    registration.unregister()
  }
}
