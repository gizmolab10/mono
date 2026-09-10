---
description: panel — the page a host draws: a controls row, a details column, an operation view and a status line, drawn on core, with what the host hands over inside them.
---
# panel

Brought up 7 September 2026 as an empty version of ov's three regions, on core. Since 10 September 2026 a library: the page as a component a host draws.

**Current state:** `Panel.svelte` is the page. It holds the `.app` div and the width arithmetic ov's App.svelte holds, and draws `Controls.svelte`, a row with core's hamburger, the project's name centered on it and whatever the host hands over at its right end, `Details.svelte` and `Operation.svelte`, each a region of a given width holding what the host hands over, and a status line below them while the host hands words for it. The host hands the name, whether the column is shown and the press that toggles it. `App.svelte` is the smallest host of it: it feeds the cursor to core's hits manager, pushes core's default colors onto the page and hands nothing to any region. `Core.ts` is the bridge to core. `Customizations.ts` holds one switch, the name. Nothing is remembered between visits, and nothing is logged. Panel.svelte takes a resize at most once per 20 ms, and hands each region its size: the details snippet its width, the operation snippet its width and height. gallery, mj and mu import Panel.svelte, each through its own `Panel.ts`, so lv's page, mj's and mu's are panel's. Nobody holds a version of panel's files but panel. Registered in ports.json at 5186, mono's workspaces, servers.sh and the hub under F. Not in the dispatcher's COLLECTIONS or ov's T_Bundle. panel imports core, and nothing of panel moves into core. Check clean at 413 files.

## Truths

- [decisions.md](truth/decisions.md) — the pacs weighing panel's coming choices.
