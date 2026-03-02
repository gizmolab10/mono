# Quaternions

A quat stores rotation but doesn't tell you which angles the user is thinking in. Decomposition is the heart of it: break a rotation into angles that feel intuitive, map to on-screen angulars, and can be clicked and edited.

## Model

Each SO tracks a sliding-window pair: the 2 most recently touched axes, each with an angle. The pair is the source of truth; the quat is derived from it (`q = R(B, β) · R(A, α)`).

- If the new axis is already in the pair, update its angle.
- If it's new, it replaces the older entry. Compose into quat, decompose back into the new pair (swing-twist).

Fidelity loss hits the oldest axis — the one the user stopped caring about. Negligible at 0-45°; visible drift only at extreme combinations (80°+ on all three), outside di's typical use.

### Storage

`rotation_pair: [Axis_Name, Axis_Name] | [Axis_Name] | null` — evolves with user actions. Serialize the pair + two angles.

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

* `Angle_Rect` (`Interfaces.ts`): extends `Label_Rect` with `rotation_axis` and `angle_degrees`
* `Angular.ts` (`editors/Angular.ts`): hit test, begin/commit/cancel editing cycle
* `Render.ts`: `angular_rects[]` cleared each frame, `render_angulars()` + `render_angular()`
* **Hit testing + events**: wired through `Hits_3D`, `Events_3D`, `Graph.svelte`
