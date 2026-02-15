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

## BVH (Bounding Volume Hierarchy)

A tree where each node wraps geometry in a bounding box. You query by walking the tree, skipping whole branches whose boxes don't overlap your test. Turns a brute-force O(n) scan into O(log n).

**In practice:** You stuff all your face bounding boxes into the tree. When you need to know which faces might occlude an edge, you query with the edge's bounding box. The tree prunes everything that's nowhere near it — you only test the handful of faces that actually overlap.

## HLR (Hidden Line Removal)

The classic wireframe rendering problem: given 3D geometry and a viewpoint, figure out which edge segments are behind faces and shouldn't be drawn (or should be drawn dashed). What our occlusion code already does brute-force — checking every edge against every front-facing face from every other object.

### Scaling

A kitchen is ~500 SOs (every door, drawer, shelf, trim piece, carcasse). Each SO has ~12 edges and ~3 front-facing faces. The brute-force cost is edges × faces per frame:

| SOs | Edges | Front faces | Brute force | With flatbush |
|---|---|---|---|---|
| 5 | 60 | ~15 | 900 | ~180 |
| 50 | 600 | ~150 | 90,000 | ~6,000 |
| 200 | 2,400 | ~600 | 1,440,000 | ~19,200 |
| 500 | 6,000 | ~1,500 | 9,000,000 | ~60,000 |

Flatbush (a static 2D R-tree) replaces the O(n) face scan with O(log n) per edge, culling ~90%+ of candidates before the narrow-phase Cyrus-Beck clipping test runs. At kitchen scale, that's the difference between choking and smooth. See [[spatial]].

### Integration

The change is surgical — three touches in `Render.ts`, nothing else:

1. **Build phase** (after `occluding_faces` loop): compute each face's screen-space bounding box, stuff them into a flatbush index, call `finish()`.
2. **Query phase** (top of `clip_segment_for_occlusion`): compute the edge's screen-space bounding box, call `index.search(minX, minY, maxX, maxY)` to get candidate face indices.
3. **Loop replacement**: iterate `candidates` instead of `this.occluding_faces`.

Everything downstream — skip logic, plane distance, Cyrus-Beck clipping, interval math — stays identical. The only change is *which* faces enter the loop. If flatbush returns too many candidates, worst case is same performance as now. R-trees are exact for bounding box overlap, so no rendering glitches.

### Next Bottleneck: Canvas 2D Draw Calls

Flatbush removes the occlusion cliff — the math won't choke as SOs grow. But the *rendering* cost shifts to Canvas 2D draw call volume. Each `beginPath`/`fill`/`stroke` cycle is a GPU state change under the hood. At 500 SOs that's roughly 1,500 `fill()` calls (white face polygons) and 6,000+ `stroke()` calls (edge segments). Canvas 2D batches poorly compared to WebGL.

**When you'll feel it:** ~200-300 SOs. Symptoms: uniform frame rate drop across the whole render (not just during rotation like the old occlusion hitch).

**Mitigations, in order of effort:**

| Fix                          | What it does                                                                           | Effort                              |
| ---------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------- |
| **Path batching**            | Merge same-styled segments into one `beginPath`/`stroke` cycle instead of one per edge | Small — pushes ceiling to ~500+ SOs |
| **OffscreenCanvas + Worker** | Render off the main thread so UI stays responsive                                      | Medium                              |
| **WebGL**                    | One draw call for all geometry                                                         | Large — architecture change         |

Path batching is the natural next step when canvas becomes the wall. Not urgent until scene complexity demands it.

### WebGL: If We Ever Need It

We can't use WebGL's depth buffer for occlusion, not where it shines best. CPU does all the math (projection, occlusion with flatbush, segment splitting). WebGL just draws the results — one buffer upload, one draw call, done. The split is natural: occlusion is geometric reasoning about intervals (CPU work), drawing 10,000 line segments fast is GPU work.