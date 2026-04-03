# Facets History

Debug sessions, investigations, and fixes. Reference only — not needed for day-to-day work.

## Identity mixing fix (2026-04-01)

The design spec said Pass 1 should produce geometry with no identity. But the implementation assigned endpoint keys during Pass 1a, 1b, and 1d, creating three disconnected populations that couldn't find each other. This caused zero facets to trace.

### Root cause

Each pass created its own endpoints independently. Pass 1d tried to match its entry/exit points against intersection endpoints using a lookup table keyed by boundary edge. This only worked when both points happened to land on the same edge — a coincidence. When it failed, orphan endpoints appeared everywhere.

### Key findings

- The arrangement (Pass 2) can't replace the face-polygon clipper for occluding segments. Arrangement crossings happen where visible segments cross other visible segments. Occluding segments connect through the invisible face silhouette. 5 arrangement crossings, 5 groups of 1, zero pairs.
- Merging keys must propagate into all segment data structures, not just the endpoint map. Without propagation, dedup against parallel edges fails because the keys are stale.
- Occluding segments that connect the same endpoints as existing segments create parallel edges the tracer bounces between. Must dedup after merge propagation.
- Per-frame state (anonymous crossing data) must be cleared at the start of each compute call, not just initialized once.

### What was built

1. Quad clipper reports vertex hits (adjacent enter/exit edges share a corner)
2. New Pass 3 assigns identity from source tags after all geometry exists
3. Pass 1d stores anonymous crossing data, Pass 3 assigns identity afterward
4. Topological merges: intersection = occlusion (same edge + matching face), intersection at vertex = corner
5. Key propagation from merges into all segments and lookups
6. Dedup: skip occluding segments whose endpoint pair already exists in edge or intersection segments

Result: 3 stable facets (was 0), 36 endpoints (was 57), no proximity thresholds.

### Previous bugs from earlier sessions (also fixed)

- Phantom segments from wrong endpoint matching — replaced 5-pixel screen search with boundary-edge lookup
- Wrong-SO facets — reject traces reaching corners of the other object
- Missing pierce-point labels — topological key matching in Pass 1b reuses intersection keys
- fi at vertex not labeled as corner — quad clipper vertex hit detection (partially addressed)

## Session plan (completed)

- Session 1: Pass 1 (visibility) — edge clipping, fake sliver filter, intersection lines with skip-self
- Session 2: Pass 2 (arrangement) — crossing detection, clip splitting, depth classification, occluding segments
- Session 3: Pass 3 (labeling) + wiring — labeling during Pass 1, wired into Render.ts with flag

## Test suite notes

44 tests in Topology.test.ts across 5 layers:

- Layer 1: Pure 2D geometry (solid)
- Layer 2: Clipping (structural only — doesn't verify geometric correctness)
- Layer 3: Splitting (solid)
- Layer 4: Two-object scenes (structural integrity, not geometric correctness)
- Layer 5: Golden test (reports orphans, doesn't compare against known values)
- Two vertex-hit detection tests added for the quad clipper

## Phantom investigation (2026-03-27, paused)

Phantoms are face_intersection endpoints where face planes mathematically cross within both quads, but the edges at that point don't actually meet in 3D. The intersection is visual only.

Tried: clear-and-rebuild, facets filter, cascading filter, edge_cross endpoint type, edge distance checks. None worked cleanly — the distinction between real and visual-only requires edge-level geometry that isn't available when endpoints are created.

Promising direction (not implemented): check both exit edge vertices against the other quad's plane AND verify the crossing point is within the other face's polygon.

## Problem P — missing pierce points (fixed 2026-03-28)

fi endpoints on edges had only 1 segment (edge) instead of 2 (edge + intersection). The intersection segment's partner occlusion_clip endpoint was wiped by a clear() in the wrong place. Fix: moved clear() to the start of the compute pipeline.

## All faces on + fi priority fix (2026-03-28)

Changed facet painting from best-face-only to all front-facing faces. Fixed floating fi endpoint caused by oc overwriting fi match in the reverse map loop. Fix: prefer face_intersection over other types in matching.

## Pipeline.ts (2026-03-28)

New file: identity-based compute pipeline alongside Render.ts for comparison. Single edge_points registry with clip_identity map for topological matching. Status at end of session: edge clips match (16/16), intersections match (5/5), crossings match (10/10), but endpoints diverge (old=29, new=25).

## Duplicate labels & phantom ex endpoints (fixed 2026-03-29)

Five bugs found and fixed:
1. Duplicate oc/ex endpoints at same point — also check face's edges' oc lists for reverse-direction match.
2. Phantom ex at corners — reuse existing corner endpoint when clip starts inside polygon.
3. Exterior corners on wrong face — added point-in-polygon check before corner synthesis.
4. Phantom crossings where edge_a is invisible — check visibility at both entry and exit positions.
5. Bridge import of corner-to-oc segments — skip edge segments where endpoints are corner+oc from different SOs.


## Facets Session Summary (2026-03-28)

Built crossing segment infrastructure, directed half-edge tracing, fixed false same-SO occlusion of intersection lines. Got 5 facets tracing. Key decisions: skip both SOs for intersection occlusion, fi coincidence merge via world-position matching, interpolate split screen positions along edge.
