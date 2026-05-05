# Code-Debt Handoff

**Date:** 2026-04-30
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Several small bugs surfaced and were fixed alongside the planned items. The most recent session shipped two parts-related items — the parts-table drag-and-drop, and the first two pieces of the selection-algorithm milestone (drill-down clicks and multi-select). See the dated session blocks below.

---

## Next

The first unchecked code-debt item is "help". Pick that up next.

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
- **Selection-algorithm milestone.** Next on the code-debt list — propose. Covers drag-dot visibility, mouse drill-down, rubber-band re-center and zoom, recenter control, and command-drag follow.
- **Arrow keys nudge SO position**, **print just the graph scaled to fit**, **move-up / move-down buttons in the parts table**, and **move-to-child / become-parent buttons** sit on the code-debt list after the selection-algorithm milestone.
- **Color leftovers.** Two unchecked items remain in the color family: white text for selected rows when the background is too dark, and a hand cursor over hover dots and the selected face (with a pointing-finger cursor everywhere else).
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

## Proposal — launch with editing on, magnet off

First unchecked code-debt item: "launch with editing enabled and 'straightening' magnet turned off."

### What is true today

The app starts with editing locked off (a closed padlock on the toolbar button). Every part is read-only until the user clicks the lock to unlock. The straightening magnet — the small magnet icon next to the "straighten" button — also starts on, which means after every rotation the system snaps the angle to the nearest face-aligned position.

Citation: the editing flag's default-off is at `src/lib/ts/managers/Stores.ts` line 31. The magnet's default-on is at line 30.

### What this asks for

The opposite. On launch: editing on (the padlock is open), the magnet off (no auto-snapping after a rotation).

### How to make the change

Two single-character edits.

1. Change the default of the editing flag from `false` to `true`. Same file, same line, just flip the third argument of the persistent-flag helper.
2. Change the default of the magnet flag from `true` to `false`. Same file, same line above.

Both flags are persistent — they live in the browser's local storage. The default only applies to a fresh visitor. A visitor who has used the app before keeps whatever their last toggle was.

### Implication for existing users

Because these flags are persistent, changing the default only changes the launch state for fresh visitors. Anyone who has already used the app and toggled either flag will keep their stored choice on the next launch.

If every existing user should also land in the new state on their next launch, two bigger options exist:

- **Bump a preferences-version number** that triggers a one-time wipe of the stored values for these two keys.
- **Migrate the stored values** explicitly — read the old key, write the new value, on a one-shot path.

The simpler "just flip the default" route is honest about what it does (helps new users only). The bigger route forces every user into the new state but rewrites their preferences.

Decision needed: which way.

---

## Adherence framework — done

A small dashboard scores the project against the development process on every build, and every rule in the catalogue is now in the new shape.

- **Run it:** `yarn adherence`. The extractor cross-joins the rules catalogue and the test index, writes the dashboard page, then runs the docs build and records its exit code into a status file. The next run reads that file for the build-gate metric.
- **Verify the parser:** `node notes/tools/validate-adherence.mjs`. Two in-memory fixtures, both pass.
- **State today:** all 58 rules in the new shape (stable name + proving test pointer + proving code pointer); every test entry points back at the rules it pins; 26 areas audited with hand-counted module counts in [areas.json](../../guides/project/development/areas.json); every gated metric green.
- **Drifts surfaced and logged:** the rule that says each direction has three attributes (the code defines four; angle is the unrecorded fourth) is logged in [adherence log.md](../../guides/project/development/adherence%20log.md). The rule on user-altered invariants was rewritten by Jonathan mid-migration to align with what the cited tests prove.
- **Where everything lives:** [stipulations.md](../../guides/project/development/stipulations.md), [testing.md](../../guides/project/development/testing.md), [adherence dashboard.md](../../guides/project/development/adherence%20dashboard.md), [adherence log.md](../../guides/project/development/adherence%20log.md), [dashboard guide.md](../../guides/project/development/dashboard%20guide.md), [logic driven design.md](../../guides/project/development/logic%20driven%20design.md). Tools at `notes/tools/`.

---

## Help overlay — sidebar toggle, reference-guide links, hand-set order

The help overlay (the full-screen page that opens from the question-mark button on the toolbar) gained four substantive changes today.

### What works now

