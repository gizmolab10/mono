# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: drop a folder, not just loose files

Dropping several loose files at once already works — the drop reads the whole batch and saves each one ([Add_Document.svelte](../../src/lib/svelte/actions/Add_Document.svelte)). The real gap is folders: a dropped folder arrives as a directory, not a file, so the current read finds nothing to save and the folder is silently ignored.

The fix is to walk a dropped folder. When a drop carries directory entries, step into each one, and for every file found anywhere inside, save it the same way a loose file is saved now. Two open questions for you before I start:

1. **How deep** — only the folder's own files, or every file in every folder within it?
2. **The names** — keep just each file's own name, or carry its folder path in front so two files named the same don't read as one?

Method that worked, and should hold: one at a time, prove it before the next. Every silent breakage this session came from a path I changed without re-running the proof — the word-swapper sat dead for hours that way, and the new ending-carry mark quietly killed every swap until the check caught it.

## Later (from code debt)

Remote support (supabase, person id, authorization), the front page, a stipulations file, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
