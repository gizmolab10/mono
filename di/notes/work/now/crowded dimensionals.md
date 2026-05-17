# Crowded Dimensionals — full requirement set

Everything Jonathan has called for during the crowded-dimensionals work, gathered in one place. Some of these are already done; some are open or under iteration. Listed in the order they emerged.

## 1. Crowded labels must spread out

Dimension labels that would otherwise stack on top of each other separate via a force-driven layout pass. Each label has a home position; springs pull it toward home, repulsion pushes it away from other labels, damping settles motion. Position and velocity persist across frames.

## 2. Motion is free in two dimensions

The force pushes labels in any direction on screen, not just along one axis. No constraint to a single dimension of motion.

## 3. No leader lines

A label that drifts from its home does NOT draw a connector line back to its anchor. Visually it stays connected by being close.

## 4. Hand-rolled, not d3-force

The physics is written directly in the dimensions renderer. No external layout library.

## 5. Skip duplicates at the same place

When two or more candidates share the same screen position AND the same displayed text (parent and child sharing an edge, for instance), only the first one collected is kept; the rest are dropped before simulation.

## 6. Lines participate in the repulsion (mildly)

The repulsion footprint of each candidate covers the label and a fraction of its dimension line, so parallel lines push each other apart. The fraction is half the line length — full-length contribution caused chaos for crossing axes, so the value is tuned down.

## 7. Hover behavior on a dimension's text

When the cursor sits on a dimension number:

- the number renders in bold
- the dimension line and witness lines render thicker (1.5 pixels instead of 0.5)
- the corresponding smart object highlights, same as if the cursor were on the object itself
- the smart object's name popup appears

## 8. Name popup includes the axis when hovering a dimension

The popup reads `name (x | width)` for an x-axis dimension, `(y | depth)` for y, `(z | height)` for z. Axis letter and semantic name separated by space-pipe-space. Regular smart-object hover (not on a dimension) just shows the name.

## 9. Name popup shows ancestry

The popup shows the full ancestry path from just-below-root down to the smart object, joined with dots. For instance `front.moose.well post`. The root name is excluded. For a smart object directly under root, the path is just its own name.

## 10. Dimensions for invisible smart objects show only while OPTION is held

Visible smart objects always get their dimensions drawn. Invisible smart objects (those whose visible flag is off, or whose parent chain includes an object that hides its children) normally get no dimensions. While the user holds the OPTION key, those invisible smart objects also get their dimensions drawn, so the user can read measurements of hidden parts on demand.

The drawing's silhouette outline stays built only from visible objects — invisible objects don't paint, so they shouldn't shift where other dimensions land. Only the set of candidates collected for the dimension pass widens to include invisible objects while OPTION is held.

## 11. Push everything outside the drawing's silhouette

Every dimension annotation has to end up outside the union of all visible smart objects' screen bounding rectangles, plus a 30-pixel margin. The push is computed per candidate at preparation time: from the home position, a ray shoots in the witness direction; if it crosses any other visible object's bounding rectangle, the 3D outward distance is increased so the dimension line clears that object plus the margin.

## 12. Witness lines stay through other objects, but never bend

Witness lines are allowed to run through other objects on their way out. But they must stay perfectly straight — projections of axis-aligned rays in 3D. They must remain in one of the three canonical planes (xy, yz, xz). No 2D shifts to witness endpoints that would put them off the projected witness ray.

## 13. Dimension lines obey 3D perspective

Dimension lines are projections of real 3D lines. Under perspective they are NOT generally parallel to the projected edge they measure — that's the correct projected appearance. When pushing a dimension outward to clear the silhouette, the push is done in 3D (increase the outward distance, then re-project), not as a 2D screen-space translation, so perspective is preserved.

## 14. Dimension text must be aligned onto its dimension line

The label sits ON the dimension line, not floating off to one side. The text is NOT rotated to match the dimension line's angle on screen. text is drawn aligned with the screen horizontal

## 15. Dimension lines follow the force-driven label position

When the force moves a label, the dimension line moves with the label. The dimension line stays parallel in 3D to an axis. Each witness line stretches or shortens along its own projected ray so its end meets the new dimension line endpoint — witness lines remain straight (rule 12).

