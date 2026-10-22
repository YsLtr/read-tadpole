---
"@read-tadpole/extension": patch
---

perf(i18n): load a UI language only when it is selected

Every locale file was bundled three times — once for extension pages, once for
the content runtime and once for the subtitles content script — so a build
carried all nine languages in each, though one is what any given reader sees.
Only English stays eager now (it is the fallback, and `translateIn` reads it);
each other language is its own chunk, fetched when the configured language
changes.

The fetch happens before `i18next.language` changes, so the `<LocaleBoundary>`
remount still paints in the new language. A language whose chunk cannot be
loaded falls back to English instead of failing the entrypoint.

The background service worker cannot use dynamic `import()` at all — the HTML
specification disallows it on `ServiceWorkerGlobalScope` — so it keeps the
locale files as static imports. That is the one copy this cannot remove.
