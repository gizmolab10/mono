# Primer

Concepts that came up during DI development, explained for Jonathan.

## Quaternions (quats)

A quaternion is 4 numbers: `[x, y, z, w]`. It represents a rotation in 3D space.

**Why not just use angles?** Three Euler angles (pitch/yaw/roll) suffer from gimbal lock — certain orientations lose a degree of freedom. Quats don't have this problem.

**How they work:** The `w` component is the cosine of half the rotation angle. The `[x, y, z]` part is the rotation axis scaled by the sine of half the angle. So `[0, 0, 0, 1]` = no rotation (identity). `[0, 0, 0.707, 0.707]` = 90 degrees around Z.

**What you do with them:**
- Multiply two quats = combine rotations (order matters: A * B means "rotate by B, then A")
- Apply a quat to a point = rotate that point
- Interpolate between two quats smoothly (slerp) = smooth rotation animation
- Normalize them — they must stay unit length or things stretch

**In the codebase:** `obj.so.orientation` is a quat. It gets baked into the world matrix via `mat4.fromQuat`, then multiplied with translation/scale to form the full world transform.

## World/screen `t` mismatch

A line segment in 3D (world space) gets projected to a line segment on screen. Both can be parameterized by `t` from 0 to 1, where `t=0` is one endpoint and `t=1` is the other.

**The trap:** `t=0.5` in world space (the literal midpoint of the 3D segment) does NOT project to `t=0.5` in screen space. Perspective makes closer things bigger — the near half of a segment takes up more screen pixels than the far half. So the screen midpoint corresponds to some `t≠0.5` in world space.

**When it bites:** Any time you compute `t` in one space and use it to interpolate in the other. Concretely:

```
World:  |----A----|----B----|    (A and B are equal length in 3D)
Screen: |------A------|--B--|    (A is closer, looks longer)
```

If you find "the segment is behind this face for world `t` in [0.3, 0.7]" and then clip to screen pixels using `screen_point = p1 + (p2-p1) * 0.3`, you get the wrong screen position. The 0.3 was computed in world space but you're applying it in screen space.

**The fix we landed on:** Do everything in screen space. The only world-space operation is asking "which side of this face plane is each endpoint?" to find the single crossing point. Project that crossing point to screen to get its screen `t`. From there, all interval math, polygon clipping, and output interpolation happens in screen coordinates — one domain, no translation errors.

**Why the intermediate fix failed:** It projected the crossing points correctly (`bs`/`be` were right) but then linearly mapped the polygon clip's `t` back to world `t` — reintroducing the mismatch one level deeper.
