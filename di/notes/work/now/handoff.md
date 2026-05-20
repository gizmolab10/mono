# Handoff

**Date:** 2026-05-19
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

## Open items

> All effort numbers below are guesses — calibrate from your own gut before scheduling.

- **Validation-error overlay placement after the rename refactor.** Hop two of the rename refactor moved the validation overlay from inside the parts list panel to the parent details panel. The overlay now lives at the bottom of the details column, below all the panel banners, rather than tucked inside the parts banner. This was not visually confirmed in a running browser. Worth a one-minute visual confirmation: trigger a name-validation error and check that the red-bordered message appears in a sensible spot whether the parts list panel is open or collapsed. If the placement looks off when the parts list is collapsed, the overlay can be repositioned without changing any of the wiring. *Effort: ~5 min to look, up to ~30 min if it needs nudging.*
- **One stray trace log left from the formula-bug investigation.** A single console.log inside the algebra constraints file announces an aborted cycle walk. Pull it (or convert it into a real status-strip warning) before the next feature pass. The renderer's many logs are part of the topology rewrite and should be left alone. *Effort: ~2 min to pull, ~30 min to convert into a real warning.*
- **Delete on a non-repeater grandchild leaves the part still listed.** Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Need a console error message or a small repro scene to pin the failing step. *Effort: blocked on a repro; once reproduced, ~half a day to track down and fix.*
- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** Could not reproduce from reading the code. Need more detail about the scene before a fix can be made. *Effort: blocked on scene detail; once seen, likely ~1 hour.*
- **Identity-based formula storage.** A targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor. *Effort: multi-day — touches storage, serialization, and the formula tokenizer.*
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](../milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Deferred in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.
- **Mothballed: stud / joist / stair template kinds.** First cut at the three-way segmented control needed lots of work — wrong starting proportions, name collisions, and no path from a stair template to the existing diagonal-rise repeater. See [repeaters.mothball.md](./repeaters.mothball.md) for what was attempted and the six things to think through before resuming.

## Proposal 10 — describe the complete dimensionals placement algorithm — DONE

[dimensionals.md](../../guides/architecture/graph/dimensionals.md) now walks the full placement pipeline: the shared outline built from leaf parts, the four-direction path-of-least-resistance picker, the camera-forward and witness-length filters, the 80-pixel push cap, duplicate-text drop, the force simulation (spring, repulsion, damping), motion carried across paints, stop-when-settled, the late drops (off-canvas, floater, drawn witness over 120 px), the drawing step, repeater integration, the diagnostic counters, and an expanded constants table with symptom → likely-cause notes. Every section names the source-line range that backs it.

Code-debt item checked off in [code.debt.md](./code.debt.md).

## Proposal 11 — labels still inside silhouette in some views

The code-debt item "dimension labels are still within the silhouette" remains open. The session-by-session detail of how we got here is in the journal entry for 2026-05-19. Current state:

- **Spring ruled out.** Spring constant turned off, no change in inside-silhouette count.
- **Floaters fixed.** Labels whose witness intersection would fall back are now dropped instead of drawn off-line. Side effect: at orientation [0.12, 0.63, 0.69, -0.33] the labels that used to land inside the outline got dropped instead, so that specific view is now clean.
- **Two other reported orientations not yet re-measured.** Drawer at [-0.35, -0.38, -0.57, 0.64] and [-0.48, -0.42, -0.49, 0.60] were each reported to show one label inside. Whether the floater fix also cleared these is not measured.
- **Inside-silhouette test was removed during the redesign-test sweep.** The old `dimensions-outside-silhouette.spec.ts` (which passed for orientation [0.12, 0.63, 0.69, -0.33]) was deleted because its weaker postcondition is subsumed by the new 15-pixel clearance test. The replacement [dimensions-clearance-silhouette.spec.ts](../../../e2e/tests/dimensions-clearance-silhouette.spec.ts) asserts the stricter 15-pixel rule but is currently `test.skip` pending the `dim_min_silhouette_clearance()` test hook (rule 25 of the redesign spec). Once that hook is added, the two un-measured orientations can be exercised by parametrising the test.

Next moves, in order:

1. Visually re-check drawer at the two un-measured orientations. If labels inside are still visible, add those orientations to the inside-silhouette spec.
2. If the bug reproduces in code, the candidates left are repulsion shoving labels across the outline (matters in crowded views) or the 80-pixel push cap leaving labels partly inside from the start (matters in deep-clearance views). The richer diagnostic (home, after-push, final positions per label) would separate the two.
