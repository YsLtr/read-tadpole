---
"@read-tadpole/extension": minor
---

feat: port the upstream v1.52.1 fixes, optimizations and dependency upgrades onto ReadTadpole

Merged the upstream work that ReadTadpole can use, and left out everything it no
longer ships (hosted AI, accounts, the Notebase, the side panel, analytics, the
install-onboarding flow):

- One shared content runtime behind a small loader script: React, zod and
  i18next are bundled once per page instead of once per content script, which
  cuts what every page has to parse and keep in memory.
- Selection shortcuts: the toolbar's actions and speak can now be triggered from
  the keyboard (translation already was), with the options page listing every
  binding and refusing two commands on one key.
- Per-platform "translate on open" for video subtitles, so YouTube, X and
  Netflix can each start on their own.
- YouTube Shorts: the subtitle adapter is torn down when the layout changes, so
  leaving Shorts for a watch page (or the reverse) no longer leaves the old
  session's timers, listeners and DOM behind.
- LaTeXML text-box reflow for arXiv-style abstracts, so fixed-size SVG cards
  translate without clipping or overlapping the next section.
- Claude 5.5 / Fable 5.5 request options, plus the newer built-in site rules and
  provider model list.
- Dependency upgrades across 27 packages (AI SDK 7, Base UI 1.9, Vite 8.3,
  lucide-react, motion, and the shared `@read-frog/*` definitions and layout
  engine packages).
