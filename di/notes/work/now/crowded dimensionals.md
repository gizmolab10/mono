# Crowded Dimensionals — consolidated requirements

Everything the dimension layout has to do, in one place, in the simplest language. Each rule stands on its own. Old session-by-session numbering is gone — the rules are grouped by what they govern.

## 1. Force-driven label layout

Crowded labels separate via a force-driven pass. Each label has a home position (the midpoint of its dimension line). Springs pull each label toward its home, repulsion pushes labels away from each other, damping settles motion. Position and velocity persist across frames. Motion is free in two dimensions — no axis constraint. No leader lines back to the home; visual connection is by proximity. The physics is written directly in the dimensions renderer — no external layout library.

## 2. Force algorithm uses rectangles, not points

Every step of the force algorithm — silhouette push, label-versus-label repulsion, outside-the-drawing check — uses the full text rectangle, not just its center. A center can sit outside the silhouette while a corner of the rectangle hangs inside. A center can be far enough from another center not to repel while the rectangles still overlap. Both produce visually broken results unless the rectangle is the unit of measurement.

## 3. Dimension lines and witness lines participate in repulsion

The repulsion footprint of each candidate covers the label rectangle AND a fraction of its dimension line and witness lines, so parallel lines push apart. The fraction is half the line length — using the full length caused chaos for crossing axes. Text avoids other lines, not just other text.

## 4. Drop duplicates

Same screen position AND same text → drop the later occurrence (parent and child sharing an edge, for instance). Also: same text anywhere in the drawing → drop the later occurrence.

## 5. Witness lines stay straight, in canonical planes

Witness lines, dimension lines, and label positions are computed using real 3D projection — the same projection used for every other edge in the drawing. Witness lines may run through other parts on their way out, but they must remain perfectly straight projections of axis-aligned 3D rays. They live in one of the three canonical planes (xy, yz, xz). No 2D screen-space shifts that would put a witness endpoint off the projected ray.

## 6. Dimension line is parallel-in-3D to the measured axis

The dimension line is a real 3D line, parallel in 3D to the axis it measures. Under perspective it is NOT generally parallel to its measured edge on screen — that's the correct projected appearance. Pushing it outward to clear the silhouette is done in 3D (increase the outward distance, then re-project), not as a 2D screen-space translation, so perspective is preserved.

## 7. Dimension text sits on its line, drawn horizontal

The label sits ON the dimension line, not floating off to one side. The text is drawn aligned with the screen horizontal — never rotated to match the dimension line's screen angle.

## 8. Witness lines stretch with the label

When the force moves a label, the dimension line moves with it (still parallel-in-3D to the measured axis). Each witness line stretches or shortens along its own projected ray so its end meets the new dimension line endpoint. Algorithm:

1. Build a 2D line through the label's force-driven position, parallel to the dimension line direction.
2. Intersect that line with each witness ray — those two intersection points become the new dimension line endpoints (and the witness end points).
3. If an intersection falls behind a witness start (would shorten past the part), keep that end at its original position.

## 9. Silhouette = single combined hull of leaf parts

Before placing any dimension, compute ONE convex outline that wraps all painted leaf parts' projected vertices combined into a single point set. Container parts (parts with at least one painted child) do NOT contribute their corners — those corners can sit far outside any actually-painted geometry and would bloat the outline. Every dimension is pushed outside that single outline, not past each individual part's outline. Margin: 30 pixels.

Trade-off: a strongly concave drawing (a U-shape) treats the notch of the U as inside the silhouette. Dimensions in the notch are pushed past the U's overall outline rather than into the notch itself.

## 10. Pick the witness direction with the easiest escape

A dimension's witness lines can point along either of the two perpendicular axes, in either positive or negative direction — four candidates total. For each candidate:

- Reject any whose 3D direction points within roughly 30 degrees of the camera axis (`|dot with camera forward| > 0.866`). A witness pointing toward or away from the camera collapses to a near-zero line on screen.
- Measure the silhouette-clearance distance — how far the witness arrow has to travel before the label clears the combined outline plus the 30-pixel margin.
- Measure the projected witness line length on screen after the push.

Among the candidates that survive both filters, pick the one with the smallest clearance distance — the path of least resistance to the outside of the drawing. Ties fall back to the older rule (most perpendicular axis on screen, then outward from the part's own center).

## 11. Caps to keep labels on the canvas

Two caps work together to stop a label from flying off:

- Silhouette push capped at 80 pixels. If the required push to clear the outline plus rectangle plus margin would be more than 80, reduce to 80.
- Projected witness line capped at 120 pixels. After the push, if the projected witness still exceeds 120, binary-search the 3D push down until the projected witness fits within 120.

## 12. Drop unfit dimensionals

A dimension that cannot satisfy the placement constraints is dropped entirely rather than placed badly. Specific drop conditions:

- All four candidate witness directions are rejected by either the camera-axis filter or the projected-length filter.
- After the push and length cap, the label position falls off the canvas — witness and dimension lines would point to nothing visible.
- After the force simulation, the label's rectangle overlaps another surviving label's rectangle. Drop the later one.

A dropped dimensional is removed from the candidate list before drawing and is never painted.

## 13. OPTION key x-rays the drawing

While OPTION is held AND at least one part is invisible:

- The visible parts are skipped from the canvas paint.
- The silhouette outline (rule 9) is built from invisible parts.
- Dimension layout collects from invisible parts only.

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

## 16. Postcondition: every drawn label sits outside the silhouette outline

Rule 9 describes the push procedure. This rule states the visible outcome a test can assert: after the layout settles, the centre of every drawn label is on or outside the combined silhouette outline. If the silhouette push cap (rule 11) or the witness-length cap (rule 11) would force a label to land inside the outline, the label is dropped (rule 12), not drawn in the wrong place. The 30-pixel margin from rule 9 is a goal of the push, not a hard postcondition — a label may end up between zero and 30 pixels outside when the push hit the cap.

## 17. Click a dimension number to edit it

Clicking on a drawn dimension number begins inline editing of its underlying value (when the value is editable — bound formulas are read-only). The hit target is the label rectangle published by the renderer, the same rectangle used for hover (rule 14). Edits commit on Enter or focus-out and revert on Escape. While editing, the rest of the dimension layout pauses so the editor's position stays stable under the cursor.
