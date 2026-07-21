# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

Finished work moves to [work journal](work%20journal.md); what's left is in [code debt](code%20debt.md).

## Proposal — next: let the browser pin the folders (the div rewrite)

The pinned-folders feature works, with one stubborn flaw: as the first folders pin when you leave the very top, the top row flicks 1px — up, then back. It survived every fix (exact placement, one-frame flush, per-event updates) because the cause isn't placement or our timing — **it's the browser's.** Scrolling runs on the compositor and paints first; our scroll handler runs afterwards, so any position we compute in JavaScript lands one frame behind the scroll. A JavaScript-placed pinned row can't stay glued to a native scroll — it will always trail it by a frame at a crossing.

Today the pinned folders are exactly that: a copy of each folder row, absolutely placed by JavaScript on every scroll ([Documents.svelte](../../ji/src/lib/svelte/main/Documents.svelte) — `update_pins`, the `sticky-parents` overlay). The list itself is one `<table>`, and a table can't do this natively: a sticky row in a table stays stuck until the whole table scrolls past, not until its own folder's contents end.

**The fix is to stop placing anything ourselves and let the browser stick the rows** — CSS `position: sticky`, which the compositor keeps glued to the scroll with no JavaScript and no lag, so the whole 1px class of flaws is gone by construction. That means rebuilding the documents list as a **nested tree of divs** instead of one table:

- Each folder becomes a block that holds its own children (its subtree), with the folder's row as a `position: sticky` header inside it. When that block's bottom scrolls past, the browser slides the folder out on its own — the "give way" we've been faking. Nesting the blocks stacks the sticky folders for free.
- Columns (format, name, tags) move from table layout to a CSS grid so the three line up as they do now.
- The walk already carries depth and the folder chain, so building the nested tree from `shown` is a small step; the per-row cells (triangle, name, tags, buttons) stay as they are (the shared `file_cells` snippet).

Scope and cost, honestly: this touches the whole documents-list rendering and its styling (hover pill, the "also here" dim, the ellipsis, the tag picker, the per-row buttons, the saved scroll place which reads rows from the DOM). It is a real rewrite of one screen, and will want a pass of visual touch-ups after. But it ends the fight for good and drops all the scroll-time JavaScript (the pin math, the flush, the measuring).

One thing to settle: **the sticky stack needs a fixed row height** (so each folder's stick point sits exactly below the one above). Confirm rows can be a fixed height — they already look uniform.

After this the tree returns: **show tags as a tree** (single-parent first — a tag walk reusing the folder triangle and shut-set), then **tag ancestries** (the multi-parent case, ws's "one identity, several places"). The [records-as-Persistables plan](persistables.md) stays paused; it's independent of the visible tree.

## Method that holds

One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.

## Later (from code debt)

Porting ws's hierarchy, moving the erase button to the far right as a trashcan, raising the documents view to the top, the new tags control, remote support (supabase, person id, authorization), a stipulations file, viewing rich text, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
