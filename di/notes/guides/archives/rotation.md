# Rotation

Rotating a child SO is purely visual — `axis.angle.value = radians` sets an orientation quaternion that the renderer applies. No stored bounds change. The camera view needs to encompass the rotated extent, but the world coordinates stay untouched.

## The trap: bounds are relative

`get_bound` walks the parent chain: `parent.get_bound(bound) + attr.value`. Crucially, `x_max` adds `parent.x_max`, not `parent.x_min`. So a child's absolute width includes its parent's width. Change root → child changes → everything downstream shifts.

Naively expanding root's stored bounds to fit a rotated child creates two problems:

1. **Feedback loop** — root grows, child's resolved bounds grow with it, projected AABB grows, root grows more.
2. **Formula distortion** — siblings with formula-driven bounds (like a wall whose `x_max = 0` tracks root edge) re-evaluate against the new root. Rotating one child distorts all the others.

## World coordinates vs camera view

The fix is recognizing that rotation fitting is a **camera view** concern, not a **world coordinates** concern. Root's stored bounds define the building — inches, feet, real-world dimensions. They're read by the algebra/constraint system for computation. They should never change because something got rotated.

The camera view already has its own state: tumble, scale, pan, grid opacity. The camera view extent of the root (how big to draw the grid, where to cast shadows) joins that family. It's computed from the rotation projection but never written back to the model.

### The rule

Formulas read world coordinates. Renderer reads camera view. They never cross.

## Camera view extent

`fit_root()` computes a `camera_view_extent` — the AABB that encompasses all content including rotated children's projected footprints. This lives in the renderer alongside tumble/scale/pan, not in the Smart_Object tree.

### How it's computed

Two passes build the bounding box:

- **World pass** — union of all descendants' absolute bounds, *excluding* any subtree rooted at a rotated direct child. Unrotated children contribute their normal resolved geometry.
- **Rotation pass** — for each rotated direct child, collect its full subtree AABB (the child's own bounds unioned with all its descendants'). Take those 8 corners, rotate them around the child's center using its orientation quaternion, and expand the bbox with the projected positions. The rotation center matches `get_world_matrix` (center of the child's own bounds), so the projection lands in the right spot.

Rotated subtrees are *excluded* from the world pass. Their unrotated bounds can be larger than the rotated camera view extent (rotation compresses some axes), so including both would inflate the camera view. Only the projected AABB matters.

This is the same math the shadow renderer uses in `R_Grid.ts` — transform vertices into root-local space via the orientation quaternion.

### Who reads it

- **R_Grid** — grid line extent, face geometry, shadow projection
- **Render** — root bottom plane, invisible SO wireframes
- **Camera** — framing, scale-to-fit

### Who ignores it

- **Smart_Object** — bounds, formulas, constraints, serialization
- **Constraints** — propagation, invariant enforcement
- **Scenes** — save/load (camera_view_extent is transient, recomputed on tick)

## Debug wireframe

Invisible SOs render as dashed 3D wireframes (grid color, grid opacity). Handy for seeing the rotated child's actual block vs. the camera view extent.
