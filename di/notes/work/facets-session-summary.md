# Facets Session Summary — 2026-03-28

i want to be able to paint each SO a different color. for that, the painter algorithm won't work, it only paints whole faces in order back to front. Two SOs intersect, part of each is in front of the other, last one wins, looks bad.

Facets solve this: each facet is a region that's entirely on one face, entirely visible. You can paint each facet with its SO's color, a 2D mosaic.

## What we did

Built infrastructure to connect crossing segments to the face graph, introduced directed half-edge tracing, fixed false same-SO occlusion of intersection lines, and got 5 facets tracing across multiple faces. Built on the 2026-03-25 session.

## Current state — what's working

- **5 facets trace** on ABFE: j→h→A, B→F→c→i→k, b→e→E. On AEHD: A→h→g. On EFGH: F→G→l→d→c.
- **Edges render correctly** with apply_crossing_splits re-enabled (interpolated screen fix)
- **Intersection lines unbroken** — skip both SOs for intersection occlusion eliminates false oc:ix dead-ends
- **Fi coincidence merge** — two intersections meeting at a shared edge share one endpoint key
- **Directed half-edge tracing** with reverse blocking and duplicate prevention
- Painting limited: only best (most forward-facing) face

## Current state — what's broken

### apply_crossing_splits screen interpolation (just fixed — needs testing)
Split points now interpolate screen position along the edge segment (`s + (e-s)*t`) instead of using registered screen from intersection compute. This was causing edge rendering corruption.

### Missing facets
- **enHEe on EFGH** — fi:EFGH:E'F'G'H':start is a dead-end. The split for the other face's edge (dual-face split) may not be working, OR the fi endpoint sits on an edge that wasn't found by the dual-face edge search.
- **Central polygon on ABFE** — the large region bounded by all three intersection lines. Needs the intersection segments to connect through crossing/oc endpoints. Currently duds because intersection fi endpoints are dead-ends on some faces.

### Painting only best face
Back faces' facets overlap front faces on screen. Painting all faces looks wrong without per-facet occlusion culling. Currently limited to best face only — other faces' facets trace but don't paint.

### Same-SO crossings reverted
The same-SO crossing logic in compute_occluding_edge_segments (testing edges against faces of the same SO they don't belong to) created false crossings due to the depth test. Reverted to cross-SO only. Same-SO face boundaries on the graph remain unconnected.

### `ex:` dead-end crossing endpoints
Some crossing segment endpoints still fall back to `ex:` type — no match in the reverse map. These are dead-ends with 1 segment.

## Architecture

### Render.ts compute pipeline (in order)
1. `compute_visible_intersection_segments()` — intersection lines between face pairs, clipped for occlusion (skipping both SOs). Registers fi/oc:ix endpoints. Populates `intersection_edge_splits`, `fi_on_edge`, `oc_at_occluder_edge`.
2. `compute_visible_edge_segments()` — SO edges clipped for occlusion. Tags endpoints as corner/fi/oc. Populates `oc_at_occluder_edge`.
3. `filter_occluded_intersection_endpoints()` — removes phantom fi endpoints on occluded edge portions.
4. `compute_occluding_edge_segments()` — cross-SO edges passing in front of faces. Reuses oc/fi endpoints via reverse map. Falls back to `ex:` endpoints. Populates `crossing_splits`.
5. `apply_crossing_splits()` — splits edge segments at intersection exits and crossing points. Interpolates screen position along edge (not from registered screen).

### Key data structures
- `oc_at_occluder_edge` — reverse map: occluder edge → list of oc/fi endpoints at that edge's crossings
- `fi_on_edge` — fi endpoints by edge for coincidence merging at shared edges
- `intersection_edge_splits` — fi/oc:ix endpoints that need to split face edges (both faces)
- `crossing_splits` — crossing endpoint split points on target face edges

### Facets.ts trace
- Directed half-edges (`seg_id>>ep_key`) in `remaining` set
- Reverse blocking during trace, restored after
- `facet_halves` prevents reverse re-tracing
- Simplified log: `type:label→label`, compact dud reasons

## Key decisions this session

1. **Skip both SOs for intersection occlusion** — intersection lines are on both surfaces of convex solids. No face of either SO can occlude them. Only third-party objects could.
2. **Fi coincidence merge** — two intersections at a shared edge share one endpoint via `fi_on_edge` world-position matching (1e-4 threshold).
3. **Fi disambiguation by distance** — when multiple fi endpoints match the same clip_map key, pick closest by world position.
4. **Dual-face intersection exit splits** — register splits on both faces' edges at intersection exits, not just the face geom.start_edge points to.
5. **Interpolate split screen positions** — use `s + (e-s)*t` along the edge, not registered screen from intersection compute. Prevents rendering artifacts.
6. **Same-SO crossings don't work** — depth test fails for adjacent faces of convex boxes. Reverted.

## Files modified
- `di/src/lib/ts/render/Render.ts` — all compute pipeline changes
- `di/src/lib/ts/render/Facets.ts` — directed half-edge tracing, logging
- `di/notes/work/facets-session-summary.md` — this file
