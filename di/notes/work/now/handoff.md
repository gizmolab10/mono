# Handoff

**Date:** 2026-07-04
**Work stream:** finished work is in the [work journal](di/notes/work/now/work%20journal.md); open and paused threads now live in [[open items]]. This file is a thin index.

## Current thread

Edit lock now covers the whole details column (2026-07-04 work-journal entry; moved to [[code.debt.paid]]): with the lock on, every edit path in attributes, angles, constants, repeats, and the selection name refuses and greys, the shared slider has a disabled state, and the dimensional hover pill is suppressed. The add-child plus also moved to the selection banner. Earlier this session: selection dots on top, midpoint hover + COMMAND-C, save/edit move, root dimensions, pure-number constants (all visual-confirmed).

**Proposed next (from code.debt, first bug):** "two door cabinet — stretch top drawer up → fubar." A stretch bug in a specific scene. First reproduce: load/build a two-door cabinet, stretch the top drawer upward, and capture what breaks (which bound goes wrong, whether it is the drag-solve or the invariant pass). Diagnose from the drag path (try_solve_given / reverse propagation) with logging before any fix. Needs the failing scene first.

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
