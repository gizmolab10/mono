# Handoff

My resume point for ji: the one thing to do next, and the context you can't read off the code. What just finished is in the [work journal](work%20journal.md); everything still owed is in [code debt](code%20debt.md).

## Next — soften the chat question pill's color

First unchecked in [code debt](code%20debt.md) (under **chats**): the chat question header sits on full `--accent`; make it a softer `--mild-accent`, a color halfway between `--accent` and `--bg`.

### Proposal

Add a `--mild-accent` token — a mix of `--accent` and `--bg` (`color-mix(in srgb, var(--accent) 30%, var(--bg))`, tuned by eye) — beside the other color tokens, and use it for the question header's background in `operations/Chat.svelte` (the `.question` rule). Keep the header's text readable against the lighter fill (its text is currently `--text-on-accent`, chosen for the strong accent — on a mild fill `--text` may read better; pick by eye). One place changes; the collapsed/expanded behavior is untouched.

**Open question for Jonathan:** exact midpoint, or lean nearer the accent? I'd set the mix and adjust to taste.

**Success.** The question pills read softer, halfway to the page color, with the text still legible; nothing else about the chat changes.

## Context

**The app as it stands.** One always-on screen: a top bar (hamburger, the operations pill, the centered "Intersection" title, a help button), then a panel. The content region shows one view for the current operation (the switcher, Show_Operation): the documents list, the drop box, the document viewer, or the LLM ask box. The list carries a tag filter (a joined pill with an all/any toggle, both hiding when there aren't enough tags), a "search by name" box, and the family filter; below a rule, the table. The "ask" segment works only on the LLM store. The details region (preferences + data) collapses from the hamburger.

**The stores.** The document store is built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md). The LLM store is built too — a local store mirrored to a running AnythingLLM for search-and-ask.

**Method that holds.** One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.
