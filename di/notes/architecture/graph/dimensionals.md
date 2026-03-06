# Dimensionals

Dimension annotations on 3D geometry. Each SO gets up to three dimensionals (one per axis), rendered as witness lines + dimension line + arrows + editable text label. Everything is derived on render — no persistent dimension state.

## File

`src/lib/ts/render/R_Dimensions.ts` (~400 lines, extracted from Render.ts)

Depends on `DimensionHost` interface to avoid circular imports with Render. The host provides: canvas context, projection, world matrices, face winding, point-in-polygon, arrow drawing, and the `dimension_rects` accumulator for hit testing.

## Pipeline

`render_dimensions(host)` iterates all scene objects. For each:

1. **Edge selection (Algorithm A)** — silhouette edge detection. for each axis, find edges where one adjacent face is front-facing and the other is back-facing. prefer the one whose front face is most toward the viewer (most negative winding). this guarantees the dimensional is on the visible outline, not hidden behind the object.

2. **Witness direction (Algorithm B)** — pick the world axis most perpendicular to the edge on screen. project each candidate axis (the two perpendicular to the edge axis) to screen space, take the cross product with the edge's screen direction. the axis with the largest cross product magnitude wins. this optimizes for visual spread and handles edge cases where face-normal-based approaches fail.

3. **Outward check** — witness direction is flipped if it points inward (toward the SO center). uses dot product between the witness direction and the vector from SO center to edge midpoint.

4. **3D offset projection** — all witness and dimension line points are computed as 3D offsets (`vertex + witness_dir * d`) and then projected. this means:
   - witness lines diverge naturally in perspective (each vertex is at a different depth)
   - the dimension line stays parallel to the measured edge (both endpoints are translated by the same 3D vector)
   - pixel distances are approximate targets, converted to 3D via `avg_wlen` (average screen-space length of a unit witness vector at both endpoints)

5. **Crunch detection (Algorithm C)** — if the projected dimension line is too short for the text, either invert the arrows (point outward) or hide the dimensional entirely. the text gap is computed as `textWidth * |ux| + textHeight * |uy| + padding`, accounting for the dimension line's angle on screen.

6. **Occlusion** — before drawing, check if another object's front face fully covers the text bounding box at a closer depth. if so, skip.

## Repeater integration

Repeater clones skip dimensionals entirely — only the template (first child) gets all axes. Exception: fireblocks.

- first fireblock: shows repeat-axis dimensional only
- last fireblock: shows repeat-axis dimensional only if its length differs from the first fireblock (shortened bookend bay)

Fireblocks are identified by comparing their repeat-axis length to the template's — they differ because fireblocks are sized to the bay gap, not the stud width.

## Drawing

`draw_dimension_3d` handles two layouts:

- **normal**: dimension line with text gap in the middle, arrows pointing inward at both ends, witness lines extending past the dimension line
- **inverted**: when the line is too short for arrows inside, arrows point outward and extension lines reach beyond both endpoints

Text is white-background-filled, centered on the dimension line midpoint. Each drawn dimension is pushed to `dimension_rects` for click-to-edit hit testing.

## Key constants

| Name | Pixels | Purpose |
|------|--------|---------|
| `gap_px` | 4 | gap between edge and witness line start |
| `dist_px` | 20 | distance from edge to dimension line |
| `ext_px` | 8 | witness line extension past dimension line |

These pixel targets are converted to 3D distances via `px / avg_wlen` before projection.
