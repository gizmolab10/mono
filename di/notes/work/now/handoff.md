# Handoff

**Date:** 2026-07-04
**Work stream:** finished work is in the [work journal](di/notes/work/now/work%20journal.md); open and paused threads now live in [[open items]]. This file is a thin index.

## Current thread

Edit-lock hardening extended and a banner colour fix (2026-07-04/05 work-journal entry; moved to [[code.debt.paid]]): the lock now also covers divide/duplicate, unrepeat, and parts-list drag-and-drop; and the banner is now a `<div>` (was a `<button>` wrapping the action buttons — invalid), so the banner button text reads black again. Earlier: whole-details lock coverage, plus-button move, selection dots on top, root dimensions, pure-number constants (all visual-confirmed).

**Proposed next (from code.debt):** the first bug line reads "stop → Jeff" — that looks like a personal note, not a code task; skip it. The first code bug is **"two door cabinet — stretch top drawer up → fubar."** A stretch bug in a specific scene. First reproduce: build a two-door cabinet, stretch the top drawer upward, capture what breaks (which bound goes wrong, drag-solve vs invariant pass). Diagnose from the drag path (try_solve_given / reverse propagation) with logging before any fix. Needs the failing scene first.

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
