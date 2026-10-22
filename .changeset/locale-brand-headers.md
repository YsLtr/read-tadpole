---
"@read-tadpole/extension": patch
---

fix(i18n): sync every locale to the zh-CN header and undo the pasted brand strings

`extName` is now the bare brand and `extDescription` the local-language form of
阅读蛙青春版 (English: `Read Frog Lite`), with no feature blurb appended — matching
zh-CN. Non-Chinese locales no longer paste the Chinese tagline into their
description.

Also filled the keys the non-Chinese locales were missing, so they stop falling
back to English: the selection toolbar's custom-action badges and template picker
(es, ja, ko, ru, tr, vi), the "provider in use" warning (ja, ko, ru, tr, vi), and
the whole popup providers block plus the custom-CSS example comment (es, ja, ko,
ru, tr, vi). The Japanese locale also still carried three dead `popup.hub`,
`popup.discord` and `popup.blog` keys from the old branding; those are removed.
