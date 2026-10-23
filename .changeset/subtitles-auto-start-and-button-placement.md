---
"@read-tadpole/extension": patch
---

fix(subtitles): keep translated cues across a reload, and stop missing the next video's auto-start

Translated cues now survive a reload of the same tab for five minutes, keyed by the
video and by everything that decides what a translation reads like (provider, model,
language pair, segmentation, prompt). A reload inside that window shows what was
already translated instead of asking the provider again, and the look-ahead no longer
re-requests those cues. The store is the tab's own, so nothing has to be swept up
afterwards, and a cue whose text or timing changed is dropped rather than shown.

Translate-on-open ran once per video, from the player's own navigation events. Two
ways into a video slipped past those: a pre-roll, which answers caption queries with
the ad's empty track and made the single attempt report "no subtitles" for a video
that has them, and entries the events do not announce (a history entry, back/forward,
a layout swap). Auto-start now waits for an ad to give the video back, and the video id
is also read on a timer so a change the events missed is still noticed.

The translate button went in front of the controls bar's first child, which on YouTube
is where other extensions put their buttons, so it landed wedged between SponsorBlock's
buttons. It now goes in front of the player's own controls, i.e. right after those.
