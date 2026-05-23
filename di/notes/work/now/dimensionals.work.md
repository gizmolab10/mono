# Dimensionals Redesign — Task List

The full work needed to replace the running force-driven placement code with the four-degrees-of-freedom search specified in [guides/development/rules/dimensionals.md](../../guides/development/rules/dimensionals.md). Tasks are ordered by dependency. Every effort number is a guess (range, not a point), and every risk is named so it can be retired or escalated as work progresses.

*Refresh this file as tasks finish. Move done items into [code.debt.paid.md](../done/code.debt.paid.md) and check this file off in [code.debt.md](./code.debt.md).*

## Phase 1 — Test infrastructure (must come first)

The tests are the acceptance contract. They have to be wired up before any new algorithm code is written so failures are visible from the first line.

### Task 1.1 — Add the ten test hooks to the test-only window object — DONE

Added the twelve new read hooks plus two input actions (`set_view_mode` and `force_cold_search`) to the `di_test` object in [Debug.ts](../../../src/lib/ts/common/Debug.ts). Four of the read hooks return real data today: `dim_label_angles` (always 0, since text is screen-horizontal), `dim_hover_state` (from `hits_3d`), `dim_popup_text` (replicating the inline format used in Graph.svelte), `dim_edit_state` (from the dimensions editor module). The other eight return placeholder values that will be filled in during Phase 2. The pre-existing trailing-comma bug in `notes/tools/hub/ports.json` was also fixed so `svelte-check` runs clean.

- **Dependencies.** None. Pure plumbing.
- **Effort guess.** Half a day to one day. Mostly straightforward; harder than expected if any hook needs internal data the renderer doesn't currently expose.
- **Risk.** A hook turns out to need a non-trivial refactor of the renderer's data flow. Example: `dim_conflict_graph_check` may want access to a conflict graph that doesn't exist until task 2.4. Mitigation: stub each hook to return placeholder data when the corresponding feature isn't built yet, then fill it in as the feature is added.

### Task 1.2 — Unskip all `test.skip` cases that depend only on hooks added in 1.1 — DONE

Removed `test.skip` from all thirteen dimension spec files that were skipped pending hooks: `dimensions-2d-mode`, `clearance-silhouette`, `click-to-edit`, `conflict-graph`, `drop-policy`, `fireblock-obstacles`, `hover`, `label-horizontal`, `pair-enumeration`, `popup-format`, `repeater-clones-skip`, `search-cold-perf`, `search-skipped-perf`. They are now live tests. Some pass trivially against the stubs, some fail predictably — both states are expected at this stage of the redesign.

- **Dependencies.** Task 1.1.
- **Effort guess.** One to two hours.
- **Risk.** Some tests fail for reasons other than "old code is wrong" (test infrastructure quirks, viewport-size assumptions). Mitigation: triage each failure; if it's a test bug, fix the test, not the algorithm.

## Phase 1.5 — Helpers and instrumentation

Two small utilities the algorithm code in Phase 2 will assume. Build them before the algorithm so the algorithm can use them from the first commit.

### Task 1.5.1 — Deterministic seeded pseudo-random number generator — DONE

[Seeded_Random.ts](../../../src/lib/ts/common/Seeded_Random.ts) holds a small linear congruential generator. Constructor takes either a 32-bit numeric seed or a string (hashed via FNV-1a). Three output methods: `next()` returns a uniform float in [0, 1); `next_int(max)` returns a uniform integer in [0, max); `pick_one(items)` returns a uniformly random element from an array. Eleven unit tests in [Seeded_Random.test.ts](../../../src/lib/ts/tests/Seeded_Random.test.ts) cover determinism (same seed → same sequence, including string seeds), range bounds, edge cases (max ≤ 0 throws, zero-seed protection), and the FNV-1a hash. All eleven pass; the full unit-test suite now totals 709 tests, all passing.

- **Dependencies.** None.
- **Effort guess.** One to two hours, including a few-line test that asserts the sequence is identical across two runs with the same seed.
- **Risk.** Low. The LCG is twenty lines of code. The risk is forgetting to use it and reaching for `Math.random()` by reflex elsewhere. Mitigation: lint rule or grep check; calling `Math.random()` anywhere in the placement code is a bug.

### Task 1.5.2 — Per-phase timing instrumentation — DONE

