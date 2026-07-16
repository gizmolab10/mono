# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: drop a folder

Dropping loose files already works — the drop reads the batch and saves each ([Add_Document.svelte](../../src/lib/svelte/actions/Add_Document.svelte)). A folder is dropped as a directory, which the current read ignores, so nothing is saved. The store already has everything a folder needs: a document per file, a stand-in document for the folder, and a parent→child link between them ([DB_Common.ts](../../src/lib/ts/database/DB_Common.ts) has `add_document`, `add_predicate`, `add_relationship`; the record shapes are in [DB_Records.ts](../../src/lib/ts/database/DB_Records.ts)).

**What happens on a folder drop:**

1. Make a stand-in document for the folder itself — a document that holds no bytes and opens to nothing.
2. For each file inside, save it the way a loose file is saved now, and link it under the folder's document as a child.
3. If a child is itself a folder, do the same for it — its own stand-in document, linked under its parent, and recurse all the way down.

**Two things the store doesn't have yet, both small:**

- **A "folder" kind.** Every saved document is marked as one of the known file types, and none of them means "this is a folder." Without a folder mark, the stand-in reads as an unknown file and the table can't tell it apart. Add one folder kind to the list of document types.
- **One shared "contains" link-meaning.** A link needs a named meaning, and today asking for one always makes a brand-new meaning. Dropping ten folders would make ten identical "contains" meanings. Add a find-or-make-one step so every folder link reuses the single "contains" meaning.

**Reading the dropped folder.** The current drop reads a flat list of files and can't see into a folder. Folders come through a different door the browser offers — one that hands back each entry and says whether it is a file or a folder, so the walk can step into subfolders. The drop has to read from that door instead.

**Two questions for you before I start:**

1. **Tags.** The drop tags each saved file with whatever tags are chosen at the time. On a folder drop, do the files deep inside get those tags too? Does the folder's own stand-in document get them?
2. **Showing folders.** The stand-in folder document has no file type and no bytes. In the table, should it show as its own row (with a folder mark where the format would be), or stay hidden — present in the store, links intact, but not listed?

Method that worked, and should hold: one at a time, prove it before the next. Every silent breakage this session came from a path I changed without re-running the proof — the word-swapper sat dead for hours that way, and the new ending-carry mark quietly killed every swap until the check caught it.

## Later (from code debt)

Remote support (supabase, person id, authorization), the front page, a stipulations file, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
