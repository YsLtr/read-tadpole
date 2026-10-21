---
"@read-tadpole/extension": minor
---

Refresh the brand artwork and drop the retired plan-badge styles.

- The extension icons, the in-app logo and the two bundled UI mockups now use the
  tadpole mark (round head, tapering tail) drawn in deep teal on a cream tile,
  with brand gold kept for the active toolbar state.
- The default translation style (`textColor`, applied on a fresh install) now
  uses `--read-tadpole-brand` instead of a hard-coded green literal.
- Removed `glass-badge.css` and the `glass` badge variant: both existed only for
  the subscription plan pills, which no longer ship.
