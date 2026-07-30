# Handoff

My resume point for ji: the one thing to do next, and the context you can't read off the code. What just finished is in the [work journal](work%20journal.md); everything still owed is in [code debt](code%20debt.md).

## Next — the log gives up before it tries, away from this machine

Still open under **debug.log** in [code debt](code%20debt.md): the logging call should return at once when the page isn't being served from this machine. The other two parts of that item are done — the never-needed lines are out, and the maybe-needed ones are written but silent.

**Where it stands.** Every logged line is sent to a small server on this mac at a fixed address (`common/Debug.ts`, the address on line 17). The determination asked for in the item: nothing is written from elsewhere. On another machine that address points at *that* machine, which has no log server, so the request fails; served from intersection.lol on this mac, the page is https and a plain http request is blocked before it leaves the browser. Either way the failure is swallowed, so nothing shows — but every logged line still tries, and around ninety lines remain.

### Proposal

One check, worked out once when the file is read: is the page being served from this machine (the address bar says localhost, or the address matches the log server's own)? If not, the logging call returns before building anything. The silent companion already returns at once, so it needs nothing.

**Steel-man the misread.** It could mean the log server should refuse outside requests instead — but the item says the logging call returns early, so the check belongs in the app, not the server.

**Success.** On this machine the log fills as it does now. Served anywhere else, nothing is sent — nothing in the browser's network view, no failed requests — and the app behaves exactly the same.

## Context

**The app as it stands.** One always-on screen: a top bar (hamburger, the operations pill, the centered "Intersection" title, a help button), then a panel. The content region shows one view for the current operation (the switcher, Show_Operation): the documents list, the drop box, the document viewer, or the LLM ask box. The list carries a tag filter (a joined pill with an all/any toggle, both hiding when there aren't enough tags), a "search by name" box, and the family filter; below a rule, the table. The "ask" segment works only on the LLM store. The details region (preferences + data) collapses from the hamburger.

**The stores.** The document store is built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md). The LLM store is built too — a local store mirrored to a running AnythingLLM for search-and-ask.

**The saved settings.** All of them read `ji_` then parts joined by underscores, and the words in the code match the saved ones. Old names are brought up to that spelling as the settings file is read — before any screen can read a setting — and anything the app no longer uses is removed. That order is the whole lesson: the first attempt ran it from the launch code instead, the screens had already read the new empty names, and my store's records were lost.

**Method that holds.** One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path. Anything that removes saved data is worse: while I work, the app relaunches on every file save, so a half-finished cleanup runs against real data. Write the rescue before the removal.
