# @read-tadpole/extension

## 2.0.0

### Major Changes

- bd70d22: feat(subtitles)!: remove the AI summary panel
  
  The learning panel is now just the transcript: its AI summary tab, the streaming
  generator behind it, its cache messages, and its prompt are gone. Translating
  subtitles with AI smart context still summarizes the transcript for the prompt —
  that is a separate path and is unchanged.

### Minor Changes

- 3cfb7d5: feat: add Doubao Translate provider authenticated by a captured Doubao cookie (with a one-click cookie button)
- c7d1cc6: refactor(providers): drop the per-vendor model option presets, keeping only the custom endpoint
  
  Every LLM provider is now a custom OpenAI-compatible endpoint, so the per-model
  recommendation tables only ever matched model ids the app no longer guesses a
  vendor for. The "recommended provider options" button and its copy are gone too;
  the provider-options editor still sends whatever the reader types.
  
  fix(providers): send provider options under the key the endpoint format reads
  
  A custom endpoint set to the Responses API filed its `providerOptions` under the
  provider's own name, which that client never reads — the options were dropped
  without a warning. They now go under `openai` there, and under the camelCase name
  the Chat Completions client asks for. The translation request also forwards the
  reasoning setting now, which it previously ignored.

### Patch Changes

- 693cb11: perf(i18n): load a UI language only when it is selected
  
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
- bd65c1b: feat(providers): offer `max` as a reasoning level, and put `forceReasoning` in front of readers
  
  The reasoning dropdown now goes up to `max`, matching the levels the AI SDK
  accepts instead of stopping at `xhigh`.
  
  The provider-options placeholder now shows `forceReasoning`, the switch that
  makes the reasoning setting reach a Responses endpoint whose model the SDK cannot
  recognise on its own — a custom endpoint keeps its model id in the request body,
  so without it the effort level was silently dropped.
  
  fix(options): translate the reasoning dropdown's placeholder
  
  It was a hardcoded English `provider-default`; it now uses the same localized
  label as the option it stands in for.
- 68c47f5: feat(subtitles): restyle the default video subtitles and default the page translation style to `dashedLine`
  
  A fresh install now renders subtitles bilingually with the translation below the
  original: a lighter box (35% background), the original in Noto Sans gold
  (`#e0ab25`, weight 400) and the translation in Roboto white (weight 500). The
  style editor's reset buttons now restore these same per-section values instead
  of one shared text style.
  
  Page translation now defaults to the `dashedLine` translation style rather than
  `textColor`.
- 1fa3bd4: chore(build): run video subtitles from the shared content runtime instead of their own bundle
  
  The subtitles content script carried its own copy of React, i18next and the
  translation runtime — 2.1 MB next to the content runtime's 3.2 MB, 73% of it
  modules the other file already had. It now only asks the shared content runtime
  (an ES module the loader already imports) to run its `subtitles` part, so the
  bundle is 3.7 KB and the code it needs is fetched once per frame from a
  `content-runtime/` chunk.
  
  The manifest entry stays: YouTube embeds and "subtitles with page translation
  off" rely on `all_frames` injection into frames the background never touches,
  and the runtime only starts subtitles when a matching site's content script asks
  for that part — every other page still runs just the host and selection parts.
  
  Loading the runtime once per page also means its locale and UI modules are no
  longer duplicated across bundles.

## 1.0.0

### Major Changes

- ReadTadpole（阅读蝌蚪）is a fresh start of the extension: readfrog lite 阅读蛙青春版. Everything user-facing — extension name, descriptions in every locale, UI strings, storage identifiers, DOM ids, CSS classes and attributes, theme variables, exported backup file names and the IndexedDB database — now uses the ReadTadpole name. Installs from before this release are not migrated: the extension starts with default settings and an empty cache.

### Features

- Bilingual page translation with translation-only mode, hover translation and per-site / per-language auto-translation.
- Subtitle translation for YouTube, Netflix and X, with downloadable source and translated subtitles and AI-generated captions for videos without a track.
- Selection toolbar with built-in and custom AI actions, plus input-box translation.
- Text-to-speech playback, custom translation styling and per-site rules.