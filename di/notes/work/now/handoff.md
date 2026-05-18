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
- **Mothballed: stud / joist / stair template kinds.** First cut at the three-way segmented control needed lots of work — wrong starting proportions, name collisions, and no path from a stair template to the existing diagonal-rise repeater. See [repeaters.mothball.md](./repeaters.mothball.md) for what was attempted and the six things to think through before resuming.

## Proposal: when option key is down, only show invisible SOs and their dimensionals

First unchecked item on [code.debt.md](./code.debt.md).

Right now, holding the OPTION key reveals invisible parts as a wireframe overlaid on top of the visible drawing — both are on screen at the same time. The ask: while OPTION is held, show ONLY the invisible parts (and their dimensions). The visible parts go away for the duration of the hold; release OPTION and the visible parts come back as normal.

### Three pieces:

1. The canvas drawing pass currently paints visible parts in solid form and invisible parts as a faint wireframe. While OPTION is held, the wireframe is fully opaque. The new behavior: while OPTION is held, skip the visible-parts pass entirely. Only the wireframe pass runs.
2. The dimension layout currently collects dimensions from visible parts and (while OPTION is held) from invisible parts too. The new behavior: while OPTION is held, the dimension layout collects from invisible parts only. Dimensions for the visible parts don't show.
3. The hit-test for hover and clicks already accepts invisible parts when OPTION is held. The new behavior keeps the same: hovering or clicking only the (now-revealed) invisible parts works while OPTION is held.
4. If NO parts are invisible? Holding OPTION key does nothing.
5. The grid and axis indicators (the y-arrow, the x-arrow, the z-arrow) — keep them on during OPTION-hold.
6. The root's bottom-face rectangle (the floor reference) — currently always drawn faintly. Keep it during OPTION-hold.

Say "go" with answers, or "go" alone for "blank canvas is fine, keep grid and axes, skip floor reference".
