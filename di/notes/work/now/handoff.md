# Code-Debt Handoff

**Date:** 2026-05-14
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

## Open items

- **Validation-error overlay placement after the rename refactor.** Hop two of the rename refactor moved the validation overlay from inside the parts list panel to the parent details panel. The overlay now lives at the bottom of the details column, below all the panel banners, rather than tucked inside the parts banner. This was not visually confirmed in a running browser. Worth a one-minute visual confirmation: trigger a name-validation error and check that the red-bordered message appears in a sensible spot whether the parts list panel is open or collapsed. If the placement looks off when the parts list is collapsed, the overlay can be repositioned without changing any of the wiring.
- **One stray trace log left from the formula-bug investigation.** A single console.log inside the algebra constraints file announces an aborted cycle walk. Pull it (or convert it into a real status-strip warning) before the next feature pass. The renderer's many logs are part of the topology rewrite and should be left alone.
- **Delete on a non-repeater grandchild leaves the part still listed.** Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Need a console error message or a small repro scene to pin the failing step.
- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** Could not reproduce from reading the code. Need more detail about the scene before a fix can be made.
- **Identity-based formula storage.** A targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor.
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](../milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Deferred in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.

## Proposal: Steppers -> bigger and horizontally laid out (pointing left and right)

First unchecked item on [code.debt.md](./code.debt.md).

The stepper arrows in the slider and in the build-notes modal currently point up and down and are 20 pixels tall. The ask: make them bigger and lay them out horizontally, pointing left and right instead. The stepper component already supports a horizontal mode and a left/right pair of arrows — what's needed is to switch the two callers over to it and to bump the size up.

Confirmed:

1. The stepper component already accepts a horizontal switch and already swaps to left/right arrows when that switch is on. No work inside the stepper component itself.
2. Two places use steppers — the slider's compound layout, and the build-notes modal. Both will switch in the same way.
3. The slider's layout currently puts the stepper to the right of the slider track with the two arrows stacked vertically. Switching to horizontal means the two arrows sit side by side and the whole stepper pair becomes wider but shorter. Need to confirm the slider band still looks right with the new shape.
4. Pick a size. Currently 20 pixels. Suggest 28 or 30 — big enough to read clearly, not so big it forces the band to grow taller.

Open questions:

1. Both callers, or only the slider? The build-notes modal stepper currently sits in the top-left corner — a horizontal layout would change where it lives.
2. New size — 28? 30? something else?

Say "go" to apply to both with size 28, or specify which caller and which size.
