# Open items

## 1. UI and interaction

### 1.1 Validation-error overlay placement after the rename refactor

Hop two of the rename refactor moved the validation overlay out of the parts list and up into the parent details. The overlay now lives at the bottom of the details column, below all the sub-details banners, rather than tucked inside the parts banner. This was not visually confirmed in a running browser. Worth a one-minute visual confirmation: trigger a name-validation error and check that the red-bordered message appears in a sensible spot whether the parts list is open or collapsed. If the placement looks off when the parts list is collapsed, the overlay can be repositioned without changing any of the wiring. *Effort: ~5 min to look, up to ~30 min if it needs nudging.*

### 1.2 Delete on a non-repeater grandchild leaves the part still listed

Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Need a console error message or a small mock scene to pin the failing step. *Effort: blocked on a mock; once a mock exists, ~half a day to track down and fix.*

### 1.3 Up/down arrow in the parts table skips two rows per press on Jonathan's scene

Could not reproduce from reading the code. Need more detail about the scene before a fix can be made. *Effort: blocked on scene detail; once seen, likely ~1 hour.*

### 1.4 Labels still inside silhouette in some views

The 2026-05-19 work fixed floaters and ruled out the spring as a cause. Two reported drawer-SO orientations — [-0.35, -0.38, -0.57, 0.64] and [-0.48, -0.42, -0.49, 0.60] — have not been re-measured since the floater fix. Next moves: visually re-check at those two orientations; if labels still sit inside, add the orientations to the inside-silhouette spec. If the bug still reproduces in code, the two remaining causal candidates are repulsion shoving labels across the outline (crowded views) or the eighty-pixel push cap leaving labels partly inside from the start (deep-clearance views). The richer diagnostic that names outside-the-silhouette position, after-push, and final positions per label would separate the two. *Effort: visual recheck ~5 minutes; diagnostic ~1 hour; fix ~half a day.* See §3.6 (bug 001) for the captured case and current synopsis.

## 2. Code quality

### 2.1 Stray trace log from the formula-bug investigation

A single console.log inside the algebra constraints file announces an aborted cycle walk. Pull it (or convert it into a real status-strip warning) before the next feature pass. The renderer's many logs are part of the topology rewrite and should be left alone. *Effort: ~2 min to pull, ~30 min to convert into a real warning.*

### 2.2 Identity-based formula storage

A targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor. *Effort: multi-day — touches storage, serialization, and the formula tokenizer.*

### 2.3 New canvas renderer open tail

Two items left from the renderer rewrite. Add a unit test for the renderer's geometry; needs canvas mocking. Adjust the "arrows inside" threshold if more visual diffing reveals the wrong layout case (arrows-inside chosen when arrows-outside would read better, or vice versa). *Effort: test ~2 hours; threshold tweak ~15 minutes per round.*

### 2.4 Coordinate system mixing audit

Standing item, fires on the next coordinate bug (a place where a number in one coordinate system is multiplied or compared with a number in another, with no conversion). Three escalating levels:

1. **Quick grep pass** (10-30 minutes). Scan the placement file, the renderer, and the helpers for places that multiply or compare numbers in different coordinate systems. **Things to look for:** a mm length multiplied by a px length with no tumble-then-projection between them, a px value treated as a fraction (or vice versa) without an explicit divide-or-multiply by a length, a dimensionless integer combined with a mm or px length without an explicit scale.
2. **Manual code walk** (a couple of hours). Trace every coordinate-using path end to end, document what system each variable lives in (mm, px, fraction), check every multiplication and comparison for system consistency.
3. **Compiler-checked coordinate tags** (a few hours of refactor). Tag every coordinate-bearing number with the system it lives in (mm, px, fraction) so the compiler refuses to mix tags silently. Permanent guard, touches many files.

On the next surface, do level 1 first. Escalate to level 2 only if more than one suspicious spot turns up. Level 3 is reserved for a separate refactor session. *Effort: trigger-driven; level 1 ten to thirty minutes.*

## 3. Remaining uniface work

### 3.1 Tuning pass on the placement constants

Constants in the placement code were set once during development and never revisited. Each one is a candidate for a visual tuning session — sweep the value through plausible settings while watching the running scene, lock in whichever setting the eye prefers. Spec list lives in the Phase 3 section at the bottom of [uniface proposal](uniface%20proposal.md). *Effort: about thirty minutes per constant, four constants total.*

- [ ] uniface gap — the world-units gap between the silhouette box and the surrounding uniface box.
- [ ] front rejection angle — how close (in degrees) a uniface's outward direction can point at the camera before it is rejected.
- [ ] back rejection angle — how close (in degrees) a uniface's outward direction can point away from the camera before it is rejected.
- [ ] closest separation — the minimum pair-clearance spacing required between any two label rectangles.

### 3.2 User-driven label override placeholder

The placement gives the user no way to nudge a label off where the algorithm puts it — there is no manual escape hatch. If the running app turns up a case where the algorithm's choice is visibly wrong and the user has no recourse, formalize a drag-to-move or right-click-to-move mechanism at that point. *Effort: not yet scoped; depends on the override algorithm (drag versus menu).*

