# Simpler Topology — Design Spec

Rewrite of Topology.ts as Topology_Simple.ts. Same public interface, completely different internals. Three passes instead of five interleaved phases.

## Public interface (unchanged)

Input: list of objects with projected vertices, occluding faces, and helper functions (projection, winding, front-face detection).

Output: endpoints, edge segments, intersection segments, occluding segments. Same types as current code.

## Pass 1: Visibility

Compute what's visible. No labeling, no identity matching.

### 1a: Intersection lines

For each pair of front-facing faces from different objects:
- Intersect face planes in 3D, clip to both quads → world-space segment
- Project to screen
- Clip against all occluding faces, skipping the two objects that own the intersecting faces (skip-self rule)
- Output: visible clips tagged with source (which two faces, which edge each endpoint sits on, world coordinates)

### 1b: Edge visibility

For each front-facing edge of each object:
- Clip against all occluding faces → visible intervals
- Merge nearly-touching intervals (gap < 0.02 in screen t)
- Filter fake slivers: if both boundaries of a visible interval come from adjacent non-silhouette faces of the same object, discard it
- Output: visible clips tagged with source (which object, which edge, world coordinates of both ends)

### 1c: Collect

Gather all visible clips into a flat list. Each clip is:
- Two screen-space endpoints
- Two world-space endpoints
- Source tag: { type: 'edge' | 'intersection', so, edge_key, face_pair, on_edge_info }

No endpoint identity assigned yet. Just geometry and provenance.

## Pass 2: Arrangement

Find all crossings and split everything.

### 2a: Find crossings

For each pair of visible clips from different objects:
- Skip if bounding boxes don't overlap (Flatbush spatial index)
- Compute 2D line intersection
- If crossing point falls within both clips (t in -0.01 to 1.01): record it

Each crossing records:
- Screen position
- World position (interpolated from both clips)
- References to both clips and the t value on each

### 2b: Split

For each clip that has crossing points:
- Sort crossing points by t along the clip
- Split the clip into sub-segments at each crossing point
- Each sub-segment inherits the parent clip's source tag

After splitting, no two clips cross in their interiors. The result is a planar graph.

### 2c: Depth classification (for occluding segments)

For each crossing, determine which clip is in front (closer to camera) at the crossing point using world-space depth. Record front/behind relationship.

For each front clip that passes over a behind clip's face:
- Find the entry and exit points (consecutive crossings on the same front-clip + behind-face pair)
- Create an occluding segment connecting entry to exit

## Pass 3: Label

Assign endpoint identities based on source tags and position.

### Corner detection

If a clip endpoint is near a mesh vertex (within 1% of edge length in world space):
- Label as corner: keyed by object + vertex index

### Intersection point detection

If the source tag is an intersection line and the endpoint is unoccluded:
- Label as face intersection (fi): keyed by both face IDs + start/end

### Occlusion boundary detection

If a clip endpoint was created by the visibility clipper (not a corner, not an intersection):
- Label as occlusion clip (oc): keyed by edge + occluder face + enter/exit
- Determine the occluder's polygon edge from the clip data

### Crossing detection

If a clip endpoint was created by Pass 2 splitting:
- Label as edge crossing (ex): keyed by both edge IDs (canonical order)

### Shared identity rule

When two endpoints from different clips land at the same screen position (within tolerance):
- They should share the same key
- Priority: corner > fi > oc > ex
- This replaces the current code's three registries and all the matching logic

### Build output

- Register all labeled endpoints in the endpoint map
- Build edge segments from the split edge clips
- Build intersection segments from the split intersection clips
- Occluding segments already built in 2c

## What disappears

- `edge_points` registry — replaced by position-based matching in Pass 3
- `clip_identity` registry — not needed; fi endpoints are identified by source tag, not by who needs to find them later
- `oc_at_occluder_edge` registry — not needed; crossing endpoints are identified by the arrangement, not by pre-registration
- `used_fi_keys` / `prev_clip_end_key` tracking — not needed; identities assigned after all geometry is done, so no risk of double-use
- Phase 3 phantom filtering — not needed; endpoints aren't created until Pass 3, and only for clips that survived visibility

## Key invariants to preserve

1. **Skip-self for intersection lines.** Intersection lines between faces A and B must not be clipped by A or B's own faces.
2. **Fake sliver filtering.** When an edge is hidden behind two adjacent non-silhouette faces of the same object, the seam must not produce a phantom visible interval.
3. **Merge micro-gaps.** Visible intervals separated by less than 0.02 in screen t are artifacts and should be merged.
4. **Depth check for crossings.** Only create occluding segments when the crossing edge is in front of the face, not behind it.

## Geometry functions to reuse

These are pure math with no identity logic. Copy them directly:

- `intersect_face_pair` — finds where two face planes meet, clips to both quads
- `clip_segment_for_occlusion_rich` — clips a segment against all occluding faces, returns intervals with cause info
- `clip_segment_to_polygon_2d` — Cyrus-Beck clip to convex polygon
- `clip_to_quad_with_edges` — clip parametric line to convex quad in 3D
- `intersect_2d` — 2D line-line intersection
- `screen_t` — parametric t along a screen segment

## Testing

The existing test suite (42 tests) runs against the public interface. Switch the import from Topology to Topology_Simple and all tests should pass:

- Layer 1: pure geometry (unaffected)
- Layer 2: clipping, fake slivers, skip-self (validates Pass 1)
- Layer 3: splitting (validates Pass 2)
- Layer 4: edge piercing, crossings, structural integrity (validates full pipeline)
- Layer 5: golden test (validates overall consistency)

## Build order

1. Stub class with empty `compute()` returning empty output
2. Implement Pass 1a (intersection lines) — test: Layer 2 overlap tests pass
3. Implement Pass 1b (edge visibility) — test: Layer 2 single-object and clipping tests pass
4. Implement Pass 2 (arrangement) — test: Layer 3 and Layer 4 piercing tests pass
5. Implement Pass 3 (labeling) — test: Layer 4 structural tests pass, Layer 5 golden test passes
6. Wire into Render.ts behind a flag — compare output with old Topology side by side
