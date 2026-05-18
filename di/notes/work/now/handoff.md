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

## Proposal: thumb buttons always white, not depend on accent color

First unchecked item on [code.debt.md](./code.debt.md).

A correction to the last session's slider work. The slider thumb was made to flip color based on how bright the accent is — white when the accent is dark, dark gray when the accent is bright. The ask: undo just the thumb's flip and keep the thumb white at all times. The track and the focus halo keep their brightness-based flip — those still adapt to the accent.

One change in the color module: the accent watcher's line that picks white or dark gray for the thumb goes away, and the thumb store stays at white forever. Nothing else changes — the track color and focus color logic stays exactly as it is.

Confirmed:

1. The thumb, the track, and the focus halo each have their own named color. They are independent — pulling the thumb out of the flip does not affect the other two.
2. The thumb CSS already reads from the named color through a CSS variable, so setting the store to white is enough. No CSS edits needed.

Open question:

1. Should the thumb stay literally `white` (full bright, no transparency), or should it match what it was before the flip work — `white` with no transparency was the default. Read the file once to confirm.

Say "go" to set the thumb back to plain white.
