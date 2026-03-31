# Topology Pipeline

Topology takes projected 3D geometry and computes what's visible on screen. Five phases, run once per frame.

```
Phase 1: compute_intersections
    │
    ▼
Phase 2: compute_edges
    │
    ▼
Phase 3: filter_occluded_endpoints
    │
    ▼
Phase 4: compute_crossings (hybrid)
    │
    ▼
Phase 5: apply_splits
```

## Output

- `endpoints` — identity-keyed map of all geometric events (corners, intersections, occlusion boundaries, crossings)
- `edge_segments` — per SO, each edge's visible clips with endpoint keys
- `intersection_segments` — visible portions of face-face intersection lines
- `occluding_segments` — segments where one edge passes in front of another SO's face

## Phases

### Phase 1: compute_intersections

For each pair of front-facing faces from different SOs:

1. Intersect face planes in 3D, clip line to both quads → world-space segment
2. Project to screen, clip for occlusion (skip both SOs as occluders)
3. Tag endpoints:
   - Unoccluded end → `fi` (face intersection), keyed by both face IDs + start/end
   - Occluded end → `oc` (occlusion clip), keyed by intersection edge + occluder face
   - Near a vertex → `corner`, keyed by SO + vertex index
4. Register fi/corner endpoints in `clip_identity` and `edge_points` so phase 2 can find them later
5. Record intersection edge splits for phase 5
6. Cross-register: the other SO's edge clipper needs to find this fi, so register under both face-pair orderings

### Phase 2: compute_edges

For each front-facing edge of each SO (ALPHA edges first, then BETA):

1. Clip edge against all occluding faces → visible intervals
2. Merge nearly-touching intervals (gap < 0.02 in screen t)
3. Tag each interval's endpoints:
   - Near vertex (t < 0.01 or t > 0.99) → `corner`
   - Occlusion cause present → search for a known fi from phase 1:
     - Topological lookup first: find fi registered for this (clipped edge, occluder face) pair
     - World-proximity fallback on occluder's edges — only accepts fi endpoints (oc endpoints from other edges are different events and must not be reused)
     - Duplicate prevention: each fi can only be used once per edge, except when consecutive clips share a zero-length gap boundary (cleared when gap > 0.02)
     - Fall back → `oc` (occlusion clip), keyed by edge + occluder face + enter/exit
   - No cause → `oc` with empty occluder
4. Register oc endpoints on the occluder's polygon edge for phase 4 matching

### Phase 3: filter_occluded_endpoints

Remove phantom fi endpoints on occluded edge portions. For each fi endpoint, check if it sits on a visible portion of the face edge it claims to be on. If not, delete it.

### Phase 4: compute_crossings (hybrid)

Two-part approach: edge-edge intersections find crossing points, face-polygon clipping builds occluding segments.

**Part 1 — Edge-edge crossings (split points):**

1. Collect all visible clips across all SOs
2. For each cross-SO pair, compute 2D line intersection
3. Threshold: -0.01 to 1.01 (slightly outside clip range to catch boundary crossings)
4. Reuse existing endpoint if one sits at the crossing point — prefer fi, then oc, then create new ex
5. Register the crossing point on both edges and record splits for phase 5

**Part 2 — Face-polygon clipping (occluding segments):**

1. For each visible edge, clip against each behind-face polygon on screen → enter/exit t values
2. Depth check: edge must be in front of face plane
3. Visibility check at entry and exit positions
4. Match enter/exit endpoints to existing oc/fi endpoints already registered on the occluder's edge
5. Fall back: create new ex (edge crossing) endpoints
6. Create occluding segments connecting each enter/exit pair
7. Record face-boundary splits for phase 5

**What crossings represent:** a crossing is where a visible edge passes IN FRONT of another SO's face. The occluding segment marks the portion of the face boundary that's hidden behind this edge. This is NOT the same as an edge going behind a face (that's phase 2's occlusion clipping).

### Phase 5: apply_splits

Split edge segments at crossing and intersection exit points. For each split point registered during phases 1 and 4, find the edge segment that contains it and break it into two segments at that point.

## Reference

### Endpoint types

| Type     | Key format                          | Created by | Meaning                                                        |
| -------- | ----------------------------------- | ---------- | -------------------------------------------------------------- |
| `fi`     | `fi:faceA:faceB:start\|end`         | Phase 1    | Where two faces' intersection line exits a face boundary       |
| `oc`     | `oc:edge:occluder_face:enter\|exit` | Phase 1, 2 | Where a segment becomes hidden/visible at an occluder boundary |
| `corner` | `c:so:vertex`                       | Phase 1, 2 | Mesh vertex                                                    |
| `ex`     | `ex:edgeA:edgeB`                    | Phase 4    | Where a visible edge crosses another edge from a different SO  |

### Identity registries

- `edge_points` — all known endpoints on each edge, keyed by SO + edge. Used for world-proximity matching across phases.
- `clip_identity` — fi endpoints indexed by (clipped edge, occluder face). Used by phase 2 to find intersection points that phase 1 already computed.
- `oc_at_occluder_edge` — oc/fi endpoints that landed on an occluder's edge during phase 2 clipping. Used by phase 4 part 2 to match crossing boundaries at face polygon enter/exit points.

### Edge output

Each edge segment carries: edge key (vertex pair), SO id, array of visible screen-space clip intervals, and parallel array of endpoint key pairs (one start/end pair per clip).

### Key invariants

- **Fi identity wins at shared points.** When two consecutive clips share a zero-length gap, the boundary is one geometric point with two identities (fi and oc). The oc endpoint should reuse the fi key, not create a duplicate.
- **Fi-only fallback.** When searching the occluder's edges for a known endpoint, only fi endpoints qualify. Reusing another edge's oc would steal its identity.
- **Gap clearing.** The zero-length gap exception only applies to truly adjacent clips. When the gap between clips exceeds 0.02, the previous clip's end key is forgotten so it can't be wrongly reused.

## Solved bugs (2026-03-30)

- Zero-length gap created duplicate oc endpoints — fixed by allowing fi reuse when previous clip's end key matches
- Phase 4 face-polygon clipping missed actual edge-edge crossing points — fixed by adding edge-edge intersection detection (Part 1) alongside face clipping (Part 2)
- Occluding segments had wrong SO and face=-1 — fixed by determining front/behind via depth check and grouping by (front edge, behind face)
- Phase 2 fallback matched oc endpoints from other edges, consuming fi identities — fixed by filtering fallback to fi-only
- Zero-length gap exception applied across real gaps (t=0.16→0.43) — fixed by clearing when gap > 0.02
- Ex endpoint keys used wrong face index format — fixed to use the occluding faces array index
- Facets couldn't assign face for occluding segments with face=-1 — fixed to search for a face whose existing segments already contain both endpoints

## Open issues

### Missing endpoints (2026-03-30)

Still has missing endpoints. The hybrid phase 4 approach produces correct crossing detection and splits, but some endpoints aren't appearing in the output. Targeted debug logging is in place across phases 2, 3, and 4 for the CG/F'G' crossing (edges CG and FG), showing endpoint keys, matching path taken, and readable SO names.