[Performance_Timer.ts](../../../src/lib/ts/common/Performance_Timer.ts) holds a small per-phase timer. `start(phase)` and `stop(phase)` mark phase boundaries; `last(phase)` returns the most recent duration; `average(phase)` returns the running mean; `breakdown()` returns the per-phase stats for dev-mode inspection; `reset()` clears every phase. The two existing performance hooks (`dim_last_cold_search_ms`, `dim_last_search_skipped_ms`) now read from the timer instead of returning 0. A new hook `dim_perf_breakdown()` surfaces the per-phase table for dev-mode tuning; added to rule 25 of the spec. Seven unit tests in [Performance_Timer.test.ts](../../../src/lib/ts/tests/Performance_Timer.test.ts) cover start/stop, the running-average math (with a stubbed `performance.now`), per-phase isolation, the breakdown sort, and reset. All seven pass; the suite total is now 716. `svelte-check` reports 0 errors and 0 warnings.

Phase 2 will call `perf_timer.start('cold_search')` / `perf_timer.stop('cold_search')` at search boundaries, plus matching pairs for `'search_skipped'`, `'collect'`, `'tier_1'`, `'tier_2'`, `'tier_3'`, `'greedy'`, `'repair'`, `'stochastic'`, `'viability_check'`.

- **Dependencies.** Task 1.1.
- **Effort guess.** Two to four hours.
- **Risk.** Timing wrappers add a few microseconds per call. Mitigation: use `performance.now()` directly at phase boundaries, not inside hot inner loops; accept the rounding noise.

## Phase 2 — Build the new algorithm behind a feature flag

Develop the new code alongside the old. A feature flag lets the renderer pick which placement runs. Old code keeps shipping until the new one passes every test.

### Task 2.1 — Compute viable (edge, direction) pairs and their DOF ranges per label — DONE

[Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts) holds the new viable-pair computation. `compute_viable_pairs()` walks every visible smart object, every one of its three axes, every silhouette edge along that axis, and every signed perpendicular direction. For each (edge, direction) pair it applies the four rule-11 filters — camera-axis, witness-length min, witness-length max, slidable-position range — and returns the survivors each with their continuous-DOF ranges in pixels plus the average projected witness length per 3D unit (which Phase 2 will use to convert pixel pushes back to 3D distances when projecting).

The witness-length max uses a linear approximation (min of 80 and the value at which projected witness reaches 120 px). I AM GUESSING the linear approximation is accurate enough at the small pushes most labels use; if a future test fails because of foreshortening overshoot, a binary search inside this function is the fix.

`compute_viable_pair_counts()` aggregates the pairs per (so, axis) — what the test hook `dim_viable_pair_counts()` exposes. The hook reads real data from this function instead of the empty-array stub. Test [dimensions-pair-enumeration.spec.ts](../../../e2e/tests/dimensions-pair-enumeration.spec.ts) can now exercise real enumeration in the browser.

716 unit tests still pass; `svelte-check` is clean.

- **Dependencies.** Task 1.1 (so `dim_viable_pair_counts()` reports real data).
- **Effort guess.** Half a day to one day.
- **Risk.** The witness-length-max filter requires projecting the witness line at the candidate length, which is a per-candidate cost. Mitigation: linear approximation used today; binary search is the fallback if approximation overshoots.

### Task 2.2 — Spatial-grid first pass for pair-check (rule 24 first pass) — DONE

[Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts) gained `compute_reachable_regions()` and `compute_neighbour_pairs()`. Each label's reachable region is computed as the AABB of every screen position the label rectangle can occupy across all its viable (edge, direction) pairs and the four corners of their continuous-DOF ranges. The grid worker `neighbour_pairs_from_regions(regions)` (exposed as a pure function so it can be unit-tested) puts each expanded AABB in a 50-pixel coarse grid, then walks every pair sharing a cell, de-dupes, and applies a final AABB-overlap check with the 33-pixel margin to weed out pairs that share a cell but don't actually overlap.

Cell size 50 px was picked to match a rough average of label widths. I AM GUESSING this is in the right ballpark; the per-pair-count diagnostic in `dim_perf_breakdown` (Task 1.5.2) will tell us once Phase 3 wires the new code into the paint loop.

Seven unit tests in [Dimension_Placement.test.ts](../../../src/lib/ts/tests/Dimension_Placement.test.ts) cover the grid worker — no overlap → empty result, just-overlapping pair flagged, just-outside pair ignored, multi-cell de-dup, self-pair excluded, mixed scene, axis tags preserved. Suite total now 723. `svelte-check` clean.

