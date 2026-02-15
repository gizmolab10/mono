# Two Dimensions

How 2D mode works: the snap, occlusion, and face rotation.

## Algorithm

### 3D → 2D Snap

1. **Pick face** — `front_most_face(so)` finds the face whose world-space normal has the highest z-component (most aligned with camera), filtered to front-facing faces only (negative screen winding).

2. **Save 3D orientation** — clone `so.orientation` into `saved_3d_orientation` so we can restore it later.

3. **Snap orientation** — from `FACE_SNAP_QUATS[face]` (4 candidates: 0°/90°/180°/270° twist around the face normal), pick the one nearest to current orientation via `quat.dot`. Copy onto `so.orientation`.

4. **Initialize scratch** — copy the snapped orientation into both `scratch_orientation` and `snapped_orientation`, so 2D face rotation starts from the correct baseline.

5. **Set camera** — position at `[0, 0, 2750]`, switch to orthographic projection.

6. **Render** — `get_world_matrix` uses `so.orientation` directly (no flattening transform).

### 2D → 3D Restore

1. **Restore orientation** — copy `saved_3d_orientation` back to `so.orientation`.
2. **Camera** — switch back to perspective.

### FACE_SNAP_QUATS

6×4 precomputed quaternions. Each of the 6 bases rotates a face's outward normal to `[0,0,+1]` (toward camera). Four Z-axis twists (0°, 90°, 180°, -90°) give the in-plane rotations per face. Verified: applying `base[i]` to `face_normal[i]` → z = 1.000 for all 6.

### Occlusion

2D mode reuses the full 3D solid-rendering pipeline. Five `!is_2d` guards were dropped in `Render.ts`:

1. **White face fills** — front-facing faces fill with background color, hiding rear edges via painter's algorithm. Guard: `is_2d || solid`.
2. **Occluding face list + Flatbush** — screen-space bounding boxes for all front-facing faces, indexed into an R-tree for fast overlap queries. Guard: `is_2d || solid`.
3. **Intersection lines** — plane-plane intersections between overlapping SOs render as visible cut lines. Guard: `objects.length > 1` (removed the `!is_2d &&` prefix).
4. **World matrix for edge clipping** — each edge's world-space transform is computed so Cyrus-Beck can clip against occluding face planes. Guard: `is_2d || solid`.
5. **Edge clipping branch** — per-edge segment enters the clipping path. Guard: `(is_2d || solid) && world`.

The phase order matters: all fills → all intersection lines → all clipped edges. This is why the painter's algorithm attempt failed — per-object interleaving has no slot for intersection lines between a parent's fills and a child's fills.

### 2D Face Rotation

Mouse drag in 2D doesn't free-rotate. It switches which face is front-facing with a tilt-then-snap feel.

1. **Accumulate drag** — mouse delta drives two quaternion rotations (X from dy, Y from dx) applied to `scratch_orientation`. This virtual orientation never touches the SO directly.

2. **Detect face crossing** — for each of the 6 faces, transform the face normal by `scratch_orientation`, check z-component. If the best face differs from `front_most_face(so)`, a snap is triggered.

3. **Tilt feedback** — while no face crossing is detected, slerp from `snapped_orientation` toward `scratch_orientation`, capped at ~5° (`max_tilt = 0.08` in dot-product space). The SO wobbles subtly in the drag direction.

4. **Animated snap** — on face crossing, `snap_anim` fires: slerp from current orientation to the target `FACE_SNAP_QUATS` entry over ~7 frames with ease-out `1 - (1-t)²`. The target quaternion is the one nearest to current orientation (via `quat.dot`) from the 4 candidates for that face.

5. **Reset scratch** — after snap, `scratch_orientation` and `snapped_orientation` are set to the snap target, so subsequent drags start from the new face.

### Dimensionals

Two 2D-specific behaviors in the dimensional rendering:

1. **Face-aware axis selection** — in 2D, only the two axes that lie in the front face's plane are shown. `so.face_axes(front_most_face(so))` returns the pair (e.g. top face → `['x', 'z']`, front face → `['x', 'y']`). The depth axis is excluded.

2. **Silhouette fallback** — `find_best_edge_for_axis` returns all silhouette candidates sorted by front-face winding. `render_axis_dimension` tries each in order. If the best edge's dimensional is occluded by another SO's face (common for children sitting on a parent), the opposite silhouette edge is tried — its witness line points away from the occluding face.

## Key Decisions

### Normal alignment over winding magnitude

`front_most_face` picks by **normal z-component**, not by screen-space winding area. Winding magnitude is face area × cos(angle) — a large face at a steep angle can have more winding than a small face pointed directly at the camera. Normal alignment matches the user's perception of "the face I'm looking at."

### No flatten_orientation transform

Earlier approach used a swing-twist decomposition in `get_world_matrix` to "flatten" the orientation for 2D rendering. Removed because it computed a different orientation than the one stored on the SO, causing `front_most_face` (which reads from projected vertex cache) to disagree with the normal-based face selection. Since `toggle_view_mode` already snaps `so.orientation` to be exactly face-on, there's nothing left to flatten.

### Snap mutates SO, save/restore preserves 3D state

The snap writes directly to `so.orientation` so the renderer, hit-testing, and `front_most_face` all see the same state. The 3D orientation is cloned before mutation and restored on toggle back. This avoids any divergence between what the renderer projects and what the hit-test system queries.

### Reuse 3D occlusion path, not a 2D-specific path

Three options were evaluated:

1. **Painter's algorithm** (~10 lines) — white fills, back-to-front per-object. **Failed.** Per-object interleaving killed intersection lines.
2. **Ortho edge clipper** (~30–50 lines) — screen-space z-comparison clipping. Avoided — scope creep risk, second code path to maintain, "face-on rectangle" assumption breaks for rotated children.
3. **Reuse 3D path** (~5 guard changes) — zero new rendering code, inherits all 3D occlusion features. **Shipped.**

The 3D pipeline's phased rendering order (fills → intersections → clipped edges) is the key architectural property. Any approach that interleaves per-object breaks the phase boundaries.

### Tilt before snap, not instant snap

Instant face transitions feel mechanical. The slerp tilt gives a physical wobble — the object resists slightly before releasing into the new face. The max tilt is small enough to never show a wrong face but large enough to feel responsive.

### Animated snap with ease-out

The snap animation uses `t += 0.15` per frame with `1 - (1-t)²` easing — fast start, soft landing. ~7 frames at 60fps ≈ 120ms. Quick enough to feel snappy, slow enough to see the rotation path.

## Files

- `Engine.ts` — `toggle_view_mode()`, `straighten()`, `FACE_SNAP_QUATS`, `rotate_2d()`, `tick_snap_animation()`, `scratch_orientation`, `snapped_orientation`, `snap_anim`
- `Render.ts` — 5 guard changes enabling 3D occlusion in 2D; `render_dimensions()`, `find_best_edge_for_axis()`, `render_axis_dimension()`
- `Hits_3D.ts` — `front_most_face()`
- `Camera.ts` — `set_ortho()`, `set_position()`
- `Smart_Object.ts` — `face_normal()`, `FACE_NORMALS`, `face_axes()`, `face_fixed_axis()`
