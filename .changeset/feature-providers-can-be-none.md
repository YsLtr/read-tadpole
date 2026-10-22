---
"@read-tadpole/extension": patch
---

fix(options): assign every feature from Feature providers and let each be set to none

The provider editor repeated the feature-to-provider assignments inside every
provider row, so the same choice was offered in two places and the row's copy
could only ever turn an assignment on. That section is gone; the Feature
providers section is the only place a feature picks its provider.

Each row there can now be set to "None", which is the feature's off state. A
feature with its own switch keeps the provider it last ran on, so turning the
switch off sets it to None and turning it back on resumes that provider — or the
first one that can still run the feature, and the switch stays off with an
explanation when there is none. Page translation, which has no switch, simply
loses its provider. The config schema, deleting a provider and the popup's
provider summary all read the same state, and every runtime (page, selection,
input, subtitles) treats a feature that is off as nothing to run.

Nothing set to None counts as using its provider: a provider the reader has
switched every feature and action off can be disabled or deleted, instead of
being held by a feature that no longer runs on it.

The popup's translate button is disabled while page translation has no provider,
instead of accepting the click and doing nothing with it, and the AI smart
context section no longer repeats a way into the Feature providers section that
is already on the same page.
