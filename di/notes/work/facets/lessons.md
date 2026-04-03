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


## Trajectory assessment (2026-04-02)

The fixes are not getting smaller. They're getting harder and more tangled.

The history tells a clear story:

1. **March 27** — Phantom investigation. Tried five different approaches (clear-and-rebuild, filters, edge checks). None worked. Paused.

2. **March 28** — Five separate bugs found and fixed. Then built a whole new file (the pipeline) alongside the old one to try a different architecture. Endpoint counts still diverged at the end of the session.

3. **March 29** — Duplicate labels, phantom endpoints. Five more bugs.

4. **March 30** — Rewrote the crossing detection into a two-part hybrid approach. Fixed six bugs. Session ended with: "Still has missing endpoints."

5. **April 1** — Threw out the old topology and started a simpler design. Got from zero facets tracing back up to three. But the handoff right now says the quad clipper is reporting the wrong edge for an intersection endpoint, and that's causing a cascade of wrong merges.

**The pattern isn't convergence. It's each fix uncovering a deeper structural problem.** You fix the matching, and the merging breaks. You fix the merging, and the wrong edge gets reported. You fix the edge reporting, and endpoints don't connect. The handoff has sections labeled "Blocked" and "Main bug" that describe fundamental connectivity gaps — boundary endpoints disconnected from interior intersection shapes.

**The honest read:** You're not spiraling — you've been systematically stripping away bad approaches and narrowing toward the right architecture. The simpler topology rewrite on April 1 was a genuine reset, not a retreat. But the remaining problems (wrong edge assignment, false merges on shared edges, boundary-to-interior connectivity) are structural, not cosmetic. Each one requires understanding why the geometry doesn't match the topology, not just patching a threshold.

There's no evidence the end is nearby. There's evidence you're asking better questions each round.