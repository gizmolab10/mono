# Intersection Lines

Where two SOs' faces cross each other, we draw dihedral intersection lines. Lives in `Render.ts`, phase 2c of the render pipeline.

## Pipeline

1. **Filter** — `shares_all_axes` skips parent-child pairs where the child has identity orientation (no independent rotation = no crossing)
2. **World-space faces** — transform each face's corners through `get_world_matrix`, derive normal from world-space geometry via `cross(e1, e2)`
3. **Plane-plane intersection** — direction = `cross(nA, nB)`, point on line via 2×2 system solve (set the coordinate along dir's largest component to 0)
4. **Cyrus-Beck clip** — clip the infinite line to both face quads. Inward edge normal = `cross(face_normal, edge_vector)`
5. **Project + draw** — surviving segments get projected through camera and stroked

## Cyrus-Beck Convention

The entering/leaving classification:
- `alignment = dot(inward_normal, line_direction)`
- `alignment > 0` → **entering** (line moving into inside half-plane) → raise t_min
- `alignment < 0` → **leaving** (line moving out of inside half-plane) → lower t_max
- Getting this backwards clips everything (t_min > t_max always)

## Test Scenario

From reset: add child, stretch it longer than parent, rotate it. The rotated child's faces cross the parent's faces, producing visible segments. A default child (identity orientation, contained inside parent) won't produce any — `shares_all_axes` skips it, and even without the filter, no faces geometrically cross.

## Key Methods

| Method | Line | Purpose |
|--------|------|---------|
| `render_intersections` | 210 | builds world-space face data, iterates pairs |
| `intersect_face_pair` | 266 | plane-plane math + double clip |
| `clip_to_quad` | 338 | Cyrus-Beck against convex quad edges |
| `shares_all_axes` | 363 | parent-child + identity quaternion check |
| `draw_seg_world` | 371 | project world points, stroke segment |
