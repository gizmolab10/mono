# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: a click on the drop box sets the operation to null

A click on the empty background already sets the operation to null, which returns the content area to the document list. But clicks landing inside the drop box or the new-tag field are deliberately kept, so the view doesn't dismiss mid-interaction ([Documents.svelte](../../src/lib/svelte/main/Documents.svelte) `background_click` skips a click that lands inside `.drop, .add-tag`). This item wants a click on the drop box to set the operation to null too.

The change is one line: stop keeping drop-box clicks — drop `.drop` from that guard, so a click on the drop box sets the operation to null the same way a background click does, while the new-tag field stays kept. Dragging a file still works, since a drop fires its own drop handler, not a click.

Method that worked, and should hold: one at a time, prove it before the next. Every silent breakage this session came from a path I changed without re-running the proof — the word-swapper sat dead for hours that way, and the new ending-carry mark quietly killed every swap until the check caught it.

## Later (from code debt)

Remote support (supabase, person id, authorization), the front page, a stipulations file, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
