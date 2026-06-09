# New design for dimensionals

The dimensionals are still challenging to interpret. Might be easier if they are co-planar.

## Uniface rules

1. Witness index is a discrete choice with values 1, 2, or 3 (the cap). It picks which uniface box holds the dim line per rule 3.
2. 4DOF with only one continuous degree of freedom -> the position of the dimension label, which still needs complicated avoidance rules (rules 5 - 8). The other 3 are edge, uniface, and witness index.
3. Compute witness length so as to place its dimension line in the plane of a uniface. witness index says which uniface box. if no such length exists without conflict, drop the label.
4. For rotated parts, the silhouette box is rotated the same -> the rotated part.
    1. The label center point is placed on the uniface closest to the rotated label's projected center. The dimension line is placed on the plane parallel to the rotated silhouette box that passes through the label center point.
****    2. when rotated parts overlap, all rules must be followed.
5. Every pair of labels must be at least silhouette margin apart, computed using their text rectangles.
6. Every label must sit at least silhouette margin away from any witness anchor, witness line, dim line, or silhouette box surface.
7. For a label that conflicts everywhere, increment its witness index and try again. If the witness index exceeds the cap (3, per rule 1), drop the label. Dropping a label does not trigger redoing the placement for labels that depended on this one's position.
8. The pair clearance and the silhouette margin are both set to 15 pixels. This is intentional.
9. **Repeater integration: clones skip, fireblocks are fixed obstacles.** Repeater clones are skipped entirely — only the master (the first child of a repeater) draws all three axes. The two exceptions are fireblocks:

    1. The first fireblock draws its repeat-axis dimension only.
    2. The last fireblock also draws its repeat-axis dimension, but only when its length differs from the first fireblock's (a shortened bookend bay).

    Fireblock dimensions are selected by this repeater rule, NOT by the placement algorithm. The placement algorithm treats them as FIXED OBSTACLES — their (edge, uniface, witness index, label position) values are dictated by their owning part and don't vary. Every other label's clearance check (rules 5 and 6) measures 15-pixel clearance against those fixed fireblock rectangles the same way it does against any other label. The fireblock labels themselves are not free to move; only the regular labels can shift around them.

10. **OPTION key x-rays the drawing.** While OPTION is held AND at least one part is invisible:

    - The visible parts are skipped from the canvas render.
    - The silhouette box is built from invisible parts.
    - Dimensionals layout collects from invisible parts only.

    Release OPTION, or hold OPTION when no part is invisible, and normal mode applies: only visible parts are rendered; only visible parts get dimensions. Grid, axes, and the root's floor-rectangle keep drawing in both modes.

11. **Persistence across renders — tolerance of 2 pixels.** Each label's previously chosen (edge, uniface, witness index, label position) is remembered between renders. On the next render, four viability checks decide whether to reuse the previous values or re-run the full placement algorithm:

    - Previous witness index must still be a viable choice on the current render (witness index is discrete, so the 2-pixel tolerance does not apply directly — it carries over to the computed witness length instead).
    - Previous label position must lie within (new range start − 2 px) to (new range end + 2 px).
    - The label's rectangle, projected at the previous values, must clear every other previously-chosen label rectangle by at least 13 pixels (PAIR_CLEARANCE_PX 5 − PERSISTENCE_TOLERANCE_PX 2).
    - The label's rectangle must clear the silhouette box by at least 8 pixels (SILHOUETTE_MARGIN_PX 15 − PERSISTENCE_TOLERANCE_PX 2).

    If every label passes all four checks, skip the placement algorithm and reuse last render's values. If any label fails any check, a full placement algorithm runs — seeded with last render's values so the result usually changes only the labels that lost viability.

    **Seeded semantics.** Inside a seeded full placement-algorithm run, every label that passes all viability checks (the same four above, but without the 2-pixel tolerance) is LOCKED — its previous (edge, uniface, witness index, label position) values are held fixed for the duration of this run, and the label acts as a fixed obstacle that every other label must clear. Only the labels that failed the strict checks are FREE; the greedy seed plus retry plus stochastic finish runs on the free labels alone. Locked labels contribute to the conflict graph and clearance tests but never get moved. Stable parts of the layout stay stable; affected labels are relocated.

    **Drift safety.** After two consecutive placement-skipped renders in which any check came in under the strict threshold but within the 2-pixel tolerance, force a full placement-algorithm run on the next render anyway. Stops slow drift from compounding into a visibly wrong layout.

    **The 2-pixel value is a starting point, not final.** Smaller than the smallest "label feels stuck" gap the eye reliably notices, big enough to tolerate floating-point projection noise. The number deserves measurement against real tumble sessions before being treated as locked in.

