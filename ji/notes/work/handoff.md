# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: say something while a drop is saving

The document-type redesign is done. The one drop-file part left: under the "drop documents and folders here" line, show a short status while a drop is being saved, so a big folder doesn't look frozen.

Plan:

1. The saving already walks files one at a time and already counts how many sit in each folder, so it can report progress — how many saved out of how many seen — without new bookkeeping.
2. Give the drop box a small piece of shared state to show: nothing when idle, a count while working, cleared shortly after it finishes.
3. Feed it from the saving path, which today only writes to the log.

Two calls to confirm before building: whether the line shows a running count ("saving 12 of 40") or just "saving…", and whether it also reports what was skipped — unrecognized files are passed over silently today, which is worth surfacing right here.

Method that worked, and should hold: one at a time, prove it before the next. Every silent breakage came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes.

## Later (from code debt)

Remote support (supabase, person id, authorization), the front page, a stipulations file, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
