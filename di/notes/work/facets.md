# Facets

## Problem

we want to paint the visible faces of the selected SO with a highlight color. sounds simple, but faces of different SOs can intersect and occlude each other, so the visible region of a face is a complex shape -- facet.

## Data

all visible line segments come from `compute_visible_segments()`. only front-facing faces of all SOs are processed.

- **edge segments** — each SO edge, clipped for occlusion (some parts visible, some hidden)
- **intersection lines** — where two SO faces cross in 3D, clipped to both face quads and for occlusion
- **split points** — where intersection lines meet face edges, detected by visibility-aware edge splitting (split face edges only at visible segment boundaries)
- **occluding edges** — edge that doesn't pierce a face, passing completely in front of it. Add it to the segment list so it can form a boundary in the graph. it becomes part of the polygon that is what's visible of the occluded face.

each line segment knows: which SO, which face, edge or intersection, and its two endpoints.

## Implementation plan

each step is independently testable. if a step breaks rendering, revert just that step.

1. **extract edge computation** — pull the clip-for-occlusion loop out of `render_edges` into `compute_visible_segments()`. store results in `segments_by_so`. `render_edges` draws from stored data. verify visually identical.
2. **extract intersection computation** — pull intersection computation out of `render_intersections` / `intersect_face_pair`. store results. `render_intersections` draws from stored data. verify visually identical.
3. **tag endpoints** — add typed endpoint identities during compute — corner, edge clipped, edge intersected. build the endpoints map. new code in `compute_visible_segments()`.
4. **strip facets** — remove the five dead populate functions. feed precomputed segments + endpoints into the graph. verify labels still work.
5. **occluding edges** — detect from precomputed data — visible edge segments that overlap another SO's face polygon + are in front. add to graph.
6. **rich clip data** — extend `clip_segment_for_occlusion` to return which occluding face caused each clip boundary. currently it returns `[Pt, Pt][]` — just coordinates, discarding which face caused each clip. return `{ start, end, start_cause, end_cause }[]` instead. then `compute_visible_edge_segments` gets everything from one call: visible intervals, clip identities, and which faces to connect intersection/occluding segments to. the retroactive split/merge approach failed twice because it tried to reconnect data that was thrown away here. previous approaches (intersection splits, merge_nearby_endpoints) are removed.
7. **trace** — test `trace_facets`. known issues to watch:
    - occluding edge endpoints may need connecting to edge/intersection endpoints
    - cyclic ordering untested with precomputed data
    - starting orientation ("clockwise along the face edge") untested
    - multiple facets per face — a face cut by an intersection line should produce 2+ facets
8. **remaining**
    - **Corner vertex swap** — `t=0` along a projected edge corresponds to vertex `i`, not `Math.min(i,j)`. Using min/max swaps vertex identity when `i > j`, hiding corners.
    - **Non-selected SO corner labels** — some visible corners of the non-selected SO fail the occlusion check or are missing from computed_endpoints because their edges aren't front-facing. Not yet investigated.


it is important what direction you go from the starting point. so. that's at a 90° corner. two segments point outward. their directions are 90° apart. go left or go right? the trace "**E → o → F → G → H → q → r → s → closed back to E**." just plain old went right when it should have gone left

## Per-face filtering

every segment in the graph must know which SO and face it belongs to. tracing works per-face — "choose a face and stay on that face." if a segment has face=-1, the tracer can't use it.

currently missing: occluding edge segments have `face: -1` because `compute_occluding_edge_segments` doesn't know which face index of the occluded SO the occluding_faces entry corresponds to. the occluding_faces list stores plane + polygon + obj_id but not the face index.

fix: when building occluding_faces in the occlusion data phase, also store the face index. then `compute_occluding_edge_segments` can tag each occluding segment with the correct face of the occluded SO. similarly, intersection segments currently have `so: '', face: -1` — the face info is encoded in the endpoint identity (face_intersection IDs contain `obj_id:fi`) but not propagated to the segment itself.

both need fixing before trace_facets can work per-face.

## Separate compute from draw

Only visible segments make facets. We get visible segments from edge, intersection and occlusion. This we will separate out from render code that now comes after facets.

We must do this. Currently facets tries to do it alone, getting different results. This is the root cause of phantom segments, flashing labels, and 0 traced facets. This was difficult code to get right. reinventing it is just as painful, for negligible gain so far. I say chuck the broken stuff. We can keep the parts that are proven useful for facets.

### `compute_visible_segments()`

