# Facets

## **Vital conclusion:** Abysmally slow!

**Status:** MOTHBALLED. 498 tests passing, svelte-check clean. Feature disabled via `k.debug.show_facets = false` in Constants.ts. Set to `true` to re-enable.
**Design spec:** [simpler design.md](simpler%20design.md)
**Stipulations:** [stipulations.md](stipulations.md)
**Pipeline:** [pipeline.md](facets/pipeline.md)
**History:** [facets/history.md](di/notes/work/next/facets/history.md)
**Milestone 26:** [lacemaker](milestones/done/26.lacemaker.md)

## Why mothballed

The facet tracing has a fundamental unresolved problem: **clockwise direction is inconsistent across faces.** Screen-space angle ordering (ascending `atan2`) is clockwise on some faces and counterclockwise on others. The tracer uses `idx-1` for clockwise, which works on some faces and fails on others. Neither `idx-1` nor `idx+1` is universally correct. Every fix for one face breaks another.

This affects:
- Starting direction from a vertex (stipulation 11.1)
- Next segment at each point (stipulation 11.2)
- Winding of traced facets (CW vs CCW)

Until this is resolved, facet tracing produces phantom segments, wrong turns, and unpainted facets.

## What works

- Topology pipeline: intersection lines, edge splitting, endpoint identity, all types (corner, cross, occlude, pierce)
- Nearby split point merge (1% of scene bounding box)
- Depth test for screen crossings (perspective-correct)
- Duplicate segment removal
- Pierce→cross rewrite at coplanar crossings
- BETA vertices renamed I-P
- Label system matches screen labels
- Even-odd fill painting (when tracing is correct)

## What doesn't work

- Clockwise direction inconsistency (see above)
- Phantom segments near merged points (f→L, f→C)
- Some facets start from non-vertices after revisit trimming

## Debug flags

All in `k.debug` (Constants.ts):
- `show_facets` — master switch (false = off)
- `trace_logged` — log trace output once
- `facets_logged` — log facet paths once
- `merge_logged` — log merge/pierce diagnostics once
- `last_facet_log` — detect path changes
- `last_label_log` — detect label changes
- `show_ep_labels` — show endpoint labels
- `clip_debug` — clip debugging

## What was done this session

**Four endpoint types:** corner, cross, occlude, pierce. Cross = two lines touch in 3D (coplanar). Occlude = two lines cross on screen at different depths. Stipulation 6.2 updated.

**BETA vertices renamed I-P:** Eliminates confusion with ALPHA's A-H. Updated keys, screen labels, logs, notes, tests.

**Depth test for screen crossings:** Pass 2 uses perspective-correct world interpolation to compute depth at screen crossing points. Lines that touch in 3D (depth < 0.01) → cross. Lines at different depths → occlude.

**Edge×edge dedup:** Split edges create multiple parts that find the same crossing. Dedup by edge pair — first one wins.

**Nearby split point merge (stipulation 7.3):** After all splitting, multiple discovery paths can split the same edge within a few world units. Merge them — cross > occlude > pierce. Threshold = 1% of scene bounding box (world-transformed). Also scans all endpoints near winners to catch pierce points at the same location.

**Duplicate segment removal:** After merge rewrites keys, different discovery paths may produce segments with identical endpoint pairs. Keep first, remove rest. Prevents parallel phantom segments.

**Stipulation 11.1 pierce rewrite:** When two edges physically cross (coplanar), any pierce at that point is a misidentification. Rewrite pierce keys to cross keys after Pass 3.

**Label system fixed:** Trace log labels now match painted screen labels. Same filters, same ordering. Endpoint identity log shows type, edge names, and world positions.

**Cyclic ordering test:** New test verifies traced facets visit each endpoint at most once and no two facets are duplicates.

**Attribute serialization fix:** Don't serialize computed value alongside formula — it's recomputed on restore.

**Screen-space cyclic ordering:** Replaced world-space tangent plane projection with screen-space angles for determining which segment comes next clockwise at each endpoint. The tangent plane approach gave wrong answers because the 3D plane didn't match the screen view. Screen angles are what you see — always correct.

**Clockwise fix:** The tracer was picking the next counterclockwise segment (ascending screen angle) instead of clockwise (descending). Changed from idx+1 to idx-1 in the face-filtered ordering.

**One facet at a time painting:** Replaced even-odd fill of all facets as sub-paths with individual fill per facet. Even-odd fill caused facets with opposite winding to cancel each other out.

**Duplicate segment removal extended:** Now checks within edge segments and intersection segments too, not just occluding segments. Two edge sub-segments with the same endpoint pair on the same edge get deduplicated.

