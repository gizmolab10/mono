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

## Proposal: crowded dimensionals

Next item on [code.debt.md](./code.debt.md): "crowded dimensionals" with the sub-item "need to explore algorithms for placing dimensionals so they do not overlap".

**Where things sit now.** Dimension labels (the small text and lines drawn alongside edges to show measurements) get drawn at fixed positions relative to each edge. In a busy scene — many small parts close together, repeated parts, deep hierarchy — multiple dimension labels can land on top of each other. The renderer doesn't currently detect or resolve overlaps.

I AM GUESSING about the current placement details. The dimension-rendering code lives in the renderer module and tracks dimension-rectangle positions in an array.
Evidence to verify before acting: `dimension_rects` array in the renderer (referenced from the print and hit-test code paths I've seen this session); the rendering routine that fills it. Worth a focused read before writing a plan.

**This is an exploration item, not a code-change item.** The sub-item explicitly says "explore algorithms", which means the work is to read what exists, identify the overlap conditions, and consider candidate placement algorithms before any code is written.

**Plan — investigation first.**

1. Read the dimension-rendering routine end-to-end and describe in plain English where each dimension label sits relative to its edge.
2. Build a small mental model of when overlaps happen: same-axis siblings, parent-vs-child dimensions, repeater clones, foreshortened views.
3. List candidate algorithms in rough order of complexity: (a) skip labels that would overlap a prior one; (b) push labels along their edge until they fit; (c) push labels perpendicular to their edge; (d) iterative force-directed placement; (e) anchor labels to a fixed off-edge column.
4. For each algorithm, name one or two known-good prior-art references (e.g., what CAD software does, what graph-labelling libraries do).
5. Propose ONE candidate to try first, with the rationale.

That last step is the proposal proper. Until investigation is done, any concrete code plan would be guessing.

**Scope of the investigation.** Reading-only — no edits. Output is a written analysis in this proposal that we iterate on before any rendering code is touched.

**Alternative.** If you'd rather skip this exploration and pick a smaller polish item from "## soon", say so and I'll read code-debt again and propose for one of those instead.