Algorithm at draw time:

1. Take the original dimension line direction in 2D from the projected endpoints d1 and d2.
2. Take the projected witness ray for each end (from witness start through witness end).
3. Build a 2D line through the label's force-driven position, parallel to the dimension line direction.
4. Intersect that line with each witness ray — those two intersection points become the new dimension line endpoints (and the witness end points).
5. Clamp: if an intersection falls behind a witness start (the witness line would shorten past the smart object), keep that end at its original position.

## 16. Witness lines and dimension lines use the normal 3D projection

Both witness lines and dimension lines must be drawn using the same 3D-to-2D projection that the rest of the drawing uses for every non-rotated edge. Their endpoints come from real 3D points (witness start, witness end, dimension line endpoints) and are projected to the screen the standard way. No special-case 2D math, no per-pixel screen-space adjustment that would diverge from how an ordinary edge would project.

## 17. witness and dimension lines must also participate

Dimension text must avoid lines from other dimensionals and SO edges.

## 18. Try all four witness directions and pick the one with the easiest escape AND shortest witness lines

A dimension is anchored to a single edge of a smart object. That edge is oriented along one axis (x, y, or z). The witness lines extend perpendicular to that edge, so they can point along either of the two remaining axes, in either the positive or negative direction — four possible directions total.

The current code is locked into a single direction, picked by (a) which of the two perpendicular axes projects most perpendicular to the edge on screen and (b) flipping the sign if it points toward the smart object's own center. Neither of those takes into account what's actually in the way along that direction OR how long the resulting witness lines would be on screen.

New behavior: for each candidate, try all four directions. For each one, measure:

1. The silhouette clearance distance — how far the witness arrow has to travel before it clears every other visible object's outline on screen, plus the silhouette margin.
2. The projected witness line length after the silhouette push has been applied — measured on screen from the anchored start to the dimension line endpoint.

Filter out any direction whose projected witness line exceeds a threshold (around 80 pixels). Among the survivors, pick the one with the SMALLEST clearance distance — the path of least resistance to the outside of the drawing. Use that direction for the witness lines, dimension line, and label.

If every direction's projected witness line exceeds the threshold, the dimension is unfit (rule 25). Drop it.

If two surviving directions tie on clearance distance, fall back to the existing rule (most perpendicular axis on screen, then outward from smart object center).

## 19. Silhouette is a single combined hull of all visible objects, not per-object hulls

Before placing any dimension, compute ONE convex outline that wraps all visible smart objects' projected vertices combined into a single point set. That single outline is the drawing's silhouette for the purposes of dimensional placement. Every dimension is pushed outside that one outline, not past each individual object's outline.

**Why:** with per-object outlines, the dimension can land in a gap between two objects — outside every individual outline but visually inside the drawing. The combined outline includes those internal gaps, so "outside the silhouette" matches the visual intent.

**How it combines with rule 18:** for each dimension, compute the clearance distance against the SINGLE combined outline (in all four directions). Pick the direction with the smallest clearance. Push by that clearance plus the silhouette margin.

**Trade-off:** a strongly concave drawing (e.g., a U-shape) treats the notch of the U as inside the silhouette. Dimensions in the notch are pushed past the U's overall outline rather than into the notch itself. For typical building sections this is fine.

## 20. Witness lines must not extend toward the camera

A witness direction whose 3D vector points mostly along the camera's line of sight (toward or away from the viewer) is forbidden. Such a direction projects to a very short line on screen — the witness "comes out of the screen" rather than going off to one side of the drawing — and the resulting dimension annotation collapses visually.

Acceptable witness directions are the ones whose 3D vector lies mostly across the camera's view (left-right or up-down on screen).

