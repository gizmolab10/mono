# Handoff

**Date:** 2026-06-24
**Work stream:** finished work is in the [work journal](di/notes/work/now/work%20journal.md); open and paused threads now live in [[open items]]. This file is a thin index.

## Current thread

None active.

**Proposed next (from code.debt):** "re-pause item 3.6 of open items.md" — looks already satisfied: bug 001 is parked in open items §3.6 (Paused threads below) and the Current thread is None active. Recommend checking it off in code.debt. The next actionable cd item after it is "play with it" (manual test — two-door cabinet, two parts), then "export an SO → file".

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
