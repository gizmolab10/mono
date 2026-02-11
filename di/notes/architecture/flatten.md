# Flatten: 3D → 2D Toggle

How the view mode toggle works, and why each step exists.

## Algorithm

### 3D → 2D

1. **Pick face** — `front_most_face(so)` finds the face whose world-space normal has the highest z-component (most aligned with camera), filtered to front-facing faces only (negative screen winding).

2. **Save 3D orientation** — clone `so.orientation` into `saved_3d_orientation` so we can restore it later.

3. **Snap orientation** — from `FACE_SNAP_QUATS[face]` (4 candidates: 0°/90°/180°/270° twist around the face normal), pick the one nearest to current orientation via `quat.dot`. Copy onto `so.orientation`.

4. **Set camera** — position at `[0, 0, 2750]`, switch to orthographic projection.

5. **Render** — `get_world_matrix` uses `so.orientation` directly (no flattening transform).

### 2D → 3D

1. **Restore orientation** — copy `saved_3d_orientation` back to `so.orientation`.
2. **Camera** — switch back to perspective.

## FACE_SNAP_QUATS

6×4 precomputed quaternions. Each of the 6 bases rotates a face's outward normal to `[0,0,+1]` (toward camera). Four Z-axis twists (0°, 90°, 180°, -90°) give the in-plane rotations per face. Verified: applying `base[i]` to `face_normal[i]` → z = 1.000 for all 6.

## Key Decisions

### Normal alignment over winding magnitude

`front_most_face` picks by **normal z-component**, not by screen-space winding area. Winding magnitude is face area × cos(angle) — a large face at a steep angle can have more winding than a small face pointed directly at the camera. Normal alignment matches the user's perception of "the face I'm looking at."

### No flatten_orientation transform

Earlier approach used a swing-twist decomposition in `get_world_matrix` to "flatten" the orientation for 2D rendering. This was removed because it computed a different orientation than the one stored on the SO, causing `front_most_face` (which reads from projected vertex cache) to disagree with the normal-based face selection. Since `toggle_view_mode` already snaps `so.orientation` to be exactly face-on, there's nothing left to flatten.

### Snap mutates SO, save/restore preserves 3D state

The snap writes directly to `so.orientation` so the renderer, hit-testing, and `front_most_face` all see the same state. The 3D orientation is cloned before mutation and restored on toggle back. This avoids any divergence between what the renderer projects and what the hit-test system queries.

## Files

- `Engine.ts` — `toggle_view_mode()`, `straighten()`, `FACE_SNAP_QUATS`
- `Hits_3D.ts` — `front_most_face()`
- `Camera.ts` — `set_ortho()`, `set_position()`
- `Smart_Object.ts` — `face_normal()`, `FACE_NORMALS`
