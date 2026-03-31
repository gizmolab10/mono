# Render Pipeline

pac start over with a fresh perspective

# Start over with a fresh rendering architecture?

**Pros:**

- Clean separation of data and drawing
- Adding features means adding to a phase, not finding a slot
- The visibility computation (the hard part) is already solid — it survives a rewrite
- The current code is small enough to rewrite without losing months

**Cons:**

- Everything works right now — faces fill, edges draw, facets trace
- A rewrite risks re-introducing bugs we already fixed
- The layering order (what draws on top of what) IS the architecture for a 2D canvas — the rendering order is inherently the output order
- Time cost for something that isn't broken from the user's perspective

**The honest truth:** the rendering order IS driven by what paints over what. On a 2D canvas without a z-buffer, the order of draw calls IS the architecture. A "cleaner" separation might just move the same ordering decisions to a different place. The ad-hoc feel comes from the medium, not just the code.

## standard practice?

For a 2D canvas without a z-buffer, yes. Painter's algorithm — draw back to front, let later draws cover earlier ones. The order of draw calls IS the depth sorting. Every 2D canvas renderer works this way.

The compute-then-draw split you already have is actually cleaner than most. The ad-hoc feel is just how canvas rendering looks — the layering logic is explicit instead of handled by hardware.

## redundancy

- **face_winding** called on the same faces multiple times: face fill (205), debug fills (225, 229), occluding faces build (247), selection dot occlusion (322), facet winding (400, 405, 415), intersection computation (now uses occluding_faces, but still)
- **get_world_matrix** called repeatedly for the same object: projection (186), occluding faces (242), selection dots (319), edge drawing (445, 515), edge computation (757), intersection computation (947), facet labels (459)
- **front_face_edges** called at least twice for the same object: edge computation (758), facet labels (458)
- **project_vertex** used in intersection computation (1005) to re-project points that could be derived from existing projected data

The main projection pass (line 187) projects every vertex and caches it. But `get_world_matrix` isn't cached per frame — it recomputes the matrix chain each time. And face winding is recomputed every time someone asks "is this face front-facing?"

The fix: compute front-facing sets and world matrices once at the start of the frame, store them, use them everywhere. The occluding faces build already does this partially — but other code paths redo the same work.

## Unified Topology Pipeline (proposed 2026-03-28)

### Current pipeline (bug-prone)

```
1. Project vertices
2. Fill faces (painter's algorithm)
3. Build occluding face list
4. Compute visible intersection segments → register fi endpoints
5. Compute visible edge segments → register oc endpoints, reuse fi by proximity
6. Compute occluding edge segments → register ex endpoints, reuse fi/oc by proximity
7. Apply crossing splits → split edges at fi/ex points by proximity
8. Facets ingests all of the above → trace
```

Every arrow between phases is a proximity match that can fail.

### Proposed pipeline

```
Phase 1 — Geometry (view-independent, world space)
  For every front-facing face pair across SOs:
    • face-face intersection line, clipped to both quads
    • endpoints land on specific edges → register once, by identity

  For every edge vs every other-SO face:
    • edge pierces face? → pierce point registered by identity (edge + face)
    • same math as intersection clip, same registry

  Output: a single Map<identity, Point> — no duplicates, no proximity

Phase 2 — Visibility (view-dependent, screen space)
  For each edge segment:
    • clip against occluding faces → oc endpoints registered by identity
      (edge + occluder face + enter/exit)
    • split at Phase 1 points that sit on this edge (known by identity, not proximity)

  For each intersection segment:
    • clip against occluding faces → same oc identity scheme

  Output: visible segments with endpoint keys into the shared registry

Phase 3 — Graph (topology only)
  • Facets reads segments + endpoints from shared registry
  • No matching, no merging — keys are authoritative
  • Trace, paint
```

### What changes

| Now | Proposed |
|-----|----------|
| 3 separate compute functions, each with its own endpoint creation | 1 geometry pass, 1 visibility pass |
| Proximity matching (screen_t, distance) to link phases | Identity lookup (deterministic keys) |
| oc_at_occluder_edge reverse map | Not needed — pierce points known from Phase 1 |
| intersection_edge_splits, crossing_splits | Not needed — splits known from Phase 1 |
| fi priority hacks, t-range tightening | Not needed — no overwrite possible |

### What stays

- `trace_facets`, `paint_facets`, `compute_cyclic_ordering` — graph consumers, not data producers
- `clip_segment_for_occlusion`, `clip_segment_to_polygon_2d` — clipping math is correct, only endpoint tagging changes
- Face winding, Flatbush spatial index, painter's fill — unrelated to the plumbing

### Risk

The current code works for the common cases. A rewrite touches every data path. The safe approach: build Phase 1 alongside the existing pipeline, verify its output matches, then swap consumers one at a time.

### Effort

Phase 1 reuses `intersect_face_pair` math. Phase 2 reuses `clip_segment_for_occlusion`. The new work is the unified registry and identity-based splits — roughly the same LOC as the current matching/merging code it replaces, but deterministic instead of heuristic.