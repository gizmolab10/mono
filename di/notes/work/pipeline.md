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