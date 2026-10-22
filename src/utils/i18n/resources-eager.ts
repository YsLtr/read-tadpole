// The background's i18n resources: every locale, imported statically.
//
// An MV3 extension service worker cannot use dynamic `import()` ("disallowed on
// ServiceWorkerGlobalScope by the HTML specification"), so the background cannot
// fetch the locale chunks `resources.ts` lazily imports. Only the background
// imports this module, which keeps its extra copies out of the chunks the
// extension pages share.
//
// ponytail: one locale tree per language at service-worker startup, since the
// configured language is only known at runtime. If that parse cost or the extra
// copy ever matters, emit the trees as JSON assets and fetch the configured one.
import type { SupportedUiLocale } from "./locales"
import es from "@/locales/es.yml"
import ja from "@/locales/ja.yml"
import ko from "@/locales/ko.yml"
import ru from "@/locales/ru.yml"
import tr from "@/locales/tr.yml"
import vi from "@/locales/vi.yml"
import zhCN from "@/locales/zh-CN.yml"
import zhTW from "@/locales/zh-TW.yml"
import { registerLocaleResources } from "./resources"

const ALL_LOCALES = {
  es,
  ja,
  ko,
  ru,
  tr,
  vi,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
} as const

for (const [locale, tree] of Object.entries(ALL_LOCALES)) {
  registerLocaleResources(locale as SupportedUiLocale, tree)
}
