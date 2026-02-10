
- [ ] movement of SO or edge/corner of SO must follow mouse
- [ ] mouse movement delta is a 2d vector in the plane of the computer screen
	- [ ] delta from mouse down to current mouse position
- [ ] identify plane in which to constrain movement
	- [ ] the plane of 
- [ ] project mouse delta vec2 onto this plane, also vec2
- [ ] apply plane delta to x,y,z of SO for rendering
- [ ] but retain the original xyz for further adjustment to plane delta and application of it to rendering xyz

## Stretch anchor pattern (edge/corner drag)

Mirrors the face translation fix: freeze everything at mousedown, compute absolute deltas.

1. **Mousedown** — capture the SO's face plane geometry (e1/e2 world+local, plane point, normal, anchor world pos) as-is. Snapshot the affected bound values (`initial_bounds`).
2. **Every frame** — intersect current mouse with the *fixed* plane. Absolute world delta from anchor. Decompose onto frozen e1/e2. Map to local via frozen e1_local/e2_local. Dot with axis vector(s) → absolute bound offset(s).
3. **Apply** — `new_value = initial_bounds[bound] + offset`. Snap. Set. No accumulator.

Kills two problems:
- Moving plane (face geometry shifts as bounds change) → frozen at mousedown
- Accumulation noise → absolute offset from snapshot