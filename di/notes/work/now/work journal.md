# Session logs

Record work performed during chat sessions, in reverse chronological order.

---

## Session — 2026-05-04 (continued) — help overlay improvements

A long second pass through the day's work focused on the help overlay (the full-screen page that opens from the question-mark button on the toolbar). Three threads.

### Thread one — sidebar can be hidden

A new hamburger button was added to the help overlay's top bar, to the left of the "← Return" button. Clicking it toggles the navigation column on the left. When the column is hidden, the page content widens to fill the space; the vertical separator hides too. The choice survives reloads via a new persistent preference. Default is "shown" so a fresh visitor still sees the navigation.

### Thread two — corner-clipping bug found and fixed

The hamburger's top-left bar was being clipped by the help overlay wrapper's rounded corner. The wrappers in the main toolbar and in the help overlay both ask for the same corner-radius value, but the browser shrinks corners that are too big to fit on a short edge. The main toolbar wrapper is short (about one toolbar tall), so its radius gets shrunk to half that height. The help wrapper is full-screen tall, so the radius renders at its full requested size. The bigger curve eats further into the corner and clips the hamburger.

Fix: tell the help wrapper to use a radius equal to half the toolbar height instead of the shared full radius. The visual rounded corner stays — it just renders at the toolbar's curve size, not the larger one. Both wrappers now look the same at their top corners.

### Thread three — reference-guide links work, sidebar is curated

The "What to read next" links in the walkthrough page pointed at pages inside the manual's `reference guide/` subfolder. None of them worked because of three independent problems stacked together. All five fixes shipped together:

- Folder renamed: `src/manual/reference guide/` → `src/manual/reference-guide/` (no space, so markdown actually parses the link).
- Walkthrough page links updated to use the new folder name.
- Help overlay's page glob widened from one-level to recursive, so subfolder pages are picked up.
- Page id calculation now uses the path under the manual folder, so a top-level file and a subfolder file with the same name don't collide.
- Click handler rewritten to resolve link URLs relative to the active page's location, and the slash-rejection that prevented multi-segment ids was removed. Outside-overlay links (with `..` segments leading out of the manual root) still fall through to the browser.

Three stray pages that the recursive glob picked up — two leftover index files inside the `images/` folder and the reference-guide section's own index — are filtered out of the sidebar.

A new constant near the top of the help overlay component sets the sidebar's order by hand. Pages whose id appears in the constant sort by their position in it; any page not in the constant falls to the end alphabetically, so a freshly-added file remains discoverable until it gets a slot.

The vitepress dead-link checker started flagging some source-file references in the handoff that had been dormant; the ignore list grew a small new pattern so these no longer fail the docs build.

### Files touched — 2026-05-04 (continued)

- New persistent preference key for the help-sidebar visibility added to [Preferences.ts](../../src/lib/ts/managers/Preferences.ts).
- New persistent store added to [Stores.ts](../../src/lib/ts/managers/Stores.ts) next to the existing details-panel show flag.
- The help overlay component picked up the hamburger button, the conditional sidebar rendering, the recursive page glob, the new id calculation, the URL-based click resolution, the stray-page filter, and the hand-set order constant: [UserGuide.svelte](../../src/lib/svelte/main/UserGuide.svelte).
- The wrapper radius override added to [Main.svelte](../../src/lib/svelte/main/Main.svelte).
- The reference-guide folder was renamed; the five walkthrough links were updated; the overview map and the file layout were updated to reflect the rename and the new help component.
- `.vitepress/config.mts` ignore-list grew one pattern to cover handoff entries that link into source files.

### Verification — 2026-05-04 (continued)

- `yarn svelte-check`: zero errors, zero warnings.
- `yarn build`: green.
- `yarn adherence` (extractor + docs build): green.

---

## Session — 2026-05-04 — adherence dashboard built; rules catalogue fully migrated

A long autonomous run that built an adherence-tracking system from scratch, then walked every rule in the catalogue through the migration to the new format.

### Thread one — dashboard build, ten steps

The "logic driven design" guide had a ten-step plan for a small dashboard that scores the project against the development process. All ten shipped:

