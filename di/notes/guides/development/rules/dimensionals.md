# Uncrowded Dimensionals Redesign — consolidated requirements

Everything the dimensionals layout has to do, in one place, in the simplest language. Each rule stands on its own. Rules are grouped by what they govern.

**Status:** rules 1, 3, 4, 8, 9, 10, 11, 12, 16, 18, 19, 20, 21, 15, 23, 24, 25 reflect the decided redesign — a four-degrees-of-freedom (4DOF) search replacing the force-driven simulation. Rules 19, 20, 21, 15, 23, 24, 25, and 26 are entirely new for the redesign; rule 18 was rewritten to fold the redesigned fireblock-as-obstacle rule into the existing repeater integration; rule 1 was rewritten to introduce the four degrees of freedom. The current code still implements the older force-driven version; see [dimensionals.md](../../architecture/graph/dimensionals.md) for what's actually running today.

## Glossary

Every term the rest of this document leans on, in one place.

- **4DOF / four degrees of freedom** — the four placement choices the search makes per label: edge, direction, witness length, slidable position. Detail in rule 1.
- **Alphabetical** — the final tie-break when both persistence and depth tie: pick the part whose dotted ancestry path comes first alphabetically. Detail in rule 4.
- **Clone** — every child of a repeater except the template, the first fireblock in a firewalled run, and (when shortened) the last fireblock. Clones get no dimensions of their own. Detail in rule 18.
- **Combined silhouette outline** — the convex hull around every painted leaf part's projected vertices, recomputed each paint. Every label must sit at least SILHOUETTE_MARGIN_PX (10 px today; value lives in `Constants.ts`) outside it. Detail in rule 9.
- **Dim line / dimension line** — the line that runs parallel-in-3D to the measured axis, offset outward from the part by the witness length, with the number sitting on it. Detail in rule 6.
- **Direction** — one of the four signed perpendicular axes to which the dim line is parallel. A discrete degree of freedom. Detail in rule 1.
- **Drift safety** — after two consecutive search-skipped paints that any check passed only by the 2-pixel tolerance, force a full search on the next paint regardless. Detail in rule 19.
- **Edge** — which silhouette edge of the part the label anchors on. A discrete degree of freedom. Detail in rule 1.
- **Fireblock** — a child of a firewalled repeater whose length on the repeat axis differs from the template's. The first fireblock and (if shortened) the last fireblock get the repeat-axis dimension only. Detail in rule 18.
- **In conflict (two labels)** — no pair of 4DOF combinations across both labels keeps both rectangles at least PAIR_CLEARANCE_PX (15 px today) apart while each stays at least SILHOUETTE_MARGIN_PX (10 px today) outside the silhouette outline. A property of the pair, not of either label alone. Detail in rule 10.
- **Inside segment** — the part of the dim line between the two witness ends. Drawn only when the label fits between the witnesses. Detail in rule 7.
- **Outside extensions** — the parts of the dim line that stick out past the witness ends. Drawn whenever the label overhangs or is wider than the dim line. Detail in rule 7.
- **Overhang** — the label sits outside the witness lines. the overhang distance is measured in screen pixels along the dim line direction. Detail in rule 10.
- **Parent over child** — the second tie-break in the duplicate-text drop: prefer the part with the shallower ancestry path. Detail in rule 4.
- **Persistence** — the first tie-break in the duplicate-text drop and the carry-over of each label's 4DOF choice between paints. Detail in rules 4 and 19.
- **Placeable label** — a label with at least one viable enum pair (edge, direction). A label with no viable pair is dropped.
- **Repeater** — a part type whose children repeat along one axis. Only the template draws all three axes; fireblocks may draw the repeat axis; other children are clones and draw nothing. Detail in rule 18.
- **Seeded semantics** — inside a full search seeded by the previous paint, labels still passing strict viability stay locked at their carry-over values; only labels that lost viability are searched for fresh. Detail in rule 19.
- **Slidable position** — where along the dim line the label sits, in screen pixels measured from the first witness anchor along the dim line direction. A continuous degree of freedom with overhang allowed at either end. Detail in rule 1.
- **Template** — the first child of a repeater; the only one that draws all three axes. Detail in rule 18.
- **Viable enum pair (edge, direction)** — an (edge, direction) pair for which at least one viable (witness length, slidable position) value pair exists. Equivalent to "none of the four filters has emptied its range".
- **Viable value pair (witness length, slidable position)** — a continuous-DOF pair whose two values both sit inside the ranges set by the four filters in rule 11.
- **Witness length** — how far the dim line sits from the part's edge, in screen pixels. A continuous degree of freedom bounded by the rule-11 filters. Detail in rule 1.
- **Witness line** — the straight projected ray from one edge endpoint outward to and 10px (screen pixels) past the dim line. Always a projection of an edge-aligned 3D ray; the two witness lines of a dimension are world-parallel, not necessarily screen-parallel. Detail in rule 5.