**How to test:** the camera has a forward direction (where it's looking). For each of the four candidate witness directions, take the angle between the witness 3D vector and the camera's forward direction. If that angle is too close to zero (witness pointing straight away from the camera) or too close to 180 degrees (witness pointing straight back at the camera), reject that direction. Concretely: forbid any direction where the absolute value of the dot product between the witness unit vector and the camera forward unit vector exceeds about 0.866 (corresponds to within roughly 30 degrees of the camera axis).

**How it combines with rule 18:** the four-direction loop skips any forbidden direction before measuring clearance. If all four directions are forbidden (unusual — would mean the smart object's two perpendicular axes both align with the camera axis), fall back to the existing direction picker so the dimension still draws.

## 21. Force algorithm uses the text rectangle, not the center point

Every step of the force algorithm — the silhouette push, the label-versus-label repulsion, and the check that a label is outside the drawing — must use the FULL TEXT RECTANGLE of the dimension number, not just its center point.

**Why:** a center point can sit outside the silhouette while the rectangle around it still hangs inside the drawing. A center point can be far enough from another center point that they don't repel, while their rectangles still overlap. Both of those produce visually broken results even though the center math passes.

**How to apply:**

- For the silhouette push: a label is "outside the silhouette" only when every corner of its rectangle is outside the combined outline. Push along the chosen witness direction until that condition holds.
- For label-versus-label repulsion: the existing code already uses the rectangle (label width and height combined with padding) — keep it that way.
- For any visibility / occlusion test: use the rectangle's corners, not the center.

**Concrete check at draw time:** compute the four corners of the label's drawn rectangle. Test each corner against the combined outline. If any corner is inside, the dimension is reported as inside the silhouette.

## 22. no duplicate text

keep track of the text of each dimensional and skip each recurrence

## 23. Combined outline uses leaf objects only, and the push is capped

The combined outline (rule 19) is built only from leaf smart objects — objects with no visible children. Container smart objects (basement, front, moose, bathroom, etc.) do NOT contribute their projected corners to the outline. Container corners can sit far outside any actually-painted geometry and would bloat the outline.

Additionally, the push distance is capped at 80 pixels. If the required push to clear the outline plus the rectangle plus the margin would be more than 80 pixels, the push is reduced to 80. Beyond that, the dimension may sit closer to or slightly inside the drawing — accepted as a trade-off against having labels fly off the canvas.

## 24. Witness line length on screen is capped

After the silhouette push moves the dimension line outward, check the projected witness line's length in pixels. If it exceeds 120 pixels, reduce the 3D push (binary-search) until the projected witness line fits within 120 pixels. Without this cap, a 3D push calibrated near the smart object can stretch much longer on screen at the far end (perspective amplification when the chosen direction has any toward-camera component).

## 25. Unfit dimensionals — drop instead of placing badly

Any dimensional that cannot satisfy the placement constraints is dropped entirely rather than placed badly. A misplaced annotation (off-canvas text, witness lines pointing to nothing visible, label sitting inside the painted drawing) is worse than no annotation.

Specific drop conditions:

- The smallest clearance across all four candidate witness directions (per rule 18) is greater than the push cap. Even the easiest escape can't get the label outside the drawing within the cap, so the dimension is dropped.
- After the silhouette push and the witness-length cap, the projected label position falls off the canvas in either direction. The witness and dimension lines would be pointing to nothing visible — drop.
- After the force simulation, the label's rectangle overlaps another label's rectangle that survived the simulation. Drop the later-collected one.

A dropped dimensional is removed from the candidate list before drawing and is never painted to the canvas.

## Workflow state

- Rules 1 through 13 are done and visually confirmed.
- Rules 14 and 15 are pending.
- Rule 16 is the underlying invariant for 12, 13, 15 — drives the implementation choices for all three.
- Rule 17 pending.
- Rule 18 is done — four-direction selection picks the smallest clearance.
- Rule 19 is done — silhouette is a single combined hull.
- Rule 20 is done — forbids witness directions within 30 degrees of the camera axis.
- Rule 21 is done — silhouette push uses the text rectangle, not just the center point.
- Rule 22 is done — same-text duplicates dropped anywhere in the drawing.
- Rule 23 is done — combined outline uses leaf objects only; push capped at 80 pixels.
- Rule 24 is done — projected witness line length is capped at 120 pixels.
- Rule 25 pending — drop dimensionals that cannot be cleanly placed.
- Final visual confirmation needed on the full bundle once rules 12, 14, 15, 17, 18, 19, 20, 21 are wired together.
