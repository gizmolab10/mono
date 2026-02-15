# Three Dimensions on a Flat Screen

Every object in the scene is just a bag of corners and edges floating in 3D space. The problem: my canvas is flat. So every frame, the renderer has to squash all that depth onto a 2D surface, figure out what's in front of what, and draw it so it *looks* like you're staring at a real solid thing.

Here's how the render folder works, file by file.

## The Supporting Cast

### Scene.ts (~48 lines)

Dead simple registry. Every 3D object in the scene gets an entry here — id, vertices, edges, faces, parent pointer, color. It's a `Map<string, O_Scene>` with create/get/destroy. No logic, no opinions. Just a phone book for geometry.

### Camera.ts (~127 lines)

The eyeball. Holds two matrices — view (where the camera sits, what it looks at) and projection (perspective or orthographic). The eye defaults to 2750mm back (about 9 feet), looking at the origin.

Two projection modes: perspective (things shrink with distance, feels natural) and orthographic (no depth shrinking, feels technical). 2D mode switches to ortho. The camera also provides `screen_to_ray` — given a pixel coordinate, fire a ray from the camera into the scene. That's how click detection works upstream.

### Animation.ts (~44 lines)

The heartbeat. A `requestAnimationFrame` loop that fires registered callbacks each frame with a delta-time. Engine registers one callback: update front face, then render. That's it. Start, stop, reset for HMR.

### Engine.ts (~480 lines)

The boss. Engine wires everything together at startup — initializes canvas, camera, and scene, loads saved state (or creates defaults), hooks up mouse/scroll input, and starts the animation loop.

The interesting stuff lives in 2D rotation handling. In 2D mode, dragging doesn't free-rotate — it accumulates a *scratch orientation* that detects when you've dragged past a face boundary. When it sees the front face would change, it triggers an animated snap to the new face. Between snaps, there's a slight tilt for tactile feedback, clamped to ~5 degrees, that springs back on release. It feels like flipping a box in your hands.

Engine also owns the cuboid topology — the 12 edges and 6 faces that every Smart_Object shares. Add a child, delete an SO, toggle 2D/3D, change precision — Engine orchestrates all of it.

## The Render Pipeline

### Render.ts (~940 lines)

The workhorse. One call to `render()`, one frame. It runs in phases, strictly ordered — later phases depend on earlier ones. Render starts with `get_world_matrix` — the function that builds the transformation chain for any object (tumble, rotate and translate).

**Phase 1 — Projection.** Every vertex of every object gets multiplied through the MVP matrix. Out comes a screen-space x, y, a depth z, and a w that tells you whether it's in front of or behind the camera. The MVP is cached per object — all vertices sharing the same world matrix skip the two matrix multiplies after the first (~10% improvement on projection). Cache invalidates at frame start so camera movement stays clean. **MVP** == Model-View-Projection. The combined matrix that takes a vertex from local object space all the way to screen space in one multiply. The M stands for model, the `get_world_matrix`.

**Phase 2 — Face fills.** In solid or 2D mode, front-facing faces get painted white. This is the "paper over the back" trick — if you can't see through it, rear edges vanish naturally. Faces are sorted back-to-front by average depth so nearer faces paint over farther ones. Classic painter's algorithm.

**Phase 2b — Occlusion index.** Still in solid/2D mode: every front-facing face gets catalogued into a spatial index (Flatbush) keyed by its screen-space bounding box. This index answers the question "which faces might overlap this edge?" without checking every face in the scene. Used heavily by edge drawing and intersection detection.

**Phase 2c — Intersections.** When two objects overlap in space, their faces cut through each other. For every pair of faces from different objects, the renderer computes where their planes cross, clips the resulting line to both face quads, then clips *again* against occluding faces so only the visible portion draws. An AABB check skips the entire face-pair loop when two objects' bounding boxes don't overlap in world space. Without AABB: O(objects² × faces²). With AABB: O(objects²) for non-overlapping scenes, O(overlapping_pairs × faces²) for the rest.

**Phase 3 — Edges.** Each edge of each object gets drawn. In solid/2D mode, only edges belonging to front-facing faces survive. Each surviving edge gets clipped against every nearby occluding face — the occluded portions are carved out, and only visible segments reach the canvas. Edges are batched by color into Path2D objects for fewer draw calls.

