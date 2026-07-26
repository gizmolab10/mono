# Handoff

My resume point for ji: the one thing to do next, and the context you can't read off the code. What just finished is in the [work journal](work%20journal.md); everything still owed is in [code debt](code%20debt.md).

## Next — a one-click way to point a new browser at the shared AI

First unchecked in [code debt](code%20debt.md): **a tiny standalone installer for the two settings** — today, wiring a new browser to the shared AI means hand-editing two stored settings (the pointer link and the share token), quoted just so. The goal is to make that a single, foolproof step, for mac and windows.

### Proposal — one click, not a native executable

**The catch, first.** A native program (a mac or windows executable) **cannot** reach into a website's browser storage — the browser walls each site's storage off from the rest of the computer. So an installed app can't write ji's two settings. Chasing that shape is a dead end; the workable forms all run *inside the browser, at ji's own address*:

- **A link ji understands (recommended).** ji already reads instructions off the web address on load (it clears settings when the address says so). Extend that: if the address carries the pointer link and the share token, ji saves them and then strips them back off the address (so the token isn't left showing). The "installer" becomes one link a newcomer opens once — no download, works the same on mac and windows. One care point: the token rides in a link, so treat it as private (open it yourself, don't post it).
- **A bookmarklet.** A saved bit that, run while ji is open, writes the two settings. Also cross-machine, but fiddlier to set up than clicking a link.

**Recommendation.** Do the link form. It reuses the address-reading ji already has, needs no executable at all, and is genuinely one step. Scope: ji reads the two values off the address, saves them (quoted correctly, so the hand-editing mistake can't happen), logs what it set, and clears them from the address. The mac/windows split in the debt item falls away — a link has no platform.

**Decide before building:** confirm the link form is acceptable (it puts the token in a URL you keep private) rather than an actual downloadable installer, which can't do the job.

## Context

**The app as it stands.** One always-on screen: a top bar (hamburger, the operations pill, the centered "Intersection" title, a help button), then a panel. The content region shows one view for the current operation (the switcher, Show_Operation): the documents list, the drop box, the document viewer, or the LLM ask box. The list carries a tag filter (a joined pill with an all/any toggle, both hiding when there aren't enough tags), a "search by name" box, and the family filter; below a rule, the table. The "ask" segment works only on the LLM store. The details region (preferences + data) collapses from the hamburger.

**The stores.** The document store is built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md). The LLM store is built too — a local store mirrored to a running AnythingLLM for search-and-ask.

**Method that holds.** One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.
