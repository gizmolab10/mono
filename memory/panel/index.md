---
description: panel — ov's three regions emptied: a controls row, a details column and a content box, drawn on core with nothing in them.
---
# panel

Brought up 7 September 2026 as an empty version of ov's three regions, on core.

**Current state:** four components carry the whole app. `App.svelte` holds the `.app` div and the width arithmetic ov's holds, feeds the cursor to core's hits manager and pushes core's default colors onto the page. `Controls.svelte` is a row holding core's hamburger and the project's name centered on it. `Details.svelte` and `Operation.svelte` are each a region of a given width with nothing inside. `Core.ts` is the bridge to core. `Customizations.ts` holds one switch, the name. Nothing is remembered between visits, and nothing is logged. Registered in ports.json at 5186, mono's workspaces, servers.sh and the hub under F. Not in the dispatcher's COLLECTIONS or ov's T_Bundle. panel imports core, and nothing of panel moves into core. mu and mj each hold their own version of its four files, taken 7 September 2026.

## Truths

- [decisions.md](truth/decisions.md) — the pacs weighing panel's coming choices.
