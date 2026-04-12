# Facets History

Debug sessions, investigations, and fixes. Reference only — not needed for day-to-day work.

---

## Reference (undated)

### Session plan (completed)

- Session 1: Pass 1 (visibility) — edge clipping, fake sliver filter, intersection lines with skip-self
- Session 2: Pass 2 (arrangement) — crossing detection, clip splitting, depth classification, occluding segments
- Session 3: Pass 3 (labeling) + wiring — labeling during Pass 1, wired into Render.ts with flag

### Test suite notes

44 tests in Topology.test.ts across 5 layers:

- Layer 1: Pure 2D geometry (solid)
- Layer 2: Clipping (structural only — doesn't verify geometric correctness)
- Layer 3: Splitting (solid)
- Layer 4: Two-object scenes (structural integrity, not geometric correctness)
- Layer 5: Golden test (reports orphans, doesn't compare against known values)
- Two vertex-hit detection tests added for the quad clipper

### Earlier bugs (before 2026-04-01)

- Phantom segments from wrong endpoint matching — replaced 5-pixel screen search with boundary-edge lookup
- Wrong-SO facets — reject traces reaching corners of the other object
- Missing pierce-point labels — topological key matching in Pass 1b reuses intersection keys
- fi at vertex not labeled as corner — quad clipper vertex hit detection (partially addressed)

---

## 2026-03-27 — Phantom investigation (paused)

Phantoms are face_intersection endpoints where face planes mathematically cross within both quads, but the edges at that point don't actually meet in 3D. The intersection is visual only.

Tried: clear-and-rebuild, facets filter, cascading filter, edge_cross endpoint type, edge distance checks. None worked cleanly — the distinction between real and visual-only requires edge-level geometry that isn't available when endpoints are created.

Promising direction (not implemented): check both exit edge vertices against the other quad's plane AND verify the crossing point is within the other face's polygon.

## 2026-03-28

### Problem P — missing pierce points (fixed)

fi endpoints on edges had only 1 segment (edge) instead of 2 (edge + intersection). The intersection segment's partner occlusion_clip endpoint was wiped by a clear() in the wrong place. Fix: moved clear() to the start of the compute pipeline.

### All faces on + fi priority fix

Changed facet painting from best-face-only to all front-facing faces. Fixed floating fi endpoint caused by oc overwriting fi match in the reverse map loop. Fix: prefer face_intersection over other types in matching.

### Second pipeline built alongside the first

A new rendering pipeline was built to run side-by-side with the existing one, so the two could be compared. The new pipeline used a single registry of edge points, and matched them by where each point was clipped — not by where it sat in space. Status at end of session: edge clips matched exactly (sixteen of sixteen), intersections matched (five of five), crossings matched (ten of ten), but endpoint counts differed — the old pipeline found twenty-nine, the new one found twenty-five.

### Crossing segment infrastructure (session summary)

Built crossing segment infrastructure, directed half-edge tracing, fixed false same-SO occlusion of intersection lines. Got 5 facets tracing. Key decisions: skip both SOs for intersection occlusion, fi coincidence merge via world-position matching, interpolate split screen positions along edge.

## 2026-03-29 — Duplicate labels & phantom ex endpoints (fixed)

Five bugs found and fixed:

1. Duplicate oc/ex endpoints at same point — also check face's edges' oc lists for reverse-direction match.
2. Phantom ex at corners — reuse existing corner endpoint when clip starts inside polygon.
3. Exterior corners on wrong face — added point-in-polygon check before corner synthesis.
4. Phantom crossings where edge_a is invisible — check visibility at both entry and exit positions.
5. Bridge import of corner-to-oc segments — skip edge segments where endpoints are corner+oc from different SOs.

## 2026-04-01 — Identity mixing fix (reset to simpler topology)

The design spec said Pass 1 should produce geometry with no identity. But the implementation assigned endpoint keys during Pass 1a, 1b, and 1d, creating three disconnected populations that couldn't find each other. This caused zero facets to trace.

### Root cause

Each pass created its own endpoints independently. Pass 1d tried to match its entry/exit points against intersection endpoints using a lookup table keyed by boundary edge. This only worked when both points happened to land on the same edge — a coincidence. When it failed, orphan endpoints appeared everywhere.

### Key findings

- The arrangement (Pass 2) can't replace the face-polygon clipper for occluding segments. Arrangement crossings happen where visible segments cross other visible segments. Occluding segments connect through the invisible face silhouette. 5 arrangement crossings, 5 groups of 1, zero pairs.
- Merging keys must propagate into all segment data structures, not just the endpoint map. Without propagation, dedup against parallel edges fails because the keys are stale.
- Occluding segments that connect the same endpoints as existing segments create parallel edges the tracer bounces between. Must dedup after merge propagation.
- Per-frame state (anonymous crossing data) must be cleared at the start of each compute call, not just initialized once.

### What was built

1. Quad clipper reports vertex hits (adjacent enter/exit edges share a corner)
2. New Pass 3 assigns identity from source tags after all geometry exists
3. Pass 1d stores anonymous crossing data, Pass 3 assigns identity afterward
4. Topological merges: intersection = occlusion (same edge + matching face), intersection at vertex = corner
5. Key propagation from merges into all segments and lookups
6. Dedup: skip occluding segments whose endpoint pair already exists in edge or intersection segments

Result: 3 stable facets (was 0), 36 endpoints (was 57), no proximity thresholds.

## 2026-04-02 — Trajectory assessment

The fixes are not getting smaller. They're getting harder and more tangled.

The history tells a clear story:

1. **March 27** — Phantom investigation. Tried five different approaches (clear-and-rebuild, filters, edge checks). None worked. Paused.

2. **March 28** — Five separate bugs found and fixed. Then built a whole new file (the pipeline) alongside the old one to try a different architecture. Endpoint counts still diverged at the end of the session.

3. **March 29** — Duplicate labels, phantom endpoints. Five more bugs.

4. **March 30** — Rewrote the crossing detection into a two-part hybrid approach. Fixed six bugs. Session ended with: "Still has missing endpoints."

5. **April 1** — Threw out the old topology and started a simpler design. Got from zero facets tracing back up to three. But the handoff right now says the quad clipper is reporting the wrong edge for an intersection endpoint, and that's causing a cascade of wrong merges.

**The pattern isn't convergence. It's each fix uncovering a deeper structural problem.** You fix the matching, and the merging breaks. You fix the merging, and the wrong edge gets reported. You fix the edge reporting, and endpoints don't connect. The handoff has sections labeled "Blocked" and "Main bug" that describe fundamental connectivity gaps — boundary endpoints disconnected from interior intersection shapes.

**The honest read:** You're not spiraling — you've been systematically stripping away bad approaches and narrowing toward the right architecture. The simpler topology rewrite on April 1 was a genuine reset, not a retreat.

## 2026-04-02 to 2026-04-09 — Late-stage work

> **Note:** Individual sub-dates for these entries are not recorded. The block covers everything between the April 2 trajectory assessment and the April 9 mothballing. Summaries are drawn from the handoff file's "What was done" and "Solved" lists.

### Lacemaker plan (milestone 26)

Renamed the pipeline's endpoint types so they read in plain English: what was called "face intersection" became "pierce", what was called "occlusion clip" and "edge crossing" both became "cross", and what was called "clip" became "part". Unified the keying so each point gets one key from the moment it is born, removed three later merge steps, and deleted the old pipeline. Three endpoint types remain: pierce, cross, and corner. The resulting file is the current topology module.

### Cross-face segment assignment with dihedral test

Edge segments from one object that cross another object's face get assigned to that face. Dihedral test: only silhouette edges (one adjacent face visible) can cross to another object's face. Relaxed rule: one endpoint connected plus one shared point. Runs in a single pass.

### Phantom occluding segment elimination

Screen-distance check in the any-boundary fallback rejects distant wrong matches. Rejected occluding segments where enter and leave are on different boundary edges. Relaxed the same-object check to allow other-object corners that have segments on the face.

### Pierce-cross confusion on same edge (fixed)

When looking for a pierce point to reuse at an occlusion boundary, the lookup now checks that the candidate is near the interval's screen position (within five pixels). This prevents the wrong point from being assigned when multiple pierce or cross points exist on the same edge involving the same face.

### Corner position poisoning (fixed)

Corners now use projected vertex positions, not visible interval positions. Fallback branches create anonymous cross keys instead of corner keys, preventing position poisoning.

### Screen-space cyclic ordering replaces tangent-plane

Replaced world-space tangent plane projection with screen-space angles for determining which segment comes next clockwise at each endpoint. The tangent plane approach gave wrong answers because the 3D plane did not match the screen view. Screen angles are what the viewer sees — and always correct.

### Clockwise direction fix attempt

The tracer was picking the counterclockwise next segment (ascending screen angle) instead of clockwise (descending). Changed the rule for picking the next segment at each endpoint — the previous-in-order neighbor instead of the next-in-order neighbor. Worked on some faces, failed on others — this is the structural problem that later caused mothballing.

### One-facet-at-a-time painting

Replaced even-odd fill of all facets as sub-paths with individual fill per facet. Even-odd fill caused facets with opposite winding to cancel each other out.

### Depth test for screen crossings

The crossings pass computes depth at each screen crossing point using perspective-correct world interpolation. Lines that touch in 3D (depth difference below a tiny threshold) get a cross type. Lines at different depths get an occlude type. Eliminates bogus crossings from projection coincidences.

### Nearby split point merge

After all splitting, multiple discovery paths can split the same edge within a few world units of each other. Merge them — cross wins over occlude wins over pierce. Threshold is 1% of the scene's world-transformed bounding box. The merge also scans nearby endpoints to catch pierce points at the same location.

### Pierce-to-cross rewrite at coplanar crossings

When two edges physically cross (coplanar), any pierce at that point is a misidentification. Rewrite pierce keys to cross keys after Pass 3.

### BETA vertices renamed I-P

Renamed BETA's vertices to letters I through P, eliminating confusion with ALPHA's A-H. Updated keys, screen labels, logs, notes, tests.

### Use case 3 — three faces painting in full (fixed)

Three faces were painting entirely when they should have been partially painted. Root cause: BETA silhouette edge segments ending at BETA corners (L and O) were imported to ALPHA faces even though those corners were outside ALPHA's face on screen. Fix: a cross-face segment ending at a corner of the source object is only valid if that corner lies inside the target face's screen polygon.

### Use case 5 — duplicate cross point (fixed)

Multiple discovery paths were finding the same point on the same edge and assigning it different keys. Fixed by the nearby-split-point merge. Cross wins over occlude wins over pierce.

### Use case 6 — wrong segment claims (fixed)

Screen-only crossings (two edges at different depths that appear to cross in 2D) were being classified as real crossings. Fixed by the depth test. Screen-only crossings now get occlude keys instead of cross keys, eliminating bogus edge splits.

## 2026-04-09 — Mothballed

The remaining structural problem — the across-face inconsistency in clockwise direction — was not resolvable with a local fix. The tracer could paint correctly on some faces and wrong on others depending on face orientation relative to the screen, and no single index-offset rule worked universally.

The codepath was left in place, gated off by the master debug switch. Tests remained green. See the Meta lessons section in [lessons.md](lessons.md) for the distilled convergence-vs-uncovering rule that came out of this work.
