# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

Finished work moves to [work journal](work%20journal.md); what's left is in [code debt](code%20debt.md).

## Proposal — next: open and close a folder

The hierarchy's foundation is in — the tree owns the records, find-or-create is the rule, dedup is store-wide, and the name and id lookups are instant (see the [work journal](work%20journal.md) and [hierarchy spec](hierarchy%20spec.md) §6). What's left is the visible tree, smallest-first, and the first piece is **open and close a folder**.

A folder row gets a triangle; closed, its whole subtree drops out of the walk. It needs one saved set of "closed ids" — the id of the link that leads into each closed place — and the walk skips a closed folder's children. No ancestry yet: a document has one parent, so a folder is simply open or closed. The closed set survives a reload, the way the details region's open sections already do.

Two things to settle:

- **The triangle's spot and look** — leading each folder row, pointing down when open, right when closed; drawn or a plain glyph?
- **Where the closed set is saved** — a single stored list of ids (matches the spec: one set covers both trees later). Confirm it rides in preferences like the other saved flags.

After this: show tags as a tree, then tag ancestries (the multi-parent case) — the two remaining spec pieces. The [records-as-Persistables plan](persistables.md) stays paused; it's independent of the visible tree.

## Method that holds

One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.

## Later (from code debt)

Porting ws's hierarchy, moving the erase button to the far right as a trashcan, raising the documents view to the top, the new tags control, remote support (supabase, person id, authorization), a stipulations file, viewing rich text, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
