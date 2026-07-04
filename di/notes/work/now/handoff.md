# Handoff

**Date:** 2026-07-03
**Work stream:** finished work is in the [work journal](di/notes/work/now/work%20journal.md); open and paused threads now live in [[open items]]. This file is a thin index.

## Current thread

Attributes-editor grouping toggle is done (2026-07-03 work-journal entry; moved to [[code.debt.paid]]): a saved button flips the nine-row table between start/length/end grouping and by-axis grouping, and the root/derived cell-merges were reworked to hold under either. Visual-confirmed.

**Proposed next (from code.debt, first bug):** "dimensionals for root should appear." Today the root part shows no dimensions. Investigate first: find where the dimension pass excludes the root (the placement loop over parts) and why — is root skipped on purpose, or does it fall out because it has no parent frame or its edges read as hidden? Then decide the fix and the plain-English rule for which root edges get dimensioned. Design before code.

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
