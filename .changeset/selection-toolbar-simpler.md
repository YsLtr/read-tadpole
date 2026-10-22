---
"@read-tadpole/extension": patch
---

refactor(selection-toolbar): drop the "more" menu, the close button and the toolbar-only site disable

The toolbar's three-dots menu is gone: every item that is switched on is now a
button on the toolbar itself, which removes the pinned/unpinned state and the
drag-to-reorder copy of the item list along with it. Custom actions are still
ordered on their own page.

The close button is gone as well, and with it the choice it offered. A site is
either on or off for the whole extension, which is what site control and the
Extension activation section already do — the toolbar no longer keeps a second,
toolbar-only list of disabled sites, nor turns off just itself. Clicking away
from the selection or clearing it is how the toolbar goes away.
