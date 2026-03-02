# Rotation

Rotating a child SO is purely visual — `axis.angle.value = radians` sets an orientation quaternion that the renderer applies. No stored bounds change. But the root needs to grow (or shrink) to encompass the rotated visual extent, and *that* is where things get hairy.

## The trap: bounds are relative

`get_bound` walks the parent chain: `parent.get_bound(bound) + attr.value`. Crucially, `x_max` adds `parent.x_max`, not `parent.x_min`. So a child's absolute width includes its parent's width. Change root → child changes → everything downstream shifts.

Naively expanding root to fit a rotated child creates a feedback loop: root grows, child's resolved bounds grow with it, projected AABB grows, root grows more. Each tick compounds.

## The fix: snapshot + project + compensate

`fit_root()` in Engine.ts runs on every rotation tick. Three phases:

### 1. Snapshot

Before touching root, grab each direct child's absolute bounds. These are the ground truth we'll restore after resizing.

### 2. Bbox with rotation projection

Two passes build the bounding box:

- **Structural pass** — union of all descendants' absolute bounds, *excluding* any subtree rooted at a rotated direct child. Unrotated children contribute their normal resolved geometry.
- **Rotation pass** — for each rotated direct child, collect its full subtree AABB (the child's own bounds unioned with all its descendants'). Take those 8 corners, rotate them around the child's center using its orientation quaternion, and expand the bbox with the projected positions. The rotation center matches `get_world_matrix` (center of the child's own bounds), so the projection lands in the right spot.

The key insight: rotated subtrees are *excluded* from the structural pass. Their unrotated bounds can be larger than the rotated visual extent (rotation compresses some axes), so including both would inflate root height/width. Only the projected AABB matters.

This is the same math the shadow renderer uses in `R_Grid.ts` — transform vertices into root-local space via the orientation quaternion. Shadows showed it worked before we applied it to root fitting.

### 3. Resize + compensate

Set root min/max to the computed bbox. Then restore each direct child's absolute bounds by adjusting their offset attributes. Formula-driven attributes (compiled) are skipped — they'll re-evaluate naturally.

The compensation breaks the feedback loop. Root changed, but children's absolute positions didn't. Next tick computes the same bbox, same root size. Stable.

## Where it's called

- **`set_angle`** (D_Selected_Part.svelte) — every slider tick calls `engine.fit_root()`, then ticks and saves. Root tracks the rotation in real time.
- **`shrink_to_fit`** (Engine.ts) — the fit button calls `fit_root()` first, then propagates constraints and runs the structural safety net (`expand_root_to_fit`).

## Debug wireframe

Invisible SOs render as dashed 3D wireframes (grid color, grid opacity). Handy for seeing the rotated child's actual block vs. the root bounds — confirms the projection is landing where it should.
