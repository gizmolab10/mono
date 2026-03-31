# Facets History

Debug sessions, investigations, and fixes. Reference only — not needed for day-to-day work.

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
