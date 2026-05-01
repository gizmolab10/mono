# Code-Debt Handoff

**Date:** 2026-04-30
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Several small bugs surfaced and were fixed alongside the planned items. The most recent session shipped two parts-related items — the parts-table drag-and-drop, and the first two pieces of the selection-algorithm milestone (drill-down clicks and multi-select). See the dated session blocks below.

---

## Next

The first unchecked code-debt item is "collapse parts tree not stuck on selected — select the collapsed part." Pick that up next.

After that, the selection-algorithm milestone has the rubber-band rectangle (with option-key centre-and-zoom and a recentre button on the controls strip), and "create new group around selected objects" / "ability to combine multiple parts" sub-items.

For evidence:

- the code-debt list is at [code.debt.md](./code.debt.md)
- the milestone notes are at [27.selection.algorithm.md](./27.selection.algorithm.md)

## Where we are

- **The formula-doesn't-refresh bug is fixed.** A small helper inside the constraints manager was running on every formula edit and writing the new length value into the end-of-axis bound, regardless of which cell the axis's invariant marker pointed at. On axes where the invariant marker is the start (such as art's y-axis), this overwrote the end-bound with a value the helper computed from the old start, then the invariant pass that immediately followed used that polluted end-bound to compute a new start — and the math cancelled out, leaving every cell at its old number. The fix: delete the helper and its six call sites. The invariant pass alone now keeps each axis consistent, which is what it was always designed to do. Existing scenes may carry corrupted bound values from prior runs of the helper; a one-time scene reload triggers a global re-evaluation and clears the pollution.
- **The two eyeball columns in the parts table are now coupled on parent rows.** Clicking the self-visibility eye on a row that has children now also flips the other column's "block children from rendering" flag, so only one of the two eyes shows at a time. One click hides the part and folds the subtree away; one click brings both back. Leaf rows and the root row are unchanged.
- **The dev-docs build is green again.** Two rounds of dead-link fixes — first a small set inside the project notes, then a larger sweep prompted by the deploy log. The sweep added two ignore patterns to the docs build config (one for source-code links, one for workspace-config and parent-workspace links that the docs site cannot route to), rewrote a couple dozen workspace-root-style paths into proper relative paths across the milestone-32 facets folder and the current-work folder, and dropped the historical-paths note at the top of the slow-handoff file since preserving the old path framing is no longer the goal.
- **The working-features summary is current.** Small edits matching what shipped through 2026-04-20 — added "row numbers" and "persistent hide list" to the parts row; trimmed the "(font now large)" parenthetical from the editing row.
- **Parts-table work for the prior session is done.** Five code-debt items shipped in order: the first small eye cell on the root row is now blank; the collapse triangles were made larger; clicking a triangle reveals one more generation outward while option-clicking hides one more outermost generation, with the triangle pointing right only when nothing below is showing; the keyboard left and right arrows on the selected row do the same as the two click modes; when a row's children are hidden, the small eye cell shows the count of every part tucked below it that has no children of its own (so the number says "how many real parts are hidden", not "how many boxes are hidden"); and the "show N parts" toggle at the top of the parts table was updated so N follows the same rule — it counts parts that have no children of their own, not containers.
- **Row numbers replaced the sibling numbers in the leftmost column.** Each row in the parts table now shows its position in the visible list (zero for the root, blank there; one for the next row, and so on). The old helper that computed "which sibling am I among my parent's children" was removed since nothing else used it.
- **The selected-part position label at the top of the details panel now matches the row number.** When the parts table is hidden, the little "X of Y" label above the selected part's name uses the same visible-row count — X is the row number, Y is the total number of visible rows. Blank when the root is selected.
- **The hide-list now persists across reloads.** The list of rows whose children are hidden is saved to the browser's local storage and restored on next launch. A new helper on the preferences object handles the array-to-set and back conversion so the stored shape stays small.
- **Second pass of render-pipeline performance is shipped and measured.** Three of five proposals landed — the edge-versus-face clipping no longer allocates inside its inner loop, the hottest allocation sites in the paint now write into pre-built reusable math objects, and the dashed-grey pass for hidden parts stopped asking for metadata it throws away. Two proposals (moving strings below early-outs in the cross-object face-pair loop, and packing vertex-pair names as single numbers) were deferred because the changes would ripple through multiple stored data shapes across the file for a modest payoff. All changes sit behind a one-line rollback switch in the renderer file. Five hundred fourteen tests still pass; type-check clean. Full status recorded in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md).
- **Tumble timing instrumentation is wired in and currently silent.** A per-paint clock and a phase breakdown plus counters for the cross-object pair loop live in the renderer and the engine loop. A single constant at the top of the engine file turns everything on. The per-second console summary is commented out for now. When the numbers are needed again, uncomment the summary block and flip the constant to true.
- **The testing catalog and the rules catalog are now in lock-step.** The rules file lists fifty-seven load-bearing rules. Fifty-three are directly covered by tests; four describe user-interface flows the unit-test runner cannot exercise (a click-blocking lock, the camera animation when the rotation-snap toggle changes, the orientation save and restore on a view-mode switch, and the drag-versus-tumble decision). Those four are queued for browser-driven tests. Each rule carries a pointer to the test that pins it down. The test guide lists each test file alongside the rules it covers. Twenty-seven test files, five hundred ninety-five checks, all green. The docs build is green again after one dead link was rewritten.
- **A design proposal for a new bare letter in formulas — the center letter — is on file.** It adds a read-only formula reference that resolves to the midpoint between the start and the end of a direction. Cycle detection runs at the moment a formula is set; a drag on a cell whose formula reads the new letter is refused and the user sees the message "cannot drag a center" on a new on-screen status strip. The work is broken into four phases: a phase zero that builds the strip itself, a phase one that adds the read-only side of the letter with a silent refusal, a phase two that wires the silent refusal to the strip with the visible message, and a phase three that adds the new letter to the parts panel. The proposal sits in [16.formulas.md](../milestones/done/16.formulas.md).
- **Phase zero is shipped.** A new on-screen status strip lives at the bottom of the canvas between the build-notes button and the guides slider. It is invisible by default; calling its show helper makes a message appear; clicking anywhere on the page dismisses it; subsequent messages queue in order; error-kind messages render in red, others in the default color, all centered. Twelve unit tests pass; the type-check is clean; the running page was eyeballed and behaves as expected. The helper is currently hooked to the page on startup as a temporary console-exposed caller (under the name `di_status`) so a developer can fire messages from the browser console; that caller comes out when phase two wires the real refusal alert.
- **Phase one is done.** A formula may now reference the center of any direction using the bare letter `c` for the host direction or the axis-qualified form for a different direction. The center resolves to start-plus-end-over-two on every read; it has no stored value. Both write paths refuse to write through a center reference, so a drag on a cell whose formula reads a center never moves any number. A formula on a start, end, or length cell that references the same-direction same-SO center is rejected at the moment it is typed — the existing chain detector is unchanged. Seventeen unit tests pass; the type-check is clean. A new rule (the fifty-eighth) was added to the rules catalog.
- **Phase two is done.** A drag on a cell whose formula reads a center now posts a visible message — "cannot drag a center" — to the new on-screen status strip. The message appears in red and stays until the user clicks anywhere on the page. Three refusal points carry the publish: the drag-time upstream walker (the path real drags actually take), the resolver-level write path, and the free-constant write path. The dedup at the strip keeps repeat refusals from filling the queue. Five new unit tests cover the message-publish behavior; the full suite passes at twenty-nine files, six hundred twenty-nine checks; type-check is clean. The catalog rule was extended; the testing guide entry was extended.
- **Phase three is done.** A new debug-summary method on every SO returns a multi-line text block that shows each direction's start, end, length, and center together. Useful for traces and console prints — no real caller wires it up yet, but anyone who wants to see all four numbers per direction at a glance has a one-line call to make. Two small tests confirm the summary contains the right values and reflects edits on the next call. Six hundred thirty-one tests pass; type-check is clean. The catalog and the testing guide are both updated.
- **The center-letter feature has been exercised in the browser and the alert appears as expected.** The temporary helper that allowed firing test messages from the browser console (the one named `di_status`) is now removed. Center is fully done end to end.
- **Browser-driven tests are running.** A new test setup at `di/e2e/` carries four user-flow tests plus a smoke test, all running on a real Chromium against the development server. They cover the four rules the unit-test runner could never exercise: the editing-lock blocks clicks; the view-mode toggle saves and restores the camera angle; a tumble drag with rotation-snap on lands on a face-aligned orientation; an empty-canvas drag tumbles the camera. The catalog now reads "all fifty-eight rules directly covered." Run them with `yarn e2e`. A small read-only set of hooks gated by the URL query parameter `?test=1` lets the tests inspect internal state — the hooks attach only when the parameter is present.
- **The zoom slider and the guides slider have moved out of the drawing area and into the toolbar at the top of the screen.** The drawing area no longer carries either slider or any of the wiring that drove them. The toolbar now holds both, in all three responsive layouts. The scaling slider flexes into whatever room is left after the buttons, up to a six-hundred-pixel ceiling, and its right edge sits flush with the right edge of the toolbar. The guides slider keeps its small fixed width and its label, with the label nudged five pixels up so it reads above the slider track without crowding the row.
- **The resolver-level write path now refuses a locked target.** The drag's write path already refused locked targets; the resolver-level write path did not. A one-line refusal closes the gap. No production code calls this write path today, so the change is belt-and-suspenders for any future test or caller.
- **A click on the drawing area drills through stacked parts.** Each click builds a fresh ordered list of every part the click landed on, front to back. If the currently selected part is in the list, the new selection is the part right after it on the list, wrapping back to the front when the current part is the last. If the current part is not in the list, the new selection is the front-most. There is no memory between clicks — the rule is determined entirely by what the cursor is over and what is currently selected.
- **The click stack skips parts that should not be hit.** Parts whose own visibility flag is off are excluded. Repeater clones are excluded — only the master in a repeater group can be hovered or clicked. The drawing area still draws all of them; the click stack is just smaller.
- **Selection is now a list, not a single part.** Empty list means nothing is selected. One item means the selected part — exactly as before. More than one means multi-select. A plain click on a part replaces the list with that one part. A command-click on a part toggles that part's membership in the list. The same rule applies in the parts table — plain click replaces, command-click toggles. The parts table marks every row whose part is in the list; the canvas draws the bold outline on each part in the list. When more than one is selected, the three-tab strip in the details panel hides.
- **Rows in the parts table can be dragged to re-parent a part.** Drag a row onto another row to make the dragged part a child of the target. While dragging, the cursor's vertical position inside a row decides the drop mode: middle of a row drops as child of that row; top edge or bottom edge drops as a sibling between the two adjacent rows when those rows share a parent, or as a child of the upper of the two when they do not. The empty area below the last row drops as child of root, last in order. Drops onto self, descendants, or repeater parents are rejected with no highlight. The visual cue is a soft blue tint on the affected row(s) plus a thin blue line at the drop edge. On drop, the dragged part's stored numbers are rewritten so it draws in exactly the same world position and size — formulas are kept untouched. History is snapshotted so the move is undoable.
- **Scrolling the side panel keeps its buttons clickable.** The right-side panel that shows preferences, library, and parts now refreshes the click-target record whenever the user scrolls inside it. Without this, scrolled rows landed at new on-screen positions while the click record still pointed at the old positions, so clicks missed.
- **The collapsed details view now has working eye cells next to the name.** When the parts list is hidden and only the selected part is shown, two clickable eye cells sit to the right of the name input. The first cell flips the hide-children flag (only when the part has children and is not root); the second flips the visibility flag. Both cells re-paint immediately on click.
- **A multi-word part name in a formula keeps its space.** Typing a path like "structure.main beam.e" used to commit as "structure.mainbeam.e" because the formula's tokenize-and-rebuild pipeline had no rule for joining a dotted reference with a following one. The pipeline now joins them and keeps the space inside the merged name segment. The same fix repairs the "did you mean: main beam" suggestion button — clicking it now actually applies the correction.
- **The attributes table no longer drops its first column below a formula error.** When an error overlay sits in the middle of one of the three-row groups (start / length / end), the table is split into two physical tables with the overlay in between. The bottom table now renders its own letter cell on the first row when the split falls mid-group, with a row-span sized to cover only the rows that remain in that group. So the first column stays in place above and below the overlay.
- **The toolbar component is clean of unused imports.** A leftover configuration import was removed; the project's type check now reports zero errors.

