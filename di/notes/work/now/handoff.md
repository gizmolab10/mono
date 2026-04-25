# Code-Debt Handoff

**Date:** 2026-04-24
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Several small bugs surfaced and were fixed alongside the planned items.

---

## Next

The first unchecked code-debt item points at the selection-algorithm milestone — a grouping of related selection improvements: drag dots that only appear on hover and on the not-quite-forward face, mouse-driven drill-down into nested parts, rubber-band rectangles that re-centre and zoom, a recentre button on the controls strip, and a command-drag that shifts the rotation centre so the canvas follows the mouse. No proposal is on the table yet. Propose next.

For evidence:

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
- Dead-link sweep (second pass): [docs config](di/.vitepress/config.mts), [26.lacemaker.md](../milestones/done/26.lacemaker.md), [32.facets.md](../milestones/done/32.facets/32.facets.md), [theory.md](../milestones/done/32.facets/designs/theory.md), [32.facets handoff](../milestones/done/32.facets/handoff.md), [32.facets history](../milestones/done/32.facets/history.md), [bottlenecks](../milestones/done/32.facets/slow/bottlenecks.md), [slow handoff](../milestones/done/32.facets/slow/handoff.md), [current work handoff](./handoff.md), [road map](./road.map.md).
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
