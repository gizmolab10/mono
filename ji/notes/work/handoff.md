# Handoff

My resume point for ji: the one thing to do next, and the context you can't read off the code. What just finished is in the [work journal](work%20journal.md); everything still owed is in [code debt](code%20debt.md).

## Next — drop the "or click to go back" hint when the store is empty

First unchecked in [code debt](code%20debt.md) (under **in drop documents**): the drop box's hover hint reads "drop files & folders here, or click to go back". When the hierarchy holds no documents there's nowhere to go back to (the drop box *is* the only view), so the hint should read just "drop files & folders here".

### Proposal

In `operations/Drop_Documents.svelte`, the hint is a fixed string on the box (line 55: `use:tip={'drop files & folders here, or click to go back'}`). Make it depend on whether the hierarchy has documents — `$w_hierarchy.documents.length === 0 ? 'drop files & folders here' : 'drop files & folders here, or click to go back'`. The visible instruction line (line 68) is already just "drop files & folders here", so only the hover hint changes. One line; nothing else about the box moves.

**Steel-man the misread.** The item could mean the *visible* label — but that already says just "drop files & folders here" (line 68); only the hover hint carries the extra clause, so that's what changes.

**Success.** On an empty store the drop box's hover hint reads "drop files & folders here" with no "or click to go back"; once there's at least one document, the full hint returns.

## Context

**The app as it stands.** One always-on screen: a top bar (hamburger, the operations pill, the centered "Intersection" title, a help button), then a panel. The content region shows one view for the current operation (the switcher, Show_Operation): the documents list, the drop box, the document viewer, or the LLM ask box. The list carries a tag filter (a joined pill with an all/any toggle, both hiding when there aren't enough tags), a "search by name" box, and the family filter; below a rule, the table. The "ask" segment works only on the LLM store. The details region (preferences + data) collapses from the hamburger.

**The stores.** The document store is built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md). The LLM store is built too — a local store mirrored to a running AnythingLLM for search-and-ask.

**Method that holds.** One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.
