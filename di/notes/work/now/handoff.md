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

## Adherence dashboard built and rules catalogue fully migrated

The "logic driven design" guide had a ten-step plan for a small dashboard that scores the project against the development process. All ten steps are done. Then all fifty-eight rules in the catalogue were walked through the migration in twelve passes. End state: zero rules on the old shape, every audited area green, every gated metric green.

### What runs now

A new yarn script — `yarn adherence` — chains two scripts. The first reads the rules catalogue and the test index, cross-joins them, and writes a dashboard page at `notes/guides/project/development/adherence dashboard.md`. The second runs the docs build and records its exit code into a small status file the next run reads. A separate validator at `notes/tools/validate-adherence.mjs` runs two in-memory fixtures through the same parser and confirms the cross-join's counts on a deliberate orphan and on a clean run.

The dashboard opens with a green-or-red overall badge that names the failing metrics when red. Below the badge sits a one-line legacy count and the migration progress section. The four gated metrics (test binding, orphan tests, build-gate, coverage by area) come next, then a per-area table with a coverage figure for every audited area. A hand-written guide at `notes/guides/project/development/dashboard guide.md` explains every section, the action triggered by each red value, and where to look when the dashboard itself looks suspect.

A hand-recorded sibling file at `notes/guides/project/development/adherence log.md` holds three append-only sections — re-read sweeps, new-work compliance, and failure triage — for the metrics the dashboard cannot read automatically.

### What the migration produced

Every rule in the catalogue now carries a short stable name, a pointer to the test that pins it, and a pointer to the source line that proves it. Every test entry in the index points back at the rules it pins. Twenty-six areas are audited; each carries a hand-counted module count in `areas.json`. Coverage runs from one rule per module to three rules per module — every audited area is green.

Four new browser-driven test entries were added to the test index for the four user-flow rules (editing-lock blocks clicks, view-mode toggle saves and restores orientation, rotation-snap aligns to a face, drag-without-selection tumbles the camera) — those rules now have a place to point back from.

### Drifts surfaced during migration

Two semantic mismatches between rule wording and code came out of the work:

