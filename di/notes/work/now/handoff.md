# Handoff

**Date:** 2026-07-01
**Work stream:** finished work is in the [work journal](di/notes/work/now/work%20journal.md); open and paused threads now live in [[open items]]. This file is a thin index.

## Current thread

Dimensionals count/hover work is done (2026-07-01 work-journal entry; moved to [[code.debt.paid]]): outer edge is a normal scored option, occlusion uses the renderer's hidden-line clipper, and the count draws the largest N of the whole valid list — hover, selection, and the slider no longer reposition.

**Proposed next (from code.debt):** "dimension slider — band / cutoff" (the low-pass threshold, spec 4.2, marked *not yet designed*). Propose the design first: a second slider or handle that hides dimensions whose on-screen length is below a pixel cutoff, so tiny dimensions drop out before the N-largest count is applied. Needs a spec section and a plain-English rule before code.

## Paused threads

Zoom feature work is proposed in open items §2.
Dimension placement. Paused threads in [[open items]]:

- §3.5 — wrong-side scoring iteration (pick the on-plane-reward approach, build, verify, keep tuning).
- §3.6 — bug 001, dim inside the silhouette. The structural merge is now DONE (2026-07-01): the outer edge is one of the scored options in the same loop as the uniface levels, with its own anchors and witness length from the binary search, not the box. The inside/outside guard already uses the visible silhouette polygon. Any remaining work is scoring-weight tuning only.

## Reference material

- [[open items]]
- [[di/notes/work/now/code.debt]]
- [[di/notes/work/now/work journal]]
- [[dimensions.latest.spec]]
- [[lexicon]]