### 3.3 Test-hook coverage — audit and fill

The e2e suite (e2e/tests/dimensions-*.spec.ts) expects test hooks on the test-only window object. Today some return real data, most return safe defaults (zero, empty array, null). The target: every hook returns its real value computed from the live placement state.

**Expected hooks** (name → what each returns):

- **dim_labels** — every drawn label as a record of part name, axis, screen position, rectangle.
- **dim_dropped_count** — count of labels dropped on the most recent render.
- **is_xray_active** — whether the OPTION x-ray mode is on.
- **dim_min_silhouette_clearance** — smallest gap, in pixels, between any drawn label rectangle and the silhouette polygon.
- **dim_viable_pair_counts** — per drawn label, the number of edge-and-face pairs that survived the shape filters.
- **dim_labels_by_kind** — per drawn label, its repeater-classification name (regular, master, fireblock-first, fireblock-last-shortened, clone).
- **dim_label_angles** — per drawn label, the on-screen rotation of the text glyph in radians. Every value is 0; the text is drawn horizontal.
- **dim_hover_state** — which label is currently hovered, current line width, whether the number is bold, whether the matching part is highlighted.
- **dim_popup_text** — the current name-popup string when one is visible; empty string when none.
- **dim_edit_state** — whether a dim editor is open, plus the part name + axis being edited and whether the value is editable.
- **dim_layout_frozen** — true while a dim editor is open and the layout is paused.
- **dim_last_cold_search_ms** — wall-clock duration of the most recent full search run.
- **dim_last_search_skipped_ms** — wall-clock duration of the most recent skip render.
- **dim_perf_breakdown** — per-phase timing breakdown for dev tuning.
- **set_view_mode(mode)** — input action; switches between 2D and 3D.
- **dim_conflict_graph_check** — OBSOLETE on the new path; decision needed: retire or rebuild from the new diagnostic counters that run_uniface_placement emits.
- **dim_drop_report** — OBSOLETE on the new path; same decision needed.

**Audit plan.** Walk the list in five groups, top to bottom:

1. **READY** — hook returns a real value with a small change to Debug.ts. Tackle first; each is about thirty minutes.
2. **COMPUTABLE** — hook needs new measurement code reading run_uniface_placement's last result, but the data is in the placement record. One to two hours each.
3. **NEEDS-INTERACTIVE-STATE** — hook depends on hover, popup, editor, or freeze state. Blocked until the interactive layer is wired into the new path; small once the wiring exists.
4. **NEEDS-INFRASTRUCTURE** — hook depends on the persistence + skip-mode work from step 3.1 (also encoded as dim.spec rule 2a). Blocked until step 3.1 is built; small after.
5. **OBSOLETE** — hook references concepts the new path does not have. Decision needed before coding: retire and update this proposal, or rebuild equivalents from the new diagnostic counters.

**Per-hook recipe.**

- Implement the hook in di/src/lib/ts/common/Debug.ts.
- Update or revive the matching e2e spec under e2e/tests/dimensions-*.spec.ts.
- Run yarn vitest and the Playwright suite.
- Visual-confirm if the hook drives a user-visible behaviour.

**Exit per hook.** Hook returns real data; matching e2e spec passes; the hook's purpose is achievable from the current placement state with no ad-hoc plumbing.

### 3.4 Unfinished items carried over from phases 1 and 2

Every item below is either disapproved, mothballed, or marked "future" in phase 1 or phase 2. None is closed; none is in flight. Decide per item whether to retire it (delete from this list), revive it (promote to its own step), or keep it parked.

**Disapproved from phase 2.**

- **3.4.1 step 1.5 — capture the visual baseline.** With the toggle off (the old path running), save a screenshot of the running app at four camera angles: front, three-quarter, top-down, tilted. The saved set was meant to be the reference picture for every later visible-output step. Disapproved; the path was retired before the baseline was used.

**Mothballed from phase 2.**

