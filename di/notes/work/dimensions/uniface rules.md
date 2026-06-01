# New design for dimensionals

The dimensionals are still challenging to interpret. Might be easier if they are co-planar.

## Uniface rules

1. Witness index is a discrete choice with values 1, 2, or 3 (the cap). It picks which uniface box holds the dim line per rule 3.
2. 4DOF with only one continuous degree of freedom -> the position of the dimension label, which still needs complicated avoidance rules (rules 5 - 8). The other 3 are edge, uniface, and witness index.
3. Compute witness length so as to place its dimension line in the plane of a uniface. witness index says which uniface box. if no such length exists without conflict, drop the label.
4. For rotated parts, the silhouette box is rotated the same -> the rotated part.
    1. The label center point is placed on the uniface closest to the rotated label's projected center. The dimension line is placed on the plane parallel to the rotated silhouette box that passes through the label center point.
    2. when rotated parts overlap, nothing special is done
5. Every pair of labels must be at least silhouette margin apart, computed using their text rectangles.
6. Every label must sit at least silhouette margin away from any witness anchor, witness line, dim line, or silhouette box surface.
7. For a label that conflicts everywhere, increment its witness index and try again. If the witness index exceeds the cap (3, per rule 1), drop the label. Dropping a label does not trigger redoing the placement for labels that depended on this one's position.
8. The pair clearance and the silhouette margin are both set to 15 pixels. This is intentional.
9. rules not mentioned here carry over from the original spec ([[dimensionals rules]]):
    1. repeater integration (rule 18),
    2. x-ray mode (rule 13),
    3. persistence across paints (rule 19),
    4. performance budget (rule 20),
    5. drop semantics (rules 4, 11, 12),
    6. dim-line drawing (rules 5, 6, 7),
    7. label centering (rules 7, 10),
    8. in-place editing (rules 14, 15, 17),
    9. deterministic tie-breaks (rules 4, 21),
    10. test hooks (rules 16, 25),
    11. distance tests use rectangles (rule 2),
    12. parallel lines need room (rule 3),
    13. 2D mode is not a special case (rule 22).

## Proposal for transition

two readings of "transition" — evolve the master spec, and roll out the code. the spec evolution gates the code, so do it first.

1. **create (or update) a test for each rule.**
2. **coding steps**, each runnable in the app at every step.

- **DONE step 1 — uniface box builder, nothing calls it yet.** add a helper that, given the camera and the rendered non-rotated leaf parts, returns the uniface box: a world-axis-aligned box plus, for each of its six unifaces, the world-units shift that places it at the configured screen-pixel margin past the projected silhouette box. recompute every render. new unit tests cover the bounding box, the per-uniface shift, and the screen-pixel-margin invariant.
- **step 2 — first uniface placements for non-rotated parts, behind a flag, default off.** for each non-rotated part and each axis, pick the first viable uniface (no smart picking yet) and place the dim line on it. emit the same placement shape today's pipeline emits so the repair pass, stochastic finish, drop policy, and persistence layer all swallow it unchanged. add a button to the controls so the visual diff is one click. fill the twelve todo tests as the gating contract.
    - **DONE step 2a — per-axis uniface picker.** pure function: given the axis being measured, the uniface box, and the witness index, return the first uniface that is not excluded and contains the measured axis. unit-tested in isolation.
    - **DONE step 2b — session-level flag (default off) that gates the new path.**
    - **DONE step 2c — wire the new placement into the render path behind the flag.** when off, today's code runs unchanged. when on, the new code produces the placement and feeds it into the same downstream shape.
    - **DONE step 2d — add a button to the controls so the visual diff is one click.**
    - **DONE step 2e — fill four of the twelve outstanding tests as real assertions against the new code.** two of the original twelve and two of the six extra
- **step 3 — refinement, then flip the default to on.** smarter uniface picking (closest, least-crowded, or stability-preferring — pick the one that settles visually). one-dimensional conflict resolution per uniface for same-axis labels that share one. drop the 200-pixel witness cap for non-rotated parts (the cap stays on for rotated parts until step 4).
    - **DONE step 3a — closest uniface picker.** replace the pick-the-first picker with one that picks the uniface closest to the natural label position (the projected midpoint of the edge being measured). unit-tested in isolation.
    - **DONE step 3b — same-uniface conflict resolution.** when two same-axis labels sit on the same uniface, slide them along the uniface so they do not overlap. one-dimensional packing along the uniface. real label widths are still placeholder constants until the dim-text formatter is wired into the new pipeline.
    - **DONE step 3c — drop the 200-pixel witness cap for non-rotated parts.** interior parts can have arbitrarily long witnesses reaching the uniface. the cap stays on for rotated parts until step 4. the new path records each pick's witness length in screen pixels (the perpendicular distance from the part center to the chosen uniface face center) with no cap applied.
    - **DONE step 3e — render the uniface placement to the canvas.** for each pick, draw the dim line on the chosen uniface plane (spanning the part's extent along the measured axis) and the two perpendicular witness lines from the part's near face to the dim line ends. labels (the dim number text) come in a later step because they need the dim-text formatter wired into the new path. drawn in blue to distinguish from the old path.
    - **DONE step 3f — port the four filters from the old path into the new one.** four filters: (1) repeater filter — only regular, template, first fireblock, and last-if-shortened fireblock get dim lines; clones and middle fireblocks are skipped (axes restricted per repeater rules). (2) duplicate-text drop — group by (formatted number text, axis), keep one per group (alphabetical by part name as the deterministic tiebreak). (3) off-canvas drop — applied in the renderer; skips picks whose dim-line endpoints both fall outside the canvas rect. (4) no-viable-pair drop — picks whose uniface is null are removed from the result. ported against the new data shape, not by reshaping new output to feed the old code.
    - **step 3d — flip the default so the new path runs without the toggle.** the old path stays in the file (gated by the toggle) until step 7. waits on steps 3e and 3f.
- **step 4 — rotated parts.** implement rule 4 after steps 1 through 3 are stable.
- **step 5 — fill the remaining outstanding test bodies.** as steps 3 and 4 add the code that unblocks each gated test, write the real check-the-result body. The entries currently outstanding are blocked on: the full uniface placement output, the drop-on-no-viable-witness branch (rule 3), the two-dim-same-uniface sharing case, the 200-pixel cap removal (gated on step 3), and the rotated-part handling (gated on step 4).
- **step 6 — audit the persistence tests against the new code.** the new code path changes the placement geometry, so tests that test the persistence rules from rule 9 may now fail. run the suite and reconcile any breakage.
- **step 7 — remove the old code AND disable the tests for the abandoned rules (rule 10).** once the new code is the active path, the old four-degree avoidance algorithm, the pair-check tiers, and the greedy-seed plus stochastic-finish helpers can come out. their tests come out with them.