`Viable_Pair` gained six additional fields (label width and height in pixels, projected edge endpoints, unit witness direction) so the reachable-region computation has everything it needs without re-projecting.

- **Dependencies.** Task 2.1.
- **Effort guess.** Two to four hours.
- **Risk.** Cell-size choice matters; too small means many cells and overhead, too large means many in-cell pairs. Mitigation: start with cell size = average label rectangle width; measure; tune.

### Task 2.3 — Closed-form rectangle separation for pair-check second pass (rule 24 second pass) — DONE

Three new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `pair_can_separate(pair_a, pair_b, clearance)` — given two viable pairs, can their two label rectangles achieve the requested clearance? Computes each pair's label-center AABB across (witness_length × slidable_position), then checks whether the max achievable X-axis or Y-axis gap (max centroid distance minus the two rectangle half-extents) meets the clearance. Conservative AABB check — false negatives are impossible; some pairs that could diagonally separate get kept anyway, which is the safe direction.
- `labels_can_separate_via_some_combination(pairs_a, pairs_b, clearance)` — walks the up-to-64 (pair_A, pair_B) combinations. If any one passes `pair_can_separate`, the labels are not in conflict.
- `compute_tier2_survivors()` — combines Task 2.2's first-pass candidates with the second-pass filter; returns only the pairs that survive both. These are the candidates that enter the conflict graph in Task 2.4.

Seven new unit tests in [Dimension_Placement.test.ts](../../../src/lib/ts/tests/Dimension_Placement.test.ts) cover the closed-form math with a helper that constructs viable pairs with a horizontal projected edge and an upward witness direction, so the geometry is easy to reason about. Covers far-apart slidable ranges, fully-overlapping AABBs with wide rectangles, vertical separation via witness length, custom clearance values, mixed combinations, and empty pair sets.

Suite total now 730. `svelte-check` clean.

I AM GUESSING the conservative axis-aligned check is enough in practice. Once Phase 3 wires the search into the paint loop, the `dim_conflict_graph_check` hook (Task 1.1) brute-force verifies tier 2's output and will flag any false drops.

- **Dependencies.** Task 2.2.
- **Effort guess.** Half a day. Geometry needs care to be correct.
- **Risk.** A subtle bug in the rectangle-vs-rectangle separation test produces false negatives — the conflict graph misses pairs that really do collide. Mitigation: the `dim_conflict_graph_check` hook (task 1.1) brute-force verifies tier 2's output and reports mismatches.

### Task 2.4 — Build the conflict graph from the stubborn pairs (rule 24 third pass) — DONE