**Overlays.** After the geometry is down, optional layers stack on top: face name labels, selection/hover dots, dimension annotations, angular annotations, and a debug face-winding readout.


## The Extracted Modules

These three files used to live inside Render.ts. They got pulled out because they're self-contained annotation systems — they read from the scene but don't modify render state. Each talks to Render through a slim host interface (just the projection and winding methods it needs).

### R_Dimensions.ts (~340 lines)

Dimension annotations — those measurement labels with witness lines and arrows that show width, height, depth.

The hard part isn't drawing the lines. It's *where* to put them. For each axis (x, y, z), the code hunts for a **silhouette edge** — an edge where one adjacent face points toward the camera and the other points away. That's where a human would naturally place a measurement: at the visible boundary of the object.

Once it finds the edge, it computes a **witness direction** — the axis most perpendicular to the edge in screen space — and offsets the dimension line outward from the object's center. Then it checks whether another object's face is occluding the label. If so, it tries the next silhouette candidate.

Two layout modes: normal (arrows point inward, text sits in the gap) and inverted (arrows point outward, extension lines reach beyond the edge). Inverted kicks in when there's not enough room for text between the arrows.

### R_Angulars.ts (~380 lines)

Rotation angle labels. When a child object is rotated relative to its parent, an arc with degree text appears at the hinge point.

Finding the hinge is the interesting bit. The code picks the parent face perpendicular to the rotation axis that's most visible (highest winding magnitude). Then it walks that face's edges and picks the one closest to the child's center. The hinge point sits on that edge, parametrically positioned toward the child.

From there: two witness lines (one for the original direction, one for the rotated direction), an arc sampled at 24 points in world space, and arrows at both ends. Like dimensions, there's a normal/inverted layout for tight angles.

The arc radius is constant in *screen* pixels, not world units — so it looks the same size regardless of zoom. To pull that off, it measures how many pixels one world unit covers at the hinge point and scales accordingly.

### R_Grid.ts (~140 lines)

2D mode only. A dotted grid overlaid on the front face of the root object.

The spacing comes from the current measurement unit and precision — if you're working in inches at 1/8" precision, the grid lines land on eighths. If the resulting screen gap would be less than 8 pixels, the spacing doubles until it's comfortable.

The grid extends well past the object's bounds to fill the canvas, using the front face's two free axes. The third axis is locked to the face's plane.

## Performance Bottlenecks

Three things eat the most cycles, in order of cost:

### Occlusion clipping (edges + intersections)

Every visible edge in solid/2D mode gets clipped against every nearby occluding face. The Flatbush spatial index prunes candidates, but for scenes with many overlapping objects, the inner loop — Cyrus-Beck polygon clipping per face per edge segment — runs hot. Each clip creates temporary vec3s and does dot products. With N objects of ~12 edges and ~6 faces each, the worst case is hundreds of clip operations per frame.

**Improvement**: pre-allocate scratch vectors outside the loop and reuse them. Cuts GC pressure. Not dramatic per-frame, but compounds during sustained mouse drag where every frame matters.

### Intersection detection

The face-pair loop is O(faces_A × faces_B) for every pair of objects. Each pair does a cross product, a 2x2 solve, and two rounds of Cyrus-Beck clipping in 3D. An AABB check now skips the entire face-pair loop when two objects' bounding boxes don't overlap — dropping the effective cost from O(objects² × faces²) to O(objects²) for non-overlapping scenes. Scales well. Only negligible improvements remain.


The grid can also spike if zoom is extreme and spacing collapses — it doubles the spacing, but a deeply zoomed-in view could still produce thousands of grid lines before the doubling loop catches up.

### Coplanar tolerance

When two objects share a coplanar face, floating point drift through quaternion rotations and world matrices means "on the plane" reads as slightly in front or slightly behind, frame to frame. Three places needed a tolerance of `1e-4` to stop the flicker:

- **Intersection detection** (`intersect_face_pair`): `cross(nA, nB)` produces a tiny non-zero direction for near-coplanar faces. The `eps` check on `dir_len` culls these before the 2×2 solve.
- **Edge occlusion** (`clip_segment_for_occlusion`): signed distance from edge endpoints to a face plane hovers around zero. The `plane_eps` tolerance treats "on the plane" as "in front."
- **Label occlusion** (`is_point_occluded`): same signed-distance flicker for face name labels. Same fix.
