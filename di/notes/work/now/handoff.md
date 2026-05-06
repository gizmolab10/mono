# Code-Debt Handoff

**Date:** 2026-05-05
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

---

## Next

The first unchecked code-debt item is "invert the radial gradient -> so they look more like buttons". Pick that up next.

## Open items

- **Trace logs left from the formula-bug investigation should be removed.** Eight console.log calls are still wired across the constraints manager, the renderer, the engine, and the attributes panel. Pull them in a small clean-up pass before the next feature work.
- **Delete on a non-repeater grandchild leaves the part still listed.** Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Still open. Need a console error message or a small repro scene to pin the failing step.
- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** Could not reproduce from reading the code. Need more detail about the scene before a fix can be made.
- **Identity-based formula storage.** A targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor.
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](../milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Deferred in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.

## Notes for future sessions

- The code-debt track is a grab-bag of small, unrelated items. Each one deserves its own short propose-then-build cycle. Do not batch them.
- The slow-render work has its own handoff at `di/notes/work/milestones/done/32.facets/slow/handoff.md`. The bottleneck-analysis file sits next to it.
- The drag work has its own mothballed handoff at `di/notes/work/milestones/33.drag/handoff.md`.
- The `handoff` and `hands` shorthands point at this file.
- The tumble instrumentation is in place but silent. Flip the constant at the top of the engine file to true, uncomment the per-second summary block inside the render loop, reload, and the console will print timings and counters again.

---

## Plain-English example — translating an earlier note

Earlier in this session the assistant wrote: "For invariant-on-start and invariant-on-end, the spec spells out only what happens to one half (the original on start-invariant, the new sibling on end-invariant). The other half is left implied. I AM GUESSING the implied behavior is the symmetric mirror — the unspecified half also keeps the original's invariant attribute and gets its own halved length. Worth confirming before code."

The user asked for that to be translated into plain English. Plain-English version:

When the original part's anchor is its start side, the spec describes only the original — keep the start where it was and halve the length; it does not say what happens to the new piece. When the anchor is the end side, the spec describes only the new piece — keep the end where the original's end was and halve the length; it does not say what happens to the original. I AM GUESSING the unstated half mirrors the stated one — same kind of anchor, length also halved. Worth confirming before any code is written.

What changed: "invariant-on-start" became "anchor is its start side." "Spec spells out only what happens to one half" became "describes only the original" or "describes only the new piece." "Symmetric mirror" became "mirrors the stated one." Speak in side, anchor, half, length — the things — not in jargon names for the things.
