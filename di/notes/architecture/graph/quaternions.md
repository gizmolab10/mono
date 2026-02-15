# Quaternions

A quat stores rotation but doesn't tell you which angles the user is thinking in. Decomposition is the heart of it: break a rotation into angles that feel intuitive, map to on-screen angulars, and can be clicked and edited.

## Answer

Each SO stores a `rotations` array: max 2 entries of `{axis, angle}`, axes frozen on first use. The 2-tuple is the source of truth; the quat is derived from it.

### Compaction

Only two entries needed. Rotate around X, then Y — that's two. Rotate around X again: compose into quat, decompose back into the frozen X-then-Y pair. Rotate around Z after that: still decomposes into X and Y. Axes lock on first use, order never changes.

### Capacity rule

A child has exactly 2 degrees of rotational freedom relative to its parent. **Max angulars = 2 × number of children**, regardless of hierarchy depth.

## Angular rendering

### Key insight: reuse intersection lines

The intersection line where a child face meets a parent face gives us everything: the arc plane (the parent face), one witness direction (the intersection line = child's rotated axis), the hinge (where the intersection meets a parent edge), and the other witness direction (the parent edge = unrotated reference).

### Coordinate frame discipline

All angular geometry in **world space**, projected through `identity`. Never project child-local through parent world matrix.

### Pipeline

`render_intersections` collects segments → `render_angulars` groups by child+parent_face, picks longest, selects hinge on parent face edge, computes witness directions, draws.

## Existing infrastructure

- **`Angle_Rect`** (`Interfaces.ts`): extends `Label_Rect` with `rotation_axis` and `angle_degrees`
- **`Angular.ts`** (`editors/Angular.ts`): hit test, begin/commit/cancel editing cycle
- **`Render.ts`**: `angular_rects[]` cleared each frame, `render_angulars()` + `render_angular()`
- **Hit testing + events**: wired through `Hits_3D`, `Events_3D`, `Graph.svelte`