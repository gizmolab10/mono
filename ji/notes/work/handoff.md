# Handoff

My resume point for ji: the one thing to do next, and the context you can't read off the code. What just finished is in the [work journal](work%20journal.md); everything still owed is in [code debt](code%20debt.md).

## Next — a help page, modeled on di's user guide

First unchecked in [code debt](code%20debt.md): **write a help page**. The help button (top-right of the controls row) does nothing yet — its click handler in `main/Controls.svelte` only logs. Build it like di's user guide (`di/src/lib/svelte/main/UserGuide.svelte`), trimmed to ji's needs.

### Proposal — an in-app help overlay

**Shape (recommended).** The help button opens a full-screen overlay over the app (a new `main/Help.svelte`, placed by the frame like the build-notes popup already is):

- **Pages are markdown files** in a new `ji/src/manual/` folder, mimicking di (di keeps them at `di/src/manual/`): `manual/index.md` (the welcome), further pages flat or in a subfolder like di's `reference-guide/`, and a `manual/images/` folder for pictures later. The overlay lives at `ji/src/lib/svelte/main/Help.svelte` and pulls the pages in at build with a glob relative to itself — `../../../manual/**/*.md` — exactly as di's user guide does. ji already renders markdown (markdown-it is a dependency and the build-notes popup reads a markdown file), so this reuses what's here. Each page's title is its first heading; a hand-set order lists them, anything unlisted falls to the end (so a new file still shows).
- **A hamburger-toggled sidebar** lists the pages; clicking one shows it; links from one page to another switch in place; a close cross and the Escape key shut the overlay.
- **Remember** which page was open and whether the sidebar is showing (two saved flags, like di).
- **Seed pages:** `index` — "hello, this is just the beginning" (a short welcome); `what's broken` — the current rough edges.

**Where help lives — decided: in-app overlay.** One build, works offline, matches di, no new deploy; the address stays intersection.lol. (A separate site at `help.intersection.lol` was weighed and set aside — it's another thing to deploy and keep in step; the same markdown folder could feed it later if wanted.)

**Kept out (add later if wanted):** search, images, versioned pages.

**Success.** Clicking help opens the overlay on the welcome page; the sidebar switches pages; Escape or the close cross returns to the app; both seed pages read correctly. Proven by a log line on open/close and by reading the two pages.

The newcomer-setup need is already handled by the AI store's password screen (the `init` operation), so the one-click-installer idea stays retired.

## Context

**The app as it stands.** One always-on screen: a top bar (hamburger, the operations pill, the centered "Intersection" title, a help button), then a panel. The content region shows one view for the current operation (the switcher, Show_Operation): the documents list, the drop box, the document viewer, or the LLM ask box. The list carries a tag filter (a joined pill with an all/any toggle, both hiding when there aren't enough tags), a "search by name" box, and the family filter; below a rule, the table. The "ask" segment works only on the LLM store. The details region (preferences + data) collapses from the hamburger.

**The stores.** The document store is built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md). The LLM store is built too — a local store mirrored to a running AnythingLLM for search-and-ask.

**Method that holds.** One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.
