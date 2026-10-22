---
"@read-tadpole/extension": patch
---

feat(subtitles): restyle the default video subtitles and default the page translation style to `dashedLine`

A fresh install now renders subtitles bilingually with the translation below the
original: a lighter box (35% background), the original in Noto Sans gold
(`#e0ab25`, weight 400) and the translation in Roboto white (weight 500). The
style editor's reset buttons now restore these same per-section values instead
of one shared text style.

Page translation now defaults to the `dashedLine` translation style rather than
`textColor`.