- A hamburger inside the help overlay toggles the navigation column on the left. The choice survives reloads via a new persistent preference. Default: shown.
- The "What to read next" links in the walkthrough page navigate inside the overlay. Same for cross-links between reference-guide pages.
- The sidebar lists ten pages — the walkthrough plus nine reference topics — in a hand-set order. Three stray pages picked up by the recursive page glob (two leftover index files inside `images/`, plus the reference-guide section's own index) are filtered out.
- The hamburger and its containing wrapper render at the same effective rounded curve as the main app's toolbar. No clipping at the top-left corner.

### Key changes

- **Folder rename:** `src/manual/reference guide/` → `src/manual/reference-guide/` (the hyphen lets markdown actually parse the URL).
- **Help overlay component** at [UserGuide.svelte](../../src/lib/svelte/main/UserGuide.svelte): hamburger button, conditional sidebar rendering, recursive page glob (`**/*.md`), full-path id calculation, URL-resolution-based click handler, stray-page filter, hand-set `SIDEBAR_ORDER` constant.
- **Help wrapper radius override** in [Main.svelte](../../src/lib/svelte/main/Main.svelte): `border-radius: calc(var(--h-controls) / 2)` makes the help wrapper render the same effective curve as the short toolbar wrapper does after CSS auto-clamping.
- **New persistent preference** `showHelpSidebar` in [Preferences.ts](../../src/lib/ts/managers/Preferences.ts) plus `w_show_help_sidebar` in [Stores.ts](../../src/lib/ts/managers/Stores.ts).
- **Five walkthrough links** in [src/manual/index.md](../../src/manual/index.md) updated to the renamed folder.
- **Vitepress dead-link ignore list** in `.vitepress/config.mts` grew one regex (`/\/src\//`) so handoff entries that link into source files do not fail the docs build.

### Reorder the sidebar in the future

Edit `SIDEBAR_ORDER` near the top of [UserGuide.svelte](../../src/lib/svelte/main/UserGuide.svelte). Pages whose id is in the list sort by their position; pages not in the list fall to the end alphabetically.

### Still open from the help slice

- **Persist the active page id** so the overlay reopens to the last page the user was reading.
- **Polish:** smooth transition when the sidebar collapses, keyboard focus ring tweaks, re-check the small-screen layouts.

### Verification (end of session)

- `yarn svelte-check`: zero errors, zero warnings.
- `yarn build`: green.
- `yarn adherence`: extractor + docs build green.

---

## Mono guides folder renamed: design → hub

The shared-guides folder at `notes/guides/design/` is now `notes/guides/hub/`. Five touch points updated:

- The folder itself was renamed.
- The heading inside `hub/index.md` changed from "Design" to "Hub" so the page title matches the folder.
- The contents listing in `notes/guides/index.md` now reads `[Hub](./hub/)`.
- The shared vitepress sidebar entry at `mono/.vitepress/config.mts` changed both the section text ("Design >" → "Hub >") and the two link paths.
- A leftover reference inside `ga/notes/design/file.layout.md` was left alone — it documents ga's own intended folder layout, not mono's guides path.

Docs build green.

---

## Next section is now auto-generated

The Next section near the top of this file no longer needs hand-editing. A new script reads the code-debt list, finds the first unchecked item, and rewrites the Next section to match. The block sits between two HTML markers so re-running the script is idempotent.

- **Script:** `notes/tools/sync-next.mjs`. Run on demand with `node notes/tools/sync-next.mjs`.
- **Wired into the build:** the adherence chain now runs the sync first, then the extractor, then the build wrapper. So every `yarn adherence` refreshes the Next section automatically.
- **Idempotent:** the auto-generated block is bounded by `<!-- BEGIN-NEXT ... -->` and `<!-- END-NEXT -->` markers. Re-running on an already-synced file is a no-op.
- **Hand-editing the Next section is no longer the right move:** edit `code.debt.md` instead and let the next sync pick it up.

Logged in [overview map.md](../../guides/project/overview/map.md) under Notes — Tools.

---

## Proposal — persist the active help page id (step 4 of the help slice)

Three sub-items of the help block were completed earlier in the session and are now ticked off in the code-debt list. The first remaining unchecked leaf reads: "deploy help page id in preferences so revisit help goes to last-visited help content."

What it does for the user: when they close the help overlay on, say, the "Repeaters" page and reopen it later, it lands back on Repeaters instead of always returning to the walkthrough.

Concrete steps:

1. **New persistent preference key** for the active help page id. Default value: the walkthrough page's id ("index"). Sits in the same enum as the existing help-sidebar visibility flag.
2. **New persistent store** in the stores file, mirroring the line that holds the help-sidebar visibility flag. Default falls back to the walkthrough page.
3. **Wire into the help overlay component.** Read the stored id at mount time and use it for the active page. If the stored id no longer matches a real page (a manual file was renamed or removed), fall back to the walkthrough page. Every page switch writes back to the store, so the next reload picks up where the user left off.
4. **Replace the existing rune-state primitive for the active page with the persistent store.** This keeps a single source of truth — no double bookkeeping between the in-memory state and the persisted value.

Risk notes:

- The fallback for a missing page id is one line: if the page list does not contain the stored id, reset to the walkthrough.
- The Svelte rune-state to store conversion mirrors the pattern already used for the sidebar-visibility flag, so the shape is familiar.

Estimated scope: three small file edits — preferences enum, stores file, help overlay component. Type-check should stay clean. No build changes.

Awaiting a green light.

---

## Help-overlay slice — step 4 done (active page id is persistent)

The help overlay now remembers which page the user was last reading. Closing the overlay on, say, the Repeaters page and reopening it later lands back on Repeaters instead of always returning to the walkthrough.

### What landed

- New persistent preference key for the active page id, with the walkthrough as the default. The id is a string like "index" or "reference-guide/repeaters".
- New persistent store mirroring the line that holds the help-sidebar visibility flag. Lives next to it in the stores file.
- The help overlay component reads from and writes to this store: the active page comes from the store, the sidebar's highlighted-pill state reads from the store, page switches write back to the store, and the click handler that resolves internal links also writes to the store.
- One-time fix-up at mount: if the stored id no longer matches a real page (the manual file was renamed or removed), the store resets to the walkthrough. Without this, a stale id would show the fallback page but the bad value would stick.

### Files touched

- New preference key `helpPageId` added to the enum in [Preferences.ts](../../src/lib/ts/managers/Preferences.ts).
- New persistent store `w_help_page_id` added to [Stores.ts](../../src/lib/ts/managers/Stores.ts) right next to the existing help-sidebar visibility line.
- The help overlay component picked up the new store, the fix-up check, and replaced its previous local rune-state for the active page with the store everywhere: [UserGuide.svelte](../../src/lib/svelte/main/UserGuide.svelte).

### Verification

- `yarn svelte-check`: zero errors, zero warnings.
- `yarn build`: green.

### Still open

- **Step 5 — polish.** Smooth transition when the sidebar collapses, keyboard focus ring tweaks, re-check the small-screen layouts.
