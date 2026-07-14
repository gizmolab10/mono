# Handoff

**Status:** active. One always-on screen: a full-width accent controls row (hamburger, "Add a new document / tag", help), then a live filter (an all/any toggle + tag chips + a "filter by name" box), a rule, and the documents table; "add new document" swaps the table for the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: a column-header row above the documents table

A header row — **format · file name · tags · edit tags** — sits just above the rule, each label centered over its column, styled like the data panel's "more / less" (a label floating on a broken rule).

1. **The look.** Reuse D_Data's separator treatment: a full-width thin rule with the labels floating over it, their background masking the line so they read as text sitting on a broken rule.
2. **Column alignment.** The labels must center over the table's four columns (type, name, tags, edit). Simplest: make the header a matching table (or a grid with the same column template) so each label lands over its column; the current table uses a fixed `--width` on the type column and auto on the rest, so mirror that.
3. **Where.** Between the filter-text box and the rule (the `<hr>` becomes the rule the labels float on, or the header carries its own).
4. **Open question for Jonathan:** should the headers also sort the table when clicked, or are they labels only for now?

## Later (from code debt)

Firebase support (person id + authorization), the diagnostic-log port, unused-preference cleanup, and the deferred store work (disk-file blobs, firestore) — tracked in [code debt](code%20debt.md) and [db handoff](db%20handoff.md).
