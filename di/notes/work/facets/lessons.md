# Lessons Learned

Don't repeat these.

- **Painter's algorithm** can't handle differently-colored faces for intersecting geometry.
- **Clip-canvas with plane tests** — "is the occluder in front" tests were all too permissive or too aggressive.
- **Centroid-based occlusion** — the occlusion check uses the face centroid, not the query point. Don't trust it for per-polygon tests.
- **One misplaced clear() cost a week.** Data created by one phase and consumed by another should never be cleared by a middle phase. The clear destroyed intersection endpoints that downstream code needed. A save/restore workaround only recovered some types, silently dropping others. Two symptoms (phantoms + missing pierce points), one root cause.
- **Phantom vs real endpoints fight each other.** Every filter that removes phantoms also removes some real endpoints, because the data structures don't distinguish visual-only intersection lines from real ones at creation time.
- **When an edge starts inside a face polygon, the crossing "entry" is the edge's own vertex** — not a new geometric event. Creating a new endpoint there doubles the choices at that point and breaks the tracer.
- **A crossing between two edges is only real if BOTH edges are visible at the crossing point.** Checking one edge against the other's face is necessary but not sufficient.
- **Prefer face_intersection over occlusion_clip at shared points.** An oc endpoint inserted later in a matching loop can overwrite an fi match at the same screen position, leaving the fi floating.
- **Skip both SOs for intersection line occlusion.** Intersection lines are on both surfaces of convex solids. No face of either SO can occlude them. Only third-party objects could.