1. Catalogue and test-index format — added a Format section to each file showing the expected shape.
2. Extractor — `notes/tools/extract-adherence.mjs` reads both files, cross-joins, returns matched / uncovered / orphan / malformed lists.
3. Metrics — coverage by area, test binding, orphan tests, build-gate.
4. Dashboard markdown — generated at `notes/guides/project/development/adherence dashboard.md` with a top-of-page badge and one section per metric.
5. Build wiring — new `yarn adherence` script chains the extractor and a build-with-status wrapper that records the build's exit code so the next run can read it.
6. Thresholds and badge — green when all four metrics meet their targets; red lists the failing metrics.
7. Tracking policy — dashboard and status file are not gitignored. Hand-recorded log lives alongside with three append-only sections.
8. Publishing — sidebar gained a Project section; project index calls out the dashboard; layout map and overview map list the new files.
9. End-to-end validator — `notes/tools/validate-adherence.mjs` builds two in-memory fixtures and asserts the cross-join's counts.
10. Hand-written guide — `notes/guides/project/development/dashboard guide.md` walks through every section, the red-value action table, and "when the dashboard is wrong".

### Thread two — overall health line and migration progress moved to the top

Added an at-a-glance line below the badge that surfaces the legacy count, then moved the full Migration progress section up to sit right under the badges so the migration status is the first thing the eye lands on.

### Thread three — rules catalogue migrated, all fifty-eight

Walked every area in twelve passes, applying the per-rule recipe each time: pick the next un-audited area, give each rule a short stable name, find the proving test in its file, find the proving code line, add the back-pointer on the test entry, set the area's module count in `areas.json`, run the extractor, run the validator. Final state: zero rules on the old "Covered:" shape, fifty-eight matched, zero uncovered, zero orphan, zero malformed. Twenty-six areas audited; coverage runs from one rule per module up to three rules per module, all green.

Four new browser-driven test entries went into the test index — for the editing-lock, view-mode-switch, rotation-snap, and drag-versus-tumble user flows — so the four user-flow rules have somewhere to point back from.

### Drifts surfaced during the migration

