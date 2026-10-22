---
"@read-tadpole/extension": patch
---

chore(build): run video subtitles from the shared content runtime instead of their own bundle

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
