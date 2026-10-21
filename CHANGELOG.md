# @read-tadpole/extension

## 1.1.0

### Minor Changes

- Ported the upstream v1.52.1 work ReadTadpole can use. Everything upstream added
  for the hosted service (accounts, the Notebase, the side panel, analytics, the
  install-onboarding flow) stays out.

### Features

- Selection shortcuts: translation, speak and each AI action can be bound to a key
  combination and run on the current selection. The Shortcuts page lists every
  binding and refuses two commands on the same keys.
- Per-platform "translate on open" for video subtitles: YouTube, X and Netflix each
  have their own switch.
- YouTube Shorts teardown: the subtitle adapter now releases its timers, listeners
  and DOM when the player layout changes, so moving between Shorts, the watch page
  and embeds no longer leaves a dead session behind.
- LaTeXML text-box reflow: abstracts rendered inside fixed-size SVG cards (arXiv and
  similar) translate without clipping or overlapping the next section.
- Claude 5.5 and Fable 5.5 request options, and refreshed built-in site rules.

### Performance

- The content scripts are now one shared ES module behind a small loader, so React,
  zod, i18next and the rest are bundled once per page instead of once per script.

### Dependencies

- 27 packages upgraded, including AI SDK 7, Base UI 1.9, Vite 8.3, `lucide-react`,
  `motion`, `@read-frog/definitions` 0.10.1 and `@read-frog/layout-engine` 0.5.0.

### Housekeeping

- `READ_TADPOLE_*` storage keys, DOM attributes and CSS classes kept their rebrand,
  including the new LaTeXML and select-all markers.
- Dropped the AI-subtitle quota strings and the `source: "selection"` wording that
  still referred to the Notebase.

## 1.0.0

### Major Changes

- ReadTadpole（阅读蝌蚪）is a fresh start of the extension: readfrog lite 阅读蛙青春版. Everything user-facing — extension name, descriptions in every locale, UI strings, storage identifiers, DOM ids, CSS classes and attributes, theme variables, exported backup file names and the IndexedDB database — now uses the ReadTadpole name. Installs from before this release are not migrated: the extension starts with default settings and an empty cache.

### Features

- Bilingual page translation with translation-only mode, hover translation and per-site / per-language auto-translation.
- Subtitle translation for YouTube, Netflix and X, with downloadable source and translated subtitles and AI-generated captions for videos without a track.
- Selection toolbar with built-in and custom AI actions, plus input-box translation.
- Text-to-speech playback, custom translation styling and per-site rules.