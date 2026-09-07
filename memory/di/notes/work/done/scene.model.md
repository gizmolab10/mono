# Scene Model

di's scene model is custom — not a standard mesh/transform graph. Here's what makes it distinct.

## Bound-centric geometry

Objects are 6 named bounds (x_min, x_max, y_min, y_max, z_min, z_max), not vertex lists or triangle meshes. Vertices are *derived* from bounds. The shape is its constraints, not its geometry.

## Attributes with formulas

Each bound is an `Attribute` that can hold a formula string (e.g. `"parent_id.x_min"`). The compiler/evaluator resolves these, creating live relationships between objects. Objects don't just *have* positions — they *compute* them from each other.

## External topology

Edges and faces live on `O_Scene`, not on the object. The SO queries its scene for `edges[i]` and `faces[i]`. This separates topology from geometry — the same SO can participate in different topological configurations.

## Drag edits bounds, not vertices

Edge drags move one bound, corner drags move two. The drag system reasons about *which bound a vertex touches on which axis*, then clamps to prevent inversions. Standard libraries move control points or apply affine matrices — this is fundamentally different.

## Fixed vs. variable orientation

The `fixed` flag controls whether quaternion rotation is preserved during propagation or recomputed from bounds. A CAD-specific concern no general library handles.

## Summary

A standard library models shapes as geometry you transform. This model treats shapes as *constraints you solve*.

---

# gl-matrix Migration Notes

gl-matrix is already a dependency — used heavily in render/, Camera, Hits_3D, Drag, Orientation, Smart_Object (`quat`, `vec3`, `mat4`, `vec4`).

But Coordinates.ts and Angle.ts don't use it at all. They define parallel `Point3` / `Point` classes that duplicate what gl-matrix provides for vec3/vec2.

## What gl-matrix already covers

| Coordinates.ts | gl-matrix equivalent |
|---|---|
| `Point3.dot()` | `vec3.dot()` |
| `Point3.cross()` | `vec3.cross()` |
| `Point3.normalized` | `vec3.normalize()` |
| `Point3.magnitude` | `vec3.length()` |
| `Point3.offset_by()` | `vec3.add()` |
| `Point3.multiplied_equally_by()` | `vec3.scale()` |
| `Point3.divided_equally_by()` | `vec3.scale(out, v, 1/d)` |
| `Point3.negated` | `vec3.negate()` |

| Angle.ts | gl-matrix equivalent |
|---|---|
| Quaternion rotation | Already using `quat` elsewhere |
| Degree↔radian | `glMatrix.toRadian()` |

## What gl-matrix does NOT cover

These are domain-specific and would stay:

- **Point (2D)**: DOM/SVG coordinate math — `rotate_by`, `isContainedBy_path`, `origin_inWindowCoordinates_for`, `quadrant_ofPoint`, `orientation_ofVector`. These are UI concerns, not linear algebra.
- **Size / Size3**: Semantic width/height/depth wrappers — `proportion`, `best_ratio_to`, `insetEquallyBy`. Named accessors for readability.
- **Rect / Block**: Bounding box logic — `contains`, `intersects`, `clippedTo`, `corners_forAngle`, DOM rect conversion. These are spatial query helpers.
- **Angle**: Quadrant/octant classification, cursor mapping, orientation detection, Direction enum. This is application logic, not math.
- **Polar**: Polar↔Cartesian conversion tied to Point's browser-Y convention.

## The migration

Replace `Point3` with `vec3` throughout. This removes ~55 lines from Coordinates.ts (the entire Point3 class) and eliminates the redundancy where Render.ts, Drag.ts, and Smart_Object.ts constantly convert between `Point3` and `vec3`.

### What changes

1. **Delete** the `Point3` class (~55 lines) and `Size3` / `Block` if unused after migration (~75 lines)
2. **Smart_Object.ts**: `vertices` returns `vec3[]` instead of `Point3[]`; face_normal, axis_vector return `vec3`
3. **Render.ts**: Stop converting Point3↔vec3 — use vec3 natively (currently has 18 Point3 references)
4. **Drag.ts**: `local_delta` becomes `vec3`; `apply_edge_drag` / `apply_corner_drag` take `vec3`
5. **Coordinates.ts tests**: Rewrite Point3 tests to use vec3

### What stays untouched

- `Point` (2D) — too entangled with DOM/SVG/browser-Y conventions
- `Size` / `Rect` — semantic wrappers for UI layout, no gl-matrix equivalent
- `Angle` — application logic (quadrants, cursors, orientations), not replaceable

### Result (done)

- **Coordinates.ts**: Deleted Point3 (~55 lines), Size3 (~24 lines), Block (~46 lines) = ~125 lines removed
- **Smart_Object.ts**: Switched to `vec3` for vertices, face_normals, axis_vector, drag methods
- **Render.ts**: Eliminated all Point3↔vec3 conversion; direct vec3 pass-through
- **Drag.ts**: `get_stretch_delta` returns `vec3` directly; no more round-trip conversion
- **Hits_3D.ts**: One line — vertex indexing changed from `.x/.y/.z` to `[0]/[1]/[2]`
- **Tests**: Rewrote Point3 tests as vec3 tests; reduced float precision to 5 decimals (gl-matrix uses Float32Array)
- **svelte-check**: 0 errors, 0 warnings
- **vitest**: 377/377 passing
