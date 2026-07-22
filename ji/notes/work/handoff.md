# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

Finished work moves to [work journal](work%20journal.md); what's left is in [code debt](code%20debt.md).

## Phase 1 — assign each document's "viewable" and "status" — DONE 2026-07-22

Groundwork for feeding documents to a model (AnythingLLM) later. Every document carries two **independent** facts, and phase 1 is only to set them right — no extraction yet. **Built and green** (svelte-check clean, 31 tests): the two facts are derived by `Document.is_viewable` / `Document.status_of` (plus a `QUICK_KINDS` set), set on the add/replace paths, folders forced to not-viewable, both recomputed on load (`derive_document_flags`), and the rows/eye/stepper now read the stored `viewable`.

- **viewable** — can the user open it and look at it in the app. Nothing to do with text.
- **status** — how ready its words are for the model: **ready** (words in hand), **quick** (a quick words-pull still owed), **heavy** (a heavy pull still owed — recognizing writing in a picture, transcribing speech). Nothing to do with viewing.

They cross freely: a picture is viewable **and** heavy; a pdf is viewable **and** quick; a Word file (were it re-accepted) is not-viewable **and** quick.

**The rules (both are pure functions of the document, so they recompute — no stored-flag migration):**

- **viewable** = true when the app can render the kind, false otherwise. A folder is false.
- **status** = **ready** if it is a plain-text kind (txt, md) **or** its text is already filled; otherwise by extension — **quick** for the quick-pull kinds (pdf, html, rtf, svg), **heavy** for the recognize/transcribe kinds (images, audio, video). The "or its text is already filled" clause is what lets a document flip to ready once extraction lands, just by recomputing.
- **folders** are neither viewed nor fed to the model (no bytes, no words) — left out of both, marked by their family, not by a status value.

**Where the code changes:** set both when a document is made (the add path), recompute both on load (records saved before these fields carry no value), point the rows / eye / stepper at the stored `viewable` instead of recomputing the render test, split the current two-way status pick ([Hierarchy.ts:131](../../ji/src/lib/ts/managers/Hierarchy.ts#L131)) into the three tiers, and report the two axes separately in the arrival log.

**Phase 2 - extraction pass** — the quick/heavy words-pull that fills `text` and flips status to ready.

## Sticky parent-folders — removed 2026-07-22

The feature that kept a scrolled row's parent folders pinned at the top is **gone**. It fought us end to end: a 1px flick at every crossing (the browser paints scroll on its own thread, so a JavaScript-placed row always trails a frame), then a click-steal (a pinned triangle's clickable box poked below the strip and caught clicks meant for the row beneath). A one-line clip did not settle it. Jonathan called it a bad design and pulled it.

What was cut from [Documents.svelte](../../ji/src/lib/svelte/main/Documents.svelte): the pinned overlay table, `update_pins`, the pin state and its recompute, the scroll-time pin math. What stayed: the sticky **column header**, the remembered scroll place, and folder open/close.

If parent-orientation is ever wanted again, do it natively — rebuild the list as a nested tree of divs with each folder row `position: sticky` inside its own block (the compositor keeps it glued, no JavaScript, no flick, no overlap). That is a real rewrite of the list, so only for a deliberate pass, not a quick add.

## Method that holds

One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.

## Later (from code debt)

Porting ws's hierarchy, moving the erase button to the far right as a trashcan, raising the documents view to the top, the new tags control, remote support (supabase, person id, authorization), a stipulations file, viewing rich text, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
