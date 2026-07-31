# Handoff

My resume point for ji: the one thing to do next, and the context you can't read off the code. What just finished is in the [work journal](work%20journal.md); everything still owed is in [code debt](code%20debt.md).

## Where the last session stopped

The work is done and written up. It ended on how I write, not on code.

1. **Code, all green.** Two new families (spreadsheet, book) with all eighteen table endings and four book endings; pdf and web page folded into text; every kind of file now tested with a real file of that kind. 112 tests pass, and svelte-check reports no errors and no warnings. Design and what's owed: [full family support](proposals/full%20family%20support.md).
2. **Nothing owed in the browser.** No visual confirmation is pending; the last change you looked at was the folds, which you passed.
3. **Written this session:** [sample files](proposals/sample%20files.md) (what a fair test file holds per kind, and where one might come from), ji's [lexicon](../guides/pre-flight/lexicon.md), and [sparse replies](sparse%20replies.md) — my replies had gone murky, and that file holds the causes, what got written, and what is still owed.

## Next — pick one

1. **Finish the writing standard** — three items in [sparse replies](sparse%20replies.md): one file for the whole standard, the "name it, don't rename it" rule, and merging two shorthands that ask the same thing. Also in there: the two layers of guides (mono and project), and how to make both arrive every turn.
2. **Or the next code item** — first unchecked in [code debt](code%20debt.md): the sample files become real documents. Not worth building until extracting words exists; the research for it is already written.

## Context

**The app as it stands.** One always-on screen: a top bar (hamburger, the operations pill, the centered "Intersection" title, a help button), then a panel. The content region shows one view for the current operation (the switcher, Show_Operation): the documents list, the drop box, the document viewer, or the LLM ask box. The list carries a tag filter (a joined pill with an all/any toggle, both hiding when there aren't enough tags), a "search by name" box, and the family filter; below a rule, the table. The "ask" segment works only on the LLM store. The details region (preferences + data) collapses from the hamburger.

**The stores.** The document store is built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md). The LLM store is built too — a local store mirrored to a running AnythingLLM for search-and-ask.

**The saved settings.** All of them read `ji_` then parts joined by underscores, and the words in the code match the saved ones. Old names are brought up to that spelling as the settings file is read — before any screen can read a setting — and anything the app no longer uses is removed. That order is the whole lesson: the first attempt ran it from the launch code instead, the screens had already read the new empty names, and my store's records were lost.

**Method that holds.** One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path. Anything that removes saved data is worse: while I work, the app relaunches on every file save, so a half-finished cleanup runs against real data. Write the rescue before the removal.
