# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

Finished work moves to [work journal](work%20journal.md); what's left is in [code debt](code%20debt.md).

## Proposal — next: show tags as a tree

Done just now (see the [work journal](work%20journal.md)): a fat triangle leads each folder that holds something — down when open, right when shut — and shutting one drops its contents from the table; the shut folders are saved across reloads. That closes the folder side of the visible tree. Next is the tag side: **show tags as a tree**.

Today tags are a flat row of chips (the filter, and each document's tag list). The data already lets a tag sit under another tag — the relationship record carries a "these are tags, not documents" flag, and its parent and child are tag ids ([hierarchy spec](hierarchy%20spec.md) §4). What's missing is the read that draws tags nested, and — the piece the spec flags as still open — **the act that nests one tag under another** (how a tag comes to have a parent tag is TBD).

Start single-parent (a tag has at most one parent tag), matching the folder tree just built: a tag walk by depth, the same open/close triangle, reusing the shut-set machinery. Multi-parent tags (a tag under two parents at once, the ancestry case) come after, as their own piece — that's the one place ji needs ws's full "one identity, several places" idea.

One thing to settle first: **how a tag gets a parent** — the spec leaves this open, and the tree can't be made without it. Options to weigh when we start: drag a chip onto another, a "nest under…" pick on the tag, or something simpler.

After this: tag ancestries (the multi-parent case) — the last [hierarchy spec](hierarchy%20spec.md) piece. The [records-as-Persistables plan](persistables.md) stays paused; it's independent of the visible tree.

## Method that holds

One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.

## Later (from code debt)

Porting ws's hierarchy, moving the erase button to the far right as a trashcan, raising the documents view to the top, the new tags control, remote support (supabase, person id, authorization), a stipulations file, viewing rich text, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