1. The rule "each direction has three attributes" says three; the code defines four (the angle is the unrecorded fourth on every direction). The proving test only checks for three, so the rule and the test agree; the code is the odd one out. Logged under re-read sweeps in the adherence log.
2. The rule "if an invariant is altered by the user, this causes reverse propagation" originally read as a different mechanism than the one the cited tests prove (the tests prove forward enforcement that overwrites the user's value, not reverse propagation that respects it). Surfaced mid-migration; Jonathan rewrote the rule to align with the tests.

### What this enables

A rename or removal of a test or a source file the catalogue points at becomes a malformed entry, which fails the docs build. Drift between rule wording and code surfaces the moment someone re-reads a rule against its proving lines — that already happened twice during the migration, cleanly.

Going forward, every new feature lands a rule in its area before the test, and a test before the merge. The development process gates this; the dashboard reports it.

### Where everything lives

- Catalogue: [stipulations.md](../../guides/project/development/stipulations.md)
- Test index: [testing.md](../../guides/project/development/testing.md)
- Module counts: `notes/guides/project/development/areas.json`
- Build status: `notes/guides/project/development/build-status.json` (auto, refreshed by the wrapper script)
- Auto dashboard: [adherence dashboard.md](../../guides/project/development/adherence%20dashboard.md)
- Sweep log: [adherence log.md](../../guides/project/development/adherence%20log.md)
- Reading guide: [dashboard guide.md](../../guides/project/development/dashboard%20guide.md)
- Tools: `notes/tools/extract-adherence.mjs`, `notes/tools/build-with-status.mjs`, `notes/tools/validate-adherence.mjs`
- Process doc: [logic driven design.md](../../guides/project/development/logic%20driven%20design.md)

---

## Help-overlay hamburger and sidebar toggle — proposed slice

The help overlay (the full-screen page that opens when the user taps the question mark on the toolbar) currently shows its sidebar permanently — there's no way to hide it. The four code-debt items under "help" want to add a hamburger inside the overlay that toggles the sidebar, plus persist the sidebar's open or closed state and which page the user was last reading.

Ordered so each step is a clean stopping point:

1. **Hamburger inside the help overlay.** A button at the top-left of the help overlay's control bar, matching the main app's hamburger style. Clicking it toggles a local "show sidebar" state. The hamburger stays visible whether the sidebar is open or closed.
2. **Wire the toggle to the sidebar.** When the state is off, the sidebar's column collapses to zero width so only the page content shows; the vertical separator hides too. When the state is on, the sidebar comes back at its current width.
3. **Persist the sidebar visibility.** A new preference key. The state survives reloads.
4. **Persist the active page id.** A new preference key. Reopening the help overlay returns to the last page the user was reading.
5. **Polish to "complete & excellent".** Hover and active styling that matches the main app's hamburger; keyboard focus ring; smooth transition when the sidebar collapses; check that the small-screen layouts still work.

Risk notes:

- The persistent preference helper exists already (used elsewhere in the app for similar flags).
- The help overlay reads its pages via a glob; persisting the page id needs a fallback if that page id no longer exists after a manual edit to the manual files.
- I am guessing the hamburger should sit to the LEFT of the "← Return" button, mirroring the main app's toolbar layout. Could go right instead.

---

## Where the persistent-preference helper lives

The two pieces:

- `persistent<T>(key, fallback)` lives at [Preferences.ts:139](../../src/lib/ts/managers/Preferences.ts#L139). Returns a writable that reads from browser storage on first read and writes through on every change.
- `persistent_set(key)` lives at [Preferences.ts:145](../../src/lib/ts/managers/Preferences.ts#L145). Same idea but for sets — handles the array-to-set round-trip.

Existing call sites are clustered in [Stores.ts:20-27](../../src/lib/ts/managers/Stores.ts#L20-L27). The decorations flag, the saved orientation, the active parts tab, the view mode, the details panel show flag, and several display values all use the same pattern. The help-overlay sidebar visibility would mirror the existing line for the details panel show flag at line 24; the active page id would mirror the active parts tab line at line 22.

---

## Help-overlay slice — decisions

Two open questions answered:

- **Hamburger position.** Left of the "← Return to Design Intuition" button, mirroring the main app's toolbar layout.
- **Fallback for a missing page id.** Land on the index page when the persisted page id no longer resolves to a real manual page.

Both confirm the original guesses. Slice is ready to build on a green light.

---

## Help-overlay slice — steps 1, 2, 3 done

Three of the five steps shipped. The help overlay's full-screen view now has a hamburger to its left of the "← Return" button. Clicking it toggles the sidebar. The state survives reloads.

### What landed

1. **Hamburger inside the help overlay.** A new button at the left of the help overlay's top bar. The icon and styling mirror the main toolbar's hamburger, including the white-when-active fill. Position is left of the "← Return to Design Intuition" button.
2. **Sidebar visibility is wired.** When the hamburger is off the navigation column and its vertical separator are removed from the layout entirely; the page content widens to fill the space. When the hamburger is on, both come back at their original widths.
3. **The visibility is persistent.** A new preference key holds the on-or-off state. Reloading the page reopens the help overlay with the same sidebar state the user left it in. Default is on, so a fresh visitor sees the navigation.

### Files touched

- New preference key `showHelpSidebar` added to the enum in [Preferences.ts:60-62](../../src/lib/ts/managers/Preferences.ts#L60-L62).
- New persistent store `w_show_help_sidebar` added next to the existing details-panel show flag in [Stores.ts:24-25](../../src/lib/ts/managers/Stores.ts#L24-L25).
- The help overlay component picked up the hamburger button, the conditional sidebar rendering, the new imports, the active-class style, and a small gap between toolbar items so the hamburger doesn't crowd the return button: [UserGuide.svelte](../../src/lib/svelte/main/UserGuide.svelte).

### Pre-existing warnings cleaned up

The svelte-check pass first showed one pre-existing warning about a non-interactive element with a click handler (the rendered-markdown div that intercepts internal links). Two ignore comments were already in place above it, but they named two different warning rules; the one that actually fires (`a11y_no_noninteractive_element_interactions`) was not covered. Added the missing ignore comment. Final state: zero errors, zero warnings.

### Still open

- **Step 4 — persist the active page id.** Not done yet. The help overlay still resets to the index page on every reload.
- **Step 5 — polish.** No transition on the sidebar collapse, no keyboard focus ring tweaks, small-screen layouts not re-checked.

---

## Help-overlay hamburger — hover styling matched to main app

The hamburger inside the help overlay now uses the same look as the main toolbar's hamburger: black icon by default, white icon on hover. The active-state class wiring was unused for visuals (the main app's white-fill rule fires on the project's own hover-tracking attribute, not on a plain "active" class), so it was removed. The CSS rule that paints the icon white now uses plain CSS `:hover` instead of a class flag, since the help overlay's controls are wired with plain `onclick` handlers and not the project's hit-target system.

Type-check still clean: zero errors, zero warnings.

---

## Help-overlay hamburger — nudged 4px left

The help hamburger sat one pixel up and zero pixels in from the left edge of the top bar. Bumped it 4 pixels further left so it lines up better against the bar's left edge. One CSS line added: `left: -4px` next to the existing `top: -1px` on the hamburger rule.

---

## Help-overlay return button — nudged 3px left

The "← Return to Design Intuition" button sat at the top-bar gap default after the hamburger. Bumped it 3 pixels further left so the spacing between the hamburger and the button feels right. One CSS rule added on the toolbar-button class: relative positioning plus a 3-pixel leftward offset.

---

## Help-overlay hamburger — top-left clipping explained

The hamburger's top-left corner gets clipped because the wrapper that surrounds the entire help overlay has a rounded outer corner with `overflow: hidden`. Anything drawn at the very top-left of the wrapper is cut along that curved edge.

Evidence: every region wrapper gets a rounded corner and a clip at [Main.svelte:123-127](../../src/lib/svelte/main/Main.svelte#L123-L127); the help-overlay wrapper inherits both at [Main.svelte:150-155](../../src/lib/svelte/main/Main.svelte#L150-L155).

The hamburger is at -7 pixels left and -1 pixel up from its natural spot. The natural spot is already only about 6 pixels from the wrapper's left edge and 1.6 pixels from the top, so the offsets push the SVG's drawing into the rounded-corner safe zone.

z-index does not address this — the clip is the parent's rounded mask, not a stacking-order issue.

Three options to fix:

1. Move the hamburger right and down so it sits clear of the curve.
2. Add inner padding to the help-overlay wrapper so the children start past the rounded corner.
3. Drop the rounded corner on the help-overlay wrapper specifically (it is a full-screen overlay; rounded corners arguably do no visual work there).

Awaiting decision.

---

## Why the main app's hamburger is not clipped, but the help's is

Both wrappers have the same rounded corner with `overflow: hidden`. The difference is the alignment of items inside the toolbar row.

- The main app's toolbar row centres its children: at [Controls.svelte:197](../../src/lib/svelte/main/Controls.svelte#L197) the row uses `justify-content: center`. The hamburger sits in the middle of the row, far from the rounded corner. At desktop widths (≥1500 pixels) the row instead packs to the left, but the typical viewer hits the wrap-mobile layout and the centring hides the corner.
- The help overlay's toolbar row packs its children to the left: at [UserGuide.svelte:158](../../src/lib/svelte/main/UserGuide.svelte#L158) the row uses `justify-content: flex-start`. The hamburger sits hard against the row's left edge, exactly where the corner curve cuts in.

The user's nudges (-7 pixels left) made the clip more obvious. The underlying cause is the alignment direction — even with no nudge the help hamburger would sit only ~6 pixels in from the wrapper's edge, well inside a corner curve of radius ~20.

z-index does not help. The clip is the wrapper's rounded mask, not a layer-stacking effect.

---

## Help-overlay hamburger — clip resolved by clamping the help wrapper's effective corner radius

The two wrappers (the toolbar wrapper in the main app and the full-screen wrapper around the help overlay) both ask for the same corner-radius value. The browser ends up rendering them at different sizes because of how it handles corners that are too big to fit.

When the two corners on the same side of a box ask for a combined radius bigger than that side, the browser shrinks both proportionally so they fit. The toolbar wrapper is only as tall as one toolbar, so its top and bottom corners (each asking for the full radius) get shrunk to half that height. The help wrapper is full-screen tall, so the corners get to render at the full requested radius.

The result: the toolbar's rounded curve is smaller than the help overlay's rounded curve, even though both are written the same way in the CSS. The help overlay's bigger curve eats enough further into the top-left corner to clip the topmost bar of the hamburger.

Fix: tell the help wrapper to use a radius equal to half the toolbar height instead of the shared full radius. This matches the effective rounded curve of the main toolbar exactly. The visual rounded corner stays — it just renders at the toolbar's curve size, not the larger one. Hamburger and corner radius unchanged in their own definitions; both now render the same way the main toolbar does.

One CSS line added to the help-overlay wrapper at [Main.svelte:155](../../src/lib/svelte/main/Main.svelte#L155): `border-radius: calc(var(--h-controls) / 2)`.

Type-check still clean.