## 1. Four degrees of freedom per label

Every label has four degrees of freedom (4DOF) in placement:

1. **Edge** (discrete). Which silhouette edge of the part to anchor on.
2. **Direction** (discrete). Each edge has 2 possible outward directions (2 faces) for the witness lines.
3. **Witness length** (continuous). How far the dim line sits from the part's edge, in screen pixels — anywhere from the minimum needed to place the label rectangle SILHOUETTE_MARGIN_PX (10 px today) outside the combined outline, up to the WITNESS_CAP_PX (200 px today) witness cap.
4. **Slidable position** (continuous, *but with gaps around witness anchors*). Where along the dim line the label sits — anywhere from X pixels before the first witness line to X pixels past the second. X is SLIDABLE_OVERHANG_PX (20 px today; value lives in `Constants.ts`) minus half the label width, except positions that place the label on or within WITNESS_ANCHOR_BUFFER_PX (20 px today) of a witness anchor.

Rule 10 describes what the search does with these four degrees of freedom.

## 2. Distance tests use rectangles, not points

Every distance test — silhouette clearance, label-versus-label clearance — uses the full text rectangle, not just its centre. A centre can sit 15 pixels from another centre while the rectangles themselves overlap; a centre can sit outside the silhouette while a corner of the rectangle hangs inside. Both look broken unless the rectangle is the unit of measurement.

Labels must also avoid overlapping ANY lines or anchors.

## 3. Parallel lines need room

Two dim lines that are parallel-in-3D must sit at least PAIR_CLEARANCE_PX (15 screen pixels, value lives in `Constants.ts`) apart, measured perpendicular to their shared direction. When two dim lines sit too close their arrows and labels become visually indistinct. This promotes easy reading.

## 4. Drop duplicates

Same text AND parallel edges-being-measured → drop the later occurrence (eg, multiple SOs with a common dimension).

**Tie-break under the new global search.** "Later" is determined in this order:

1. **Persistence** — the label whose 4DOF values have been remembered between paints the longest wins; the newer one is dropped.
2. **Parent over child**  — when neither was remembered (or both were), the part with the shallower position in the scene hierarchy wins. A measurement on a parent describes more of the drawing than the same measurement on one of its children; the child loses. The depth comparison uses the dotted ancestry path length — fewer dots wins.
3. **Alphabetical** — when persistence and depth both tie, the part with the alphabetically earlier ancestry path wins, so the result is deterministic from run to run.

## 5. Witness and dimension lines lie in the plane of a face

Witness lines must remain perfectly straight and may run through other parts on their way out.

**Each witness line is an extension of an edge.** Extend an edge to infinity, this is where a witness line goes.

## 6. Each witness line must NOT touch the SO it measures

Each witness line begins AFTER a gap of 5px. It must NOT touch the SO it measures.

## 7. Dimension text sits on its line, drawn horizontal

The label sits ON the dimension line (center point of the label rect is on that line). The text is drawn aligned with the screen horizontal — never rotated to match the dimension line's screen angle.

**The painter places the label center on the dim line that actually gets drawn — not on the one the search used internally for scoring.** The two are slightly different in perspective..

**The dim line stretches from a witness anchor to the label, even when the label overhangs.** Thus two parts, one for each witness line. Two possibilities:

- **Inside segment** (between the two witness ends): drawn only when the label fits between the witnesses (label width + enough room X to draw the dim lines, X is 20px in screen pixels).
- **Overhang**: BOTH sides get an overhang line, and the inside is left empty. The line on the side the label actually overhangs stretches from the witness line to the label; the other side gets a fixed short length so the visual reads as symmetric. The full visual pattern is: "dim line — arrow — witness line — gap — witness line — arrow — dim line — label" (or vice versa).

