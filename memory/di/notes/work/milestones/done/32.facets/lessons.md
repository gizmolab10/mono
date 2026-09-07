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
- **Screen-space angle ordering is not orientation-invariant across faces.** Ascending angles give a clockwise sweep on some faces and a counterclockwise sweep on others, depending on which way the face normal projects to screen. Neither "take the previous index" nor "take the next index" works on every face. **This is the structural reason the feature was mothballed.** The tracer needs a per-face sense-of-direction step that the current architecture does not provide.
- **Depth test distinguishes real 3D crossings from screen-only coincidences.** Two edges that cross on screen are not necessarily touching in 3D. Without a perspective-correct depth test at the crossing point, screen-only coincidences get classified as real crossings and pollute the topology. Interpolate the world position at the screen crossing and compare depths. Below a tiny threshold, treat it as a real touch; otherwise it is just one edge passing in front of the other.
- **Single key from birth beats multi-pass merges.** Letting each pass invent its own keys for the points it discovers and then trying to merge duplicates across passes is a losing game. Every merge rewrites a key, and every downstream structure has to catch up, and any miss leaves a stale reference the tracer bounces against. Unify keys up front so each point has one key from the moment it is born.
- **Cross-face segments need an inside-polygon check at their corner endpoints.** A silhouette edge ending at one of its own object's corners is only a valid segment on another object's face if that corner lies inside the target face's screen polygon. Without this check, phantom segments leak across faces and paint regions that should not be painted.
- **Even-odd fill cancels facets with opposing windings.** Collecting every facet into one canvas path and filling with the even-odd rule causes facets with opposite winding to subtract from each other. Paint one facet at a time instead.
- **Screen angles beat tangent-plane angles for cyclic ordering.** Projecting segment directions onto the face's 3D tangent plane and computing angles there gives wrong answers, because the 3D plane does not match what the viewer sees. The tracer needs the angles the viewer sees — compute them in screen space.

## Meta lessons

- **When each fix uncovers a deeper problem instead of shrinking the remaining work, suspect the architecture, not the patches.** Converging means today's bugs were smaller than yesterday's. Uncovering means today's bugs were deeper than yesterday's. The second pattern is a reset signal — stop patching and rethink and redesign.

## Final outcome (2026-04-9)

The feature was mothballed. The remaining structural problem — the across-face inconsistency in clockwise direction — was not resolvable with a local fix. The tracer could paint correctly on some faces and wrong on others depending on face orientation relative to the screen, and no single index-offset rule worked universally.

The codepath is still present, gated off by the master debug switch. The test suite is green. Re-entering this work means finding a per-face direction sense that replaces the current ambient rule — not patching the existing tracer.
