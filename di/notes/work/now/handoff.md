# Handoff

**Date:** 2026-06-28
**Work stream:** finished work is in the [work journal](di/notes/work/now/work%20journal.md); open and paused threads now live in [[open items]]. This file is a thin index.

## Current thread

None active.

**Proposed next (from code.debt):** "hover and select included in dim slider count" — the dimension-count slider's number should count the dimensionals shown by hover and by selection, not just the toggle-driven set. Likely the count source the slider reads excludes the hover/selection-only dims that the renderer still draws; reconcile them. Say go to investigate and propose.

## Paused threads

Zoom feature work is proposed in open items §2.
Dimension placement. Paused threads in [[open items]]:

- §3.5 — wrong-side scoring iteration (pick the on-plane-reward approach, build, verify, keep tuning).
- §3.6 — bug 001, dim inside the silhouette. Partial fix in: the inside/outside guard now uses the visible silhouette polygon, not the box-corner outline. Spec reframed so outer-edge candidates merge into the one scored set, β raised to 3. Remaining: the structural code merge (outer-edge scored with the uniface candidates; anchors and witness length based on the silhouette polygon, not the box) — staged plan in the 2026-06-25 work-journal entry.

## Reference material

- [[open items]]
- [[di/notes/work/now/code.debt]]
- [[di/notes/work/now/work journal]]
- [[dimensions.latest.spec]]
- [[lexicon]]
