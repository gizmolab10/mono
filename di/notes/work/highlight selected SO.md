# Highlight Selected SO

## Proposed Implementation Plan

1. Define data structures: `Segment` (SO, face, type, two endpoint IDs), `Endpoint` (cause, list of connected segment IDs, cyclic ordering). **Effort:** low. **Risk:** low — straightforward types.
2. Populate segments from existing Phase 1 code — `clip_segment_for_occlusion` results become edge segments, `intersect_face_pair` results become intersection segments. Each gets a stable identity based on its geometric origin, not screen coordinates. **Effort:** medium — adapting existing code to produce new data structures. **Risk:** low — the geometry code already works.
3. Populate endpoints — for each segment endpoint, determine its cause (corner, face intersection, occlusion clip, edge crossing). Register which segments connect there. **Effort:** medium — matching endpoints from different computation paths to the same identity. **Risk:** medium — this is where the old MATCH_DIST problems lived. Must get identity right.
4. Compute cyclic ordering at each endpoint from 3D surface topology. Store it. **Effort:** high — the ordering logic per endpoint type hasn't been implemented before. **Risk:** high — getting the ordering wrong produces wrong polygons. Hard to debug.
5. Traverse — follow the cyclic ordering to trace every closed polygon. Pure topology, no atan2. **Effort:** low — simple loop once the ordering is correct. **Risk:** low — depends entirely on step 4 being right.
6. Filter — for each polygon, test one vertex for occlusion (ray unproject + depth check against other SOs). Paint or skip. **Effort:** low — reuse existing ray unproject code. **Risk:** low — already proven to work.
7. Test with the two-SO case first, then the many-SO case. **Effort:** low. **Risk:** the many-SO case may surface endpoint types we haven't handled (see Endpoints section).

## Problem

we want to paint the visible faces of the selected SO with a highlight color. sounds simple, but faces of different SOs can intersect and occlude each other, so the visible region of a face is a complex shape.

## Data

we already compute and draw all the line segments we need. only front-facing faces of all SOs are processed.

- **edge segments** — each SO edge, clipped for occlusion via `clip_segment_for_occlusion` (some parts visible, some hidden)
- **intersection lines** — where two SO faces cross in 3D, computed by `intersect_face_pair`
- **split points** — where intersection lines meet face edges, detected by visibility-aware edge splitting (split face edges only at visible segment boundaries)
- **crossing edges** — edges of other SOs that pass in front without creating an intersection. may not be needed if intersection lines and own edges are sufficient — TBD
- we need geometry to determine when one edge exactly intersects another

each line segment knows: which SO, which face, edge or intersection, and its two endpoints.

## Endpoints

an endpoint is where line segments meet. what connects there depends on what caused it:

- **corner** — a mesh vertex. three face edges meet here
- **face intersection** — where an intersection line hits a face edge. the intersection line and the two split edge segments meet here
- **occlusion clip** — where an occluder hides part of an edge. the visible edge segment and the occluder's boundary edge meet here (not a dead end). also applies to intersection lines partially occluded by a third SO — the clip endpoint connects the visible intersection segment to the occluder's boundary
- **edge crossing** — two edges from different SOs cross. both edges split, plus intersection lines between their faces

notes:
- multiple SOs: no special case. each SO pair produces its own events. endpoints just get more segments
- degenerates (intersection through corner, two intersections at same point): just higher-degree vertices

at each endpoint, the segments radiate out in the order they appear on the surface — like spokes, always in the same sequence regardless of viewing angle.

## Building polys

pick a segment. follow the cyclic ordering at each endpoint to the next segment. keep going until you return to the start (a poly) or get stuck (a dud). the segments you didn't pick make other polys. trace them all.

## Filtering polys

not all polys should be painted. for each poly: is it on the selected SO's visible face, or behind another SO? test by unprojecting any vertex of the polygon to the face's world plane via camera ray, then checking depth against occluding faces (other SOs only — self-occlusion can't happen for convex SOs).

## Algorithm

1. **Geometry** — use coordinates to compute edge segments, intersection lines, and split points. `intersect_face_pair` called with `null` ctx to suppress drawing side effect.
2. **Topology** — build a graph: each segment knows SO/face/type/endpoints, each endpoint knows its connected segments and their cyclic ordering
3. **Traverse** — follow the cyclic ordering to trace every closed polygon. no screen-space angles, just topology
4. **Filter + paint** — occlusion filter decides which polys to fill. `render_intersections` runs after fill so intersection lines draw on top. coordinates used only here, to draw the fill path. debug visualizations (polygon labels, graph edges) gated on `k.debug`.

# Lessons Learned (don't repeat)

- **Painter's algorithm** — can't handle differently-colored faces for intersecting geometry.
- **Clip-canvas with plane tests** — "is the occluder in front" tests were all too permissive or too aggressive.
- **Centroid-based occlusion** — `is_point_occluded` uses the face centroid, not the query point. Don't trust it for per-polygon tests.
