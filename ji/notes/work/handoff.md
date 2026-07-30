# Handoff

My resume point for ji: the one thing to do next, and the context you can't read off the code. What just finished is in the [work journal](work%20journal.md); everything still owed is in [code debt](code%20debt.md).

## Next — the diagnostic log stays home

First unchecked in [code debt](code%20debt.md): **debug.log** — it should do nothing away from this machine, and the cruft it prints wants listing and moving somewhere (the work journal, or its own file).

**Where it stands.** Every logged line is sent to a small server on this mac at a fixed address (`common/Debug.ts`, the address on line 11). Off this machine that address doesn't answer, so each line becomes a request that fails — swallowed quietly, so nothing shows, but every logged line still tries. The app logs freely (the list, the filters, the folds, the settings sweep, the tooltips), so on a phone or another computer that's a steady patter of failing requests.

### Proposal

Two small pieces, neither depending on the other:

**Say nothing off this machine.** One check, worked out once when the file is read: is the page being served from this machine? If not, logging returns at once — no request built, no failure. This also settles the "not accessible" question in the item: with the check in place, a browser elsewhere sends nothing, so there is nothing to reach.

**Then read what's left.** With the noise gone, walk the logged lines and sort them: the ones that prove a decision (the counts and the values behind a filter or a threshold) stay; the ones that only say "this ran" go. What goes gets listed in one place rather than deleted silently, so a line worth keeping can be brought back — the work journal is the wrong home for it (that's finished work); a short file beside the guides fits better.

**Steel-man the misread.** "Should do nothing when not launched on localhost" could mean off *and* on — silence everywhere unless a switch is thrown — but the item says "when not launched on localhost", so on this machine it keeps working as it does.

**Success.** On this machine the log fills as it does now. Served anywhere else, nothing is sent (nothing in the browser's network view, no failures), and the app behaves the same.

## Context

**The app as it stands.** One always-on screen: a top bar (hamburger, the operations pill, the centered "Intersection" title, a help button), then a panel. The content region shows one view for the current operation (the switcher, Show_Operation): the documents list, the drop box, the document viewer, or the LLM ask box. The list carries a tag filter (a joined pill with an all/any toggle, both hiding when there aren't enough tags), a "search by name" box, and the family filter; below a rule, the table. The "ask" segment works only on the LLM store. The details region (preferences + data) collapses from the hamburger.

**The stores.** The document store is built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md). The LLM store is built too — a local store mirrored to a running AnythingLLM for search-and-ask.

**The saved settings.** All of them read `ji_` then parts joined by underscores, and the words in the code match the saved ones. Old names are brought up to that spelling as the settings file is read — before any screen can read a setting — and anything the app no longer uses is removed. That order is the whole lesson: the first attempt ran it from the launch code instead, the screens had already read the new empty names, and my store's records were lost.

**Method that holds.** One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path. Anything that removes saved data is worse: while I work, the app relaunches on every file save, so a half-finished cleanup runs against real data. Write the rescue before the removal.
