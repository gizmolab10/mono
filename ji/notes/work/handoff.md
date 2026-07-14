# Handoff

**Status:** active. One always-on screen: a full-width accent controls row (hamburger, "Add a new document / tag", help), then tag chips (a filter — all picked tags must match), a rule, and the documents table; "add new document" swaps the table for the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: search.ts (one source of truth for the filter)

Right now the filter state is scattered — the picked tags live as local state inside Documents, and the filter-text box isn't built yet. This gathers both into one small module so every view reads the same thing.

1. **The module** (`ts/managers/Search.ts`) — two stores: the picked tag ids (a set) and the filter text (a string). Plus a derived "matches" that, given the store's documents, keeps only those carrying every picked tag **and** whose name contains the text.
2. **Documents reads it** — the top chips bind the tag set; the table iterates the derived matches instead of its own local filter. Removes the ad-hoc filter now living in Documents.
3. **Sets up the next item** — the filter-text input (below the tags, live-as-you-type) just binds the text store; results update for free.
4. **Open question for Jonathan:** name match — plain substring (case-insensitive) to start, or something fancier later?

## Later (from code debt)

The filter-text input + live results, firebase support, the diagnostic-log port, and the deferred store work (disk-file blobs, firestore) — tracked in [code debt](code%20debt.md) and [db handoff](db%20handoff.md).
