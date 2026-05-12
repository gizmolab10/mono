# Code-Debt Handoff

**Date:** 2026-05-11
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

## Open items

- **Validation-error overlay placement after the rename refactor.** Hop two of the rename refactor moved the validation overlay from inside the parts list panel to the parent details panel. The overlay now lives at the bottom of the details column, below all the panel banners, rather than tucked inside the parts banner. This was not visually confirmed in a running browser. Worth a one-minute visual confirmation: trigger a name-validation error and check that the red-bordered message appears in a sensible spot whether the parts list panel is open or collapsed. If the placement looks off when the parts list is collapsed, the overlay can be repositioned without changing any of the wiring.
- **One stray trace log left from the formula-bug investigation.** A single console.log inside the algebra constraints file announces an aborted cycle walk. Pull it (or convert it into a real status-strip warning) before the next feature pass. The renderer's many logs are part of the topology rewrite and should be left alone.
- **Delete on a non-repeater grandchild leaves the part still listed.** Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Need a console error message or a small repro scene to pin the failing step.
- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** Could not reproduce from reading the code. Need more detail about the scene before a fix can be made.
- **Identity-based formula storage.** A targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor.
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](../milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Deferred in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.

## Proposal: move help and return-to-app buttons to the right

First unchecked item on [code.debt.md](./code.debt.md): "move the '?' to the right, and the 'return to design intuition' button".

**Where they sit now.** The round `?` help button is on the LEFT end of the main control bar — it's the second item, right after the hamburger, and it lays out that way in all three responsive layouts (desktop, mobile-wrap, phone-wrap). The `← Return to Design Intuition` button is on the LEFT end of the user-guide bar, also right after its own hamburger.

**Plan.** Move both buttons to the right end of their respective bars.

- Main control bar (Controls.svelte). Remove the help_button call from its current spot (just after hamburger) in each of the three layout branches. Re-render it at the far right — after the face accessory buttons and after the trailing spacer — so it docks against the right edge in every layout.
- User-guide bar (UserGuide.svelte). Push the return button to the right end while leaving the hamburger on the left. Cleanest way: drop a stretching spacer between the hamburger and the return button (or change the bar's `justify-content` from `flex-start` to `space-between`).

**One default I'm picking.** At the right edge of the main bar, the help button will sit OUTERMOST — to the right of the face buttons. If you'd rather have it tucked just left of the face buttons, say so before I edit.

**Scope.** Two files, layout-only changes, no behavior changes. No styling tweaks beyond what is needed to anchor the buttons on the right.
