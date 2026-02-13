# Angle decorations

- [ ] add angulars (like dimenionals but for angles)
- [ ] for parent P and child C, C has an orientation quat O relative to P
- [ ] decompose O into one or two angle(s)
	- [ ] orientation is either simple (one angle) or compound (composition of two angles)
	- [ ] angles are always relative to P's axes
- [ ] show these angles at a hinge point
	- [ ] choose the hinge point carefully
		- [ ] must always be at the intersection of an edge of C with a face of P
		- [ ] choose the edge of C carefully
			- [ ] do not make the algorithm "thin axis aware" treat all axes as equally qualified
- [ ] draw two witness lines and an arc and the text of the angle in degrees
	- [ ] short witness lines — `1.3 × radius` from hinge point
	- [ ] radius of arc in world space: is one which, when projected results in a constant (same constant for all angulars)
- [ ] the arc must be drawn in a plane parallel to a face of the parent
	- [ ] choose the plane carefully
	- [ ] the plane perpendicular to the rotation axis
		- [ ] choose the face of P that is most visible to the camera
	- [ ] check the normal of the plane, if it is nearly perpendicular to the camera ray, it is too flat
	- [ ] hide angulars whose plane is too flat to see the arcs
- [ ] the arc must end in arrow heads pointing at the witness lines
- [ ] the arc has two sections, one on either side of the text
	- [ ] the arc is NOT a full circle
- [ ] use the same algorithm as dimensionals to decide whether the two sections are between the witness lines or outside of them
	- [ ] arrow heads always point toward their witness line and are on the same side of the witness lines as the sections

## Existing infrastructure (wired, working — keep on rewrite)

- **`Angular_Rect`** (`Interfaces.ts:36`): extends `Label_Rect` with `rotation_axis: Axis` and `angle_degrees: number`. Render pushes these into `render.angular_rects[]` each frame.
- **`T_Hit_3D.angle`** (`Enumerations.ts:22`): hit type enum. **`T_Editing.angles`** (`Enumerations.ts:29`): editing state enum.
- **`Angular.ts`** (`editors/Angular.ts`): `Angulars` class — singleton `angulars`. `hit_test(x,y)` checks `render.angular_rects`. `begin(rect)` sets store + editing state. `commit(input)` parses degrees, calls `quat.setAxisAngle` + `recompute_max_bounds` + `propagate`. `cancel()` clears.
- **`Hits_3D.ts`** (`managers/Hits_3D.ts:100-101`): after dimension hit test, calls `angulars.hit_test(point)`. Returns `T_Hit_3D.angle` on match.
- **`Events_3D.ts`** (`signals/Events_3D.ts:46-47`): on mousedown, if `hit.type === T_Hit_3D.angle`, calls `angulars.begin(ang)`. Also sets text cursor on hover for angle hits.
- **`Graph.svelte`** (`svelte/main/Graph.svelte`): imports `angulars`, subscribes to `w_s_angular`. Renders `<input>` overlay for editing (`ang_input`, `on_ang_keydown`, `on_ang_blur`). Auto-focuses on `$effect`.
- **`Render.ts`** (`render/Render.ts:32,74`): `angular_rects: Angular_Rect[]` field, cleared each frame. `render_angulars()` called inside `show_dimensionals` block.

## Key insight: reuse intersection lines

Claim: "all intersection lines lie on both the child's and the parent's faces AND the parent's face is a great candidate for the plane of the angular AND the intersection line is a great candidate for one of the witness lines AND the parent's edge that meets that line is a great candidate for the other witness line"

Verification of each part:

1. **All intersection lines lie on both the child's and the parent's faces.** True by construction. `intersect_face_pair` computes the plane-plane intersection line and clips it to both face quads. The resulting segment lies on both faces.

2. **The parent's face is a great candidate for the plane of the angular.** The spec says "arc in a plane parallel to a face of the parent." The intersection line lies ON the parent's face. An arc drawn in that face's plane, centered at a point on the intersection line, is in a plane coincident with the parent's face.

3. **The intersection line is a great candidate for one of the witness lines.** The intersection line is where the child's face meets the parent's face — the visible crease where the child emerges from the parent. It represents the child's rotated direction. The angle is measured FROM this line.

4. **The parent's edge that meets that line is a great candidate for the other witness line.** The parent's edge at the junction defines the parent's axis direction in that face plane. The child rotates away from the parent's edge. The angle sweeps from the intersection line (child's direction) to the parent's edge (parent's unrotated reference).

## Coordinate frame discipline

Previous attempts failed repeatedly by mixing coordinate frames — computing geometry in child-local or parent-local space and projecting through the wrong world matrix. This caused angulars to float in space, detached from the SOs they refer to.

Rules:
- All angular geometry (hinge, witness lines, arc points) must be computed in **world space**
- Project through `identity` matrix — the same pattern intersection lines use (`Render.ts:583-585`)
- **Never** project child-local coordinates through a parent world matrix
- The intersection line endpoints from `intersect_face_pair` are already in world space — use them directly
- Parent face corners transformed via `parent_world` are in world space — use them for edge directions
- For constant-screen-size radius: measure px-per-world-unit at the hinge by projecting `hinge` and `hinge + small_delta` through identity, then `radius_world = target_px / px_per_unit`

## Implementation strategy: plumbing intersection data to angulars

`render_intersections` currently computes world-space intersection segments in a tight draw loop and discards them. `render_angulars` needs that data. The approach:

1. **Collect intersection segments.** Refactor `render_intersections` to store each segment alongside metadata: `{ start: vec3, end: vec3, parent_obj_id: string, child_obj_id: string, parent_face_idx: number, child_face_idx: number }`. Store these in a per-frame array on Render (like `angular_rects`), cleared each frame.

2. **`render_angulars` consumes collected segments.** For each child SO, filter segments where `child_obj_id` matches. Each segment provides:
   - The **parent face** it lies on → the arc plane
   - The **intersection direction** (`normalize(end - start)`) → one witness line direction
   - The **hinge** → an endpoint of the segment (where the intersection line meets a parent edge)
   - The **parent edge direction** at the hinge → the other witness line direction

3. **Finding the parent edge at the hinge.** The hinge is where the intersection segment ends at the boundary of the parent face quad. The parent face has 4 edges. Find which parent edge the hinge lies on (closest edge), and use that edge's direction as the second witness line.

4. **Angle between witness lines.** The angle of the arc = angle between the intersection line direction and the parent edge direction, measured in the parent face plane. This is the rotation angle visible on that face.

5. **Which segments to use.** A child may produce multiple intersection segments across different parent faces. Group by parent face, pick the most camera-visible parent face (most negative winding), skip too-flat faces. One angular per qualifying face.