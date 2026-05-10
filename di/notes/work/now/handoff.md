# Code-Debt Handoff

**Date:** 2026-05-10
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

## Open items

- **Validation-error overlay placement after the rename refactor.** Hop two of the rename refactor moved the validation overlay from inside the parts list panel to the parent details panel. The overlay now lives at the bottom of the details column, below all the panel banners, rather than tucked inside the parts banner. This was not visually confirmed in a running browser. Worth a one-minute visual confirmation: trigger a name-validation error and check that the red-bordered message appears in a sensible spot whether the parts list panel is open or collapsed. If the placement looks off when the parts list is collapsed, the overlay can be repositioned without changing any of the wiring.
- **One stray trace log left from the formula-bug investigation.** A single console.log inside the algebra constraints file announces an aborted cycle walk. Pull it (or convert it into a real status-strip warning) before the next feature pass. The renderer's many logs are part of the topology rewrite and should be left alone.
- **Delete on a non-repeater grandchild leaves the part still listed.** Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Need a console error message or a small repro scene to pin the failing step.
- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** Could not reproduce from reading the code. Need more detail about the scene before a fix can be made.
- **Identity-based formula storage.** A targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor.
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](../milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Deferred in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.
- **Print rule-39 tests, follow-up.** Six browser-driven tests for the screen silhouette were written against the old corner-projection contract. Rule 39 was rewritten this session to define the silhouette as the bounding rectangle of painted pixels on the canvas. The six tests now fail because their expected values come from corner projection. Detailed proposal for each test is at the bottom of this file.

## Proposal: rewrite the seven red browser-driven tests for the painted-pixel silhouette

All seven tests in `e2e/tests/print-notifications.spec.ts` were written against the old rule that defined the silhouette by projecting world corners. Rule 39 was rewritten this session to define the silhouette as the bounding rectangle of painted pixels on the canvas. The tests need to follow. Each item below names the test and the rewrite that makes it pass against the new contract.

**Test one — single box, exact silhouette transform.** Today the test computes the expected silhouette by projecting a known box's eight world corners. The rewrite: add the box to the scene via the test write hook, wait long enough for the renderer to paint it (around 200 milliseconds), read the canvas pixels via getImageData, find the painted bounding rectangle, derive the expected print transform from that rectangle and the canvas dimensions, then compare to the actual transform applied by the production handler.

**Test two — two boxes far apart.** Same shape as test one. Add both boxes, wait, read pixels, derive expected, compare. Keep the existing sanity check that the two-box scale is smaller than the one-box scale.

**Test three — off-frame box.** This test pinned the old clamping behaviour. The new rule has no clamping concept — pixels are pixels. Rewrite as: a box that extends well past the camera's view paints only its visible portion onto the canvas; the silhouette equals the bounding rectangle of that visible portion, which is smaller than the box's full projected extent. Verify the silhouette by reading pixels.

**Test four — box with visibility flag off.** ALPHA visible, BETA invisible. Renderer paints only ALPHA. Pixel scan finds ALPHA's painted region. Verify the silhouette matches just ALPHA's pixels (read canvas, derive expected, compare). Same shape as test one but with the invisible BETA confirmed to contribute nothing.

**Test five — hide-children on parent.** ALPHA with hide-children turned on, CHILD suppressed. Renderer paints only ALPHA. Same shape as test four.

**Test six — empty scene leaves the canvas with no transform applied.** Needs a policy decision before the rewrite. With the new rule, anything painted contributes to the silhouette. The renderer paints grid lines and axes even when no smart objects exist, so pixel scan finds those grid pixels and the silhouette is non-empty. Two options: hide the grid and axis decorations during print (a new rule 66, parallel to the dashed-wireframe suppression already in place), then an empty scene leaves the canvas truly empty and the test passes; or loosen the test to assert that the transform's scale stays bounded when the scene is empty. The first option is the cleaner policy choice and matches what the user probably wants on a printed page — no grid clutter.

**Test seven — diagnostic print-media-emulation log.** This test compared projection-based expected values to the production transform to flag any drift. With pixel scan the projection-based expected is no longer meaningful. Either delete it (the silhouette-stability test already covers determinism) or rewrite as a pixel-scan diagnostic that logs the painted-pixel bounding rectangle and the resulting transform side-by-side for ad-hoc review.

**Bundled work.** All seven changes can be done in one pass. The cost is a small helper at the top of the spec file that reads the canvas pixels via page.evaluate and returns the painted bounding rectangle. Six tests call it; the seventh either gets deleted or rewritten as a pixel-scan diagnostic. The empty-scene test depends on the policy decision about grid lines during print — if the suppression rule is added, the test passes without further reworking.
