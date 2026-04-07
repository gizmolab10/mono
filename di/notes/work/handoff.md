# Facets

**Status:** 46 tests passing, svelte-check clean. Use case 2 and 3 both paint correctly.
**Design spec:** [simpler design.md](facets/designs/simpler%20design.md)
**Stipulations:** [stipulations.md](stipulations.md)
**Pipeline:** [pipeline.md](facets/pipeline.md)
**History:** [facets/history.md](facets/history.md)
**Milestone 26:** [lacemaker](milestones/done/26.lacemaker.md)

## Use case 3 — fixed

Three faces were painting in full when they should be partially painted. See [use case 3.md](use%20case%203.md).

**Root cause:** BETA silhouette edge segments ending at BETA corners (`D'`, `G'`) were imported to ALPHA faces even though the corners were outside ALPHA's face on screen.

**Fix (stipulation 9.5):** A cross-face segment ending at a corner of the source object is only valid if that corner is inside the target face's screen polygon. Blocks `l→D'`, `m→D'`, `k→G'`, `n→G'` (corners outside) while allowing `g→F'` (F' is inside ALPHA:ABFE).

## Remaining: unpainted facets

**Island facets (stipulation 10.3):** Facets enclosed entirely by other facets on the same face — like `b→c→a` on AEHD, which is on BETA's surface, not ALPHA's. Solved by painting all facets per face as sub-paths of a single canvas path using even-odd fill. Islands are automatically subtracted — no special detection needed.

**Blinking:** Some facet painting blinks. Not yet investigated — pausing on this.

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

## Known limitations

**Pierce key for three-face intersections:** The current pierce key format only works when the intersection line ends at a boundary edge. When three objects' faces meet at a single point, no boundary edge. Future key: pierce with three object IDs in canonical order.

**Pierce or cross at a corner:** The vertex-corner merge replaces pierce/cross keys with corner keys. Correct for identity but loses type information.

**Key length growth:** More intersecting objects means longer pierce keys. Future: overlap graph from bounding-box tests to determine key format before building keys.

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
