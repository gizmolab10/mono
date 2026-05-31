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
10. rules from the original spec abandoned by the uniface design:
    1. four degrees of freedom per label (rule 1) — replaced by the new four placement choices (edge, uniface, witness length, label position),
    2. two translations within the search (rule 8) — replaced by the discrete witness index,
    3. silhouette as a single combined hull of leaf parts (rule 9) — replaced by the silhouette box (world-3D),
    4. pick 4DOF values by best combined clearance (rule 10, mostly) — replaced by computing witness length per rule 3 and dropping on conflict. The centering preference sub-rule inside rule 10 carries over under label centering,
    5. 4D avoidance algorithm (rule 23) — replaced; the new design does not run the old four-degree search,
    6. pair-check tiers (rule 24) — replaced,
    7. strongly prefer placement on or just outside the uniface block (rule 26) — fully merged into the new spec.


## Proposal for transition

two readings of "transition" — evolve the master spec, and roll out the code. the spec evolution gates the code, so do it first.

1. **create (or update) a test for each rule.**
2. **coding steps**, each runnable in the app at every step.

- **step 1 — uniface box builder, nothing calls it yet.** add a helper that, given the camera and the painted non-rotated leaf parts, returns the uniface box: a world-axis-aligned box plus, for each of its six unifaces, the world-units shift that places it at the configured screen-pixel margin past the projected silhouette box. recompute every paint. new unit tests cover the bounding box, the per-uniface shift, and the screen-pixel-margin invariant.
- **step 2 — first uniface placements for non-rotated parts, behind a flag, default off.** for each non-rotated part and each axis, pick the first viable uniface (no smart picking yet) and place the dim line on it. emit the same placement shape today's pipeline emits so the repair pass, stochastic finish, drop policy, and persistence layer all swallow it unchanged. add a button to the painter toggle so the visual diff is one click. fill the twelve todo tests as the gating contract.
- **step 3 — refinement, then flip the default to on.** smarter uniface picking (closest, least-crowded, or stability-preferring — pick the one that settles visually). one-dimensional conflict resolution per uniface for same-axis labels that share one. drop the 200-pixel witness cap for non-rotated parts (the cap stays on for rotated parts until step 4).
- **step 4 — rotated parts.** implement rule 4 after steps 1 through 3 are stable.
- **step 5 — audit the persistence tests against the new code.** the new code path changes the placement geometry, so tests that test the persistence rules from rule 9 may now fail. run the suite and reconcile any breakage.
- **step 6 — remove the old code AND disable the tests for the abandoned rules (rule 10).** once the new code is the active path, the old four-degree avoidance algorithm, the pair-check tiers, and the greedy-seed plus stochastic-finish helpers can come out. their tests come out with them.