12. **Performance budget.** The target is to keep each render inside one 40-fps frame — about 25 milliseconds total. Two budgets for the placement work, on basement-scale scenes (around 100 drawn labels):

    - Full placement-algorithm run → under 25 milliseconds (full run plus draw is allowed to spend the whole frame budget).
    - Placement skipped (when every label's previously chosen values are still close enough) → under 5 milliseconds.

    These map directly to the two performance tests in the e2e suite. Above 25 milliseconds on a full run, the user feels the redraw stutter when they tumble or pan; above 5 milliseconds for determining whether or not to skip the placement algorithm can possibly consume too much of our 25 ms per-frame budget, causing noticeable stutter.

13. **Drop duplicates.** Same text AND parallel edges-being-measured → drop the later occurrence (eg, multiple SOs with a common dimension).

    **Tie-break under the placement algorithm.** "Later" is determined in this order:

    1. **Persistence** — the label whose four-degrees-of-freedom values have been remembered between renders the longest wins; the newer one is dropped.
    2. **Parent over child** — when neither was remembered (or both were), the part with the shallower position in the scene hierarchy wins. A measurement on a parent describes more of the drawing than the same measurement on one of its children; the child loses. The depth comparison uses the dotted ancestry path length — fewer dots wins.
    3. **Alphabetical** — when persistence and depth both tie, the part with the alphabetically earlier ancestry path wins, so the result is deterministic from run to run.

14. **Drop filters imposed on DOF ranges.** Each (edge, uniface) enum pair has several disabled ranges for the value pair; the filters set those ranges. A label with no surviving (edge, uniface) pair is dropped (rule 15):

    - Label position forbidden range: Y pixels BEFORE and AFTER both witness anchors are forbidden -> the label rect must not overlap it even partially. Y is WITNESS_ANCHOR_BUFFER_PX (20 px today) minus half the label width.
    - Camera-axis filter (applies to uniface, not to a continuous range): a uniface is rejected when its outward normal points within 20° of straight AT the camera (a head-on front face whose witness would project to a sliver coming straight at the viewer) OR within 45° of straight AWAY from the camera (a back face hidden by the box itself, where the wider tolerance reflects that even partly-back faces are unusable). Unifaces facing sideways, up, or down (more than 45° off from straight back AND more than 20° off from straight at-camera) are kept.
    - Witness convergence: world-parallel witness lines project to non-parallel screen rays whenever the edge is not parallel to the image plane. Treat the edge, the dim line, and the two witnesses as an irregular trapezoid. Pick the edge corner with the LARGER interior angle (the more obtuse one; ties go to W1's corner). Drop a perpendicular from that corner onto the opposite witness's line. If the length of that perpendicular is less than WITNESS_CLEARANCE_PX (15 px today), reject the (edge, uniface) pair — the witnesses would crowd each other on screen.
    - A child whose parent is set to hide its children is not drawn on screen, but its geometry is still physically present in the scene. It MUST count as a potential blocker — the parent's drawn shell would otherwise leak dimensions through it.

15. **Drop unfit dimensionals.** A dimension that cannot be placed without violating the clearance rules is dropped rather than rendered in a bad spot. Three drop reasons; a label hits at most one of them:

    - Every (edge, uniface) pair for the label had its DOF ranges collapsed by the filters in rule 14 — the witness index range went empty, the label position range went empty, or the camera-axis filter rejected the uniface.
    - The label was forced into a true conflict by the placement algorithm and the drop-most-conflicted policy selected it.
    - Every surviving (edge, uniface) pair would put the label rectangle past the canvas edge at every reachable position.

    The dropped count is reported to the status strip.

16. **Witness and dimension lines lie in the plane of a face.** Witness lines must remain perfectly straight and may run through other parts on their way out.

    **Each witness line is an extension of an edge.** Extend an edge to infinity, this is where a witness line goes.

17. **Each witness line must NOT touch the SO it measures.** Each witness line begins AFTER a gap of 5 px. It must NOT touch the SO it measures.

18. **Dimension text sits on its line, drawn horizontal.** The label sits ON the dimension line (center point of the label rect is on that line). The text is drawn aligned with the screen horizontal — never rotated to match the dimension line's screen angle.

    **The renderer places the label center on the dim line that actually gets drawn — not on the one the placement algorithm used internally for scoring.** The two are slightly different in perspective.

    **Each side of the dim line decides on its own whether its arrow needs to move outside its witness line.** The arrowhead's tip ALWAYS touches the witness line at the anchor; what varies is which side of the witness the rest of the arrow sits on.

    - **Inside arrow (default):** the arrowhead points INWARD toward the dim centre. Its tip is at the anchor; its base sits one arrow-length further along the dim line toward the other anchor. **The half of the dim line nearest this anchor is also drawn inside** — from the anchor toward the label's near edge (or all the way to the other anchor when that side is also inside).
    - **Outside arrow (per side):** when the inside arrow would not fit between the label box and the witness line on this side, the arrow flips. The tip stays at the anchor; the arrow now points OUTWARD, and a dim-line extension of EXACTLY SLIDABLE_OVERHANG_PX (20 screen pixels today) is drawn from the anchor outward along that side. **Every outside arrow gets the same twenty-pixel extension — no special cases, ever.** **No inside dim line on this side** when the arrow has flipped.

    **Label slide for full coverage.** If at the algorithm's chosen position the label fully covers an arrowhead (both the anchor AND the arrow's base point sit inside the label box), the placement search slides the label along the dim line past that witness anchor by half-label-width + SLIDABLE_OVERHANG_PX + an arrow's length, so the label's near edge sits past the outside extension's end with an arrow-length gap. **The slide happens inside the placement search so the label-vs-label and label-vs-everything-else clearance checks see the FINAL slid position.** The renderer then reads that final position and draws — no second slide in the renderer.

    **Slid label forces full overhang.** Once the label has been slid past a witness anchor (the "overhung label" case), **both** arrowheads AND **both** sides of the dim line go outside, regardless of what the per-side check would say. No inside dim segment between the anchors is drawn. **Both outside extensions remain exactly SLIDABLE_OVERHANG_PX long, the same as every other outside arrow.** On the slid side, a connector dim line runs from the extension's outer end to the label's near edge so the arrow and the label read as one connected shape.

    **The label is part of the hit-test.** Hovering the cursor on the label's number box triggers the same red highlight and name popup as hovering on a dim line, a witness line, or the part itself (rule 20).

    The arrows mean "this is the witness line for this label."

19. **Pick four-degrees-of-freedom values by best combined clearance.** The placement algorithm picks an (edge, uniface, witness index, label position) tuple per label such that every drawn label has PAIR_CLEARANCE_PX (5 px today) clearance from every other drawn label and SILHOUETTE_MARGIN_PX (15 px today) clearance from the silhouette box. Path-of-least-resistance (the old "smallest clearance wins" rule) is gone — it produced collisions because two neighboring labels would both pick the same easy escape uniface.

    **A candidate is a possible (edge, uniface, witness index, label position) four-degree-of-freedom tuple — NOT the label itself.** The label only exists once a candidate wins. A rejected candidate is discarded; the search moves to the next combination.

    **Filter pipeline (early exit).** Each candidate is tested against the seven hard filters in a fixed order (cheap and most-discriminating first). The first filter the candidate fails causes immediate rejection; remaining filters do not run. The rejection records which filter killed it (useful for debugging). The seven filters, in order:
    1. Label rectangle clears the silhouette rect by at least SILHOUETTE_MARGIN_PX.
    2. Label rectangle clears every previously placed label rectangle by at least PAIR_CLEARANCE_PX.
    3. Label rectangle clears every previously placed witness anchor by at least PAIR_CLEARANCE_PX.
    4. The candidate's own two witness lines keep at least SILHOUETTE_MARGIN_PX of separation along their length.
    5. **REMOVE:** Label rectangle clears every previously placed witness line by at least PAIR_CLEARANCE_PX.
    6. Label rectangle clears every previously placed dim line by at least PAIR_CLEARANCE_PX.
    7. The candidate's own anchors and dim line clear every previously placed label rectangle by at least PAIR_CLEARANCE_PX (NOTE: no longer clear every previously placed anchor).

    **Retry strategy.** A rejected candidate is never altered. The next candidate is generated by the enumeration. The enumeration, outer to inner: witness index (1, 2, 3); part edge (the four parallel edges per axis); uniface face (the four candidates per axis); label position (sample slots along the dim line). If no candidate at any combination passes, the part-axis drops with no dim line (rule 15).

    **Slide repair (one controlled exception).** When a candidate fails by D pixels at a position-sensitive filter (numbers 1, 3, 5, 6, or 7 above), the search generates ONE additional candidate with the same (edge, uniface, witness index) but with the label position slid along the dim line by D + 1 pixels away from the obstacle. The slid candidate re-enters the filter chain from filter 1. If the slid candidate also fails, the chain ends — no second slide for that combination.

    **Prefer between-the-witnesses over overhang.** Add a weighting to positions between the witness lines. Weighting is computed by subtracting the distance between the witness lines and the length of the label, in screen pixels.

    **Centering preference, shaped like a parabola.** When the label fits between the witnesses, a small additional penalty nudges the label toward the midpoint between the witness lines. The penalty is a parabola sized to the dim line, value is zero at the midpoint and a tunable number X at the witness anchors. Start with X = 20.

    **The label must NEVER cover its own witness lines.** A candidate whose label rectangle is wider than the space between the witness lines must overhang. The overhang distance must leave room for a dimension line stretching between the label and the witness anchor on the overhang side.

    **Two dim lines that are real-world-parallel must sit at least PAIR_CLEARANCE_PX apart in screen pixels** (5 px today; value lives in `Constants.ts`). See rule 27. When two dim lines sit too close their pair of arrows and labels become visually indistinct.

    **Concentrate witness indices per direction by a popularity vote.** The full sweep tries every witness index (1 through WITNESS_INDEX_CAP) in every direction and records, per part and per direction, which witness indices survive the seven filters. The records are then transposed: for each direction, each witness index gets a list of the parts that found it viable. For each direction, the two witness indices with the longest lists win. Only the parts on those two winning lists keep that direction; every other (part, direction, witness index) viability record is discarded. Labels in the same direction therefore concentrate on at most two shared witness indices instead of scattering across all four. A part viable in a direction only at a witness index that lost the vote loses that direction entirely and must place elsewhere (or drop, per rule 15).

20. **Hover on a dimension number.** When the cursor sits on a dimension number:

    - The number renders in bold.
    - The dimension line and witness lines render thicker (1.5 pixels instead of 0.5).
    - The matching part highlights as if the cursor were on the part itself.
    - The name popup appears at the cursor (rule 21).

21. **Name popup format.** Hovering a part shows the ancestry path from just-below-root down to the part, joined with dots — for instance `front.moose.well post`. The root is excluded. A part directly under root shows just its own name.

    Hovering a dimension on a part appends the axis info. Format: `name (x | width)` for an x-axis dimension, `(y | depth)` for y, `(z | height)` for z. The separating dot between the ancestry path and the axis info appears only when the ancestry path is non-empty — so a root-level dimension reads `width (x)` with no leading period.

22. **Click a dimension number to edit it.** Clicking on a drawn dimension number begins inline editing of its underlying value (when the value is editable — bound formulas are read-only). The hit target is the label rectangle published by the renderer, the same rectangle used for hover (rule 20). Edits commit on Enter or focus-out and revert on Escape. While editing, the rest of the dimensionals layout pauses so the editor's position stays stable under the cursor.

23. **Placement-algorithm determinism.** The placement algorithm is deterministic. Given the same scene, same view, and the same remembered four-degrees-of-freedom values from the previous render, every render produces the same chosen values per label. Every tie-break — whether ordering labels, ordering (edge, uniface) pairs, or seeding the stochastic step — uses a stated rule, with "alphabetical by part ancestry path" as the catch-all when no other rule applies. No randomness from a non-deterministic source.

    The stochastic finish reaches for the project's seeded pseudo-random number generator, never the browser's built-in random function. The generator's seed is derived from the scene contents via a string hash so the same scene at the same view produces the same random sequence. See the [determinism helpers section of the research file](dimensionals-research.md#determinism-helpers) for plain-English descriptions of the generator and the hash. Implementation: [Seeded_Random.ts](../../../src/lib/ts/common/Seeded_Random.ts).

24. **Postconditions for every rendered layout.** Two visible-outcome assertions a test can check after the layout settles:

    - Every drawn label rectangle is at least SILHOUETTE_MARGIN_PX (15 px today) outside the silhouette box.
    - Every pair of drawn labels is at least 15 pixels apart, measured rectangle-to-rectangle.

    When the filters (rule 14) would force a label to violate either, the label is dropped (rule 15), not rendered in the wrong place.

25. **Test-only hooks the new design must expose.** The e2e suite verifies postconditions and budgets through functions exposed on the existing `di_test` object when the URL carries `?test=1`. The new design must keep the existing hooks and add the ones in italics. The e2e tests under `e2e/tests/dimensions-*.spec.ts` reference these names already; the spec listing them here is a contract that the new implementation must satisfy.

| Function                           | What it returns / does                                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dim_labels()`                     | Every drawn label — part name, axis, screen position, label rectangle (existing).                                                                                 |
| `dim_dropped_count()`              | How many labels were dropped on the most recent render (existing).                                                                                                |
| `is_xray_active()`                 | Whether the OPTION x-ray mode is currently on (existing).                                                                                                         |
| *`dim_min_silhouette_clearance()`* | Smallest gap, in pixels, between any drawn label rectangle and the silhouette box.                                                                                |
| *`dim_viable_pair_counts()`*       | Per drawn label, the number of viable (edge, uniface) pairs that survived the **rule-14** filters.                                                                |
| *`dim_conflict_graph_check()`*     | Any pair whose conflict-graph classification disagrees with a brute-force check of the **rule-19** conflict definition. Should be empty.                          |
| *`dim_drop_report()`*              | Per dropped label, which of the three **rule-15** reasons applied and (for the second reason) how many true conflicts it had when dropped.                        |
| *`dim_labels_by_kind()`*           | Every drawn label tagged as one of: `master`, `clone`, `fireblock-first`, `fireblock-last-shortened`, `regular` (**rule 9**).                                     |
| *`dim_label_angles()`*             | Per drawn label, the on-screen rotation of the text glyph in radians (**rule 18** expects 0 for every label).                                                     |
| *`dim_hover_state()`*              | Which label is currently hovered (part name + axis), the current line width, whether the number is bold, whether the matching part is highlighted (**rule 20**).  |
| *`dim_popup_text()`*               | The current name-popup string when one is visible — empty string when no popup is shown (**rule 21**).                                                            |
| *`dim_edit_state()`*               | Whether a dimension editor is currently open, plus the part name + axis being edited and whether the underlying value is editable (**rule 22**).                  |
| *`dim_layout_frozen()`*            | Whether the dimension layout is currently paused — true while a dimension editor is open (**rule 22**).                                                           |
| *`dim_last_cold_search_ms()`*      | Wall-clock duration of the most recent full placement-algorithm run, in milliseconds.                                                                             |
| *`dim_last_search_skipped_ms()`*   | Wall-clock duration of the most recent placement-skipped render, in milliseconds.                                                                                 |
| *`dim_perf_breakdown()`*           | Per-phase timing breakdown for dev-mode tuning: phase name, most recent duration, running average, count.                                                         |
| *`set_view_mode(mode)`*            | Input action — switches between `'2d'` and `'3d'` view modes (**rule 28**).                                                                                       |

26. **Distance tests use rectangles, not points.** Every distance test — silhouette clearance, label-versus-label clearance — uses the full text rectangle, not just its centre. A centre can sit 15 pixels from another centre while the rectangles themselves overlap; a centre can sit outside the silhouette box while a corner of the rectangle hangs inside. Both look broken unless the rectangle is the unit of measurement.

    Labels must also avoid overlapping ANY lines or anchors.

27. **Parallel lines need room.** Two dim lines that are parallel-in-3D must sit at least PAIR_CLEARANCE_PX (5 screen pixels, value lives in `Constants.ts`) apart, measured perpendicular to their shared axis. When two dim lines sit too close their arrows and labels become visually indistinct. This promotes easy reading.

28. **2D mode is not a special case.** Every part gets all three axes considered for placement, regardless of view mode. The 2D-from-the-front view does NOT restrict a part to only the two axes of its front-most face — that was a quirk of the old code and is dropped in the new design. The placement algorithm, the DOF filters, the conflict definition, and the persistence map all behave identically in 2D and 3D modes. If a particular axis projects to nothing useful in the current view, the filters (camera-axis, witness-index) collapse its DOF ranges the same way they would in 3D.