**Dim line arrowheads sit on the same side of each witness anchor as the dim line at that anchor.**

- When the label sits between the witnesses, the dim line is the inside segment. Both arrows are inside the witness anchors, pointing at each anchor.
- When the label overhangs past a witness, no inside segment is drawn. Each arrow sits OUTSIDE its witness anchor, on the extension side, again pointing at each anchor.

The arrows mean "this is the witness line for this label."

## 8. Two translations within the search, then frozen

Each label sits on its dim line. Two screen-translations are available to the search:

- Perpendicular to the part's edge — the witness-length DOF moves the dim line and label together away from or toward the edge.
- Along the dim line — the slidable-position DOF moves the label left or right while the dim line itself extends so the label stays on it.

Once the search converges, both translations are frozen for the paint. No frame-to-frame drift, no after-the-fact springs. The two translations are part of the search, not a post-process.

## 9. Silhouette = single combined hull of leaf parts

Before placing any dimension, compute ONE convex outline that wraps all painted leaf parts' projected vertices combined into a single point set. Container parts (parts with at least one painted child) do NOT contribute their corners — those corners can sit far outside any actually-painted geometry and would bloat the outline. Every drawn label rectangle must sit at least SILHOUETTE_MARGIN_PX (10 px today) outside that single outline.

Trade-off: a strongly concave drawing (a U-shape) treats the notch of the U as inside the silhouette. Dimensions in the notch are positioned outside the U's overall outline rather than into the notch itself.

## 10. Pick 4DOF values by best combined clearance

The search picks an (edge, direction, witness length, slidable position) tuple per label such that every drawn label has PAIR_CLEARANCE_PX (15 px today) clearance from every other drawn label and SILHOUETTE_MARGIN_PX (10 px today) clearance from the combined silhouette outline. Path-of-least-resistance (the old "smallest clearance wins" rule) is gone — it produced collisions because two neighboring labels would both pick the same easy escape direction.

Search algorithm (sketched in rule 23): enumerate discrete (edge, direction) pairs per label, run continuous avoidance over the two continuous DOF, fall back to dropping labels (rule 12) when no satisfying assignment exists.

**Prefer between-the-witnesses over overhang.** add a weighting to positions between the witness lines. Weighting is computed by subtracting the distance between the witness lines and the length of the label, in screen pixels.

**Centering preference, shaped like a parabola.** When the label fits between the witnesses, a small additional penalty nudges the label toward the midpoint between the witness lines. The penalty is a parabola sized to the dim line, value is zero at the midpoint and a tunable number X at the witness anchors. Start with X = 20.

**The label must NEVER cover its own witness lines.** A candidate whose label rectangle is wider than the space between the witness lines, must overhang. The overhang distance must leave room for a dimension line stretching between the label and the witness anchor on the overhang side.

**Two dim lines that are real-world-parallel must sit at least PAIR_CLEARANCE_PX apart in screen pixels** (15 px today; value lives in `Constants.ts`). See rule 3. When two dim lines sit too close their pair of arrows and labels become visually indistinct.

## 11. Drop filters imposed on DOF ranges

Each (edge, direction) enum pair has several disabled ranges for the value pair; the filters set those ranges. A label with no surviving (edge, direction) pair is dropped (rule 12):

