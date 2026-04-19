# Code-Debt Handoff

**Date:** 2026-04-19
**Work stream:** items from [code.debt.md](di/notes/work/now/code.debt.md), one item at a time, plus continuing internal cleanup of the manager layer.

---

## Next

The first unchecked code-debt item is about the on-face name labels — decide whether to remove them entirely, and if kept, raise the font size. No proposal is on the table yet. Propose next.

## Where we are

- **Parts-table work for the last session is done.** Five code-debt items shipped in order: the first small eye cell on the root row is now blank; the collapse triangles were made larger; clicking a triangle reveals one more generation outward while option-clicking hides one more outermost generation, with the triangle pointing right only when nothing below is showing; the keyboard left and right arrows on the selected row do the same as the two click modes; when a row's children are hidden, the small eye cell shows the count of every part tucked below it that has no children of its own (so the number says "how many real parts are hidden", not "how many boxes are hidden"); and the "show N parts" toggle at the top of the parts table was updated so N follows the same rule — it counts parts that have no children of their own, not containers.
- **Row numbers replaced the sibling numbers in the leftmost column.** Each row in the parts table now shows its position in the visible list (zero for the root, blank there; one for the next row, and so on). The old helper that computed "which sibling am I among my parent's children" was removed since nothing else used it.
- **The selected-part position label at the top of the details panel now matches the row number.** When the parts table is hidden, the little "X of Y" label above the selected part's name uses the same visible-row count — X is the row number, Y is the total number of visible rows. Blank when the root is selected.
- **The hide-list now persists across reloads.** The list of rows whose children are hidden is saved to the browser's local storage and restored on next launch. A new helper on the preferences object handles the array-to-set and back conversion so the stored shape stays small.
- **Second pass of render-pipeline performance is shipped and measured.** Three of five proposals landed — the edge-versus-face clipping no longer allocates inside its inner loop, the hottest allocation sites in the paint now write into pre-built reusable math objects, and the dashed-grey pass for hidden parts stopped asking for metadata it throws away. Two proposals (moving strings below early-outs in the cross-object face-pair loop, and packing vertex-pair names as single numbers) were deferred because the changes would ripple through multiple stored data shapes across the file for a modest payoff. All changes sit behind a one-line rollback switch in the renderer file. Five hundred fourteen tests still pass; type-check clean. Full status recorded in [bottlenecks.md](di/notes/work/milestones/done/32.facets/slow/bottlenecks.md).
- **Tumble timing instrumentation is wired in and currently silent.** A per-paint clock and a phase breakdown plus counters for the cross-object pair loop live in the renderer and the engine loop. A single constant at the top of the engine file turns everything on. The per-second console summary is commented out for now. When the numbers are needed again, uncomment the summary block and flip the constant to true.

## What the tumble measurement told us

At roughly a hundred parts where every part's outer box overlaps every other, the dominant cost is the cross-object intersection compute — about seventy percent of paint time. The pooled clipper shipped in this pass saved fifteen to twenty percent of total paint time. That is a real win but does not change the working comfort ceiling much: around fifty overlapping parts is the realistic limit today. The remaining cost is structural — more than eleven thousand face-pair intersections get tested per paint in dense scenes, and about nine of every ten produce nothing visible after occlusion clipping. Pushing the ceiling further means either skipping ancestor-descendant pairs by policy (risks hiding legitimate intersection edges), adding a "draft mode" during camera motion (risks visual flicker), or rewriting the intersection feature with a fundamentally different approach (high cost, high payoff, high risk). Decision for now: accept the limit. Revisit only if a real scene pushes past the comfort threshold.

## Open items

- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** I could not reproduce from reading the code — the arrow-navigation list and the table-display list look like the same filter. Jonathan reports pressing down from the top row lands on the row three deeper in the family tree instead of the next row. Still open. Need more detail about the scene (whether any row shows a repeater "×N" badge, and whether the table displays all four rows or only two) before a fix can be made.
- **Face-label question.** Next unchecked item — propose. Decide whether to remove the on-face name labels entirely; if kept, make their font bigger.
- **Redo for undo.** No proposal yet.
- **Color sub-list.** Starts with "dots: larger white filled circular bordered" under hover color. Also: white text for selected when background is too dark; the cross icon in the attributes table is too faint; and a hand cursor over hover dot and selected face, otherwise pointer.
- **Givens for angles** and **rename library items** moved into the leftovers section of code.debt.
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](di/notes/work/milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Left as deferred in [bottlenecks.md](di/notes/work/milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.

## Notes for future sessions

- The code-debt track is a grab-bag of small, unrelated items. Each one deserves its own short propose-then-build cycle. Do not batch them.
- The slow-render work has its own handoff at `di/notes/work/milestones/done/32.facets/slow/handoff.md`. The bottleneck-analysis file sits next to it.
- The drag work has its own mothballed handoff at `di/notes/work/milestones/33.drag/handoff.md`.
- The `handoff` and `hands` shorthands point at this file.
- The tumble instrumentation is in place but silent. Flip the constant at the top of the engine file to true, uncomment the per-second summary block inside the render loop, reload, and the console will print timings and counters again.

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
- Code-debt list: [code.debt.md](di/notes/work/now/code.debt.md).

### Verification — 2026-04-19

- Type-checker: zero errors, zero warnings after each step.

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
- Bottlenecks write-up: [bottlenecks.md](di/notes/work/milestones/done/32.facets/slow/bottlenecks.md).
- Code-debt list ticking items off: [code.debt.md](di/notes/work/now/code.debt.md).

### Verification

- Type-checker: zero errors, zero warnings across every intermediate step.
- Test suite: five hundred fourteen of five hundred fourteen tests pass.
- Real-world tumble measured on a roughly hundred-part scene before handing back.

---

## Session — 2026-04-11 — parts-panel sibling-position label

(Previous session — kept for history. Delivered the N-of-M sibling label next to the name editor in the parts details panel. Full details in the handoff file prior to this one.)