run in render after occlusion data. It computes and stores all visible segments (edges and intersections). Each segment carries typed endpoints — the compute phase tags each endpoint with its identity (corner, edge clip, face intersection). facets will use it to trivially build the graph.

#### dead

Facets.ts populate functions become dead code and get removed

- `populate_edge_segments`
- `populate_intersection_segments`
- `populate_crossing_segments`
- `split_edges_at_crossings`
- `find_nearby_endpoint`

#### keep

The remaining bones consume precomputed data

- types
- `trace_facets`
- `paint_facets`
- `paint_labels`
- `compute_cyclic_ordering`

### output structure

```
segment: { so, face, type, edge_key?, screen[2], world[2], endpoint_keys[2] }
endpoint: { key, id (typed), screen, world, segment_keys[] }
```

performance using flat array is fine for 2 SOs (~100 segments). grouped maps scale to 10K SOs (~200K segments) without full scans.

grouped by SO and face for O(1) lookup:
```
segments_by_so:   Map<so_id, Segment[]>
segments_by_face: Map<so_id, Map<face_index, Segment[]>>
endpoints:        Map<key, Endpoint>
```

consumers:
- **edge drawing** — `segments_by_so.get(id)` filtered to type='edge'
- **intersection drawing** — `segments_by_so.get(id)` filtered to type='intersection', or a flat list
- **facets per face** — `segments_by_face.get(id).get(face)`

#### how it is consumed

- **Lines --**
    - **Edge drawing** loops over stored edge segments
    - **Intersection line drawing** loops over stored intersection segments
- **Facets --** reads stored segments into its graph (no populate functions)

## Endpoint

an endpoint is where line segments meet.

### type

the line segments that connect there depend on what caused the point --

- **corner** — a mesh vertex. three face edges meet here
- **edge intersected** — where an intersection line hits a face edge. the intersection line and the two split edge segments meet here
- **edge clipped** — where an occluder hides part of an edge. the visible edge segment and the occluder's boundary edge meet here (not a dead end). also applies to intersection lines partially occluded by a third SO — the clip endpoint connects the visible intersection segment to the occluder's boundary
- **edges cross** — two edges from different SOs cross. both edges split, plus intersection lines between their faces

#### edges clipped

An edge can be clipped by another face's visible edge that overlaps it -- sits in front of that face's plane in 3D. Detecting such arrangements is easily performed from data already in `compute_visible_segments()` and the occlusion list — no new computation.

### identity

each endpoint is uniquely identified by the geometric features that create it — no coordinates:

- **corner** — SO id + vertex index
- **edge intersected** — (face A id, face B id, edge being split). two faces produce one intersection line; where it hits an edge is deterministic
- **edge clipped** — (edge id, occluder face id). tagged by `compute_visible_segments()` at creation time — the compute phase knows which occluder it's clipping against
- **edges cross** — (edge A id, edge B id)

#### endpoint identity

Corner endpoints must include the SO id, not just the vertex index. Without it, vertex 2 of SO_A and vertex 2 of SO_B share the same key, and the graph confuses them.

### notes:

- multiple SOs: no special case. each SO pair produces its own events. endpoints just get more segments
- degenerates (intersection through corner, two intersections at same point): just higher-degree vertices

### Cyclic ordering

at each endpoint, visible segments radiate out in the order they appear on the surface — like spokes, always in the same sequence regardless of viewing angle.

at each endpoint, for each outgoing segment, project its direction onto the face's tangent plane. to do this, compute the angle in the tangent plane's local 2D coordinate system (atan2). sort these by angle.

same math as screen-space atan2, but in the face's local space — fixed, view-independent, computed once per face. here, the face normal and one edge direction give both basis vectors and define the plane in which these spokes radiate.

## Building polys

1. choose a face and stay on that face, build a mutable set of that face's segments
2. start at a 90° corner. two segments point outward. one goes left and the other right. turns out the correct answer is -> go left
3. go to the end of the segment and go right (next clockwise in cyclic ordering)
4. repeat until getting home or lost (DUD)

## Filtering polys