- Witness length minimum: the value that places the label rectangle exactly SILHOUETTE_MARGIN_PX (10 px today) outside the combined outline along the chosen direction.
- Witness length maximum: the smaller of (a) WITNESS_CAP_PX (200 px today) — the witness cap that stops labels flying off the canvas — and (b) the witness length at which the PROJECTED witness reaches WITNESS_LEN_MAX_PX (300 px today) on screen — the limit that stops deep-perspective parts from drawing absurdly long witness lines.
- Slidable position range: Y pixels before the first witness to Y pixels past the second. Y is SLIDABLE_OVERHANG_PX (20 px today) minus half the label width.
- Camera-axis filter (applies to direction, not to a continuous range): any direction within 30 degrees of the camera's forward (cosine of the angle 0.866 or higher) is rejected outright. Reject any witness pointing into or out of the screen -- it projects to an unreadable sliver.
- Witness convergence: world-parallel witness lines project to non-parallel screen rays whenever the edge is not parallel to the image plane. Treat the edge, the dim line, and the two witnesses as an irregular trapezoid. Pick the edge corner with the LARGER interior angle (the more obtuse one; ties go to W1's corner). Drop a perpendicular from that corner onto the opposite witness's line. If the length of that perpendicular is less than WITNESS_CLEARANCE_PX (15 px today), reject the (edge, direction) pair — the witnesses would crowd each other on screen.
- A child whose parent is set to hide its children is not drawn on screen, but its geometry is still physically present in the scene. It MUST count as a potential blocker — the parent's drawn shell would otherwise leak dimensions through it.

## 12. Drop unfit dimensionals

A dimension that cannot be placed without violating the clearance rules is dropped rather than painted in a bad spot. Three drop reasons; a label hits at most one of them:

- Every (edge, direction) pair for the label had its DOF ranges collapsed by the filters in rule 11 — the witness-length range went empty, the slidable range went empty, or the camera-axis filter rejected the direction.
- The label was forced into a true conflict by the search (rule 24, third pass) and the drop-most-conflicted policy selected it.
- Every surviving (edge, direction) pair would put the label rectangle past the canvas edge at every reachable position.

The dropped count is reported to the status strip.

## 13. OPTION key x-rays the drawing

While OPTION is held AND at least one part is invisible:

- The visible parts are skipped from the canvas paint.
- The silhouette outline (rule 9) is built from invisible parts.
- Dimensionals layout collects from invisible parts only.

Release OPTION, or hold OPTION when no part is invisible, and normal mode applies: only visible parts are painted; only visible parts get dimensions. Grid, axes, and the root's floor-rectangle keep drawing in both modes.

## 14. Hover on a dimension number

When the cursor sits on a dimension number:

- The number renders in bold.
- The dimension line and witness lines render thicker (1.5 pixels instead of 0.5).
- The matching part highlights as if the cursor were on the part itself.
- The name popup appears at the cursor (rule 15).

## 15. Name popup format

Hovering a part shows the ancestry path from just-below-root down to the part, joined with dots — for instance `front.moose.well post`. The root is excluded. A part directly under root shows just its own name.

Hovering a dimension on a part appends the axis info. Format: `name (x | width)` for an x-axis dimension, `(y | depth)` for y, `(z | height)` for z. The separating dot between the ancestry path and the axis info appears only when the ancestry path is non-empty — so a root-level dimension reads `width (x)` with no leading period.

## 16. Postconditions for every painted layout

Two visible-outcome assertions a test can check after the layout settles:

- Every drawn label rectangle is at least SILHOUETTE_MARGIN_PX (10 px today) outside the combined silhouette outline.
- Every pair of drawn labels is at least 15 pixels apart, measured rectangle-to-rectangle.

When the filters (rule 11) would force a label to violate either, the label is dropped (rule 12), not painted in the wrong place.

## 17. Click a dimension number to edit it

Clicking on a drawn dimension number begins inline editing of its underlying value (when the value is editable — bound formulas are read-only). The hit target is the label rectangle published by the renderer, the same rectangle used for hover (rule 14). Edits commit on Enter or focus-out and revert on Escape. While editing, the rest of the dimensionals layout pauses so the editor's position stays stable under the cursor.

## 18. Repeater integration: clones skip, fireblocks are fixed obstacles

Repeater clones are skipped entirely — only the template (the first child of a repeater) draws all three axes. The two exceptions are fireblocks:

- The first fireblock draws its repeat-axis dimension only.
- The last fireblock also draws its repeat-axis dimension, but only when its length differs from the first fireblock's (a shortened bookend bay).

Fireblock dimensions are selected by this repeater rule, NOT by the search. The search treats them as FIXED OBSTACLES — their (edge, direction, witness length, slidable position) values are dictated by their owning part and don't vary. Every other label's pair-check (rule 24) measures 15-pixel clearance against those fixed fireblock rectangles the same way it does against any other label. The fireblock labels themselves are not free to move; only the regular labels can shift around them.

## 19. Persistence across frames — tolerance of 2 pixels

Each label's previously chosen (edge, direction, witness length, slidable position) is remembered between paints. On the next paint, four viability checks decide whether to reuse the previous values or re-run the full search:

- Previous witness length must lie within (new min − 2 px) to (new max + 2 px).
- Previous slidable position must lie within (new range start − 2 px) to (new range end + 2 px).
- The label's rectangle, projected at the previous values, must clear every other previously-chosen label rectangle by at least 13 pixels (PAIR_CLEARANCE_PX 15 − PERSISTENCE_TOLERANCE_PX 2).
- The label's rectangle must clear the combined silhouette outline by at least 8 pixels (SILHOUETTE_MARGIN_PX 10 − PERSISTENCE_TOLERANCE_PX 2).

If every label passes all four checks, skip the search and reuse last paint's values. If any label fails any check, a full search runs — seeded with last paint's values so the result usually changes only the labels that lost viability.

**Seeded semantics.** Inside a seeded full search, every label that passes the strict viability checks (the same four above, but without the 2-pixel tolerance) is LOCKED — its previous (edge, direction, witness length, slidable position) values are held fixed for the duration of this search, and the label acts as a fixed obstacle that every other label must clear. Only the labels that failed the strict checks are FREE; the greedy seed plus retry plus stochastic finish runs on the free labels alone. Locked labels contribute to the conflict graph and clearance tests but never get moved. Stable parts of the layout stay stable; affected labels are relocated.

**Drift safety.** After two consecutive search-skipped paints in which any check came in under the strict threshold but within the 2-pixel tolerance, force a full search on the next paint anyway. Stops slow drift from compounding into a visibly wrong layout.

**The 2-pixel value is a starting point, not final.** Smaller than the smallest "label feels stuck" gap the eye reliably notices, big enough to tolerate floating-point projection noise. The number deserves measurement against real tumble sessions before being treated as locked in.

## 20. Performance budget

The target is to keep each paint inside one 40-fps frame — about 25 milliseconds total. Two budgets for the placement work, on basement-scale scenes (around 100 drawn labels):

- Full search -> under 25 milliseconds (full search plus draw is allowed to spend the whole frame budget).
- Search skipped (when every label's previously chosen values are still close enough) -> under 5 milliseconds.

These map directly to the two performance tests in the e2e suite. Above 25 milliseconds on a full search, the user feels the redraw stutter when they tumble or pan; above 5 milliseconds for determining whether or not to skip the search can possibly consume too much of our 25ms per-frame budget, causing noticeable stutter.

## 21. Search determinism

The search is deterministic. Given the same scene, same view, and the same remembered 4DOF values from the previous paint, every paint produces the same chosen values per label. Every tie-break — whether ordering labels, ordering (edge, direction) pairs, or seeding the stochastic step — uses a stated rule, with "alphabetical by part ancestry path" as the catch-all when no other rule applies. No randomness from a non-deterministic source.

The stochastic finish (rule 23) reaches for the project's seeded pseudo-random number generator, never the browser's built-in random function. The generator's seed is derived from the scene contents via a string hash so the same scene at the same view produces the same random sequence. See the [determinism helpers section of the research file](../../project/research/dimensionals-research.md#determinism-helpers) for plain-English descriptions of the generator and the hash. Implementation: [Seeded_Random.ts](../../../src/lib/ts/common/Seeded_Random.ts).

## 15. 2D mode is not a special case

Every part gets all three axes considered for placement, regardless of view mode. The 2D-from-the-front view does NOT restrict a part to only the two axes of its front-most face — that was a quirk of the old code and is dropped in the new design. The search, the DOF filters, the conflict definition, and the persistence map all behave identically in 2D and 3D modes. If a particular axis projects to nothing useful in the current view, the filters (camera-axis, witness-length) collapse its DOF ranges the same way they would in 3D.

## 23. 4D avoidance algorithm — library or custom?

The avoidance problem is rule 10. The shape is two discrete DOF per label (small finite sets) and two continuous DOF per label (ranges bounded by rule 11). The performance budget is rule 20. The pair-check tiers in rule 24 are what keep that budget realistic on a custom implementation.

**Greedy step (the custom-path detail).** When a free label's turn comes up in the greedy seed, for each of its viable (edge, direction) pairs the algorithm finds the BEST achievable (witness length, slidable position) within that pair's continuous ranges — best meaning the values that maximize the minimum clearance from every already-placed label rectangle and from the silhouette outline. The label then commits to the (edge, direction) pair whose best-clearance value is largest. Final tie-break uses rule 21 (alphabetical by part ancestry path).

**Continuous optimization inside a pair (the custom-path detail).** Divide each continuous range into 4 equal segments, giving 5 samples in each DOF — 25 (witness length, slidable position) candidate points per (edge, direction) pair. Evaluate the minimum-clearance objective at each candidate; pick the point with the largest minimum clearance. Grid sampling is deterministic by construction (same scene, same point) and bounded in cost (25 evaluations × number of viable pairs). Trades sub-grid precision for reproducibility; 25 samples gives 1 part in 4 of the witness-length range and the slidable range, which is finer than the 2-pixel persistence tolerance.

**Retry (the custom-path detail).** After the greedy seed finishes, walk every label that still has a true conflict (rule 24's third pass). For each such label, try its other viable (edge, direction) pairs in best-clearance order. If switching to one of them clears the conflict without creating a new one, accept the switch. If no single-label switch resolves the conflict, look one step further: for each alternative on the conflicted label, find whether any neighbour that also has an unused alternative could swap with it to clear both labels at once. Cap the look-ahead at two labels moving — deeper chains cost more than they're worth. Retry runs once per full search.

**Stochastic finish (the custom-path detail).** If retry leaves any conflicts behind, run up to 200 random tries. Each try picks a random conflicted label and switches it to a random other viable (edge, direction) pair, with its continuous values re-found by the grid sample. Accept the change if the total number of remaining conflicts drops; reject if it grows. Stop when zero conflicts remain OR the iteration budget runs out OR the 25-millisecond full-search budget is about to expire. The randomness uses a deterministic seed derived from the scene contents (rule 21) so the result is reproducible across runs.

**Polish pass (the custom-path detail).** After the drop policy removes labels, run a single pass that re-positions every surviving label given the reduced obstacle set. For each survivor, the same scoring used in the greedy step picks the best position now that the dropped labels are gone. This stops surviving labels from sitting off-center to avoid neighbours that no longer exist. The polish pass runs once; if it surfaces new conflicts, those are accepted (no second drop round). Polished positions are remembered for the next paint, so the layout stays stable across frames.

**Decision: custom.** Research on 2026-05-20 checked browser-compatible candidate libraries against this problem; none beat our custom algorithm (all exceed the 25-millisecond full-search budget). The general-purpose constraint engines (Google OR-Tools, Z3 WebAssembly, MiniZinc) either lack a browser build or take up too much initialization time. The lightweight label-placement libraries (d3-labeler, d3fc, cola.js, d3-force) each handle only one or two of the four DOFs. Full findings, candidate-by-candidate, in [dimensionals-research.md](../../project/research/dimensionals-research.md).

**Upgrade path, if ever needed.** Keep the architecture (greedy seed plus retry plus stochastic finish). Swap the continuous inner loop for a small specialized quadratic-programming solver — for example, the gradient-projection routine from `cola.js`. Do NOT adopt a general-purpose constraint engine; the initialization-time cost alone disqualifies them at the current budget.

## 24. Pair-check tiers — skip the obvious, work on the rest

Most label pairs are nowhere near each other. The trick is to skip them cheaply and only do real work on the few that might actually fight. Three passes, each cheaper than the next and dropping most pairs at the lowest cost.

**First pass — am i even in the same neighbourhood?** Each label has a region of the screen it could move within, given every choice of edge, direction, witness length, and slidable position. That region is a rectangle — the union of where the label could end up. If two labels' regions don't overlap when expanded by 15 pixels, they can't conflict, ever. Put the regions in a coarse grid; only test pairs that share a grid cell. Order of (label count) times log (label count), not label count squared.

Even cheaper upstream: if two labels' parts are more than 250 pixels apart on screen, skip the pair without building either region.

**Second pass — does some combination of choices keep us apart?** For pairs that survived the first pass, walk the discrete choices: each label has up to four edges times four directions, so up to 64 combinations of (mine, yours). For each combination, both labels have a tiny rectangle of where they could end up — set by the witness-length range and the slidable-position range. Test: can those two tiny rectangles be 15 pixels apart? Single rectangle-vs-rectangle math, no iteration. If any of the 64 combinations passes, the pair is fine — drop it.

**Third pass — the stubborn pairs.** A pair that fails every one of the 64 combinations is in true conflict. No matter what either label picks, they collide. These enter the conflict graph and force the search to drop somebody (rule 12). They should be rare.

**Caching across full-search runs.** First-pass regions and second-pass results stay valid as long as the camera doesn't move. Cache them. When the next full search kicks off, it only re-tests pairs whose regions actually changed since the cache was built. (The search-skipped path needs no pair-checking.)

**Rough budget on basement** (around 100 labels, so 5000 raw pairs):

- First pass: under a millisecond.
- Second pass: I AM GUESSING about 750 survivors, each running up to 64 cheap rectangle tests — maybe 5 milliseconds.
- Third pass: I AM GUESSING under 50 truly-stubborn pairs.

Comfortable inside the 25-millisecond full-search budget. Both the survivor count and the per-test cost are guesses until measured.

## 25. Test-only hooks the new design must expose

The e2e suite verifies postconditions and budgets through functions exposed on the existing `di_test` object when the URL carries `?test=1`. The new design must keep the existing hooks and add the ones in italics.

| Function                           | What it returns / does                                                                                                                                           |     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `dim_labels()`                     | Every drawn label — part name, axis, screen position, label rectangle (existing).                                                                                |     |
| `dim_dropped_count()`              | How many labels were dropped on the most recent paint (existing).                                                                                                |     |
| `is_xray_active()`                 | Whether the OPTION x-ray mode is currently on (existing).                                                                                                        |     |
| *`dim_min_silhouette_clearance()`* | Smallest gap, in pixels, between any drawn label rectangle and the combined silhouette outline.                                                                  |     |
| *`dim_viable_pair_counts()`*       | Per drawn label, the number of viable (edge, direction) pairs that survived the **rule-11** filters.                                                             |     |
| *`dim_conflict_graph_check()`*     | Any pair whose conflict-graph classification disagrees with a brute-force check of the **rule-10** conflict definition. Should be empty.                         |     |
| *`dim_drop_report()`*              | Per dropped label, which of the three **rule-12** reasons applied and (for the **rule-12** second reason) how many true conflicts it had when dropped.           |     |
| *`dim_labels_by_kind()`*           | Every drawn label tagged as one of: `template`, `clone`, `fireblock-first`, `fireblock-last-shortened`, `regular` (**rule 18**).                                 |     |
| *`dim_label_angles()`*             | Per drawn label, the on-screen rotation of the text glyph in radians (**rule 7** expects 0 for every label).                                                     |     |
| *`dim_hover_state()`*              | Which label is currently hovered (part name + axis), the current line width, whether the number is bold, whether the matching part is highlighted (**rule 14**). |     |
| *`dim_popup_text()`*               | The current name-popup string when one is visible — empty string when no popup is shown (**rule 15**).                                                           |     |
| *`dim_edit_state()`*               | Whether a dimension editor is currently open, plus the part name + axis being edited and whether the underlying value is editable (**rule 17**).                 |     |
| *`dim_layout_frozen()`*            | Whether the dimension layout is currently paused — true while a dimension editor is open (**rule 17**).                                                          |     |
| *`dim_last_cold_search_ms()`*      | Wall-clock duration of the most recent full-search run, in milliseconds.                                                                                         |     |
| *`dim_last_search_skipped_ms()`*   | Wall-clock duration of the most recent search-skipped paint, in milliseconds.                                                                                    |     |
| *`dim_perf_breakdown()`*           | Per-phase timing breakdown for dev-mode tuning: phase name, most recent duration, running average, count. Empty until Phase 2 starts timing individual phases.   |     |
| *`set_view_mode(mode)`*            | Input action — switches between `'2d'` and `'3d'` view modes (**rule 15**).                                                                                      |     |

The e2e tests under `e2e/tests/dimensions-*.spec.ts` reference these names already; the spec listing them here is a contract that the new implementation must satisfy.
