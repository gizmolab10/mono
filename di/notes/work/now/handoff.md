# Code-Debt Handoff

**Date:** 2026-05-07
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

## Open items

- **Validation-error overlay placement after the rename refactor.** Hop two of the rename refactor moved the validation overlay from inside the parts list panel to the parent details panel. The overlay now lives at the bottom of the details column, below all the panel banners, rather than tucked inside the parts banner. This was not visually confirmed in a running browser. Worth a one-minute visual confirmation: trigger a name-validation error and check that the red-bordered message appears in a sensible spot whether the parts list panel is open or collapsed. If the placement looks off when the parts list is collapsed, the overlay can be repositioned without changing any of the wiring.
- **One stray trace log left from the formula-bug investigation.** A single console.log inside the algebra constraints file announces an aborted cycle walk. Pull it (or convert it into a real status-strip warning) before the next feature pass. The renderer's many logs are part of the topology rewrite and should be left alone.
- **Delete on a non-repeater grandchild leaves the part still listed.** Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Need a console error message or a small repro scene to pin the failing step.
- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** Could not reproduce from reading the code. Need more detail about the scene before a fix can be made.
- **Identity-based formula storage.** A targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor.
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](../milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Deferred in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.

## Proposal: print just the graph, scaled to fit

**The item.** When the user prints the page (the keyboard print shortcut, or "save as PDF" through the system print dialog), they currently get whatever the browser captures of the live screen — the side column with all its banners, the top strip with the menu and edit and save buttons, and the graph squeezed into whatever space is left over. The goal is for printing to produce just the drawing area, by itself, scaled up to fill the printable area of the chosen paper size.

**How the page sits today.** The window is split into three regions: a thin top strip with the menu and a few buttons, a wide drawing area (the graph), and a narrow side column on one edge with the layered detail panels. The drawing area is a single rectangular drawing surface that the rendering engine paints into; the rendering engine sizes that surface to match whatever pixel dimensions the surrounding container hands it.

The print-aspect ratio number in the project's constants list is ready and waiting (it was added some time ago) but nothing reads it yet, so it has no behavior attached to it.

Evidence: window layout at [Main.svelte](../../../src/lib/svelte/main/Main.svelte); drawing surface and engine wiring at [Graph.svelte](../../../src/lib/svelte/main/Graph.svelte); the unused print-aspect ratio constant at [Constants.ts:43](../../../src/lib/ts/common/Constants.ts#L43).

**Two ways to make print show just the graph.**

1. **A print stylesheet.** Add a small block of styles that only apply when the browser is printing. The block hides the top strip and the side column, makes the drawing area fill the page, and asks the browser to skip page margins. The browser does the rest — what is on the screen at print time is what gets sent to the printer. Smallest possible change. The drawback is that the drawing surface keeps the same pixel dimensions it had on screen — meaning at print resolution it will look softer than the actual screen rendering, especially on high-resolution print output (a typical printer is two to three times sharper per inch than a typical screen). Lines drawn one pixel wide become slightly fuzzy edges on paper.

2. **A print button that re-renders the graph at print resolution.** Add a print action somewhere visible (the top strip's existing menu would be a natural place) that, when pressed, asks the rendering engine to draw the current scene one more time into an off-screen drawing surface that is sized for the chosen paper at high resolution, then opens a fresh print window containing that surface alone, then triggers print. The drawing surface used on screen is left alone; the user does not see anything change in the live view. Cleaner output, more code, more places to break, and it touches the rendering engine, which is currently in the middle of a separate refactor.

**Recommended approach.** Start with option one (the print stylesheet). It is the smallest change, lands the feature today, and gives the user a usable result immediately. The output will look slightly softer than ideal on paper, but it will be readable and correctly composed (just the drawing area, scaled to the page). Option two stays available as a follow-up if and when print quality becomes the bottleneck — it is a self-contained add-on and does not need any of option one's work to be undone.

**Test plan.** Open the app with a scene loaded, press the print shortcut, and check the print preview: only the drawing area should appear, the side column and top strip should be gone, and the drawing area should fill the printable region of the page. Try this in landscape and portrait paper orientations. Print to PDF and inspect the result at full zoom — lines should be sharp enough to read; if they look unacceptably fuzzy, that is the cue to graduate to option two. Confirm that nothing changes on the live screen view when the user is not printing.

**Cons.** Soft line edges at print time, as described above. No cons found beyond that for option one.

I AM GUESSING that the existing single drawing surface will scale up to a typical page size acceptably under option one. If the surface refuses to scale (because its pixel dimensions are forced by the rendering engine), option one will need a small tweak to allow the surface to fill the page rather than sitting at its current pixel size; that tweak is a single style line.

---

## Done: print stylesheet — just the drawing area, scaled to fit the page

**Outcome.** A small print-only block of styles now lives at the top of the app's global styles. When the browser is printing (or the user is "saving as PDF" through the print dialog), the top strip with the menu and buttons is hidden, the side column with the detail panels is hidden, the small overlays inside the drawing area (the build button, the breadcrumbs trail, the status strip at the bottom) are hidden, the outer page frame loses its fixed positioning and padding so it can flow into a normal page, and the drawing area expands to fill the entire printable region of the chosen paper. The drawing surface inside the drawing area is told to scale to fit while preserving its aspect ratio, so the picture is not stretched out of shape — if the paper is a different shape than the drawing surface, the surface fits inside with a thin band of white on the long sides rather than warping.

The page margins are pulled to zero in the same block so the drawing fills edge to edge.

Evidence: rules at the bottom of the styles block in [App.svelte](../../../src/App.svelte).

**Test plan, run.** Needs visual confirmation in the running browser. Open a scene, press the print shortcut, and check the print preview: only the drawing area should appear, nothing else. Try landscape and portrait paper. Save as PDF and check that the drawing fills the page edge-to-edge with no surrounding column or strip. The live screen view should look exactly the same as before when not printing.

I AM GUESSING that the printed lines may look softer than the on-screen lines because the drawing surface keeps its on-screen pixel resolution and scales up — this is the documented drawback of the simple option chosen here. If the softness bites, the follow-up path (a separate print action that re-renders the scene at print resolution into a fresh off-screen surface) is described in the proposal above and remains untouched by this work.

---

## Proposal: scale the print to the size of the drawing's silhouette, not the size of the drawing surface

**The item.** The current print stylesheet scales the drawing surface to fit the page. That is correct in shape, but the picture inside that surface only occupies the pixels where the actual drawing lives. The drawing surface is sized to match the on-screen drawing area, which is much wider and taller than the picture itself — so most of the surface is empty room around the picture. When the surface scales to fit the page, that empty room scales with it, and the picture ends up small in the middle of the paper. The goal is to scale based on the picture's silhouette — the smallest rectangle that contains every drawn line and shape — so the silhouette fills the page, with the empty room around it cropped away.

**How the picture sits today, once printed.** The drawing surface is a rectangle whose pixel dimensions match the on-screen drawing area. Inside that rectangle, the picture itself (the projected scene with its lines, faces, and labels) occupies some sub-rectangle, surrounded by background. The current print rule scales the whole rectangle to the page, so the sub-rectangle ends up scaled by the same factor as the empty room — which is whatever factor scales the on-screen drawing area to the page.

What is needed is two extra numbers: how much bigger to scale (so the silhouette, not the drawing surface, fills the page) and how much to slide left or up (so the silhouette is centered on the page rather than offset by the empty room).

Evidence: the existing print rules at the bottom of the styles block in [App.svelte](../../../src/App.svelte). The drawing surface is the canvas inside [Graph.svelte](../../../src/lib/svelte/main/Graph.svelte). The smart objects in the scene each carry their own world-space corner numbers. The camera that turns those world-space numbers into on-screen pixels exposes its view and projection matrices at [Camera.ts:5-6](../../../src/lib/ts/render/Camera.ts#L5-L6).

**Three ways to compute the silhouette.**

1. **Project the corners of every smart object through the camera.** Walk every smart object, take its eight world-space corner points, run them through the camera's view-and-projection math to get on-screen pixel positions, and keep a running track of the smallest and largest pixel-x and pixel-y seen. Those four numbers define the silhouette rectangle on the drawing surface. Then compute the scale that fits that rectangle to the page and the slide that centers it. Fast, exact, no rendering needed. Requires reading the camera matrices and the smart-object corner numbers — both already exposed.

2. **Scan the picture pixels of the drawing surface.** Right before printing, read the pixel data of the drawing surface, find the smallest rectangle containing every non-background pixel, and use that as the silhouette. Slower (one whole-surface scan, which on a typical large window is in the millions of pixels and takes a few tens of milliseconds), but does not need to know anything about the scene or the camera — it works purely from what is already drawn. Insensitive to engine internals, so it survives the topology rewrite without touching it.

3. **Move the camera to frame the silhouette, then re-render.** Compute a new camera position and zoom that frames the silhouette, render the scene one more time into a fresh off-screen drawing surface sized to the page (at print resolution, not screen resolution), and swap that surface in for printing. This is the path that also fixes the soft-line problem from the previous proposal. Most code, most quality, most touching of the rendering engine — which is currently being rewritten.

**Recommended approach.** Option one (project the corners). The math is small and runs in under a millisecond on any plausible scene. The two numbers it produces (a scale factor and a slide offset) get applied to the drawing surface as a transform, and the print stylesheet picks them up automatically. The implementation is one short helper that walks the scene, plus a tiny event listener that runs the helper just before the print dialog opens and clears the transform when printing ends. It fixes today's "the picture sits tiny on the page" without touching the rendering engine, and it stacks cleanly with option three from the previous proposal if higher print quality becomes the next goal.

**Why not option two.** It does work, and it is the safest against engine churn. The reason to skip it is that option one already does not touch the engine — it only reads numbers the camera exposes — so there is no engine-survival benefit, and the pixel scan is strictly slower and slightly less precise (background-color detection has edge cases at faint anti-aliased line edges).

**Test plan.** Open a scene whose drawing only takes up part of the on-screen drawing area (say, a small house in the middle of a wide window). Print to PDF. The silhouette should be centered on the page and large — filling at least one of the two paper dimensions. Pan the on-screen view so the drawing is in a corner and print again — the silhouette should still be centered and large, regardless of where it sits on the screen. Try a single small object and a sprawling layout — both should print at the largest size that fits. Confirm that nothing changes on the live screen view at any point.

**Cons.** A small helper has to project geometry through the camera, so a handful of new lines of code live near the rendering layer. If the camera matrices ever stop being accessible during a future rewrite, the helper would need to follow them. No cons found beyond that.

I AM GUESSING that the smart objects' world-space corner numbers (the per-object minimum and maximum in each axis) will give a tight enough silhouette for printing. If they over-estimate (because, for example, an object's bounding box includes an annotation that is hidden), the silhouette would be slightly wider than the visible drawing and the print would have a thin extra margin — visually fine, just not pixel-perfect. The pixel-scan fallback (option two) catches that edge case if it ever bites.

---

## Done: silhouette-based print scaling

**Outcome.** When the user prints, a small handler runs once just before the print preview is built. It walks every smart object in the scene, takes each object's eight world-space corner points, runs them through the camera's view-and-projection matrices, and converts each result to a pixel coordinate on the drawing surface. The smallest rectangle that contains all those projected pixel coordinates is the silhouette — the actual extent of the picture on the drawing surface, ignoring any empty room around it. The handler then computes a scale factor (the largest factor that still fits the silhouette inside the page area while preserving aspect ratio) and a slide offset (so the silhouette's center lines up with the page's center) and applies a single transform to the drawing surface. When printing finishes, a second handler clears that transform.

The print stylesheet now also tells the surrounding region to crop anything that extends outside the page area, and pins the drawing surface at its native pixel size with no auto-fit. This way the handler's transform is doing all the scaling and positioning, in plain pixel space, and the result is exactly the silhouette filling the page edge to edge while keeping its shape.

Evidence: handler and listeners in the script of [App.svelte](../../../src/App.svelte); print rules at the bottom of the same file's styles block.

**Test plan, run.** Needs visual confirmation in the running browser. Open a scene whose drawing only takes up part of the on-screen drawing area (a small house in the middle of a wide window). Print to PDF and confirm the picture fills the page rather than sitting small in the middle. Pan the on-screen view so the drawing is in a corner and print again — the print should still show the picture centered and large. Try landscape and portrait paper. Confirm that the live screen view is unchanged outside of printing.

I AM GUESSING that the page area dimensions are correct at the moment the handler reads them (right after the print event fires) on the browsers Jonathan uses. If on some browser the print stylesheet has not yet kicked in when the handler runs, the picture would be sized to the on-screen region instead of the page. If that bites in practice, the fix is to wait a frame before measuring, or to drive the scaling from the drawing surface's own pixel dimensions rather than the page area. Either is a small follow-up.

**Initial print-blank issue, patched.** The first cut of the silhouette work used auto-sized dimensions on the drawing surface during print, which collapsed it to nothing in some browsers and produced a blank page. The patch pins the drawing surface to its own pixel dimensions before applying the scale-and-translate transform, and computes the transform from those pixel dimensions rather than from the surrounding region. The picture now scales the silhouette to fill the drawing surface's own area; the print stylesheet still lets the surrounding region fall back to "fit the whole drawing surface to the page with aspect preserved" if the handler ever does not run. Aspect is preserved in both paths.

I AM GUESSING that this two-step approach (silhouette fills drawing surface, drawing surface fits page) leaves a small margin around the silhouette when the page aspect differs from the drawing-surface aspect, since the drawing surface is letterboxed inside the page. If a tighter fit is needed, a small follow-up can switch to a single-step transform that scales directly to the page — which requires reading the page area at the right moment in the print lifecycle, the timing question called out above.

---

## Done: stipulations vocabulary refresh and end-to-end renumber

**Outcome.** The catalog of load-bearing rules now speaks in the project's current vocabulary — "attribute", "field", "SO", "formula" — instead of the old "cell" / "value" wording. Seven rules got new short names, eight rules got plain-English word swaps, one rule was removed as redundant (the locked-named-value rule, already covered by the general locked-slot rule), and every rule was renumbered so the file reads 1 through 62 in unbroken sequence. The header coverage line now states: fifty-eight of sixty-two rules are directly covered (fifty-four by unit tests, four by browser-driven tests), with four — the drawing silhouette and the three printing rules — not yet test-backed.

The per-test-file index in `testing.md` was synced to match: every old short name was updated, and the reference to the removed rule was dropped. A whole-project grep confirmed no other notes or code held onto the old names.

A handful of paste-artifact link tails on rule pointer lines were trimmed, two pointer lines missing their closing markdown bracket were closed, and one Preferences-layer pointer that aimed at the wrong source file was redirected. Two stray double-blank-line gaps were collapsed.

The driver spreadsheet that listed the renames was deleted by Jonathan once the work landed; nothing else linked to it.

Evidence: rule catalog at [stipulations.md](../../guides/project/development/stipulations.md); test-file index at [testing.md](../../guides/project/development/testing.md); adherence row in [working features.md](./working%20features.md).

**Test plan, run.** No code touched, so no test run is needed. A grep for every old short name across notes, source, and browser tests returns nothing outside the deleted spreadsheet — confirmed during the pass. Visual confirmation not applicable.

I AM GUESSING that the four TBD rules (drawing silhouette, three printing rules) will get test backing once the printing work in the proposals above settles. If a follow-up adds tests for any of them, the coverage line should be bumped accordingly.
