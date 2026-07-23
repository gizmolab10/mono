# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md).

Finished work moves to [work journal](work%20journal.md); what's left is in [code debt](code%20debt.md).

## Proposal — build DB_LLM

- [ ] AnythingLLM is installed
- [ ] 
First unchecked in [code debt](code%20debt.md): **add AnythingLLM into the databases.** This is the real payoff of phase 1: with every document already tagged *viewable* and *status* (ready / quick / heavy), the next step is to pull each document's words out and hand them to a model so the store can be searched and questioned. Rough shape: run the extraction pass (the quick or heavy words-pull) to fill each document's `text` and flip its status to ready; chunk that text into passages; turn each passage into numbers that capture its meaning and store them; then, on a question, find the closest passages and answer from them.

AnythingLLM's own pipeline is the reference — but it does the finding-and-answering, not the labeling, so ji keeps its own tags and viewable/status. This is a phase of its own; scope it before building (local vs remote model, where the passage-numbers live, how much runs in the browser).

btw, a quick unrelated one also waiting: **set operation to null is very, very slow** — worth a look on its own.

**Recently finished** (details in [work journal](work%20journal.md)): the viewer header settled (triangles top-left, close pinned, title centered, survives-reload); phase 1 — each document's *viewable* and *status* worked out and stored; the sticky parent-folders feature removed; the "Intersection" title; the dedup question ordered by date.

## Method that holds

One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.

## Later (from code debt)

Porting ws's hierarchy, moving the erase button to the far right as a trashcan, raising the documents view to the top, the new tags control, remote support (supabase, person id, authorization), a stipulations file, viewing rich text, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