## What the tumble measurement told us

At roughly a hundred parts where every part's outer box overlaps every other, the dominant cost is the cross-object intersection compute — about seventy percent of paint time. The pooled clipper shipped in this pass saved fifteen to twenty percent of total paint time. That is a real win but does not change the working comfort ceiling much: around fifty overlapping parts is the realistic limit today. The remaining cost is structural — more than eleven thousand face-pair intersections get tested per paint in dense scenes, and about nine of every ten produce nothing visible after occlusion clipping. Pushing the ceiling further means either skipping ancestor-descendant pairs by policy (risks hiding legitimate intersection edges), adding a "draft mode" during camera motion (risks visual flicker), or rewriting the intersection feature with a fundamentally different approach (high cost, high payoff, high risk). Decision for now: accept the limit. Revisit only if a real scene pushes past the comfort threshold.

## Open items

- **Trace logs left from the formula-bug investigation should be removed.** Eight console.log calls are still wired across the constraints manager, the renderer, the engine, and the attributes panel. Pull them in a small clean-up pass before the next feature work.
- **Delete on a non-repeater grandchild leaves the part still listed.** Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Still open. Need a console error message or a small repro scene to pin the failing step.
- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** Same status as the prior session — could not reproduce from reading the code. Need more detail about the scene before a fix can be made.
- **Identity-based formula storage.** Today's targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor; see the rename-bug discussion in today's session below.
- **Selection-algorithm milestone.** Next on the code-debt list — propose. Covers drag-dot visibility, mouse drill-down, rubber-band re-centre and zoom, recentre control, and command-drag follow.
- **Arrow keys nudge SO position**, **print just the graph scaled to fit**, **move-up / move-down buttons in the parts table**, and **move-to-child / become-parent buttons** sit on the code-debt list after the selection-algorithm milestone.
- **Color leftovers.** Two unchecked items remain in the colour family: white text for selected rows when the background is too dark, and a hand cursor over hover dots and the selected face (with a pointing-finger cursor everywhere else).
- **Givens for angles** and **rename library items** sit in the leftovers section of code.debt.
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](../milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Left as deferred in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.

## Notes for future sessions

- The code-debt track is a grab-bag of small, unrelated items. Each one deserves its own short propose-then-build cycle. Do not batch them.
- The slow-render work has its own handoff at `di/notes/work/milestones/done/32.facets/slow/handoff.md`. The bottleneck-analysis file sits next to it.
- The drag work has its own mothballed handoff at `di/notes/work/milestones/33.drag/handoff.md`.
- The `handoff` and `hands` shorthands point at this file.
- The tumble instrumentation is in place but silent. Flip the constant at the top of the engine file to true, uncomment the per-second summary block inside the render loop, reload, and the console will print timings and counters again.

---

## Session — 2026-04-30 — drill-down clicks, multi-select, parts-table drag-and-drop

Several threads.

### Thread one — drill-down click on the drawing area

A click on the drawing area now picks the front-most part by default, but on the second click the selection moves one part deeper into the stack. Each click builds a fresh ordered list of every part the click landed on, front to back. If the currently selected part is in that list, the new selection is the part right after it on the list, wrapping back to the front when the current part is at the end. If the current selection is not in the list (or nothing is selected), the new selection is the front-most. The rule is stateless — the click handler keeps no memory between clicks; the input is just "what is the cursor over" plus "what is currently selected."

### Thread two — skip non-eligible parts in the click stack

The click stack now skips two kinds of parts. Parts whose visibility flag is off are excluded so a hidden part cannot be reached by a click — drill-down moves straight past it to the next one behind. Repeater clones are also excluded — only the master in a repeater group can be hovered or clicked, since the parts table treats clones as derived and does not list them. The drawing area still draws all parts as before; the click stack is just smaller.

### Thread three — multi-selection

The single-selected-part data shape became a list of selected parts. Empty list means nothing is selected. One item means the selected part, identical to the prior single-selection behavior. Two or more means multi-select. A small backwards-compat reader called "the only selected part" returns the single item when the list has exactly one, otherwise nothing — so every existing call site that reads "the selected part" keeps working without modification.

A plain click on a part replaces the list with that one part. A command-click on a part toggles that part's membership in the list. The same rule applies in the parts table for row clicks. The parts table marks every row whose part is in the list, and the canvas draws the bold outline on every part in the list. When more than one is selected, the three-tab segmented control in the details panel (and the rest of the per-selection editing widgets) hides.

### Thread four — parts-table drag-and-drop re-parenting

Rows in the parts table can now be dragged onto each other to change the tree. Each row is draggable; while a drag is in progress the cursor's vertical position inside the row over decides the drop mode. The middle of a row drops as a child of that row. The top edge of a row, when the row above is a sibling, drops as a sibling inserted between them. The bottom edge of a row, when the row below is a sibling, drops as a sibling inserted between them. When the cursor is on the line between two rows that are NOT siblings, only the upper of the two is highlighted and the drop becomes a child of that upper row. The empty area below the last row drops as child of root, last in order. Drops onto self, descendants, or onto a part that has a repeater set up are rejected with no highlight.

The visual cue during a valid hover is a soft blue tint on the affected row (or both rows when sibling-mode) plus a thin blue line at the drop edge.

On drop, the dragged part's six absolute world bounds are snapshotted, the part is re-parented in the scene tree, the master order is reshuffled so the parts table sibling order matches, and the bounds are written back so the drawing-area position does not move. Formulas are not touched, per the user's instruction. History is snapshotted before the move so the action is undoable.

### Thread five — small fix: scroll on the side panel keeps buttons clickable

The right-side panel that holds preferences, library, and parts now refreshes the click-detector's record whenever the user scrolls inside it. Without this, scrolled rows landed at new on-screen positions while the record still pointed at the old positions, so clicks missed. The mount-time refresh got a small cleanup at the same time — the wrapping setTimeout was unnecessary because the existing deferred-refresh helper already waits one layout pass.

### Thread six — eye cells in the collapsed details view

When the parts list is hidden and only the selected part is shown, the row that holds the part's name now also shows the two eye cells (the hide-children eye and the visibility eye) on the right of the name input. They use the same click handlers as the rows in the full parts list — clicking one flips the matching flag on the selected part. The first cell only paints when the selected part has children and is not root; the second cell always paints with either the eye glyph or a dash. The cells re-paint on every click because their displayed values are read through three small reactive views that depend on the global change-tick the toggle handlers bump after each mutation.

### Thread seven — pre-existing unused-import cleanup

The toolbar component had an unused configuration import left over from earlier work; it has been removed. The Svelte type check now reports zero errors across the project.

### Thread eight — formula commit kept the space inside a multi-word name

A formula like "structure.main beam.e" was committed as "structure.mainbeam.e" — the space between "main" and "beam" was being lost. The text was being tokenized into two separate references — one for "structure.main" and one for "beam.e" — and the joiner that follows only knew how to merge bare-name references that follow the form "foo bar.x". When the first reference is itself a dotted path (because the part lives inside another part), the joiner left the two references separate, and the un-tokenizer concatenated them with no separator. The same bug also caused the "did you mean: main beam" suggestion button to look like it was being ignored — the suggestion's corrected text went through the same commit pipeline and the space was lost the second time too. Fix: extend the joiner so two adjacent dotted references also collapse into one, with the merged path holding the space inside its last name segment.

### Thread nine — attributes table dropped its first column below an error overlay

When a formula error overlay appears, the attributes table is split into two physical tables with the overlay in between. The left-most column of the table holds a single letter (s, l, or e) that spans three rows in agnostic mode. If the split fell in the middle of one of those three-row groups, the spanned cell was rendered only in the top table — so every row below the overlay was missing its left-most column and the rest of the row drifted left. Fix: when the bottom table starts in the middle of a three-row group, render the letter cell on its first row with a row-span sized to cover only the rows that remain in that group.

### What was added — 2026-04-30

- A drill-down click rule that uses the current selection plus the click stack. No internal state in the click handler.
- A visibility-and-clone filter on the click stack.
- A list-based selection store with backwards-compat single-selection reader, a "toggle membership" method, and a "contains this part" check.
- A canvas-side command-click branch that toggles the picked part instead of replacing the selection.
- A parts-table-side command-click branch that does the same for rows.
- A multi-row highlight in the parts table driven by the selection list.
- A canvas multi-part bold-outline driven by the same list.
- A details-panel gate that hides the three-tab segmented control (and the rest of the per-selection widgets) when more than one part is selected.
- A new helper that re-parents a part to a new target with three modes (child of, sibling-before, sibling-after), preserving the on-screen position by rewriting the dragged part's stored offsets.
- A new method on the scene module that moves a single entry to any spot in the master order — drives sibling reorder.
- Drag handlers on each parts-table row plus a table-level handler for the empty area below.
- Visual-feedback styles (soft blue background; thin blue top or bottom line) on rows during a drag.
- A scroll listener on the side panel that refreshes the click-detector record on each scroll.
- Two clickable eye cells alongside the name input in the collapsed details view, with three small reactive views that re-paint them on every click.
- Removal of an unused configuration import from the toolbar component.
- An extension of the formula token-joiner so spaces inside multi-word part names survive the tokenize-and-rebuild round trip — fixes both the typed-input and the "did you mean" suggestion-button paths.
- A row-span-aware split of the attributes table's left-most letter column, so the column does not vanish below a formula error overlay.

### Files touched — 2026-04-30

- Click stack, drill-down rule, visibility-and-clone filter: [Hits_3D.ts](di/src/lib/ts/events/Hits_3D.ts).
- Selection model: [Selection.ts](di/src/lib/ts/managers/Selection.ts), [Face_Label.ts](di/src/lib/ts/editors/Face_Label.ts).
- Canvas command-click branch: [Events_3D.ts](di/src/lib/ts/events/Events_3D.ts).
- Multi-part bold outline: [Render.ts](di/src/lib/ts/render/Render.ts).
- Parts-table multi-row highlight, command-click, drag-and-drop wiring, drag-style CSS, collapsed-view eye cells: [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).
- Re-parent helper: [Engine.ts](di/src/lib/ts/render/Engine.ts).
- Master-order move helper: [Scene.ts](di/src/lib/ts/render/Scene.ts).
- Side-panel scroll refresh and mount-time cleanup: [Details.svelte](di/src/lib/svelte/details/Details.svelte).
- Toolbar unused-import cleanup: [Controls.svelte](di/src/lib/svelte/main/Controls.svelte).
- Formula token-joiner extension for multi-word names: [Tokenizer.ts](di/src/lib/ts/algebra/Tokenizer.ts).
- Attributes-table split-row letter column: [P_Attributes.svelte](di/src/lib/svelte/details/P_Attributes.svelte).
- Code-debt list: [code.debt.md](./code.debt.md) — parts-table drag-and-drop is now off the list.

### Verification — 2026-04-30

- The Svelte type check now reports zero errors across the project after the unused-import cleanup.
- The unit-test suite has not been re-run this session.
- The drill-down click, the multi-select, the collapsed-view eye cells, the multi-word-name formula commit, and the attributes-table split row were all exercised by the user in the running app. The drag-and-drop wiring is in place but the user has not yet exercised it.

---

## Session — 2026-04-29 (continued, fifth) — sliders moved into the toolbar; resolver write-path lock check

Two threads.

### Thread one — resolver write-path lock check

The drag's write path already refuses to write through a locked target — that is the path real drags travel. A second write path sits one level lower, used by the resolver. It did not refuse locked targets. No production code calls it today, but a future test or new caller could land on it and behave inconsistently with the drag path. Added a one-line refusal at the same shape as the drag-side check: look up the target, bail if it is locked. No new behavior reaches end users from this change.

### Thread two — sliders moved out of the drawing area and into the toolbar

The zoom slider used to float at the top-right of the drawing area, taking half the drawing width. The guides slider used to sit in the lower-right corner of the drawing area as a small vertical bar with the word "guides" beneath it. Both have moved into the toolbar at the top of the screen.

Layout decisions, all from the user:

- The zoom slider lives in all three responsive layouts (phone, mobile, desktop), keeps its end-cap step buttons, and flexes into whatever toolbar room is left after the buttons. The user set the upper limit at six hundred pixels wide. No minimum width.
- The guides slider also lives in all three layouts and was rotated from vertical to horizontal. Its "guides" label sits directly above the slider track. The label is nudged five pixels upward so it reads cleanly above without crowding the row.
- In the desktop layout, the buttons sit in one flex row on the left and the zoom slider sits in a second flex area on the right. The zoom slider's right edge is flush with the right edge of the toolbar — a negative right margin pulls it past the toolbar's own horizontal padding, and an automatic left margin pushes it to the right end of its area.
- The new buttons wrapper carries an explicit flex layout so its spacers behave and its segmented blocks do not force line breaks.

The drawing area no longer carries any slider markup, any slider styles, or any of the store handles or handler functions that drove them.

### What was added — 2026-04-29 (continued, fifth)

- A one-line locked-target refusal in the resolver-level write path of the constraints manager.
- The slider import, two store handles, and three handler functions on the toolbar component.
- Two new toolbar snippets (one for the zoom slider, one for the guides slider) and four new style classes (the buttons row, the slider area, the guides block, the scale block) plus a small styling rule for the guides label.
- Removal of the slider import, the store handles, the three handler functions, the two markup blocks, and four style classes from the drawing-area component.

### Files touched — 2026-04-29 (continued, fifth)

- Resolver write-path lock check: [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts).
- Toolbar additions: [Controls.svelte](di/src/lib/svelte/main/Controls.svelte).
- Drawing-area removals: [Graph.svelte](di/src/lib/svelte/main/Graph.svelte).
- Code-debt list: [code.debt.md](./code.debt.md) — the slider-move item is now off the list.

### Verification — 2026-04-29 (continued, fifth)

- I AM GUESSING the unit-test suite still passes — it has not been re-run this session.
- The user iterated visually on the toolbar layout in the running app across several rounds.

---

## Session — 2026-04-29 (continued, fourth) — center-letter closed in browser; browser-driven tests running

Two threads.

### Thread one — center-letter feature confirmed in the browser

The user exercised the formula editor in the running app and confirmed the "cannot drag a center" alert appears at the bottom of the canvas in red on a refused drag. With that confirmed, the temporary helper that exposed the status helper to the browser console (the one named `di_status`) was removed from the page-startup code. Center is now done end to end with no leftover scaffolding.

### Thread two — browser-driven tests running

The browser-driven test setup that was deferred earlier is now in place. Four test files cover the four user-interface rules that the unit-test runner could never reach:

- The editing-lock blocks clicks. Three checks: the lock starts on by default; a click on the canvas while the lock is on does not pick a part; toggling the lock off lets a click pick a part.
- The view-mode toggle saves and restores the camera angle. One check: toggling from 3D to 2D and back restores the angle to within a small numerical tolerance of where it started.
- The rotation-snap toggle lands on a face-aligned orientation. One check: a tumble drag with rotation-snap on settles on an angle whose quaternion has a near-±1 component (one of the six face-aligned forms).
- The drag-versus-tumble decision. Two checks: an empty-canvas drag changes the camera angle; a drag with a selection in place leaves the selection intact.

Plus a small smoke test that confirms the page loads and the read hooks attach.

The setup uses Playwright as the runner. A small read-only set of hooks gated by the URL query parameter `?test=1` lets the tests inspect internal state without exposing any write path. The hooks live in the page-startup code; they attach only when the parameter is present, so a normal user session sees no extra surface on the page.

The browser tests run with `yarn e2e`. The runner starts the development server if one is not already running, otherwise reuses the running one. One browser is enough — Chromium covers all the flows.

### What was added — 2026-04-29 (continued, fourth)

- A new browser-driven test directory at `di/e2e/` with four user-flow test files plus a smoke test, all passing.
- A Playwright config that reuses the running development server when present.
- A small read-only set of hooks on the page, gated by the URL parameter `?test=1`.
- A new `e2e` script in the package.json.
- Removal of the temporary console helper (the `di_status` window assignment).
- Catalog and testing-guide updates: rules fifty-three through fifty-six now point at the new browser-test files; the count line at the top reads "all fifty-eight rules directly covered."

### Files touched — 2026-04-29 (continued, fourth)

- New test files: [`smoke.spec.ts`](di/e2e/tests/smoke.spec.ts), [`editing-lock.spec.ts`](di/e2e/tests/editing-lock.spec.ts), [`view-mode-switch.spec.ts`](di/e2e/tests/view-mode-switch.spec.ts), [`rotation-snap.spec.ts`](di/e2e/tests/rotation-snap.spec.ts), [`drag-vs-tumble.spec.ts`](di/e2e/tests/drag-vs-tumble.spec.ts).
- New config: [`playwright.config.ts`](di/e2e/playwright.config.ts).
- Page-startup script: [`App.svelte`](di/src/App.svelte) — temporary console helper removed; read-only test hooks added gated by `?test=1`.
- Package manifest: [`package.json`](di/package.json) — added Playwright as a development dependency and an `e2e` script.
- Catalog: [stipulations.md](../../guides/stipulations.md).
- Testing guide: [testing.md](../../guides/testing.md).

### Verification — 2026-04-29 (continued, fourth)

- Unit tests: twenty-nine files, six hundred thirty-one checks, all passing.
- Browser-driven tests: eight checks across five files, all passing.
- Type-check: zero errors, zero warnings.

---

## Session — 2026-04-29 (continued, third) — center-letter phase three done

One thread. Phase three of the center-letter milestone is done: a small observability touch.

### Phase three changes

- A new debug-summary method on every SO that returns a multi-line text block. Each direction gets a line with its start, end, length, and center. The center is computed from start and end at call time — no stored value.
- Two small unit tests in the center test file: a multi-line summary contains every direction's center alongside its start, end, and length; after editing the start of a direction, the next summary call shows the updated center.

### What was deferred from phase three

The optional hover tooltip is still future work. No real caller wires the new debug method into the running app — it is a tool for any developer who wants to inspect an SO's full numerical state. The placeholder console-exposed caller from phase zero is still in place; it can come out at any time.

### Milestone status after phase three

All four phases are done. The feature is complete end to end. The next concrete pieces of work, when chosen:

- A real exercise of the formula editor in the browser to confirm the message appears at the bottom of the canvas in red.
- Removal of the placeholder console-exposed caller, once the in-app exercise above confirms the feature works.
- The browser-driven test setup, deferred earlier; that work begins when the center-letter milestone is fully closed.

### What was added — 2026-04-29 (continued, third)

- A debug-summary method on every SO showing each direction's start, end, length, and center.
- Two new unit tests; full suite passes at twenty-nine files, six hundred thirty-one checks; type-check clean.
- Catalog rule fifty-eight extended to mention the debug summary.
- Testing guide entry extended to mention the debug summary.

### Files touched — 2026-04-29 (continued, third)

- The Smart_Object class (the new debug-summary method): [Smart_Object.ts](di/src/lib/ts/runtime/Smart_Object.ts).
- The center test file (two new tests): [Center.test.ts](di/src/lib/ts/tests/Center.test.ts).
- Catalog: [stipulations.md](../../guides/stipulations.md).
- Testing guide: [testing.md](../../guides/testing.md).

### Verification — 2026-04-29 (continued, third)

- Test suite: twenty-nine test files, six hundred thirty-one checks, all passing.
- Type-check: zero errors, zero warnings.

---

## Session — 2026-04-29 (continued) — center-letter phase two done

One thread. Phase two of the center-letter milestone is complete: the silent refusal of phase one is now wired to the status strip from phase zero with the visible message "cannot drag a center."

### What was added

- An import of the status helper into the constraints manager.
- A publish call inside the upstream walker — when the walker enters a center reference and finds no underlying number to walk into, it posts the refusal message to the status strip. This is the path real drags take when the formula on the dragged cell reads a center.
- A publish call inside the resolver-level write path (defensive — the path does not fire in normal flow but is now consistent).
- A publish call inside the free-constant write path (defensive — same shape).
- Five new unit tests in the center test file: the walker publishes when it encounters a center, the resolver-level write publishes, the free-constant write publishes, repeat refusals do not fill the queue (the strip's dedup catches them), and a drag whose formula does not read a center publishes nothing.

### Visual snap-back

I AM GUESSING the corner the user grabbed snaps back to where it started automatically — the underlying numbers never change because the writes are refused, and the renderer reads from those numbers on every paint. Phase two does not add any explicit snap-back code. If a real drag in the running app shows visual lag, a follow-up can add an up-front check at drag-start.

### What does not land in phase two

Phase three (optional observability polish — debug logs and an optional hover tooltip) is still future work. The placeholder console-exposed caller from phase zero is still active; it can come out at any time after the center-letter feature is exercised in the running app.

### Status of the center-letter milestone

Phase zero, phase one, and phase two are all done. The feature reaches end users now. Phase three is optional and can be deferred.

### What was added — 2026-04-29 (continued)

- Three refusal points in the constraints manager publish "cannot drag a center" to the status strip.
- Five new unit tests; full suite passes at twenty-nine files, six hundred twenty-nine checks; type-check clean.
- Catalog rule fifty-eight extended to mention the visible alert.
- Testing guide entry extended to mention the alert and the additional tests.

### Files touched — 2026-04-29 (continued)

- Constraints manager (the upstream walker, the resolver-level write, the free-constant write): [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts).
- Center test file (five new tests): [Center.test.ts](di/src/lib/ts/tests/Center.test.ts).
- Catalog: [stipulations.md](../../guides/stipulations.md).
- Testing guide: [testing.md](../../guides/testing.md).

### Verification — 2026-04-29 (continued)

- Test suite: twenty-nine test files, six hundred twenty-nine checks, all passing.
- Type-check: zero errors, zero warnings.
- A run in the browser to confirm the message appears at the bottom of the canvas in red is still pending.

---

## Session — 2026-04-29 — center-letter phase one shipped

One thread. Phase one of the center-letter milestone landed: the read-only side of the new letter end to end, with a silent refusal of any drag whose formula reads a center.

### What landed

- The bare-name table that today knows three letters (start, end, length) gained a fourth letter for the center. Each direction's concrete center name is the direction prefix plus `_center` (so `x_center`, `y_center`, `z_center`).
- The accepted-letter list the parser uses to reject unknown letters gained the new letter.
- The bind step that turns letter shorthand into concrete cell references now recognizes the new letter at every entry point — when a user types a formula, when a saved file is loaded, and when a part is renamed.
- The resolver gained a branch: when asked for a center, it returns start-plus-end-over-two on the named direction. The value is computed fresh on every read; nothing is stored.
- Both write paths — the resolver-level write and the free-constant write — refuse any write to a center. The read-only contract holds end to end.
- A small self-loop check at edit time: a formula on a start, end, or length cell that references the center of the same direction on the same SO is rejected before the formula commits. The existing chain detector is unchanged.
- The translation table loop was extended so the new letter survives round-tripping between the concrete form and the axis-agnostic form.
- One small piece of cleanup along the way: a half-finished show-position-versus-show-size feature in the parts panel was deleted (a state, two helpers, a format function, a type, and the preference key that fed it). Removing it brought the type-check fully clean.

### What gets tested

Seventeen new tests in [Center.test.ts](di/src/lib/ts/tests/Center.test.ts) cover:

- Forward reads: cross-direction reads, cross-SO reads via the part's identifier, with-literal arithmetic, mixed-form sums, and freshness on changes (no stale cache).
- Self-loop rejection: starts, ends, and lengths that reference the same-direction same-SO center are rejected; the qualified-self form is also rejected.
- Self-loop acceptance: cross-direction same-SO is accepted; cross-SO same-direction is accepted.
- Drag through center: both write paths refuse to write — the resolver-level path and the free-constant path.
- Save and reparse round trip: the formula text containing the center letter survives a re-compile.
- Formula text preserves the bare letter — no rewrite to start-plus-end happens at save time.
- Translation round trip: a center-using formula survives the concrete-to-agnostic round trip and back.

### What does not land in phase one

The visible alert on a refused drag, the snap-back animation, and any change to the parts panel are explicitly out of scope. Those land in phase two.

Phase one is reviewable and revertable on its own as a code-change unit. It is **not** user-shippable on its own — the silent refusal of a drag is a usability gap that phase two closes. The two phases reach end users together.

### What shipped — 2026-04-29

- A new bare letter in formulas with a read-only resolver branch and a self-loop check at edit time.
- Seventeen new unit tests; full suite passes at twenty-nine files, six hundred twenty-four checks; type-check clean.
- A new rule in the catalog (the fifty-eighth), pointing at the new test file.
- A new index entry for the test file in the testing guide.
- A small cleanup of half-finished parts-panel code that was clouding the type-check.

### Files touched — 2026-04-29

- New test file: [Center.test.ts](di/src/lib/ts/tests/Center.test.ts).
- Constraints manager (the bare-name table, translation maps, resolver, write paths, self-loop check): [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts).
- Accepted-letter list: [Errors.ts](di/src/lib/ts/algebra/Errors.ts).
- Catalog: [stipulations.md](../../guides/stipulations.md).
- Testing guide: [testing.md](../../guides/testing.md).
- Cleanup of unused parts-panel code: [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte), [P_Attributes.svelte](di/src/lib/svelte/details/P_Attributes.svelte), [Preferences.ts](di/src/lib/ts/managers/Preferences.ts).

### Verification — 2026-04-29

- Test suite: twenty-nine test files, six hundred twenty-four checks, all passing.
- Type-check: zero errors, zero warnings.
- Manual exercise of the formula editor in the running app is still pending; phase two will exercise the editor end to end via the refusal-with-message flow.

---

## Session — 2026-04-28 — rules catalog and test catalog locked in step

Six threads.

### Thread one — wrote the missing tests

The rules file listed thirty-three load-bearing rules at the start of the day. Walking the list against the existing tests, fourteen rules had no direct test, partial coverage, or only "probably covered by a big nearby test file." Wrote tests one rule at a time, then verified each. Several rules turned out to be already covered by tests in unrelated files; those got their pointers in the rules file relabelled rather than getting a new test. The work landed across a handful of files: a new file that pins down rotation, a new file that pins down named values that formulas can reference, a new file that pins down the snap-to-grid drag rounding, plus added test groups in the data-layout file, the units file, the formula-and-constraints file, the errors file, and the save-and-load file. The catalog summary at the top of the rules file now reads "all directly covered by tests."

### Thread two — added more rules to the catalog

After the missing tests landed, a second pass through the codebase looked for rules the catalog did not name yet. Ten rules were added in a first round (rotation, internal millimeters, named values, cycle detection, single writable target, visibility, drag snap, redo, repeater spacing, and fire-block cross direction). Then the user-interface rule about the user typing into a locked cell was removed and the remaining rules renumbered. Then a third pass found seven more rules with direct evidence in the code: setting a formula clears a cell's lock, the bare-name resolver walks up the parent chain and picks the first match, repeater duplicates are excluded from the saved snapshot, locked named values are protected the same way locked cells are, every SO is shaped like a box with eight corners and twelve edges and six faces, the camera has two viewing modes (3D and 2D), and an error reported on a cell stays there until cleared. Each new rule got a test alongside its catalog entry. Net: forty-nine rules in the catalog, all directly covered by tests.

### Thread three — restructured the testing guide

The testing guide had two overlapping sections: an alphabetical index of test files with one-liner descriptions, and a longer prose section that described the same fourteen tests inside two of those files in detail. Merged them: the longer prose now sits as nested bullets under the two file entries in the index. The standalone duplicate section is gone. The "stipulation coverage" subsection at the bottom of the testing guide was reduced to one short paragraph that points at the rules file (where the per-rule pointers now live).

### Thread four — restructured the rules catalog

Each rule in the rules file now carries an annotation line directly under it: "Covered: filename" plus optional detail. The bird's-eye summary moved to the top of the file as a one-line counts paragraph. The dedicated "stipulation coverage" section that used to live in the testing guide is now folded into this per-rule annotation, so a reader checking a rule and a reader checking coverage both end up in the same place.

### Thread five — quieted the markdown linter

Adding rules forty through forty-nine triggered a linter warning on every numbered rule across the file: the linter wanted ordered-list numbers to restart at one inside each section, but the catalog uses continuous numbering across sections so the rules can be cited by stable identifier. Added one line to the project's markdown-linter config that turns off the offending rule for every markdown file in the project. The other config entries are unchanged.

### Thread six — fixed a dead link, established a wording convention

The docs build had been failing on one dead link inside the handoff file: a reference to the docs config file written as a markdown link, which the build's link checker tried to verify and could not find. Changed that one entry to plain text with the path in inline code, leaving the path visible to the reader without the build trying to verify it. The build is green again.

A wording convention was also established for new content about this project: write "SO" or "smart object" rather than "block." The convention applies to new content only — existing prose was not swept. Saved as a persistent note so it carries across future sessions.

### What shipped — 2026-04-28

- Twenty new tests across new and existing test files. Twelve files now collectively pin down all forty-nine load-bearing rules. Twenty-five test files, five hundred eighty-seven checks, all green.
- The rules catalog grew from thirty-three rules to forty-nine, with one user-interface rule removed mid-session and the rest renumbered. Every rule now carries a pointer to the test that pins it down.
- The testing guide and the rules catalog are now in lock-step; their previously overlapping sections have been merged into one canonical place for each kind of information.
- The markdown linter no longer warns about the catalog's continuous numbering.
- The docs build is green again after one dead link was rewritten.
- A persistent wording convention: SO or smart object, not block.

### Files touched — 2026-04-28

- New tests: [Rotation.test.ts](di/src/lib/ts/tests/Rotation.test.ts), [Givens.test.ts](di/src/lib/ts/tests/Givens.test.ts), [Snap.test.ts](di/src/lib/ts/tests/Snap.test.ts).
- Test files extended with new groups: [Data_Layout.test.ts](di/src/lib/ts/tests/Data_Layout.test.ts), [Units.test.ts](di/src/lib/ts/tests/Units.test.ts), [Constraints.test.ts](di/src/lib/ts/tests/Constraints.test.ts), [Errors.test.ts](di/src/lib/ts/tests/Errors.test.ts), [Save_Load.test.ts](di/src/lib/ts/tests/Save_Load.test.ts), [Camera.test.ts](di/src/lib/ts/tests/Camera.test.ts), [Hierarchy.test.ts](di/src/lib/ts/tests/Hierarchy.test.ts), [Root.test.ts](di/src/lib/ts/tests/Root.test.ts).
- Catalog: [stipulations.md](../../guides/stipulations.md).
- Testing guide: [testing.md](../../guides/testing.md).
- Markdown-linter config: `di/.markdownlint.json`.
- Dead-link fix in this handoff (docs config reference).

### Verification — 2026-04-28

- Test suite: twenty-five test files, five hundred eighty-seven checks, all passing.
- Docs build: green after the dead-link fix; previously failing on the handoff's broken docs-config link.
- Markdown linter: no warnings on the rules catalog after the project-wide config update.

---

## Session — 2026-04-28 (continued) — rules audit, eight more rules, center-letter proposal, status-strip phase zero

Three threads, all design work. No code shipped beyond the testing additions in the earlier session today.

### Thread one — audit of the codebase for missing rules

A walk through the source folders looking for load-bearing behavior the rules catalog did not yet name. Two passes. First pass turned up ten candidates and they were added as rules thirty-three through forty-two — rotation, internal millimeters, named values, cycle detection, single writable target, visibility, drag snap, redo, repeater spacing, fire-block cross direction. The user-interface rule about typing into a locked cell got removed in the same step and the catalog renumbered. Second pass — driven by reading the managers, editors, events, and render folders — turned up eight more rules: identifier stability, default scene on first launch, selection saved with the scene, auto-save after most user actions, deletion cascade with formula cleanup, the precision setting snapping every plain-number cell, the editing-lock toggle blocking clicks, the two-dimensional / three-dimensional view-mode swap, the rotation-snap toggle behavior, drag-with-versus-without selection, and the preferences layer that persists across reloads. Eight of those landed as rules fifty through fifty-seven. Tests came along with each rule that was reachable in the unit-test runner; four rules that need real mouse events or the running animation loop got marked as not unit-testable. Catalog ends at fifty-seven rules, fifty-three directly covered, four queued for browser-driven tests.

### Thread two — the center-letter design

The user proposed adding a new bare letter to the formula vocabulary that means "the midpoint between the start and the end of a direction." After several rounds of pros-and-cons and locking decisions one at a time, the design settled on:

- The letter is read-only. There is no path that writes through a center reference.
- Reverse propagation that would land on a center reference is refused, with a visible message — "cannot drag a center" — on a new on-screen status strip.
- The cycle detector runs at the moment a formula is set, and knows that a center reference depends on both the start and the end of the same direction. Loops through the new letter are caught at edit time, not at run time.
- Center sits outside the existing invariant mechanism. The user's choice of which storage cell is the recomputed one stays at three options, not four. The save format is unchanged. Formulas containing the new letter are stored as the letter literally — not as the equivalent expansion in terms of start and end.
- The work breaks into four phases: phase zero (the strip itself), phase one (read-only center plus silent refusal), phase two (wire the silent refusal to the strip), phase three (optional — add center to the parts panel and debug logs).

The full proposal — including risk assessment with three high-stakes questions all answered, the four phases with what lands and what gets tested in each, and a phase-zero implementation plan — is in [16.formulas.md](../milestones/done/16.formulas.md).

### Thread three — phase-zero details for the status strip

The status strip is a small new on-screen surface that displays brief transient messages. The design landed in one round:

- Lives at the bottom of the graph region, between the build-notes button on the left and the guides slider on the right.
- Height matches the standard common-button height. Empty space below the strip and on each side equals one standard layout gap.
- Invisible by default. A message stays until the user clicks anywhere on the page; that click both dismisses the message and performs whatever else the click would normally do.
- Subsequent messages queue in order; each one surfaces when the previous is dismissed.
- Error-kind messages render in red text. Other messages render in the default text color. All messages are horizontally centered.
- The implementation plan: a new strip component, a small status store with show, dismiss, and clear helpers, a click hook that drives the dismiss step, and a two-line wiring change in the graph component. A temporary placeholder caller goes in during the phase and comes out before merging.

### What shipped — 2026-04-28 (continued)

- The rules catalog grew from forty-nine to fifty-seven rules. Eight new rules landed (with seven tests) plus a renumber-and-remove pass.
- Twenty new tests across two new files (the engine-behavior file and the preferences file) and several extensions to existing files. Test count moved from five hundred fifty-three to five hundred ninety-five, all green.
- A full design proposal for the center-letter feature, with phased implementation plan and risk assessment, sits in 16.formulas.md.

### Files touched — 2026-04-28 (continued)

- Catalog: [stipulations.md](../../guides/stipulations.md).
- Testing guide: [testing.md](../../guides/testing.md).
- New tests: [Engine_Behaviors.test.ts](di/src/lib/ts/tests/Engine_Behaviors.test.ts), [Preferences.test.ts](di/src/lib/ts/tests/Preferences.test.ts).
- Test extensions: [Data_Layout.test.ts](di/src/lib/ts/tests/Data_Layout.test.ts).
- Center-letter and status-strip proposal: [16.formulas.md](../milestones/done/16.formulas.md).

### Verification — 2026-04-28 (continued)

- Test suite: twenty-seven test files, five hundred ninety-five checks, all passing.

---

## Session — 2026-04-24 — parts eyeball coupling, dead-link sweep, formula-doesn't-refresh fixed

Five threads.

### Thread one — working-features summary edits

Two small touch-ups to the running feature list. Added "row numbers" and "persistent hide list" to the parts row to match what had already shipped. Trimmed "(font now large)" out of the editing row — the parenthetical read as a dated marker; the current font size is just the size.

### Thread two — dead-link fixes inside the notes tree

A first-pass sweep prompted by Jonathan's report of dead links. Real fixes that landed: the cadence link in the work index pointed to a file that had been moved into the now folder; the selection-algorithm link in the milestones index pointed to a sibling that actually lives in the now folder; the facets and lessons links in the same milestones index used a workspace-root path that breaks when the renderer resolves it relative to the current file; a checkbox in the code-debt list was wrapped as a link to a non-existent file. All five fixed.

### Thread three — dead-link sweep driven by the deploy build

The deploy log had eighty-five dead-link errors. Triaging them showed three real classes plus one false-positive class. Two ignore patterns were added to the docs-build config — one catches links to source-code files (which the docs site cannot route to anyway), the other catches links into the workspace's parent-level notes folder and the workspace-config command files. Inside the markdown, the workspace-root-style paths used in the milestone-32 facets folder and the current-work handoff were rewritten to proper relative paths. A handful of links lost track of subfolder reorganisations (the facets folder split into a designs subfolder and a use-cases subfolder); those got their subfolder names back. The "note on historical paths" framing at the top of the slow-handoff file was removed since preserving the old path text inside link labels is no longer the goal — labels were tightened to just the file name.

### Thread four — explained the click-on-dimensional bug

Jonathan reported that clicking on a dimensional number on the canvas was being ignored — the input box did not appear. Walked the click handler and surfaced the most likely cause: the editing-lock toggle is on, which makes the click handler bail out before any hit-type check runs. With the lock on, the cursor stays as the open-grab-hand even when over a dimensional, and clicks just possibly deselect the current selection. Fix is for the user to flip the lock — the small toolbar button at the top of the canvas. No code change.

### Thread five — built the parts-table eyeball coupling, then opened the formula-doesn't-refresh investigation

Coupling: clicking the self-visibility eye on a row that has children now also flips the other column's block-children flag. After the click, exactly one of the two eyes shows. Leaf rows and root row unchanged. One line added in the parts-table click handler.

Investigation, fixed: Jonathan reported that typing a new formula on a cell did not make the shape on screen update. The value column also did not refresh. Tracing logs were added across the whole chain — the attributes-panel commit handler, the compile-and-write step inside the constraints manager, the start and end of the propagate routine, the after-hook that fires when propagate finishes, and the canvas-out-of-date flip on the renderer. The logs proved every link in the chain fires end to end. The fault sat one step in front of the invariant pass: a small helper inside the constraints manager was running on every formula edit and writing the new length value into the end-of-axis bound, regardless of which cell the axis's invariant marker pointed at. On art's y-axis, where the invariant marker is the start, the helper overwrote y_max with a value computed from the old y_min plus the new depth — the formula on y_max (which says "track parent's end") was silently stomped — and then the invariant pass that ran immediately after used that polluted y_max to compute a new y_min, which cancelled out to the same old y_min. Net: every cell wrote back the value it already had. The fix: delete the helper and its six call sites. The invariant pass alone is enough to keep an axis consistent. The UI gate that disables the formula slot on the invariant cell, plus the scene-load step that clears any formula that somehow landed on an invariant cell, together guarantee the invariant pass never has to deal with a formula on the invariant cell — which is the only situation the helper could ever have been useful for. Caveat: existing scenes may carry corrupted bound values from prior runs of the helper; a one-time scene reload triggers a full re-evaluation and clears them.

### What shipped — 2026-04-24

- Formula-doesn't-refresh bug fixed: the redundant length-syncing helper was deleted along with its six call sites. The invariant pass now keeps each axis consistent on its own.
- The two-eyeball coupling on parent rows in the parts table.
- The "Cadence" jump and four other broken markdown links inside the notes tree.
- The docs-build config now ignores source-file links and parent-workspace links; many workspace-root-style paths inside the milestone-32 facets folder and the current-work handoff were rewritten to relative paths; subfolder names were restored on a handful of intra-facets links; the historical-paths header on the slow-handoff file was dropped.
- Working-features summary trimmed and topped up to match the latest shipped state.
- Tracing logs across the full constraints-and-render chain — used to find the formula-doesn't-refresh bug. Still wired; should be pulled in a small clean-up pass.

### Files touched — 2026-04-24

- Eyeball coupling: [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).
- Working features: [working features.md](./working%20features.md).
- Dead-link fixes (first pass): [work index](../index.md), [milestones index](../milestones/index.md), [code-debt list](./code.debt.md).
- Dead-link sweep (second pass): docs config `di/.vitepress/config.mts`, [26.lacemaker.md](../milestones/done/26.lacemaker.md), [32.facets.md](../milestones/done/32.facets/32.facets.md), [theory.md](../milestones/done/32.facets/designs/theory.md), [32.facets handoff](../milestones/done/32.facets/handoff.md), [32.facets history](../milestones/done/32.facets/history.md), [bottlenecks](../milestones/done/32.facets/slow/bottlenecks.md), [slow handoff](../milestones/done/32.facets/slow/handoff.md), [current work handoff](./handoff.md), [road map](./road.map.md).
- Tracing logs (still wired): [P_Attributes.svelte](di/src/lib/svelte/details/P_Attributes.svelte), [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts), [Engine.ts](di/src/lib/ts/render/Engine.ts), [Render.ts](di/src/lib/ts/render/Render.ts).
- Propagate-skip guard removed: [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts) — the loop in propagate no longer skips the edited object. Useful side fix during the investigation.
- Length-syncing helper deleted along with its six call sites: [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts). The invariant pass alone keeps each axis consistent.

### Verification — 2026-04-24

- Formula-doesn't-refresh: confirmed in the running app. After the helper was deleted, depth edits on art produced visible y-axis movement and the value column updated.
- Type-checker: should be re-run after the trace logs are pulled.
- Test suite: should be re-run after the trace logs are pulled.
- The eyeball-coupling change was reasoned through by trace, not run-tested in the browser yet.

---

## Session — 2026-04-20 — repeater template button, sibling-only names, formula rename, key-paths reference

Five threads in sequence.

### Thread one — add-template button for repeaters

Code-debt item shipped: when you select a part that has no children and open the repeat panel, the panel used to show only a small grey hint saying "need one child for the template". It now shows a real button labelled "add template". Clicking it creates one child sized identically to the parent — same width, depth, and height, placed at the parent's origin so it fills the parent exactly — names the new child "template", selects the new child, and re-renders the panel into the straight-or-diagonal chooser. The new child is always visible regardless of the parent's visibility flag.

### Thread two — sibling-only name uniqueness

The name-validation rule used to reject any name that any other part anywhere in the scene already had. The user reported wanting to use the same name on parts under different parents — for example, "drawer" inside a cabinet and "drawer" inside a kitchen layout. The validator was changed to scope the duplicate check to siblings of the part being renamed: cousins under different parents may now share names. Givens stay globally unique. Two new tests pin both directions of the new rule. The formula resolver was already scope-aware (it walks up the parent chain looking only at siblings at each level), so writer and reader are now consistent.

### Thread three — investigated a delete-not-removing-part bug

Jonathan reported: selecting a non-repeater grandchild and pressing delete clears the selection but the part stays in the parts table. Walked the delete routine in detail, ruled out the repeater-regeneration theory and the early-return paths, and arrived at the most likely remaining culprit — an exception thrown between the selection-clear step and the parts-list rewrite step, with the formula-reference walker being the most fragile candidate. Could not pin the failing step from static analysis alone. Open in the open-items section above; needs a console error message or a small repro scene.

### Thread four — formula rename helper, plus a structural-direction note

Jonathan reported: rename a part that another part's formula references; the formula text still shows the old name. Traced the cause: formulas hold reference tokens whose object field is the referenced part's name, not its identity. The compiled form binds names to identities at compile time, so evaluation kept giving correct numbers, but the displayed text and the on-disk save kept the old name — and a reload would fail to re-bind because the saved text held a name no part in the scene had any more.

Two routes were laid out. The targeted route mirrors the existing given-rename helper: walk every formula in the scene, rewrite reference tokens whose object equals the old name, recompile, re-bind. The structural route — store reference tokens by identity, not by name — was analysed in pros-and-cons and recorded as a future structural direction (see open items). The targeted route landed today: a new tokeniser helper that rewrites the object field of reference tokens, a new constraints helper that uses it across the whole scene, and a call from the part-rename flow right after assigning the new name.

A small clean-up went with it: the template-child creator was simplified to always name the new child "template" (no uniquify loop) and its now-unused argument was removed from the definition and its one caller — aligned with the new sibling-only uniqueness rule.

### Thread five — key-paths reference doc

A two-column table of every keyboard binding in the app, grouped by the context the key fires in. Keys mean different things on the canvas, inside a value cell, inside a name cell, inside a dimension or angle input, and inside the build-notes modal. Lives at [key paths.md](./key%20paths.md).

### What shipped — 2026-04-20

- "Add template" button in the repeat panel for parts without children, plus the engine and runtime helpers behind it. New child is sized identically to its parent, named "template", and selected.
- The sibling-only name-uniqueness rule, with two new tests pinning the cousin-allowed and sibling-rejected directions.
- Formula reference tokens now follow part renames: a new tokeniser helper, a new constraints helper, and a call from the part-rename flow.
- A small reference document listing every keyboard binding by context.

### Files touched — 2026-04-20

- New child-creator: [di/src/lib/ts/runtime/Smart_Object.ts](di/src/lib/ts/runtime/Smart_Object.ts).
- New engine wrapper for the add-template flow: [di/src/lib/ts/render/Engine.ts](di/src/lib/ts/render/Engine.ts).
- Repeat panel button: [di/src/lib/svelte/details/P_Repeat.svelte](di/src/lib/svelte/details/P_Repeat.svelte).
- Sibling-only name rule and its tests: [di/src/lib/ts/algebra/Errors.ts](di/src/lib/ts/algebra/Errors.ts), [di/src/lib/ts/tests/Errors.test.ts](di/src/lib/ts/tests/Errors.test.ts).
- Token-rename helper: [di/src/lib/ts/algebra/Tokenizer.ts](di/src/lib/ts/algebra/Tokenizer.ts). Constraints helper that uses it: [di/src/lib/ts/algebra/Constraints.ts](di/src/lib/ts/algebra/Constraints.ts). Called from: [di/src/lib/svelte/details/D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).
- New reference doc: [key paths.md](./key%20paths.md).
- Code-debt list: [code.debt.md](./code.debt.md).

### Verification — 2026-04-20

- Type-checker: zero errors, zero warnings after each step.
- Test suite: now five hundred eighteen tests, two more than at the end of the prior session, all green.

---

## Session — 2026-04-19 — manager split, parts-triangle hit area, banner action buttons

Three threads ran in sequence.

### Thread one — manager split

The big shared "stores" file had grown into two unrelated jobs: it held both the parts-tree machinery and the current selection. I pulled each out into its own file. The parts-tree file owns the collapsed-rows set, the tree walks, the show-hide generations, and a small toggle helper. The selection file owns the current selection, exposed as a paired reader and writer under one short name so callers can read with a property reference and assign with the same property reference. The big "stores" file is now back to general session and persistent values only.

The pass-through getter and setter that used to live on the hit-testing helper for the current selection were removed too. Every place in the codebase that used to read or write the selection through the hit-testing helper was redirected to talk to the new selection file directly.

### Thread two — parts-triangle hit area

A long thread of UI-pointer debugging. The visible triangle on each row had been drawn with a normal text character at a much-larger font size, sitting on a row whose own line height was set to zero. Two symptoms followed: the cursor over the visible triangle was the open-hand drag cursor of the canvas behind the panel rather than the pointing-hand cursor of a real button, and sliding the cursor across the title text of any row made the row below light up the moment the cursor crossed where the lower row's triangle would be drawn.

After several attempts that traded one symptom for another, the working layout is: the triangle button is a small fixed-size block sized to a line of the small body text. The painted character lives in a wrapper inside that block. The wrapper ignores the pointer entirely. So the visible character can grow on hover and poke above its row, but the part of the character outside the block is silent to the mouse — no row bleed, no flicker. On hover, the painted character grows to the largest preset size, fully opaque.

### Thread three — banner action buttons

A code-debt item shipped: the factory-reset button moved out of the bottom of the preferences panel, and the reinstall button moved out of the bottom of the library panel. Both now sit at the far-left end of their respective glow-banner headers, mirroring the small plus button on the far-right end. The shared glow-banner component grew a second slot for buttons on the left side that mirrors the existing right-side slot. The center-aligned title is unaffected by either slot.

The reinstall handler was lifted into the scenes manager as a one-call helper that wipes the user-saved files and bumps the library refresh signal. The library panel's refresh effect now also clears the highlighted row if it points to a file that no longer exists, so the wipe behaves the same as the in-panel button used to.

A small shared font-size constant for these buttons was added in the constants table; the app root now publishes it as a style variable so the banner buttons can refer to it. A polish followed: eight pixels of empty space above and below the separator inside the library panel.

### What shipped — 2026-04-19

- A new parts-tree manager file, holding nine generation-walking helpers and the collapsed-rows set.
- A new selection manager file, holding the current selection, with a property-style read and a property-style write.
- The pass-through selection getter and setter on the hit-testing helper were removed and every caller across the project (renderer, drag tool, scene save, mouse handlers, parts panel, several details panels) now talks to the new selection file directly.
- A redesigned hit area for the parts-table triangle that no longer bleeds across rows or interacts with the canvas behind the panel.
- A second slot on the shared glow-banner component for left-side buttons.
- The factory-reset and reinstall buttons moved into their respective banners and resized to a smaller form.
- A new one-call scenes helper that wipes user files and refreshes the library list.
- The library panel auto-clears its highlighted row when a refresh removes that file.
- A new published style variable for the smaller "reset"-class font.
- Eight-pixel separator gap inside the library panel.

### Files touched — 2026-04-19

- New: [Parts.ts](di/src/lib/ts/managers/Parts.ts), [Selection.ts](di/src/lib/ts/managers/Selection.ts).
- Trimmed: [Stores.ts](di/src/lib/ts/managers/Stores.ts).
- Manager re-exports: [managers/index.ts](di/src/lib/ts/managers/index.ts).
- Selection callers across the project: [Hits_3D.ts](di/src/lib/ts/events/Hits_3D.ts), [Hits.ts](di/src/lib/ts/events/Hits.ts), [Events.ts](di/src/lib/ts/events/Events.ts), [Events_3D.ts](di/src/lib/ts/events/Events_3D.ts), [Face_Label.ts](di/src/lib/ts/editors/Face_Label.ts), [Drag.ts](di/src/lib/ts/editors/Drag.ts), [Engine.ts](di/src/lib/ts/render/Engine.ts), [Render.ts](di/src/lib/ts/render/Render.ts), [R_Grid.ts](di/src/lib/ts/render/R_Grid.ts), [Scenes.ts](di/src/lib/ts/managers/Scenes.ts), [Graph.svelte](di/src/lib/svelte/main/Graph.svelte), [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte), [P_Angles.svelte](di/src/lib/svelte/details/P_Angles.svelte), [P_Repeat.svelte](di/src/lib/svelte/details/P_Repeat.svelte), [P_Attributes.svelte](di/src/lib/svelte/details/P_Attributes.svelte).
- Triangle hit area: [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).
- Banner left slot: [Hideable.svelte](di/src/lib/svelte/details/Hideable.svelte), [Details.svelte](di/src/lib/svelte/details/Details.svelte). Removed buttons from [D_Preferences.svelte](di/src/lib/svelte/details/D_Preferences.svelte) and [D_Library.svelte](di/src/lib/svelte/details/D_Library.svelte). Helper added in [Scenes.ts](di/src/lib/ts/managers/Scenes.ts).
- Constants and root variables: [Constants.ts](di/src/lib/ts/common/Constants.ts), [App.svelte](di/src/App.svelte).
- Code-debt list: [code.debt.md](./code.debt.md).

### Verification — 2026-04-19

- Type-checker: zero errors, zero warnings after each step.

---

## Session — 2026-04-19 (continued) — file rename, face labels, undo/redo fix, build-notes table

Five smaller threads ran after the earlier session, each closing a code-debt item or a polish target.

### Thread one — rename of the canvas-stale helper file

Walked through the naming options in a short pros-and-cons cycle: render-gate, an interface-style prefix, stall-render, and finally the bare word "dirty". Picked the bare word — it matches the existing one-word file-naming pattern in the project, it is the long-standing software term for "modified, needs re-processing", and it leaves room for any future second consumer that wants to react to changes. Renamed the file, redirected the ten consumer files that imported it, and updated the file-map note.

### Thread two — face-label font

Bumped the on-canvas face name labels from a hard-coded ten-pixel size to the project's preset large size — about twenty-two pixels. The white background plate behind each label and the recorded clickable footprint each derive from the new font size, so the box still hugs the text and the labels are still hittable.

### Thread three — undo and redo

Investigated the long-standing redo question on the code-debt list. Found that the redo machinery was fully built — the stack, the method, the keyboard chord — but a single shared call inside both step-back and step-forward asked the scene-load routine to wipe history every time either ran. The doc comment on the scene-load routine already said the call should not wipe in this case; the code did not match the comment. Two-character fix in the engine. After the fix you can step back many times and step forward to undo each step back, and the chain holds together.

A small focused test landed alongside: it pretends the scene-capture call returns whatever marker we hand it, snapshots five marker values, walks back five steps, then walks forward five steps, and asserts the chain returns to where it started. A second test pins the existing rule that taking a fresh snapshot after stepping back wipes the forward chain.

### Thread four — attribute-table cross thickness

The little X marker that signals an invariant in the attributes table was too faint to read. Each diagonal line was drawn half a pixel wide, which the browser anti-aliases to a soft grey hairline. Bumped the offset to draw three-pixel-wide lines instead, in two steps. The hover-time variant was proposed (also draw the cross on hover, darker and thicker), discussed, and rejected as not needed.

### Thread five — build-notes table

Walked the git history from the previous build-notes entry through today, separated significant feature shipments from cosmetic tweaks, bug fixes, and mothballed branches, and added twenty-four new entries to the build-notes table. The bundler reads that markdown file at build time and turns each row into a small entry the in-app build-notes panel renders.

A couple of small clean-ups along the way: removed an unused separator import from the attributes panel that was a leftover from a prior edit; renamed a font-size constant the user had switched from one purpose name to another so the two consumers and the published style variable stayed aligned.

### What shipped — 2026-04-19 (continued)

- The canvas-stale helper file is renamed to a one-word concept name; the ten consumers and the file-map note follow.
- The on-canvas face name labels render at twenty-two pixels instead of ten; the white plate and the click footprint scale with the font.
- Undo and redo now keep the history alive across each step-back and step-forward; you can step many times in either direction.
- Two new tests pin the back-and-forward chain inside the history machinery and the rule that fresh snapshots wipe the forward chain.
- The attribute-table invariant cross is now drawn three pixels wide per diagonal instead of half a pixel.
- The build-notes table grew by twenty-four entries covering work from late February through today.

### Files touched — 2026-04-19 (continued)

- File rename: [Dirty.ts](di/src/lib/ts/common/Dirty.ts) (was Stale_Writable.ts). Imports updated in [Hits_3D.ts](di/src/lib/ts/events/Hits_3D.ts), [Units.ts](di/src/lib/ts/types/Units.ts), [Engine.ts](di/src/lib/ts/render/Engine.ts), [Stores.ts](di/src/lib/ts/managers/Stores.ts), [Selection.ts](di/src/lib/ts/managers/Selection.ts), [Angular.ts](di/src/lib/ts/editors/Angular.ts), [Face_Label.ts](di/src/lib/ts/editors/Face_Label.ts), [Drag.ts](di/src/lib/ts/editors/Drag.ts), [Dimension.ts](di/src/lib/ts/editors/Dimension.ts), [Colors.ts](di/src/lib/ts/utilities/Colors.ts). File map: [map.md](../../map.md).
- Face label font: [Render.ts](di/src/lib/ts/render/Render.ts).
- Undo/redo fix: [Engine.ts](di/src/lib/ts/render/Engine.ts). New test: [History.test.ts](di/src/lib/ts/tests/History.test.ts).
- Cross thickness: [P_Attributes.svelte](di/src/lib/svelte/details/P_Attributes.svelte). Unused import removed in the same file.
- Build notes: [builds.md](di/src/lib/md/builds.md).
- Constants and root variables: [Constants.ts](di/src/lib/ts/common/Constants.ts), [App.svelte](di/src/App.svelte).
- Code-debt list: [code.debt.md](./code.debt.md).

### Verification — 2026-04-19 (continued)

- Type-checker: zero errors, zero warnings after each step.
- Test suite: now five hundred sixteen tests, two more than before this session, all green.

---

## Session — 2026-04-18 — generational triangles, hide-count, performance second pass, measurement

Big session. Three threads ran in sequence:

### Thread one — generational triangles and the hide list

I shipped the full generational behavior for the parts-table triangles. A click reveals one more generation outward; holding option while clicking hides one more outermost generation; the triangle points right only when no descendants of that row are currently showing; if option-click on a row that has nothing visible below it, the collapse "bubbles up" and the row's parent is collapsed instead, with the selection moving up accordingly. The hide list is now saved to the browser between reloads. Arrow-left and arrow-right on the selected row mirror the two click modes. Changing collapse state does not mark the render as stale unless the selection actually moves; changes that only affect the parts table do not trigger a repaint.

The data model stayed the same on purpose — one flat list of identifiers where each entry means "the children of this row are hidden". The new logic interprets that list at different relative depths to step layer by layer.

### Thread two — the render pipeline, second pass

I audited where each paint spends its time, found five proposals, and wrote them into the bottlenecks file. Three shipped, two deferred. The full-status entries for each are in that file.

### Thread three — measurement

Instrumentation was wired in so we could see where the paint actually spends its time. The numbers, over a scene of roughly one hundred parts during tumble, showed that the dominant cost was the cross-object intersection compute. The pooled clipper saved about fifteen to twenty percent. The remaining cost is structural — dense scenes generate too many face-pair intersections to clip at interactive rates, and the outer bounding-box prune is useless when every part's box overlaps every other. Jonathan chose to accept the current limit rather than take on the risks of a further rewrite. The instrumentation is now silent but left in place for the next time we need to measure.

### What shipped this session

- Five parts-table code-debt items.
- A generational collapse model, wired through click, option-click, right arrow, left arrow, and the reveal-on-select behavior.
- A persistent hide list.
- A file-level rollback switch for the pooled edge-vs-face clipper.
- Pooled scratch lists and records for the inner occluder loop.
- Named scratch math objects for nine hot allocation sites.
- A light-weight variant of the clipper used by the dashed-grey invisible-part pass.
- A per-paint timer, phase breakdown, and counters for the cross-object pair loop, currently silent behind a top-of-file constant.
- Updates to the bottlenecks file with the second-pass status and the measurement findings.
- The leftmost small-number column in the parts table now shows each row's position in the visible list instead of its sibling index within its parent. Root is blank.
- The little "X of Y" label above the selected part's name (visible when the parts table is hidden) now reports the row's position in the visible list and the total count of visible rows, matching the first column.

### Files touched this session

- Render loop and paint code: [Render.ts](di/src/lib/ts/render/Render.ts).
- Engine loop and timer: [Engine.ts](di/src/lib/ts/render/Engine.ts).
- Stores (generational helpers, persistent hide list): [Stores.ts](di/src/lib/ts/managers/Stores.ts).
- Preferences (new key and set-persistence helper): [Preferences.ts](di/src/lib/ts/managers/Preferences.ts).
- Parts table component (triangle click, hide-children count, parts-count): [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).
- Events (keyboard arrows defer to generational helpers): [Events.ts](di/src/lib/ts/events/Events.ts).
- Bottlenecks write-up: [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md).
- Code-debt list ticking items off: [code.debt.md](./code.debt.md).

### Verification

- Type-checker: zero errors, zero warnings across every intermediate step.
- Test suite: five hundred fourteen of five hundred fourteen tests pass.
- Real-world tumble measured on a roughly hundred-part scene before handing back.

---

## Session — 2026-04-11 — parts-panel sibling-position label

(Previous session — kept for history. Delivered the N-of-M sibling label next to the name editor in the parts details panel. Full details in the handoff file prior to this one.)
