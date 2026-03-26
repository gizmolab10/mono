# Facets Session Summary — 2026-03-25

## What we're building

Paint visible faces of the selected SO with a highlight color. Faces of different SOs intersect and occlude each other, so the visible region of a face is a complex shape — a facet. Design doc: `di/notes/work/facets.md`.

## Architecture (implemented)

### Compute pipeline (in Render.ts)

1. **Occlusion data** — `occluding_faces` list with face planes, screen polygons, spatial index. Now includes `face_index`.
2. **`compute_visible_intersection_segments()`** — runs FIRST. Computes all face-pair intersection lines, clips for occlusion via `clip_segment_for_occlusion_rich()`. Registers endpoints per visible clip interval (fi, corner, or oc identity). Populates `intersection_exit_map`. Only processes front-facing faces.
3. **`compute_visible_edge_segments()`** — runs SECOND. Clips each SO edge for occlusion via `clip_segment_for_occlusion_rich()`. Tags endpoints as corner (t≈0/1), face_intersection (via exit_map at start-of-visible boundaries only), or occlusion_clip. Gap merge for micro-gaps between clip intervals. **Visibility gate** filters fake visible intervals (see below).
4. **`filter_occluded_intersection_endpoints()`** — runs after edge segments. Removes intersection endpoints that fall on occluded portions of face edges.
5. **`compute_occluding_edge_segments()`** — detects edges passing in front of other SO's faces.

### Key design decisions

- **`clip_segment_for_occlusion_rich()`** — returns which occluding face caused each clip boundary (`start_cause`, `end_cause`). Backward-compat wrapper `clip_segment_for_occlusion()` strips the cause.
- **`register_endpoint()`** — pure key lookup, NO world-space proximity merge (removed — it caused cross-contamination between different intersections).
- **Intersection segments use per-clip-interval endpoints** — no phantom geometric endpoints. Each visible interval gets its own start/end identity.
- **Corner detection at intersection exits** — `corner_for_geom()` checks if intersection exits at a vertex (CORNER_EDGE_T=0.005).
- **Exit map only at start-of-visible** — edge clips at end-of-visible boundaries skip the exit_map lookup (prevents phantom labels in hidden zones).
- **Mid-interval splits REMOVED** — they were redundant with exit_map and caused phantom labels. The `intersection_splits` map is gone.
- **Visibility gate** — when walking an edge's visible intervals, track which face hid the edge. If the next interval starts with an emergence from the same face, skip it — the edge is still behind that face's plane but outside its polygon. Don't update the tracked face when skipping (prevents chaining). Only real emergences (different face) create endpoints.

### Graph (in Facets.ts)

- **`ingest_precomputed()`** — imports endpoints, edge segments (per face), intersection segments (per face pair, per clip interval), and occluding edge segments from Render's compute phase.
- **`compute_cyclic_ordering()`** — tangent-plane atan2 sorting. No collinear dedup (removed — it collapsed needed connections).
- **`trace_facets()`** — go LEFT first (against face winding), then always RIGHT (idx+1). Determines face winding from the SO's face vertex order. Successfully traces closed polygons.
- **`paint_labels()`** — labels: uppercase for selected SO corners, A' for other SO corners, lowercase a-z then aa-az for non-corner endpoints. Filter: `ep.segments.length < 2` (dead-end filter). Occlusion check disabled (too many false positives).
- **Endpoint.label** — debug prop on Endpoint, assigned during paint_labels.
- **`pretty()`** — resolves obj IDs to SO names in display strings. `id_to_name` map populated during `ingest_precomputed`.
- **`edge_letters()`** — only letterizes vertex indices, not digits in SO id prefix.

### Facet log

Console logs `facets: A→B→C→A` with display labels, updates when path changes. Gated by `Render._last_facet_log` change detection. Fires on first frame via `!Render._facets_logged` check. `_facets_logged` set after the log, not before.

## Current state

### Working

- Compute pipeline produces correct visible edge and intersection segments
- Labels appear at real junction points
- Facet tracing successfully closes polygons on uncut faces
- Go-left-first traces inner facets instead of full face boundary
- No more phantom labels from mid-splits or world-space merge
- **Phantom h/g fixed** — visibility gate eliminates fake visible intervals; intersection endpoint filter catches remaining phantoms
- Canary check in always.md for post-compaction recovery
- Think-mode-default in always.md (rule 20)
- Expectations guide for collaboration

### Active bugs

1. **Facet tracing on cut faces** — the go-left-first algorithm is implemented but not yet tested on faces cut by intersection lines. The uncut face traces correctly. Cut faces need the intersection segments to provide the boundary for inner facets.

### Debug infrastructure in place

- `Render._facets_logged` / `Facets._trace_logged` / `Facets._occlusion_logged` — static flags reset on page load
- Facet path log with display labels (change-detected, fires on first frame)
- `pretty()` on Facets for resolving obj IDs to SO names in display

### Files modified this session

- `di/src/lib/ts/render/Render.ts` — visibility gate in edge clip loop, `filter_occluded_intersection_endpoints()`, removed `debug_label` from clip function, cleaned up diagnostic logs
- `di/src/lib/ts/render/Facets.ts` — `edge_letters()` fix, `id_to_name`/`pretty()`, removed label log
- `di/notes/work/facets-session-summary.md` — updated

### Key lessons from this session

- **Stale logs** cost us hours — static flags preserved first-frame output through code changes
- **World-space merge** in register_endpoint caused cross-contamination — removed
- **Mid-interval splits** were redundant with exit_map — removed
- **Go LEFT first** at trace start, then always RIGHT — the starting direction determines inner vs outer polygon
- **Think mode default** — don't edit code unless user says solve/go/impl/proceed/create/rewrite
- **Be an open book** — show thinking, don't hide it behind action
- **Never guess without labeling it as a guess**
- **Phantom root cause** — when an edge goes behind a face, the face's polygon may not fully cover the behind-portion. The clip function sees a fake "visible" interval where the edge is behind the plane but outside the polygon. The visibility gate fixes this by tracking which face hid the edge and suppressing fake emergences from the same face.
- **Don't chain state through skipped intervals** — updating tracked state from skipped data poisons downstream checks
