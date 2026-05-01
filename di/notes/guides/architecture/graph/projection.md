# Projection

The line between model space and screen space. Data never flows back across it.

## The rule

Formulas read world coordinates. Renderer reads camera view. They never cross.

## World coordinates (model space)

Stored bounds, formulas, constraints, serialization. Root's stored bounds define the building — inches, feet, real-world dimensions. They should never change because something got rotated or the camera moved.

**Owners:** Smart_Object, Constraints, Scenes (save/load)

## Camera view (screen space)

Tumble, scale, pan, grid opacity, camera view extent. Computed from world coordinates + orientation quats, but never written back to the model.

**Owners:** Render, R_Grid, Camera

## Camera view extent

The AABB that encompasses all content including rotated children's projected footprints. Transient — recomputed on tick, not serialized.

Two passes:

- **World pass** — union of all descendants' absolute bounds, excluding rotated subtrees.
- **Rotation pass** — for each rotated child, collect its full subtree AABB, rotate the 8 corners around the child's center, expand the bbox with the projected positions.

Rotated subtrees are excluded from the world pass. Their unrotated bounds can be larger than the rotated projection (rotation compresses some axes), so including both would inflate the view.

## The trap

`get_bound` walks the parent chain: `parent.get_bound(bound) + attr.value`. Expanding stored bounds to fit a rotated child creates:

1. **Feedback loop** — parent grows, child's resolved bounds grow with it, projected AABB grows, parent grows more.
2. **Formula distortion** — siblings with formula-driven bounds re-evaluate against the new parent. Rotating one child distorts all the others.

## The fix

Parent size is user-intent. Rotation never changes it.

A rotated child that protrudes is allowed — a rafter past a wall plate, a door swung open, a diagonal brace through a stud bay. In every case the user defined the parent's dimensions intentionally. Auto-expanding would change the meaning of the design.

Rotation sets `axis.angle.value` and stops. No `set_bound` calls on the rotated SO or any ancestor. The renderer's `camera_view_extent` (transient, recomputed each tick) handles the visual overflow — grid extent, framing, shadows.

When the user *wants* to resize a parent to match its children, the **fit** button (`Engine.fit_to_children`) does it on demand. Explicit intent, runs once, no automatic behavior. Snapshots direct children's absolute positions, resizes root to the union AABB, then restores children (recalculates offsets against the new root).
