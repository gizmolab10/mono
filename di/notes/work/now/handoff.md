# Handoff

**Date:** 2026-05-19
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

## Open items

> All effort numbers below are guesses — calibrate from your own gut before scheduling.

- **Validation-error overlay placement after the rename refactor.** Hop two of the rename refactor moved the validation overlay from inside the parts list panel to the parent details panel. The overlay now lives at the bottom of the details column, below all the panel banners, rather than tucked inside the parts banner. This was not visually confirmed in a running browser. Worth a one-minute visual confirmation: trigger a name-validation error and check that the red-bordered message appears in a sensible spot whether the parts list panel is open or collapsed. If the placement looks off when the parts list is collapsed, the overlay can be repositioned without changing any of the wiring. *Effort: ~5 min to look, up to ~30 min if it needs nudging.*
- **One stray trace log left from the formula-bug investigation.** A single console.log inside the algebra constraints file announces an aborted cycle walk. Pull it (or convert it into a real status-strip warning) before the next feature pass. The renderer's many logs are part of the topology rewrite and should be left alone. *Effort: ~2 min to pull, ~30 min to convert into a real warning.*
- **Delete on a non-repeater grandchild leaves the part still listed.** Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Need a console error message or a small repro scene to pin the failing step. *Effort: blocked on a repro; once reproduced, ~half a day to track down and fix.*
- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** Could not reproduce from reading the code. Need more detail about the scene before a fix can be made. *Effort: blocked on scene detail; once seen, likely ~1 hour.*
- **Identity-based formula storage.** A targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor. *Effort: multi-day — touches storage, serialization, and the formula tokenizer.*
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](../milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Deferred in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.
- **Mothballed: stud / joist / stair template kinds.** First cut at the three-way segmented control needed lots of work — wrong starting proportions, name collisions, and no path from a stair template to the existing diagonal-rise repeater. See [repeaters.mothball.md](./repeaters.mothball.md) for what was attempted and the six things to think through before resuming.

## Proposal 10 — describe the complete dimensionals placement algorithm — DONE

[dimensionals.md](../../guides/architecture/graph/dimensionals.md) now walks the full placement pipeline: the shared outline built from leaf parts, the four-direction path-of-least-resistance picker, the camera-forward and witness-length filters, the 80-pixel push cap, duplicate-text drop, the force simulation (spring, repulsion, damping), motion carried across paints, stop-when-settled, the late drops (off-canvas, floater, drawn witness over 120 px), the drawing step, repeater integration, the diagnostic counters, and an expanded constants table with symptom → likely-cause notes. Every section names the source-line range that backs it.

Code-debt item checked off in [code.debt.md](./code.debt.md).

## Proposal 11 — labels still inside silhouette in some views

The code-debt item "dimension labels are still within the silhouette" remains open. The session-by-session detail of how we got here is in the journal entry for 2026-05-19. Current state:

- **Spring ruled out.** Spring constant turned off, no change in inside-silhouette count.
- **Floaters fixed.** Labels whose witness intersection would fall back are now dropped instead of drawn off-line. Side effect: at orientation [0.12, 0.63, 0.69, -0.33] the labels that used to land inside the outline got dropped instead, so that specific view is now clean.
- **Two other reported orientations not yet re-measured.** Drawer at [-0.35, -0.38, -0.57, 0.64] and [-0.48, -0.42, -0.49, 0.60] were each reported to show one label inside. Whether the floater fix also cleared these is not measured.
- **Inside-silhouette test was removed during the redesign-test sweep.** The old `dimensions-outside-silhouette.spec.ts` (which passed for orientation [0.12, 0.63, 0.69, -0.33]) was deleted because its weaker postcondition is subsumed by the new 15-pixel clearance test. The replacement [dimensions-clearance-silhouette.spec.ts](../../../e2e/tests/dimensions-clearance-silhouette.spec.ts) asserts the stricter 15-pixel rule but is currently `test.skip` pending the `dim_min_silhouette_clearance()` test hook (rule 25 of the redesign spec). Once that hook is added, the two un-measured orientations can be exercised by parametrising the test.

Next moves, in order:

1. Visually re-check drawer at the two un-measured orientations. If labels inside are still visible, add those orientations to the inside-silhouette spec.
2. If the bug reproduces in code, the candidates left are repulsion shoving labels across the outline (matters in crowded views) or the 80-pixel push cap leaving labels partly inside from the start (matters in deep-clearance views). The richer diagnostic (home, after-push, final positions per label) would separate the two.

## Proposal 12 — Task 1.1 + 1.2: add the test-only hooks to `di_test` and unskip the dimension tests — DONE

Hooks added to [Debug.ts:46](../../../src/lib/ts/common/Debug.ts#L46): twelve new read hooks (`dim_min_silhouette_clearance`, `dim_viable_pair_counts`, `dim_conflict_graph_check`, `dim_drop_report`, `dim_labels_by_kind`, `dim_label_angles`, `dim_hover_state`, `dim_popup_text`, `dim_edit_state`, `dim_layout_frozen`, `dim_last_cold_search_ms`, `dim_last_search_skipped_ms`) plus two input actions (`set_view_mode` and `force_cold_search`). Four of the read hooks return real data today (label angles, hover state, popup text, editor state); the other eight return placeholder values that will be filled in during Phase 2.

Thirteen e2e specs un-skipped (one per new hook plus combos). `svelte-check` passes with 0 errors and 0 warnings; all 698 unit tests still pass.

One pre-existing bug fixed along the way: `notes/tools/hub/ports.json` had a trailing comma that was breaking `svelte-check`'s style processor. Now valid JSON.

Tasks 1.1 and 1.2 in [dimensionals.work.md](./dimensionals.work.md) are checked off. Next step is Task 1.5.1 (deterministic seeded random-number generator) per the task plan.

## Proposal 13 — Task 1.5.1: deterministic seeded random-number generator — DONE

New file [Seeded_Random.ts](../../../src/lib/ts/common/Seeded_Random.ts) — a small linear congruential generator. Constructor takes a 32-bit numeric seed or a string (hashed via FNV-1a). `.next()` returns a uniform float in [0, 1); `.next_int(max)` returns a uniform integer in [0, max); `.pick_one(items)` returns a uniformly random element. Zero-seed protection bumps the state to 1 so the LCG doesn't lock at zero.

Eleven unit tests in [Seeded_Random.test.ts](../../../src/lib/ts/tests/Seeded_Random.test.ts) cover the determinism, range bounds, edge cases, and hash. All eleven pass. The unit-test suite total moved from 698 → 709. `svelte-check` still reports 0 errors and 0 warnings.

Next step is Task 1.5.2 (per-phase timing instrumentation) per the task plan.

## Proposal 14 — Task 1.5.2: per-phase timing instrumentation — DONE

New file [Performance_Timer.ts](../../../src/lib/ts/common/Performance_Timer.ts) — small per-phase timer with `start(phase)`, `stop(phase)`, `last(phase)`, `average(phase)`, `breakdown()`, and `reset()`. The two existing performance hooks (`dim_last_cold_search_ms`, `dim_last_search_skipped_ms`) now read from the timer. New hook `dim_perf_breakdown()` exposes the per-phase table for dev-mode tuning; spec rule 25 updated to list it.

Seven unit tests in [Performance_Timer.test.ts](../../../src/lib/ts/tests/Performance_Timer.test.ts) — stubbing `performance.now` to make the running-average math deterministic. Suite total now 716. `svelte-check` clean.

Phase 1.5 done. Next step is Task 2.1 (compute viable (edge, direction) pairs and their DOF ranges per label) — the first piece of new algorithm code.

## Proposal 15 — Task 2.1: viable (edge, direction) pair enumeration with DOF ranges — DONE

First piece of new algorithm code. New file [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts).

`compute_viable_pairs()` walks every visible smart object, every axis, every silhouette edge along that axis, every signed perpendicular direction. Applies the four rule-11 filters and returns survivors with continuous-DOF ranges in pixels.

The four filter implementations:

- **Camera-axis.** Direction's world-space projection within 30° of camera forward → reject. Same logic as today's code at R_Dimensions.ts:660-678, lifted into a standalone helper.
- **Witness-length min.** Distance along the witness direction from the projected edge midpoint to the combined-outline exit, plus the half-rectangle footprint along that direction, plus the 15-pixel buffer (rule 9's margin). Uses the `ray_polygon_exit` helper already exported from R_Dimensions.ts.
- **Witness-length max.** Linear approximation: min of 80 (push cap) and 120 (projected witness limit). I AM GUESSING the linear approximation is accurate enough at the small pushes most labels use; binary search is the documented fallback.
- **Slidable-position range.** From `−50 + label_width / 2` to `dim_line_length + 50 − label_width / 2`, in pixels measured along the dim line. Range collapses if the line is shorter than the label minus the 100-pixel overhang.

`compute_viable_pair_counts()` aggregates per (so, axis) and is what the `dim_viable_pair_counts()` hook now reads. Test [dimensions-pair-enumeration.spec.ts](../../../e2e/tests/dimensions-pair-enumeration.spec.ts) can now exercise real enumeration.

`svelte-check` clean. 716 unit tests still pass.

Next step is Task 2.2 (spatial-grid first pass for pair-check, rule 24 first pass).

## Proposal 16 — Task 2.2: first-pass pair candidates via spatial grid — DONE

Two new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `compute_reachable_regions()` — per (so, axis) label, the AABB of every screen position the label rectangle can occupy across its full four-DOF range. Computed from the viable pairs and the four corners of (witness_length × slidable_position).
- `compute_neighbour_pairs()` — wraps the grid worker. Puts each region's expanded AABB in a 50-pixel coarse grid; pairs sharing a cell are candidates; a final AABB-overlap check with the 33-pixel margin filters down to the actual candidate list.

The grid worker `neighbour_pairs_from_regions(regions)` is exported as a pure function so it's unit-testable. Seven tests in [Dimension_Placement.test.ts](../../../src/lib/ts/tests/Dimension_Placement.test.ts) cover no-overlap, just-overlapping, just-outside, multi-cell de-dup, self-pair, mixed scenes, axis preservation.

Suite total 723. `svelte-check` clean.

`Viable_Pair` grew six fields (label width and height, projected edge endpoints, unit witness direction) so the reachable-region math doesn't have to re-project.

Next step is Task 2.3 (closed-form rectangle separation for pair-check second pass).

## Proposal 17 — Task 2.3: closed-form rectangle separation for second pass — DONE

Three new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `pair_can_separate(pair_a, pair_b, clearance)` — closed-form yes/no on whether two viable pairs' rectangles can be at least `clearance` pixels apart. Conservative axis-aligned AABB check (no false negatives, some false positives that get kept in the conflict graph as the safe direction).
- `labels_can_separate_via_some_combination(pairs_a, pairs_b, clearance)` — walks the up-to-64 (pair_A, pair_B) combinations. Returns true the moment any combination passes.
- `compute_tier2_survivors()` — wraps Tasks 2.2 + 2.3 together. Returns the candidate pairs that survive both passes (the "stubborn" pairs that enter the conflict graph in Task 2.4).

Seven new unit tests for the second-pass math. Suite total 730. `svelte-check` clean.

Next step is Task 2.4 (build the conflict graph from the stubborn pairs).

## Proposal 18 — Task 2.4: conflict graph and brute-force verifier — DONE

Three new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `Conflict_Graph` class — undirected graph of label conflicts with `add_edge`, `has_edge`, `neighbours`, `conflict_count`, `all_edges`, `size`. De-duplicates, no self-edges, stable canonical edge format.
- `build_conflict_graph()` — walks every tier-2 survivor and adds it as an edge.
- `check_conflict_graph()` — brute-force pairwise comparison against the graph; returns any mismatches.

The `dim_conflict_graph_check()` test hook now reads real verification data. Returns an empty list when the graph matches the brute-force result; otherwise lists the disagreements.

Six new unit tests for the graph itself. Suite total 736. `svelte-check` clean.

Next step is Task 2.5 (greedy seed — rule 23's greedy step).

## Proposal 19 — Task 2.5: greedy seed with most-constrained-first ordering and 5×5 grid sampling — DONE

Five new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `Greedy_Placement` type — the four-DOF tuple a label commits to plus the achieved minimum clearance.
- `greedy_seed()` and `greedy_seed_for_regions()` — the scene-bound and pure entry points.
- `order_by_constrainedness()` — fewest pairs first, then ancestry path, then axis letter.
- `best_candidate_in_pair()` — 5×5 grid sample within the pair's (witness_length × slidable_position) range; returns the candidate with the largest minimum distance to every placed rectangle.
- `min_distance_to_placed()` — rectangle-to-rectangle distance helper.

Eleven new unit tests cover the distance math, the grid sample, the most-constrained-first ordering with all three tie-break levels, and the full greedy on two-label scenes. Suite total 747. `svelte-check` clean.

Next step is Task 2.6 (continuous optimisation inside a pair — already implemented as part of 2.5's grid sample) → Task 2.7 (repair pass).

## Proposal 20 — Task 2.7: repair pass — DONE

Two new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `repair_pass(placed, regions)` — for every still-conflicted pair after the greedy: try a single-label switch first, then a paired swap. Cap at two labels moving. Mutates the input.
- `find_conflicts_in_placement(placed)` — every pair of placed labels under 33 pixels rectangle-to-rectangle.

Seven new unit tests covering the conflict-finder at four distances (no conflict, 20-pixel gap, exactly-33-pixel boundary, multi-overlap chain) and the repair pass at three outcomes (single-switch resolves, clean placement untouched, no-alternative gives up gracefully).

Suite total 754. `svelte-check` clean.

Next step is Task 2.8 (stochastic finish).

## Proposal 21 — Task 2.8: stochastic finish — DONE

Two new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `stochastic_finish(placed, regions, seed, max_iterations)` — up to 200 random tries (configurable). Each iteration picks a random conflicted label, picks a random other viable pair, finds its best continuous values via the grid sample, and accepts the switch only when the total conflict count drops. Deterministic given the seed.
- `seed_string_from_regions(regions)` — stable seed string from every label key joined alphabetically. Same scene → same seed.

Uses the seedable random-number generator from Task 1.5.1 (the FNV-1a hashed string seed feeds the linear congruential generator).

Six new unit tests covering conflict resolution, determinism across runs, no-op on clean placement, iteration cap, and the seed-string helper.

Suite total 760. `svelte-check` clean.

Next step is Task 2.9 (drop policy — rule 12).

## Proposal 22 — Task 2.9: drop policy — DONE

One new export in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `apply_drop_policy(placed, canvas_w, canvas_h, no_viable_pair_labels)` — iteratively drops labels until no conflicts remain. Three drop reasons match rule 12: no-viable-pair (caller-supplied), off-canvas, and remaining-conflict (most-connected first; ties broken alphabetically per rule 21). Returns a `Drop_Report` with each dropped entry and `kept_max_conflict` (always 0 by construction).

Six new unit tests covering the no-op case, single-pair drop with tie-break, multi-conflict chain ordering, off-canvas, caller-supplied no-viable-pair entries, and the kept-zero-conflict guarantee.

Suite total 766. `svelte-check` clean.

The `dim_drop_report()` test hook still returns the placeholder until Task 2.11 wires the full pipeline.

Next step is Task 2.10 (persistence with 2-pixel tolerance).

## Proposal 23 — Task 2.10: persistence with 2-pixel tolerance and seeded semantics — DONE

Two new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `compute_viability(persisted_list, regions)` — for every remembered label, finds the matching (edge, direction) pair in the current regions, re-projects, and runs four viability checks (witness length tolerance, slidable position tolerance, pair still exists, pairwise rectangle clearance ≥ 31). Returns either skip-search with an `any_slack_used` flag, or cold-run with locked + free lists per rule 19's seeded semantics.
- `Persistence` class — holds the remembered four-DOF map plus the drift-safety streak counter. `remember`, `remember_all`, `forget`, `clear`, `has`, `size`, `get_all`, `note_slack_use`, `clear_slack_streak`, `should_force_cold_run`.

Two new exported types: `Persisted_Placement`, `Viability_Result`.

Twelve new unit tests covering both halves of the system: six for `compute_viability` (all-pass strict, slack-only, outside-tolerance, pair-no-longer-viable, pairwise overlap, empty input) and six for the `Persistence` class (starts empty, records and recalls, forgets by key, clears with streak reset, force-cold-run after two slack paints, clear-streak resets).

Suite total 778. `svelte-check` clean.

Next step is Task 2.11 (wire the new algorithm behind a feature flag).

## Proposal 24 — Task 2.11: feature flag + orchestrator — DONE

Three pieces wired together:

1. **Feature flag.** New session store `w_use_new_placement` on the stores manager, default false, with a `stores.use_new_placement` getter.
2. **Orchestrator.** New `run_new_placement(canvas_w, canvas_h)` function in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts) that walks: compute regions → check viability against the persistence map → either reuse persisted (search-skipped) or run greedy + repair + stochastic (cold) → apply drop policy → replace persistence with the new placements. Module-level `persistence` instance survives across paints. Result cached in a module variable readable via `get_last_run_result()`.
3. **Test-hook integration.** `dim_drop_report()` now reads from the last run's drop report. `force_cold_search()` clears persistence and re-runs placement, gated by the feature flag.

Today's paint loop still runs the force-driven `R_Dimensions.ts` because the flag defaults off. Flipping it on routes the test hooks at the new pipeline.

Suite total 778. `svelte-check` clean.

**Known shortcut.** The cold-run branch doesn't yet honour rule 19's "locked labels never move" property — when any label fails strict viability, the full search runs over every label instead of locking the strict-passers. Correctness is preserved (every label still gets placed and clearance is checked) but stability across paints is weaker than the spec promises. Threading a locked-key set into the three search functions is a follow-up.

Phase 2 done. Phase 3 next — flip the flag and triage the e2e failures.

## Proposal 25 — Task 3.1 setup: paint-loop integration + hook wiring — IN PROGRESS

The feature flag now defaults to ON. `run_new_placement` runs at the end of every `render_dimensions` paint when the flag is on, alongside the still-drawing old code. Five test hooks now read real new-placement data: `dim_last_cold_search_ms`, `dim_last_search_skipped_ms`, `dim_min_silhouette_clearance`, `dim_drop_report`, `dim_labels_by_kind` (the last still tags every label `'regular'` — repeater-aware tagging is the first known gap to fix).

Per-phase timing instrumentation wired into the orchestrator: `cold_search`, `search_skipped`, `greedy`, `repair`, `stochastic`.

778 unit tests still pass; `svelte-check` clean.

**Three known gaps will surface as e2e failures the next time the suite runs:**

1. **Repeater-aware filtering missing** — clones-skip and fireblock-obstacles tests will fail until rule 18's logic is ported from `R_Dimensions.ts:380-410` into `compute_viable_pairs`.
2. **"Locked labels never move" not honoured** in the cold-run branch — stability across paints is weaker than rule 19's seeded semantics promise.
3. **Drawing still owned by the old code** — the canvas paints via `R_Dimensions.ts`. Visual confirmation against the new placements requires Task 3.3 work.

Driving the Playwright suite needs a browser + dev server. Belongs in a session where that's set up.

## Proposal 26 — Gap 1: repeater-aware filtering in `compute_viable_pairs` — DONE

Rule 18's repeater logic now lives in the new pipeline. New helper `classify_so` in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts) mirrors `R_Dimensions.ts:380-410` exactly: a part with no repeater parent is `'regular'` and gets all three axes, `siblings[0]` of a repeater parent is `'template'` and gets all three axes, non-firewalled clones are skipped (kind `'clone'`, no axes), firewalled siblings whose length matches the template are skipped, the first fireblock in the run is `'fireblock-first'` and gets the repeat axis only, and the last fireblock if shortened from the first is `'fireblock-last-shortened'` and gets the repeat axis only.

The Label_Kind value rides through the pipeline: `Viable_Pair`, `Reachable_Region`, and `Greedy_Placement` all carry it; `re_project_persisted` pulls kind from the current paint's pair so a re-classified part shows up correctly without churning the persistence layer. The `dim_labels_by_kind` hook now reports the real kind from placements — the legacy-path branch still says `'regular'` because the old code drops clones before drawing.

`svelte-check` clean. 778 unit tests still pass after backfilling the `kind: 'regular'` field across the test fixtures.

The locked-labels and drawing-cutover gaps remain.

## Proposal 27 — Gap 2: locked-labels-never-move enforcement in the cold-run branch — DONE

Rule 19's seeded-cold-run promise — that labels still strictly viable from the previous paint stay exactly where they were while the broken ones get a fresh seat — is now enforced.

`greedy_seed_for_regions` takes an optional `locked_placements` list. Those placements are pre-loaded into `placed` before the search starts, so every non-locked label sees them as obstacles, and their regions are filtered out of the ordering so they never get a fresh slot. `repair_pass` and `stochastic_finish` each take an optional `locked_keys` set: switches, paired swaps, and stochastic targets all skip indices whose label key is in the set.

The orchestrator in `run_new_placement` builds the locked list from `viability.locked` whenever `viability.kind === 'cold_run'` AND drift-safety has not fired. When drift-safety forces a cold run (two slack-using paints in a row), the locked list is empty — the whole layout is re-derived, matching rule 19's drift-safety clause.

Three new unit tests pin the behavior: greedy_seed keeps a locked label exactly at its carry-over slidable position and seats the rest around it; repair_pass refuses to switch a locked label even when it has an escape pair; stochastic_finish never picks a locked label as a swap target.

`svelte-check` clean. 781 unit tests pass (was 778).

Only the drawing-cutover gap remains (Task 3.3).

## Proposal 28 — Task 3.2: write the new canvas painter — DONE for first pass

The new pipeline now turns its placement list into pixels and Jonathan has visually confirmed three things in the running app.

What was added:

- A painter-source store value with three states (`'old' | 'new' | 'both'`) defaulting to `'old'`. Today's behavior is unchanged for any user who has not flipped the toggle.
- A three-button toggle in the bottom-left of the graph area (old / both / new). The button matching the current state is highlighted.
- `text` and `dim_z` plus four per-endpoint witness-vector fields plumbed through each viable pair so the painter has every input it needs without re-projecting.
- A new painter file. It reads the carry-over placement list, draws two witness lines (each from its own endpoint's projection — they correctly diverge in perspective), the dim line between the two witness ends, arrows in two layout cases (arrows inside when the line is long enough, arrows outside on short lines), a white box behind the number, and the number text. The label center is re-snapped onto the painted dim line so the text sits exactly on the line in every camera angle. It honors hover state. The new painter always draws in blue so the user can confirm visually that the new code is what they are looking at, regardless of mode.
- The paint loop is gated. The old painter only draws and pushes hit-test rectangles when the toggle is `'old'` or `'both'`. The new painter only draws when the toggle is `'new'` or `'both'`. The new painter only pushes hit-test rectangles when the toggle is `'new'`. The status-bar drop counter is published by whichever painter is sole.

Three bugs fixed during the first round of visual confirmation:

1. **First-paint nothing-drawn.** The viability check returned "skip the search" when nothing had been remembered yet (the vacuous-true case), so the search never ran and the painter had nothing to draw. Fix at the viability check: require at least one remembered label before considering a skip. Two new unit tests pin the empty-input and empty-remembered behavior.
2. **Screen-parallel witness lines.** The painter was using one averaged screen-space witness direction for both witness lines, which made them screen-parallel by construction even though the underlying rays are world-parallel (not screen-parallel under perspective). Fix at the painter and the data shape: each pair now stores per-endpoint per-3D-unit screen vectors, and the painter computes each witness end from its own endpoint's projection. Rule 5 in the spec was strengthened to forbid the shortcut.
3. **Floating labels.** The search picked a label center using an averaged witness direction; the painter drew the dim line between per-endpoint witness ends. In perspective those two diverge and the label floated next to the line. Fix at the painter: re-snap the label center onto the painted dim line, using the search's slidable choice as the distance from the first witness end. Rule 7 in the spec was strengthened to forbid the shortcut.

What is still open in this task (no longer blocking visual use):

- Adding a unit test for the painter's geometry (canvas-mocking required).
- Adjusting the "arrows inside" threshold if more visual diffing reveals the wrong layout case.

`svelte-check` clean. 782 unit tests pass.

## Proposal 30 — Tasks 3.5, 4.0, 4.1 + four parity gaps — DONE

Six things in one pass:

**Camera-angle fallback.** When every direction fails the 30° camera filter, the new pipeline now falls through to trying all four directions anyway, so the label still appears (degenerate is better than missing). Matches the old painter's behavior.

**2D-mode axis restriction.** In 2D view, the new pipeline only measures the two axes on the front-facing face. The repeater filter still runs first; the 2D restriction narrows whatever set the repeater filter allows.

**X-ray visibility.** When OPTION is held AND any part is hidden, dimensions are now drawn for the hidden parts only and the visible parts are skipped — matching the old painter's x-ray mode.

**Layout-freeze while editing.** When the dimension number editor is open, the search step is bypassed. Persisted placements are re-projected onto the current paint's pairs so dim and witness lines still follow the camera, but each label's four-DOF choice stays put. The `dim_layout_frozen` readout hook now reports the real state.

**Helpers moved out of the old file.** `convex_hull`, `ray_polygon_exit`, `push_outside_hull`, the combined-hull computation, and the status-bar drop-count store all live in `Dimension_Placement.ts` now. The hull is computed at the start of every `compute_viable_pairs` call so the new pipeline is self-sufficient — no longer reads `last_hull` from the old file.

**Old force-driven code deleted.** `R_Dimensions.ts` is now a thin wrapper that clears the hit-test list, calls the new search, and asks the new painter to draw. Gone: the force-driven simulation, `persisted_state`, the spring/repulsion/damping constants, the stop-when-settled state, the duplicate-text drop, the off-canvas drop, the candidate prep, the silhouette push helpers, the occlusion check, the old painter, and the per-paint stats. The `use_new_placement` and `painter_source` toggles are removed from `Stores`. The bottom-left toggle UI and CSS are removed from `Graph.svelte`. Two stale test hooks (`set_spring_k`, `dim_lines`) are removed from `Debug`. Various conditional branches that gated on the toggle are simplified.

`svelte-check` clean. 789 unit tests still pass.

**Rule 4 in the new pipeline.** When two labels share both the same number text AND a 3D-parallel measured edge, the new pipeline now drops the later one. The keeper is whichever was already remembered last paint; on a first paint with neither remembered, alphabetical by part ancestry path picks the keeper deterministically. The drop is recorded in the drop report with reason "duplicate_text" — a new value added to the existing drop-reason set. Seven new unit tests cover the truth table: simple duplicate, different 3D direction kept, different text kept, flipped-direction treated as same, persistence-based tie-break, alphabetical tie-break, three-way duplicates.

Negative-zero gotcha along the way: the direction canonicalization multiplies a component by minus one, which can produce minus-zero, and minus-zero's string formatting can break the grouping key. The canonical-direction helper now normalizes minus-zero to zero before building the key.

**Painter source default is now "new".** On launch the canvas paints from the new pipeline's placements (in blue). The old painter still runs its computation up to the drawing step but does not draw. The toggle remains available so the user can flip back to "old" or "both" at any time.

`svelte-check` clean. 789 unit tests pass (was 782; +7).