## Use case 5 — duplicate cross point

See [use case 5.md](use%20case%205.md). Stipulation 11.

**Fixed** by the nearby split point merge. Multiple discovery paths that find the same point on the same edge get merged into one key. Cross wins over occlude wins over pierce.

## Use case 6 — wrong segment claims

See [use case 6.md](use%20case%206.md).

**Fixed** by the depth test. Screen-only crossings (lines at different depths) get occlude keys instead of cross keys. Eliminates bogus edge splits from projection coincidences.

## What was done

**Lacemaker plan (milestone 26):** Renamed the pipeline (fi to pierce, oc+ex to cross, clip to part), unified keys so each point gets one key from birth, removed three merge steps, deleted the old pipeline. Three endpoint types remain: pierce, cross, corner. The file is now Topology.ts.

**Cross-face segments:** Edge segments from one object that cross another object's face get assigned to that face. Dihedral test: only silhouette edges (one adjacent face visible) can cross to another object's face. Relaxed rule: one endpoint connected + one shared point. Runs in single pass.

**Phantom occluding segments fixed:**

- Screen-distance check in the any-boundary fallback rejects distant wrong matches
- Rejecting occluding segments where enter and leave are on different boundary edges
- SO check allows other-object corners that have segments on the face

**Pierce/cross confusion on same edge fixed:** When looking for a pierce point to reuse at an occlusion boundary, the lookup now checks that the candidate is near the interval's screen position. Rejects distant matches (more than 5 pixels). This prevents the wrong point from being assigned when multiple pierce/cross points exist on the same edge involving the same face.

**Corner position fix:** Corners use projected vertex positions, not visible interval positions. Fallback branches create anonymous cross keys instead of corner keys, preventing position poisoning.

**Golden test:** Rotated scene test using real app vertex positions exercises the full intersection geometry.

## Remaining: unpainted facets

**Island facets (stipulation 10.3):** Facets enclosed entirely by other facets on the same face — like `b→c→a` on AEHD, which is on BETA's surface, not ALPHA's. Solved by painting all facets per face as sub-paths of a single canvas path using even-odd fill. Islands are automatically subtracted — no special detection needed.

**Blinking:** Some facet painting blinks. Not yet investigated.

## Known limitations

**Pierce key for three-face intersections:** The current pierce key format only works when the intersection line ends at a boundary edge. When three objects' faces meet at a single point, no boundary edge. Future key: pierce with three object IDs in canonical order.

**Pierce or cross at a corner:** The vertex-corner merge replaces pierce/cross keys with corner keys. Correct for identity but loses type information.

**Key length growth:** More intersecting objects means longer pierce keys. Future: overlap graph from bounding-box tests to determine key format before building keys.

**World-distance threshold for merging nearby split points:** Uses 1% of the scene's world-transformed bounding box. Different scenes with very different scales might need tuning.

**Occlude world positions are placeholders:** Occlude points store the front edge's world position, not the actual position on both edges. Not currently a problem since cyclic ordering uses screen positions, but could matter if world positions are used for other purposes.

## Solved

- All visible facets painting correctly on all ALPHA faces
- Lacemaker plan (milestone 26): key unification, merge removal, pipeline cleanup
- Cross-face segment assignment with dihedral test
- Phantom occluding segment elimination (screen-distance, boundary-edge rejection)
- Pierce/cross confusion on same edge (position check in find_pierce)
- Corner position poisoning fix
- Pierce-pierce merges eliminated by key unification
- Pierce-occlusion merge eliminated by cross key unification
- Skip hidden intersection line ghosts
- Skip other-object corner crossings
- Identity mixing fix — Pass 3 with source tags
- Key propagation — merge rewrites into all segments
- Same-object intersection-edge crossings
- Cyclic ordering: screen-space angles, clockwise direction
- Duplicate segment removal across all segment types
- Nearby split point merge (1% of scene bounding box)
- Depth test for screen crossings (perspective-correct)
- Pierce→cross rewrite at coplanar edge crossings (stipulation 11.1)
- BETA vertices renamed I-P

## Use case 3 — fixed

Three faces were painting in full when they should be partially painted. See [use case 3.md](use%20case%203.md).

**Root cause:** BETA silhouette edge segments ending at BETA corners (`L`, `O`) were imported to ALPHA faces even though the corners were outside ALPHA's face on screen.

**Fix (stipulation 9.5):** A cross-face segment ending at a corner of the source object is only valid if that corner is inside the target face's screen polygon. Blocks `l→L`, `m→L`, `k→O`, `n→O` (corners outside) while allowing `g→N` (N is inside ALPHA:ABFE).
