# Handoff

**Date:** 2026-06-24
**Work stream:** the recent finished work (controls, max zoom in, wireframe, CLAUDE) is recorded in [work journal](di/notes/work/now/work%20journal.md). Open and paused are here, below.

## wrong-side scoring bug

Several scoring rules have piled up, but the latest picture still puts the line on the far side of the drawing from the wall it measures, instead of right along it. Jonathan wants one more rule: reward a placement where the whole dimension lies flat against the front face of the part being measured.

The app cannot tell that yet. The outline it compares against wraps the whole scene, not the single part, so that outline's near face floats in front of the wall by the depth of everything behind it — never on the wall itself. Two ways forward:

- ONE — reward by how close the dimension line is to the part's front face: closer earns more (a sliding scale).
- TWO — build the comparison outline around the ONE part being measured, not the whole scene. Then its face is the part's face, so "lies on the face" is a clean yes or no.

Next time: pick one, build it, look at the result, then keep tuning.

## 001 dim is inside silho bug

We are tuning dimension placement, using our new bugs assemblage. this is the first one. The assemblage — one numbered folder per bug under `work/now/bugs`, no tracker — is described in [our process](our%20process.md) (the "bugs" section).

Folder: `notes/work/now/bugs/001 dim is inside silho/` — holds the screenshot, the render log, and `data.json` (the part, the view, what is wrong, what was expected).

The bug: at the captured view (part front.moose.kitchen wall, orientation and zoom in `data.json`), the 10' 4 1/4" label sits well inside the silhouette box. Expected: it should pass the first filter (dimensions.latest.spec, line 160).

Synopsis of work so far:

- The guard that decides "inside or outside the silhouette" tests the label against the outline built from the parts' box corners after projection. Under perspective that outline does NOT match the silhouette the eye sees, so a label can read as inside the visible silhouette while the guard calls it outside.
- Every diagnosis tried so far has been wrong against the visual. Standing rule: trust the eye over the log and the guard.
- Captured, not yet diagnosed; no code changed. Paused as part of the "simplify and perfect the flag-off case" arc (code-debt item 1) — nothing to revert.
- Older notes on the same symptom: open items 1.4 (2026-05-19 — floaters fixed; two drawer orientations never re-measured; remaining causes were repulsion shoving labels across the outline, or the push cap leaving them partly inside).

## Open notes

- The lies-flat term scales by `max(0, −n_camera · n_front)`. When the front-most face points sideways, the term collapses to zero — that is intentional, but worth eyeballing across scenes.
- The on-plane reward (next session's task) probably requires deciding between graded distance and per-part silhouette boxes. The per-part choice is the bigger structural change.
- The "label inside part box" reject in the last-resort step assumes one part box per dim. Multi-part dims would need a different check.

## Reference material

- [[open items]]
- [[di/notes/work/now/code.debt]]
- [[di/notes/work/now/work journal]]
- [[dimensions.latest.spec]]
- [[lexicon]]

## Proposal — zoom cluster (dolly, flat/dolly toggle, near-occluder peel)

Three connected proposals about zoom. All still design — no code yet. Today zoom scales the model around the origin (a scale matrix on the root); the camera eye is fixed at 2750 mm.
Evidence: root scale matrix, Drag.ts 747–750; camera eye, Camera.ts line 8.

A. Dolly zoom — move the camera in and out instead of scaling the model.

- The model keeps true world size; the eye moves along its line of sight toward the center.
- Must clamp the near plane (10 mm) or near parts clip away. Evidence: Camera.ts near = 10.
- Migration: retire the stored scale amount; re-derive the default, the status read-out, saved views, and the dimensions slider's frustum basis from eye distance.

B. Flat-or-dolly toggle — a persisted flag plus a control that switches between today's flat scale and the dolly.

- Default flat; dolly behind the flag. Define a flat-amount to eye-distance mapping so switching mid-scene does not jump the view.
- Cost: two zoom paths to keep and test, and one more control.

C. Near-occluder peel — as you zoom in, HIDE parts closer to the camera than a zoom-driven depth, so front layers peel away and inner parts show.

- Chosen flavor: blanket near-plane peel. Hide outright (not fade). Never peel the selected or hovered part.
- Depth = distance from the eye along the view axis to a part's nearest box corner; the peel depth ramps with zoom, tuned by a curve.
- Focus-targeted peel (hide only the true occluders of a focus part) is the fallback if the blanket peels the wrong things; the renderer already tracks occluding faces. Evidence: Render.ts line 27.

Order to build: A (dolly) first, then C (peel) which leans on the dolly's depth, then B (toggle) if both are wanted. Each needs tests and a log line of what it culled or moved.
