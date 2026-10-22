---
"@read-tadpole/extension": patch
---

fix(options): assign every feature from Feature providers and let each be set to none

The provider editor repeated the feature-to-provider assignments inside every
provider row, so the same choice was offered in two places and the row's copy
could only ever turn an assignment on. That section is gone; the Feature
providers section is the only place a feature picks its provider.

Each row there can now be set to "None", which switches that feature off. For the
built-in features, None clears the provider: an empty provider id is the stored
"off" state, the config schema accepts it, importing a config leaves it alone,
and the page, selection, input and subtitle flows treat it as nothing to run
rather than as a broken reference. Custom actions keep their last provider and
are disabled instead, since an action cannot run without one.