1. The rule "each direction has three attributes" says three; the code defines four (the angle is the unrecorded fourth). The proving test only checks for three, so the rule and the test agree; the code is the odd one out. Logged in the adherence log.
2. The rule "user-altered invariant causes reverse propagation" did not match the cited tests (which prove forward enforcement that overwrites the user's value). Surfaced mid-migration; Jonathan rewrote the rule to align with the tests, then the migration resumed.

### Files touched — 2026-05-04

- New tools: [extract-adherence.mjs](../../tools/extract-adherence.mjs), [build-with-status.mjs](../../tools/build-with-status.mjs), [validate-adherence.mjs](../../tools/validate-adherence.mjs).
- New guides: [adherence dashboard.md](../../guides/project/development/adherence%20dashboard.md) (generated), [adherence log.md](../../guides/project/development/adherence%20log.md), [dashboard guide.md](../../guides/project/development/dashboard%20guide.md).
- Edited: [stipulations.md](../../guides/project/development/stipulations.md), [testing.md](../../guides/project/development/testing.md), [logic driven design.md](../../guides/project/development/logic%20driven%20design.md), `notes/guides/project/development/areas.json`, [development index](../../guides/project/development/index.md), [project index](../../guides/project/index.md), [guides.layout.md](../../guides/guides.layout.md), [overview map.md](../../guides/project/overview/map.md), `.vitepress/config.mts`, `package.json`.

### Verification — 2026-05-04

- `yarn adherence`: every gated metric green; legacy count zero; zero malformed; build green.
- `node notes/tools/validate-adherence.mjs`: both fixture passes green.

---

## Session — 2026-05-01 — guides cleanup, screenshots, URL flag, App.svelte slimming

A long session that closed out the guide-update arc and started chipping at code-debt items.

### Thread one — guides finished

The guide tree was pushed through the last of its long sweep: distilled the working-process file into a permanent instructions page; filled in the user manual feature by feature (eight new pages — selection, re-parenting, formulas, library, build notes, undo and redo, units, save and load); added a key-paths page covering every keyboard shortcut grouped by context. The working file `update.guides.md` graduated from "now" to "done" once everything had landed. Builds stayed green throughout.

### Thread two — first-steps page with screenshots

A new walk-through page for a brand-new user covers their first few minutes: the URL, the bundled drawer that loads on first visit, turning on dimensions, the read-only lock, turning on editing, stretching, editing a dimension, starting a fresh design from the library, and adding an empty box.

The page started without screenshots. After deciding the assistant would do the captures (full automation), a Playwright script and a separate config landed at `e2e/screenshots/`. The script clicks the hamburger to hide the side panel, then drives the app through eight scripted journeys, capturing one PNG per step into the manual's image folder. Wired as `yarn shoot`.

The image folder name had to change from `first.steps` to `first-steps` because the period in the folder name confused Obsidian's relative-path renderer. The eight markdown image references and the script's output path were updated; the docs build stayed green.

### Thread three — launch defaults flipped

Two preference defaults flipped on first launch: editing now starts on (lock open), the rotation-snap magnet now starts off. Two single-character edits in the persistent-flag setup. Existing users keep whatever they last toggled, since the change touches only the fresh-visitor default.

### Thread four — URL-flag handling brought across from ws

The ws project's pattern for URL flags was lifted into di. Configuration gained a query-strings field captured at construction time, an `apply_queryStrings` method, a `configure` step that wires each manager's apply method in order, and a side-effect call at module load. Preferences gained an `apply_queryStrings` of its own that handles the new flag.

The flag is `?clear=preferences`. When present, the preferences-reset helper runs before any persistent store reads its initial value. The result: a fresh launch on the next page render. Scene and library are preserved (matching the existing factory-reset button's behaviour).

`main.ts` imports Configuration first so the side-effect runs before App.svelte's transitive imports trigger the persistent stores to read.

### Thread five — App.svelte slimming

Two big chunks of one-time setup code moved out of `App.svelte` into Configuration.

The first chunk — the long block of static design tokens that injects CSS variables onto the document root — moved into a new `configure_css` method.

The second chunk — the `?test=1` test-hook attachment — folded into Configuration's `apply_queryStrings` (since it is itself a URL-flag-driven action).

A third method, `configure_reactive_colors`, takes the four reactive color values as parameters and pushes them onto the document root. App.svelte's `$effect` now just forwards the four values to that method.

After all three moves, App.svelte's script block is a handful of lines: import Configuration, run `c.configure()` on mount, watch the four color stores via `$effect`, hand them to Configuration on each change.

### Thread six — memories saved

Several rules were codified:

- "move" always means relocate (copy plus delete), never just copy.
- "chime" means a brief plain-English analysis of recent changes, not an audible sound.
- The chime should lead with completions, optionally suggest a next step, and skip the plumbing detail.
- All pre-existing errors and warnings get fixed without approval, and without a report afterwards.
- Never ask permission to read a file or run a read-only check; just do it.
- Every substantive answer in the di project lands as a new section in `handoff.md`; the assistant picks the section title.

### Files touched

- Documentation: many under `notes/guides/` (new pages, indexes, the layout map, the lessons file, the updating-guides instructions). The map page picked up entries it had been missing.
- The working-notes file `update.guides.md` graduated to `work/done/`.
- Source: [Configuration.ts](di/src/lib/ts/common/Configuration.ts), [Preferences.ts](di/src/lib/ts/managers/Preferences.ts), [Stores.ts](di/src/lib/ts/managers/Stores.ts) (the two default flips), [App.svelte](di/src/App.svelte), [main.ts](di/src/main.ts).
- New screenshot capture: [playwright.config.ts](di/e2e/screenshots/playwright.config.ts), [first-steps.spec.ts](di/e2e/screenshots/first-steps.spec.ts), `package.json` gained a `shoot` script.

### How it was checked

- Type-checker: clean after every intermediate step.
- Test suite: six hundred thirty-three checks pass.
- Docs build: green.
- Screenshot run: eight passes in about thirty seconds.

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
- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).

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
- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).

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
- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).

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
- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).
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
- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).
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

- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).
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

A two-column table of every keyboard binding in the app, grouped by the context the key fires in. Keys mean different things on the canvas, inside a value cell, inside a name cell, inside a dimension or angle input, and inside the build-notes modal. Lives at [key paths.md](../../guides/architecture/ui/key%20paths.md).

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
- New reference doc: [key paths.md](../../guides/architecture/ui/key%20paths.md).
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

- File rename: [Dirty.ts](di/src/lib/ts/common/Dirty.ts) (was Stale_Writable.ts). Imports updated in [Hits_3D.ts](di/src/lib/ts/events/Hits_3D.ts), [Units.ts](di/src/lib/ts/types/Units.ts), [Engine.ts](di/src/lib/ts/render/Engine.ts), [Stores.ts](di/src/lib/ts/managers/Stores.ts), [Selection.ts](di/src/lib/ts/managers/Selection.ts), [Angular.ts](di/src/lib/ts/editors/Angular.ts), [Face_Label.ts](di/src/lib/ts/editors/Face_Label.ts), [Drag.ts](di/src/lib/ts/editors/Drag.ts), [Dimension.ts](di/src/lib/ts/editors/Dimension.ts), [Colors.ts](di/src/lib/ts/utilities/Colors.ts). File map: [map.md](../../guides/project/overview/map.md).
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
