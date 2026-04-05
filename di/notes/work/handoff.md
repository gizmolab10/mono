# Facets

**Status:** 46 tests passing, svelte-check clean. 7 facets painting (was 0).
**Design spec:** [simpler design.md](facets/designs/simpler%20design.md)
**History:** [facets/history.md](facets/history.md)
**Milestone 26:** [lacemaker](milestones/done/26.lacemaker.md)

## What was done

**Lacemaker plan:** Renamed the pipeline (fi→pierce, oc+ex→cross, clip→part), unified keys so each point gets one key from birth, removed three merge steps, deleted the old pipeline. Three endpoint types remain: pierce, cross, corner. The file is now called Topology.ts.

**Facet #5 and two bonus facets:** Three fixes were needed:
1. Cross-face segment assignment — edge segments from one object that cross another object's face get assigned to that face when both endpoints are already there.
2. Corner position fix — corners use projected vertex positions, not visible interval positions.
3. Fallback branches for missing boundary edge data create anonymous cross keys instead of corner keys, preventing position poisoning.

**Golden test:** Added rotated scene test using real app vertex positions to exercise the HGCD × H'G'C'D' intersection. Confirms point `j` appears in both an intersection segment and an edge segment.

## Next

More facets to paint. The current 7 are on three ALPHA faces (DCBA, CGFB, HGCD). BETA faces and remaining unpainted regions are next targets.

---
## Known limitations

**Pierce key for three-face intersections:** `pierce:edge:face` only works when the intersection line ends at a boundary edge. When three objects' faces meet at a single point, no boundary edge — need `pierce:soA:soB:soC`.

**Pierce or cross at a corner:** The vertex-corner merge replaces pierce/cross keys with corner keys. Correct for identity but loses type information. Segments carry the relationship.

**Key length growth:** More intersecting objects means longer pierce keys. Future: overlap graph from bounding-box tests to determine key format before building keys.

---
## Solved

- Lacemaker plan (milestone 26): key unification, merge removal, pipeline cleanup
- Facet #5 (l→j→g→G→l on HGCD) + D→k→c→d→D (DCBA) + D→H→m→i→d→D (HGCD)
- Cross-face segment assignment
- Corner position poisoning fix
- Pierce-pierce merges eliminated by key unification
- Pierce-occlusion merge eliminated by cross key unification
- Skip hidden intersection line ghosts
- Skip other-object corner crossings
- Identity mixing fix — Pass 3 with source tags
- Key propagation — merge rewrites into all segments
- Same-object intersection-edge crossings