- **3.4.2 step 3h — descending-millimetres traversal (rule 19).** Replace the current alphabetical-by-name iteration of parts with a priority-queue traversal keyed by descending millimetre value of each (part, axis) measurement. Big measurements get first crack at every spot; small ones fit around them or drop. The queue holds (part, axis, value-in-mm) entries; each pop runs the existing four-degree search and commits if a candidate survives. Equal millimetre values mean equal formatted text and are caught by the duplicate-text drop before they reach the queue. Exit: unit tests pin (a) the traversal order is descending by millimetres, (b) on a scene where two labels compete for the same spot the bigger one wins, (c) the queue empties cleanly.
- **3.4.3 step 4 — rotated parts.** Set aside on 2026-06-09 — the rotated-parts work is not active. The proposal text below stays on disk for reference; revisit when rotated parts become a real design need. No code from step 4 has been built.
    - **3.4.3a step 4a — build the rotated silhouette and uniface boxes per rule 4.** Each rotated part gets its own box, aligned with the part, expanded by the silhouette margin. Exit: unit tests pass.
    - **3.4.3b step 4b — visual confirmation on a scene with two or more overlapping rotated parts.** If clutter results (labels stacked unreadably or witnesses crossing the rotated boxes' edges visibly), address by one of: sharing a uniface between overlapping rotated boxes, dropping one label per overlapping group, or widening the rotated-box silhouette margin. Decide between those options after the visual shows the problem, not before.

### 3.5 Wrong-side scoring iteration

We are tuning where the placement parks a dimension line. Several scoring rules have piled up, but the latest picture still puts the line on the far side of the drawing from the wall it measures, instead of right along it. Jonathan wants one more rule: reward a placement where the whole dimension lies flat against the front face of the part being measured.

The app cannot tell that yet. The outline it compares against wraps the whole scene, not the single part, so that outline's near face floats in front of the wall by the depth of everything behind it — never on the wall itself. Two ways forward:

- ONE — reward by how close the dimension line is to the part's front face: closer earns more (a sliding scale).
- TWO — build the comparison outline around the ONE part being measured, not the whole scene. Then its face is the part's face, so "lies on the face" is a clean yes or no.

Next: pick one, build it, look at the result, then keep tuning.

Notes:

- The lies-flat term scales by `max(0, −n_camera · n_front)`. When the front-most face points sideways, the term collapses to zero — intentional, but worth eyeballing across scenes.
- The on-plane reward probably requires deciding between graded distance and per-part silhouette boxes. The per-part choice is the bigger structural change.
- The "label inside part box" reject in the last-resort step assumes one part box per dim. Multi-part dims would need a different check.

### 3.6 Bug 001 — dim inside silhouette

From the bugs assemblage (one numbered folder per bug under `work/now/bugs`, no tracker; described in [our process](our%20process.md)). Folder: `notes/work/now/bugs/001 dim is inside silho/` — screenshot, render log, and `data.json` (the part, the view, what is wrong, what was expected).

The bug: at the captured view (part front.moose.kitchen wall, orientation and zoom in `data.json`), the 10' 4 1/4" label sits well inside the silhouette box. Expected: it should pass the first filter (dimensions.latest.spec, line 160).

Synopsis:

- The guard that decides "inside or outside the silhouette" tests the label against the outline built from the parts' box corners after projection. Under perspective that outline does NOT match the silhouette the eye sees, so a label can read as inside the visible silhouette while the guard calls it outside.
- Every diagnosis tried so far has been wrong against the visual. Standing rule: trust the eye over the log and the guard.
- Captured, not yet diagnosed; no code changed. Paused as part of the "simplify and perfect the flag-off case" arc (code-debt item 1) — nothing to revert.
- Same symptom as §1.4 (older 2026-05-19 notes there).

## 4. Zoom (proposed)

Three connected proposals about zoom. All still design — no code yet. Today zoom scales the model around the origin (a scale matrix on the root); the camera eye is fixed at 2750 mm. Evidence: root scale matrix, Drag.ts 747–750; camera eye, Camera.ts line 8.

### 4.1 Dolly zoom — move the camera in and out instead of scaling the model

- The model keeps true world size; the eye moves along its line of sight toward the center.
- Must clamp the near plane (10 mm) or near parts clip away. Evidence: Camera.ts near = 10.
- Migration: retire the stored scale amount; re-derive the default, the status read-out, saved views, and the dimensions slider's frustum basis from eye distance.

### 4.2 Flat-or-dolly toggle

A persisted flag plus a control that switches between today's flat scale and the dolly. Default flat; dolly behind the flag. Define a flat-amount to eye-distance mapping so switching mid-scene does not jump the view. Cost: two zoom paths to keep and test, and one more control.

### 4.3 Near-occluder peel

As you zoom in, HIDE parts closer to the camera than a zoom-driven depth, so front layers peel away and inner parts show.

- Chosen flavor: blanket near-plane peel. Hide outright (not fade). Never peel the selected or hovered part.
- Depth = distance from the eye along the view axis to a part's nearest box corner; the peel depth ramps with zoom, tuned by a curve.
- Focus-targeted peel (hide only the true occluders of a focus part) is the fallback if the blanket peels the wrong things; the renderer already tracks occluding faces. Evidence: Render.ts line 27.

Order to build: 4.1 (dolly) first, then 4.3 (peel) which leans on the dolly's depth, then 4.2 (toggle) if both are wanted. Each needs tests and a log line of what it culled or moved.

## 5. Mothballed

### 5.1 Residual child-drag drift

Parked in [milestone 33](di/notes/work/milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.

### 5.2 Allocation-cluster and string-key performance bullets

Deferred in [bottlenecks.md](bottlenecks.md). Revisit only if profiling points back at allocation pressure.

### 5.3 Stud / joist / stair master kinds

First cut at the three-way segmented control needed lots of work — wrong starting proportions, name collisions, and no path from a stair master to the existing diagonal-rise repeater. See [repeaters.mothball.md](repeaters.mothball.md) for what was attempted and the six things to think through before resuming.
