# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

Finished work moves to [work journal](work%20journal.md); what's left is in [code debt](code%20debt.md).

## Proposal — next: pin the viewer's step triangles to the top

First unchecked in [code debt](code%20debt.md): **view document → pin the fat step triangles to the top.** In the open-document viewer, the previous/next fat triangles should stay put at the top of the view while the document itself scrolls under them, instead of scrolling away with the content. Likely a small change in [View_Document.svelte](../../ji/src/lib/svelte/actions/View_Document.svelte): give the triangle cluster a fixed spot at the top of the viewer (sticky or absolute within the scroll area), leaving the content to scroll beneath. Confirm by eye that they hold while a long document scrolls and still step and auto-repeat.

**Recently finished** (details in [work journal](work%20journal.md)): phase 1 — each document's *viewable* and *status* worked out and stored; the sticky parent-folders feature removed; the "Intersection" title; the dedup question ordered by date; the drop-progress pie; non-viewable kinds ignored for now.

**Phase 2 (later) — extraction pass:** the quick/heavy words-pull that fills `text` and flips a document's status to ready.

## Method that holds

One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.

## Later (from code debt)

Porting ws's hierarchy, moving the erase button to the far right as a trashcan, raising the documents view to the top, the new tags control, remote support (supabase, person id, authorization), a stipulations file, viewing rich text, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