not all polys should be painted. for each poly: is it on the selected SO's visible face, or behind another SO? test by un-projecting any vertex of the polygon to the face's world plane via camera ray, then checking depth against occluding faces (other SOs only — self-occlusion can't happen for convex SOs).

## Algorithm

1. **Segments** — read precomputed visible edge and intersection segments from `compute_visible_segments()`. identify occluding edges by filtering for screen overlap + depth.
2. **Topology** — build a graph: each segment knows SO/face/type/endpoints, each endpoint knows its connected segments and their cyclic ordering
3. **Traverse** — follow the cyclic ordering to trace every closed polygon. no screen-space angles, just topology
4. **Filter + paint** — occlusion filter decides which polys to fill. intersection lines and edges draw after fill so they appear on top. coordinates used only here, to draw the fill path. debug labels gated on `k.debug`.

## Lessons Learned (don't repeat)

- **Painter's algorithm** — can't handle differently-colored faces for intersecting geometry.
- **Clip-canvas with plane tests** — "is the occluder in front" tests were all too permissive or too aggressive.
- **Centroid-based occlusion** — `is_point_occluded` uses the face centroid, not the query point. Don't trust it for per-polygon tests.

## Phantom investigation (2026-03-27, paused)

Spent two sessions on phantom endpoints. Identified the root cause but couldn't fix without breaking real endpoints.

### Root cause

Phantoms are `face_intersection` endpoints from `compute_visible_intersection_segments` where face planes mathematically cross within both quads, but the edges at that point don't actually meet in 3D. The intersection is visual only — two edges cross on screen at different depths.

### What we tried

1. **Clear-and-rebuild in edge compute** — `computed_endpoints.clear()` was wiping intersection endpoints, then a lossy save/restore tried to recover them. Changed `register_endpoint` to overwrite instead of skip-if-exists. Removed the save/restore. Didn't fix phantoms.

2. **Facets filter: no intersection segments** — delete non-corner endpoints with no intersection-type segments. Didn't catch phantoms because `compute_visible_intersection_segments` creates intersection segments for visual-only crossings too.

3. **Cascading filter** — delete endpoints whose intersection segments have orphaned other ends. Works mechanically but the classification of real vs phantom was never precise enough.

4. **`edge_cross` endpoint type** — tag visual-only fi endpoints with a new type, delete them in Facets. The exit-edge-crosses-plane check (`d0 * d1 < 0`) correctly identifies some phantoms but: (a) `continue` on a clip interval kills valid endpoints on the other end, and (b) the edge can cross the plane far from where the objects actually overlap.

5. **Edge distance checks** — screen-space and world-space distance between the two edges at the crossing point. Perspective projection makes screen-to-world interpolation imprecise. Thresholds either too tight (kills real) or too loose (misses phantoms).

### Key findings

- The clip_map face-index mismatch (occluder reports face X, intersection registered face Y) was partially fixed with an adjacent-face fallback, but some misses remain on edges with no intersection line.
- `compute_occluding_edge_segments` creates crossing segments at visual crossings. Adding `Math.abs(dist) > coplanar_epsilon` removes these, but the fi endpoints survive via intersection segments from the separate intersection compute.
- The distinction between face piercing (real) and edge crossing (can be visual) maps to `start_edge.face === end_edge.face` (same quad = piercing) vs `!==` (different quads = could be either). But real piercings also exit through different quads, so this test is insufficient.
- The edge-crosses-plane test is necessary but not sufficient — need to also verify the crossing happens within the other face's polygon, not just on the infinite plane.

### Why it's hard

The phantom fix and real endpoint preservation fight each other. Every filter that removes phantoms also removes some real endpoints, because the data structures don't distinguish visual-only intersection lines from real ones at the point where endpoints are created. The intersection compute works with face planes (mathematical), while the visual/real distinction requires edge-level geometry (physical).

### Pick up here (phantoms)

The promising direction: check `d0 * d1 < 0` on the exit edge vertices against the other quad's plane, AND verify the crossing point is within the other face's polygon. This would correctly classify all cases but wasn't implemented.

Both phantoms and missing endpoints share the same root cause: the polygon seam gap at face boundaries. The clipper misses occlusion at the seam between two adjacent faces' screen polygons. The behind range and polygon coverage don't overlap — each face's plane is crossed at a screen location where that face's polygon doesn't reach.

## Problem P — missing pierce points (fixed 2026-03-28)

fi endpoints on edges existed but only had 1 segment (edge) instead of 2 (edge + intersection). The intersection segment was missing because its partner `occlusion_clip` endpoint on the intersection line was wiped by `computed_endpoints.clear()` in `compute_visible_edge_segments`. The save/restore only recovered `face_intersection` and `corner` types, not `occlusion_clip`.

**Fix:** moved `computed_endpoints.clear()` from inside `compute_visible_edge_segments` to the start of the compute pipeline (before `compute_visible_intersection_segments`). Removed the save/restore entirely. Now all endpoint types from intersection compute survive through edge compute.
