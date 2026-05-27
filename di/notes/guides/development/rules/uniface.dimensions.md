# Uniface — a simpler dimensioning model for axis-aligned parts

## What it is

A redesign of the dimension-placement search that puts every dim line on a face of one shared buffer box. Replaces the per-edge / per-direction search of the current rules for non-rotated parts. Rotated parts get a different algorithm (TBD) and are skipped by uniface for now.

## The core idea

Build one buffer: a world-axis-aligned 3D bounding box that wraps every painted non-rotated part. Expand each face in world units so it projects exactly 15 pixels outside the projected silhouette of the scene. Recomputed each paint as the camera moves.

Every dim line for a non-rotated part lies on one of the six faces of that buffer. The dim line is parallel-in-3D to the part's axis. The witness lines extend from the part's edge endpoints to the buffer face.

## Why it might be better than the current per-edge / per-direction search

- All same-axis dimensions across all parts share one of a small set of buffer faces. They line up. Visually uniform.
- Direction selection collapses from per-edge-per-face down to a small fixed set (typically 4 buffer faces per axis).
- Conflict resolution per face becomes a 1-D arrangement problem instead of a free 2-D placement search.
- The whole per-edge silhouette-pushback computation goes away.

## Concerns

1. **Witness length for interior parts.** The buffer wraps the whole scene's silhouette. A part at the centre of a complex scene has a witness reaching all the way out to the buffer face — many hundreds of pixels. The current 200-pixel cap rejects most. Decision: abandon the cap.

2. **Buffer alignment.** Three options were considered: world-axis-aligned (stays put as camera tumbles), screen-axis-aligned (rotates with camera), or camera-aligned (one face perpendicular to camera forward). Decision: world-axis-aligned. The dim line lives in a stable world plane and the camera just sees it from a new angle each paint.

3. **Which buffer face per part-axis.** A part's x-axis dim could sit on top, bottom, front, or back face of the buffer (the four faces that contain the x-axis). The picking rule is TBD — closest face, least-crowded face, or always-the-same face for consistency are the candidates.

4. **15 pixels outside the silhouette.** Two interpretations were considered: expand each face by a 3D distance chosen each paint so the projected face sits exactly 15 px outside the projected silhouette, OR fix a 3D offset once and live with whatever pixel margin that gives. Decision: per-paint exact 15-px margin. Recomputed every paint.

5. **Rotated parts.** A rotated part has no world-axis-aligned edges, so the buffer-face approach does not apply. Decision: skip rotated parts entirely for now. A separate algorithm for rotated parts is needed and not yet designed.

6. **Foreshortening.** Buffer faces tilted relative to the camera will show their dim lines at an angle. Same problem as today, no worse.

7. **Witness convergence.** Witnesses still extend from the part edge to the buffer face. The per-endpoint convergence check (current rule 11's trapezoid gap) still applies.

8. **Mode interaction.** In x-ray mode, the buffer wraps a different silhouette (visible parts differ). The rule needs to handle both modes consistently.

## Decisions taken

- a. Rotated parts: skip for now.
- b. Buffer is world-axis-aligned; stays put as camera tumbles.
- c. Each buffer face is expanded in world units to project exactly 15 px outside the projected silhouette, recomputed every paint.
- d. The 200-px witness cap is abandoned entirely.

## Phase plan

**Phase 1 — write the new rules into the spec.** Add uniface rules to `dimensionals.md` (or its successor). Mark the rules below as replaced or no-longer-applicable for non-rotated parts.

**Phase 2 — minimal end-to-end code.**
- Detect non-rotated parts.
- Build the buffer (3D bounding box plus per-face per-paint screen-margin expansion).
- For each non-rotated part-axis, pick the first viable buffer face (no smart selection yet).
- Place the dim line on that face, draw witnesses from the part edge to it.
- Remove the witness cap.
- Skip rotated parts (no dims for B in the test scene).

**Phase 3 — refinement.**
- Smarter face-picking: closest, least-crowded, or other rule TBD.
- 1-D conflict resolution per face.
- Tests for the new helpers.

## Rules in the current dimensionals spec that uniface violates or replaces

- **Rule 1 (Four degrees of freedom per label).** Uniface drops "edge" and "direction" as per-label degrees of freedom. The per-axis choice is which of the 4 buffer faces (containing that axis) hosts the dim line. Witness length is determined by the buffer face's distance from the part edge. Slidable position remains the only continuous degree of freedom.
- **Rule 5 (Witness and dimension lines lie in the plane of a face).** Uniface puts the dim line in the plane of a BUFFER face, not a face of the part being measured.
- **Rule 9 (Silhouette = single combined hull of leaf parts).** Replaced. Uniface uses a world-axis-aligned 3D bounding box, with each face expanded to project 15 px outside the projected silhouette.
- **Rule 10 (Pick 4DOF values by best combined clearance).** Replaced. Uniface picks a buffer face for each part-axis, not a 4DOF tuple.
- **Rule 11 (Drop filters imposed on DOF ranges).** The 200-px witness-cap filter is removed entirely. The per-edge silhouette-pushback filter becomes "the witness reaches the chosen buffer face". The camera-axis filter and the witness-convergence filter still apply.
- **Rule 18 (Repeater integration).** Still applies to non-rotated parts. Rotated parts are now skipped entirely until a separate algorithm is added.

## Rules in the current dimensionals spec that uniface does NOT touch

- Rules 2, 3, 4, 6, 7, 8, 12, 13, 14, 15, 16, 17, 19, 20, 21, the renumbered 22/15, 23, 24, 25 still apply as written.
