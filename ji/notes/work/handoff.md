# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

Finished work moves to [work journal](work%20journal.md); what's left is in [code debt](code%20debt.md).

## Proposal — next: the table remembers where it was scrolled

Done just now (see the [work journal](work%20journal.md)): every accent-filled button now carries readable text. Next is the first open piece under the documents table: **the table keeps its scroll place.**

Only the rows scroll — they sit in their own scroll area under the pinned filter, search, and header ([Documents.svelte](../../ji/src/lib/svelte/main/Documents.svelte) `.table-scroll`). Open a file and come back, or reload, and the table jumps to the top; a person who was deep in a long list loses their place. The fix: note how far down the rows are scrolled and put them back there.

The build:

- **Note the scroll place as it changes** — the rows' scroll distance from the top, saved like the other remembered flags (the details sections, the shut folders).
- **Put it back when the table returns** — after opening a file and closing it, and after a reload, the rows start where they were left.

Two things to settle:

- **Does it survive a reload, or only within a session?** Saving it across reloads matches how the folds and the open/closed sections already persist — lean there. A session-only place is simpler but forgets on reload.
- **What happens when the list changes underneath it?** If rows were added, removed, or filtered while away, the old distance may point somewhere else. Simplest is to put back the same distance and let it settle where it lands; pinning to a particular row is more work for a rare case.

After this the tree returns: **show tags as a tree** (single-parent first — a tag walk reusing the folder triangle and shut-set), then **tag ancestries** (the multi-parent case, ws's "one identity, several places"). The [records-as-Persistables plan](persistables.md) stays paused; it's independent of the visible tree.

## Method that holds

One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.

## Later (from code debt)

Porting ws's hierarchy, moving the erase button to the far right as a trashcan, raising the documents view to the top, the new tags control, remote support (supabase, person id, authorization), a stipulations file, viewing rich text, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