Three new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `Conflict_Graph` class — undirected graph of label conflicts. Methods: `add_edge`, `has_edge`, `neighbours`, `conflict_count`, `all_edges`, `size`. De-duplicates on add, ignores self-edges, stores edges canonically (sorted endpoint pair so order-of-add doesn't matter).
- `build_conflict_graph()` — walks every tier-2 survivor (from `compute_tier2_survivors()`) and adds it as an edge.
- `check_conflict_graph()` — brute-force verification: walks every pair of labels in the current scene, computes "can separate" directly via `labels_can_separate_via_some_combination`, compares with the graph. Returns any mismatches.

`dim_conflict_graph_check()` test hook now calls `check_conflict_graph()` and returns mismatches. By construction this should always be empty if the tiered algorithm and the conflict-graph builder agree — which they do today since both use the same `labels_can_separate_via_some_combination` helper. The hook earns its keep once Phase 2 introduces shortcuts in the tier-2 path; any future divergence from the brute-force result will surface here.

Six new unit tests in [Dimension_Placement.test.ts](../../../src/lib/ts/tests/Dimension_Placement.test.ts) cover the graph itself — starts empty, no-double-add, no-self-edge, symmetric neighbours, canonical edge format, label-key builder. Suite total now 736. `svelte-check` clean.

- **Dependencies.** Task 2.3.
- **Effort guess.** Two to four hours.
- **Risk.** Low. Bookkeeping work.

### Task 2.5 — Greedy seed (rule 23 greedy step) — DONE

Five new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `Greedy_Placement` type — the four-DOF tuple a label gets committed to, plus the resulting screen rectangle and the achieved minimum clearance.
- `greedy_seed()` — scene-bound entry point. Gathers reachable regions and ancestry paths, calls the pure version.
- `greedy_seed_for_regions(regions, ancestry)` — pure greedy seed; testable without a scene. Walks labels in most-constrained-first order, picks each label's best placement.
- `order_by_constrainedness(regions, ancestry)` — the sort. Primary key fewest viable pairs first, then ancestry path alphabetical (rule 21 tie-break), then axis letter for the final tie-break within a part.
- `best_candidate_in_pair(pair, placed)` — the 5×5 grid sample. Walks 25 (witness_length, slidable_position) candidates and returns the one with the largest minimum-distance from every already-placed rectangle.
- `min_distance_to_placed(cx, cy, w, h, placed)` — rectangle-to-rectangle minimum distance helper.

Eleven new unit tests in [Dimension_Placement.test.ts](../../../src/lib/ts/tests/Dimension_Placement.test.ts) cover the rectangle-distance math, the grid sample (finds the corner-of-range farthest from a placed label, returns null on zero-length edge), the most-constrained-first ordering (fewest pairs first, alphabetical tie-break, axis tie-break within a part), and the full greedy on simple two-label cases. Suite total now 747. `svelte-check` clean.

For the silhouette constraint: the greedy trusts that any (W, S) with W ≥ witness_length_min keeps the label rectangle 15 px outside the combined outline along the witness direction. I AM GUESSING this is enough in practice; the per-position silhouette clearance can drift if the outline curves sharply near the slidable extremes, but the `dim_min_silhouette_clearance()` test will catch violations once Phase 3 wires the new code into the paint loop.

- **Dependencies.** Tasks 2.1, 2.4.
- **Effort guess.** One day.
- **Risk.** Greedy paints itself into a corner more often than the repair pass can fix. Mitigation: the stochastic finish (task 2.7) is the safety net; measure dropped-count and pairwise-clearance after greedy alone before adding repair, to know how much each phase contributes.

### Task 2.6 — Continuous optimisation inside a pair (rule 23 grid sample) — DONE

Implemented as part of Task 2.5's `best_candidate_in_pair`. Each (edge, direction) pair gets a 5×5 grid sample on its (witness_length × slidable_position) range (25 candidates per pair). The candidate with the largest minimum distance to every already-placed rectangle wins.

- **Dependencies.** Task 2.5.
- **Effort guess.** Two to four hours.
- **Risk.** 25 points × N pairs × N labels could exceed the 25-millisecond budget if pair count grows. Mitigation: the per-phase timing instrumentation from Task 1.5.2 surfaces the inner-loop cost; if it exceeds budget on basement.di, drop the grid to 9 points (3×3).

### Task 2.7 — Repair pass (rule 23 repair) — DONE

Two new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `repair_pass(placed, regions)` — walks every still-conflicted pair; tries a single-label switch first (each of the conflicted label's other viable pairs in best-clearance order); if no single switch resolves, tries every (unused pair A) × (unused pair B) combination for a paired swap. Cap at two labels moving — deeper chains are deferred to the stochastic finish (Task 2.8). Mutates the input array in place.
- `find_conflicts_in_placement(placed)` — pure helper that returns every pair of placed labels closer than 33 pixels rectangle-to-rectangle.

Seven new unit tests in [Dimension_Placement.test.ts](../../../src/lib/ts/tests/Dimension_Placement.test.ts) cover the conflict-finder (no-conflict, 20-pixel gap, exactly-33-pixel boundary, multiple overlaps) and the repair pass (single-switch moves a label to its escape pair, no-op on clean placement, graceful give-up when no alternative exists).

Suite total now 754. `svelte-check` clean.

- **Dependencies.** Task 2.5, Task 2.6.
- **Effort guess.** Half a day.
- **Risk.** Look-ahead chains beyond depth 2 are tempting but explode the cost. Mitigation: hard-cap depth at 2; rely on the stochastic finish for anything deeper.

### Task 2.8 — Stochastic finish (rule 23 stochastic) — DONE

Two new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `stochastic_finish(placed, regions, seed, max_iterations)` — up to 200 random tries (configurable cap). Each iteration picks a random conflicted label, picks a random other viable pair, finds its best continuous values via the grid sample, and accepts the switch only if the total conflict count drops. Seeded by the supplied string so the result is reproducible.
- `seed_string_from_regions(regions)` — derives a stable seed by joining every label key in alphabetical order. Same scene → same seed → same final layout per rule 21.

Six new unit tests in [Dimension_Placement.test.ts](../../../src/lib/ts/tests/Dimension_Placement.test.ts):

- `stochastic_finish` — resolves a conflict by switching to an escape pair, is deterministic given the same seed, leaves a clean placement untouched, respects the iteration cap.
- `seed_string_from_regions` — same seed regardless of input order, different seed when the label set differs.

Suite total 760. `svelte-check` clean.

- **Dependencies.** Task 2.7, Task 1.5.1 (the seedable PRNG).
- **Effort guess.** Half a day.
- **Risk.** Reaching for `Math.random()` by reflex breaks the determinism test. Mitigation: use the seedable PRNG from Task 1.5.1 throughout; never call `Math.random()` in the placement code.

### Task 2.9 — Drop policy (rule 12) — DONE

One new export in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `apply_drop_policy(placed, canvas_w, canvas_h, no_viable_pair_labels)` — mutates the placement in place, dropping labels until no conflicts remain. Three drop reasons mirror rule 12: `no_viable_pair` (caller-supplied), `off_canvas` (the placed rectangle extends past a canvas edge), and `remaining_conflict` (the post-search drop-most-conflicted policy, iteratively removing the most-connected label until conflicts vanish). Returns a `Drop_Report` with the dropped entries and `kept_max_conflict` (which is always 0 by construction).

Two new exported types: `Drop_Reason` (the three rule-12 labels) and `Drop_Report`.

Tie-break for "most-conflicted" — same count, drop the alphabetically later label so the earlier one survives. Deterministic per rule 21.

Six new unit tests in [Dimension_Placement.test.ts](../../../src/lib/ts/tests/Dimension_Placement.test.ts) cover the no-conflict no-op, single-pair drop with alphabetical tie-break, multi-conflict chain producing the right drop order, off-canvas reason, no-viable-pair reason from caller-supplied input, and verification that kept_max_conflict ends at 0.

The `dim_drop_report()` test hook still returns the placeholder `{ dropped: [], kept_max_conflict: 0 }` — wiring it to call `apply_drop_policy` against a live placement is Task 2.11 work (the full-pipeline composition).

Suite total now 766. `svelte-check` clean.

- **Dependencies.** Task 2.8.
- **Effort guess.** Two to four hours.
- **Risk.** Low. Bookkeeping.

### Task 2.10 — Persistence with 2-pixel tolerance (rule 19) — DONE

Two new exports in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts):

- `compute_viability(persisted_list, regions)` — pure function. For each remembered label, finds the matching (edge, direction) pair in the current paint's regions, re-projects to the new screen position, and checks four things: witness length within tolerance, slidable position within tolerance, pair still exists, pairwise rectangle clearance ≥ 31 (33 minus the 2-pixel tolerance). Returns either a search-skipped outcome (every label passes) with an `any_slack_used` flag for the drift-safety check, OR a cold-run outcome with the still-strict-viable labels marked as locked obstacles and the rest as free.
- `Persistence` class — holds the per-label remembered four-DOF values plus the drift-safety streak counter. `remember`, `remember_all`, `forget`, `clear`, `has`, `size`, `get_all`. The drift counter is bumped by `note_slack_use()` and read by `should_force_cold_run()`; clear via `clear_slack_streak()`.

Two new exported types: `Persisted_Placement` and `Viability_Result`.

Twelve new unit tests in [Dimension_Placement.test.ts](../../../src/lib/ts/tests/Dimension_Placement.test.ts):

- `compute_viability` — six tests: all-pass strict (skip_search, no slack), slack-in-witness-length (skip_search, any_slack_used=true), outside-tolerance (cold_run with affected label free), pair-no-longer-exists (cold_run, label free), pairwise overlap (cold_run, both free), empty input (skip_search).
- `Persistence` class — six tests: starts empty, records and recalls, forgets by key, clears everything plus streak, force-cold-run after two slack-using paints, clear-streak resets the counter.

Suite total now 778. `svelte-check` clean.

The Persistence class is not yet wired into a paint loop. Task 2.11 (feature-flag wire-up) is where the persistence state gets updated after each paint and consulted at the start of the next.

- **Dependencies.** Tasks 2.5–2.9.
- **Effort guess.** One day.
- **Risk.** The drift-safety rule (force a full search after two consecutive search-skipped paints near threshold) is easy to forget and hard to test for. Mitigation: dedicated test asserts the force-after-drift behaviour explicitly.

### Task 2.11 — Wire the new algorithm behind a feature flag — DONE

Three new pieces fall into place:

**Feature flag in the stores manager.** `w_use_new_placement` is a session-only boolean defaulting to false. Getter `stores.use_new_placement`. Off by default — today's force-driven code still paints. Flipping it on (planned for Task 3.1) routes the test hooks at the new pipeline.

Evidence: [Stores.ts:18-23](../../../src/lib/ts/managers/Stores.ts#L18-L23) defines the store; the getter sits near the other booleans.

**Orchestrator function and module persistence.** [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts) now exposes a module-level `persistence` instance plus a `run_new_placement(canvas_w, canvas_h)` function that composes every Phase-2 piece end-to-end:

1. Compute reachable regions from the current scene.
2. Check viability against the previous paint's persisted choices (with the 2-pixel tolerance).
3. If viability passes AND the drift-safety streak hasn't tripped, reuse last paint's values (search-skipped path); otherwise run greedy + repair + stochastic against a fresh seed.
4. Apply the drop policy (rule 12) against the chosen placements.
5. Replace the persistence map with the new placements so the next paint can compare.

The result is cached in a module variable readable via `get_last_run_result()` — the new `Run_New_Placement_Result` type carries the placements, the drop report, a `search_skipped` flag, and the seed string used for the cold run.

**Test-hook integration.** `dim_drop_report()` and `force_cold_search()` are now wired up. `dim_drop_report()` reads from the last run's drop report. `force_cold_search()` clears the persistence map and runs a fresh placement against the current canvas — but only when `w_use_new_placement` is on, so its behaviour during today's force-driven paints stays a no-op.

Suite total still 778. `svelte-check` clean.

**Locked-labels promise honored.** The cold-run branch now passes `viability.locked` through `greedy_seed_for_regions`, `repair_pass`, and `stochastic_finish`. Labels still strictly viable from the previous paint stay exactly where they were and act as obstacles for the rest; on a drift-safety reset the locked list is empty so the whole layout is re-derived.

- **Dependencies.** Task 2.10.
- **Effort guess.** Two to four hours.
- **Risk.** Low.

## Phase 3 — Cut over

### Task 3.1 — Run the e2e suite with the new algorithm; fix failures — IN PROGRESS

Setup wiring done in this session; actual e2e suite execution and bug-by-bug fixing belongs in a session with a browser and dev server.

**Wiring done:**

1. **Feature flag flipped on by default** in [Stores.ts:22](../../../src/lib/ts/managers/Stores.ts#L22) so the new placement runs without per-session configuration.
2. **`run_new_placement` integrated into the paint loop.** At the end of `render_dimensions` in [R_Dimensions.ts](../../../src/lib/ts/render/R_Dimensions.ts), when `stores.use_new_placement` is on the new pipeline runs after the force-driven code has finished. The old code still owns the canvas drawing today; the new code produces structured placements that the test hooks read.
3. **Per-phase timing instrumentation wired in.** `run_new_placement` now calls `perf_timer.start`/`stop` for `cold_search`, `search_skipped`, `greedy`, `repair`, and `stochastic`. The two timing hooks (`dim_last_cold_search_ms`, `dim_last_search_skipped_ms`) now read real values.
4. **`dim_min_silhouette_clearance` returns real data** when the feature flag is on. Estimate per label: 15 + (witness_length − witness_length_min) — the 15-pixel margin already baked into the min plus any extra push.
5. **`dim_drop_report` returns real data** from the last placement run.
6. **`dim_labels_by_kind` reads from new placements** when the flag is on.

**Known gaps that will surface as e2e failures and need fixing:**

- ~~**Repeater-aware filtering missing from `compute_viable_pairs`.**~~ **Done.** New helper `classify_so` in [Dimension_Placement.ts](../../../src/lib/ts/render/Dimension_Placement.ts) mirrors R_Dimensions.ts:380-410: template gets all three axes, clones (firewalled or not) are skipped, the first fireblock and the last fireblock-when-shortened get the repeat axis only. `Label_Kind` rides through Viable_Pair → Reachable_Region → Greedy_Placement. The `dim_labels_by_kind` hook now reports the real kind.
- ~~**"Locked labels never move" not yet enforced**~~ **Done.** `greedy_seed_for_regions`, `repair_pass`, and `stochastic_finish` each accept locked-label info (a pre-seeded placement list and/or a key set). The orchestrator passes `viability.locked` through whenever the previous paint left some labels still strictly viable AND drift-safety has not fired; on a drift-safety reset the locked list is empty. Three new unit tests pin the behavior at each step.
- **Drawing still owned by `R_Dimensions.ts`.** The canvas still paints labels via the force-driven code. Task 3.2 (paint the canvas from the new placements) owns this work; visual confirmation cannot start until that task is done.
- **X-ray mode (OPTION-held) not honored.** When the user holds OPTION and at least one part is hidden, the old painter draws dimensions for the hidden parts and skips the visible ones. The new pipeline always treats hidden parts as hidden. Will surface as fireblock-obstacle and hover tests on invisible parts.
- **2D-mode axis restriction missing.** In 2D view the old painter only measures axes on the front-facing face. The new pipeline always offers all three axes regardless of view mode. Will surface as the 2D-mode test.
- **Duplicate-text drop missing.** When two parts have identical measured lengths, the old painter drops the duplicate. The new pipeline keeps both. Will surface as the duplicates test.
- **"All four directions forbidden" fallback missing.** When every direction fails the 30° camera filter the old painter draws degenerate labels anyway. The new pipeline returns zero options for that part-axis. Will surface in extreme camera angles.

781 unit tests pass; `svelte-check` clean.

- **Dependencies.** Task 2.11.
- **Effort guess.** Two days to one week, heavily dependent on how many real bugs surface.
- **Risk.** The biggest in the project. Mitigation: small commits, run the suite per commit, never let red tests pile up.

### Task 3.2 — Paint the canvas from the new placements — FIRST PASS DONE

Today the new pipeline computes where each label belongs (which edge, which direction, how far out, how far along) but never turns those positions into pixels. The canvas is still painted by the old force-driven code. This task closes the gap: the carry-over placement list becomes the source of truth for what the user sees.

What the painter must produce, per label:

- The two perpendicular witness lines from the edge endpoints outward.
- The dim line connecting the two witness ends.
- Arrowheads at the dim line endpoints (two layout cases: arrows inside when the line is long enough, arrows outside with little extensions when it is short).
- The number text at the chosen center, drawn horizontally.
- A small white box behind the number so it stays readable over geometry.
- The bookkeeping the rest of the app reads from when the user hovers, clicks to edit, or hovers a part name in a popup. That bookkeeping is currently a list of drawn rectangles indexed by smart-object id and axis. The new painter must populate the same list, in the same field shape, so that click-to-edit (di/src/lib/ts/editors/Dimension.ts), the per-label test readouts (di/src/lib/ts/common/Debug.ts), and the part-name popup all keep working without changes on the reader side.
- The status-bar "dimensions dropped on average" running counter — pushed each paint into the same store the old code writes today (the published value at di/src/lib/ts/render/R_Dimensions.ts:592). Without this, the bottom-of-screen number stops changing after cleanup.

What the painter must respect:

- The hover state (the hovered label and part get bolder lines and a bolder number).
- The view-mode constraint (2D mode draws only the front-face axes; 3D mode draws all three) — this is also fixed at the search-input side in Task 3.1, but the painter must not over-draw if it ever has the chance.
- The repeater visibility rules — the kind tag riding through each placement already encodes which labels exist; the painter just draws what it is given.

How this fits with the old code during transition:

- Add a sub-flag (or extend the existing one) so the canvas can paint from old, new, or both side-by-side. Side-by-side is the cheapest way to spot a visual regression — same scene, two passes, eyeball the differences.
- Default to new-only once basic confirmation passes; keep the old path one toggle away for a soak window.

- **Dependencies.** Task 3.1 (the new pipeline must be wired into every paint).
- **Effort guess.** One to two days. Drawing geometry is simple; the hover, edit, and popup bookkeeping is the long tail.
- **Risk.** Small drawing details (line width, font, anti-aliasing, color, baseline) can look subtly wrong even when positions match. Mitigation: lift the drawing parameters from the old painter character-for-character; keep the side-by-side toggle on while diffing.

### Task 3.3 — Visual confirmation on basement.di and a handful of other scenes

Load basement, drawer, kitchen wall, and any other scenes Jonathan reaches for. Tumble, edit, OPTION-x-ray, switch view modes. Compare against the old behaviour. Make sure labels don't strobe, don't drift, don't disappear unexpectedly.

- **Dependencies.** Task 3.2.
- **Effort guess.** Half a day to one day.
- **Risk.** A subtle behaviour difference looks bad in motion even when every test passes. Mitigation: record short videos of old vs new at matched camera moves, eyeball side-by-side.

### Task 3.4 — Default the canvas to the new painter — DONE

The painter-source default is now "new". The old painter remains available behind the toggle for a soak window.

### Task 3.5 — Freeze layout while a dimension is being edited — DONE

When the user opens the edit popup on a dimension number, the labels around it must stop reshuffling underneath them. There is a test readout hook for this state today; it returns the stub value `false` because no real freeze behavior lives in either pipeline. This task adds it: while the dim editor is open, the search step is skipped, the carry-over memory is treated as authoritative, and the painter redraws from that memory so positions do not change between paints. The readout hook reports the real state.

What "frozen" means concretely:

- The search step (greedy + repair + stochastic) is bypassed on every paint while the editor is open.
- The carry-over placement list from the paint just before the editor opened is what the painter reads.
- The painter still runs (so the labels still appear over the geometry), but the four-number tuple per label does not change.
- When the editor closes, normal behavior resumes — the next paint runs a fresh search.

- **Dependencies.** Task 3.2 (the painter has to be able to redraw without re-searching).
- **Effort guess.** Half a day. The change is small but needs an explicit test pinning the frozen-between-paints behavior.
- **Risk.** Low. Worst case is the freeze sticks after the editor closes; mitigation is a clear close-handler that clears the flag and bumps a counter the test can read.

## Phase 4 — Cleanup

### Task 4.0 — Move outline and ray-exit helpers into the new code — DONE

Before the old code can be deleted, two helpers it owns today must be re-homed into the new pipeline: the silhouette outline computation (the convex hull around every painted leaf part's projected vertices) and the ray-to-outline-exit math. The new pipeline currently imports both from the old file. Without this move, deleting the old code breaks the new code.

What changes:

- The outline computation lives next to the rest of the new pipeline. The same input set (painted leaf parts, their projected vertices) feeds it.
- The ray-exit helper moves alongside.
- The new pipeline reads the outline from its own store, not from the old file.
- The old file's exports of these two helpers can be removed in the same step or left in place for one more soak window, at your call.

- **Dependencies.** Task 3.4.
- **Effort guess.** Two to four hours. No new logic, just relocation and re-wiring.
- **Risk.** Low. The helpers are pure functions; tests around them still pass after the move.

### Task 4.1 — Remove the old force-driven code — DONE

Delete `run_simulation`, `persisted_state` (the old map keyed by SO id plus axis), the force-pass constants (`SPRING_K`, `REPULSION_K`, `DAMPING`, `ITERATIONS`), the `prev_settled` / `prev_keys` / `prev_homes` stop-when-settled state, the old early-collection statistics, the old painter (`draw_dimension_candidate`), the per-paint Phase A/B/C blocks, and the old `render_dimensions` body. Drop the feature flag and the painter sub-flag.

- **Dependencies.** Task 4.0 (helpers must be moved first) plus at least a few days of soak with no regressions.
- **Effort guess.** Half a day.
- **Risk.** Some auxiliary callsite still depends on something the force code exported. Mitigation: TypeScript compiler catches most of these; full repo grep catches the rest.

### Task 4.2 — Update the architecture guide

Rewrite [guides/architecture/graph/dimensionals.md](../../guides/architecture/graph/dimensionals.md) so its body describes the new running code, not the old force-driven code. Drop the "Status — redesign decided, not yet built" header.

- **Dependencies.** Task 4.1.
- **Effort guess.** One day.
- **Risk.** Low.

### Task 4.3 — Check the dimensionals item off in [code.debt.md](./code.debt.md)

And add an entry to [code.debt.paid.md](../done/code.debt.paid.md) summarising the redesign.

- **Dependencies.** Task 4.2.
- **Effort guess.** Ten minutes.
- **Risk.** None.

## Total guess

I AM GUESSING the whole redesign comes in around three to four-and-a-half working weeks, with the lion's share inside Task 3.2 (writing the new painter) and Task 3.1 (debugging the cutover). Phase 1 is one or two days. Phase 1.5 is half a day. Phase 2 is roughly five to eight days. Phase 3 is the wide-error bar — three to four days if everything else went well, two weeks if not. Phase 4 is one to two days.

Every estimate above wants measurement before being treated as a commitment.
