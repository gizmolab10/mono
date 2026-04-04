# Simpler Topology

**Next:** Follow [lacemaker plan](lacemaker.md).
**Status:** All 44 tests passing, svelte-check clean. 4 facets painting (was 0).
**Design spec:** [simpler design.md](facets/designs/simpler%20design.md)
**History:** [facets/history.md](facets/history.md)


## Dead ends

- **p, q** (on HGCD): occlusion endpoints on edge GH.
- **o** (on DCBA): occlusion endpoint on edge AB.
- **c** (on DCBA): pierce endpoint disconnected on this face.

## Solved previously

- Pierce-pierce tier 2 merge — same edge + shared face from other object.
- Pierce-pierce tier 1 merge — edge pair as merge key.
- Pierce-occlusion merge tightened — face-level matching + world-distance check (> 5 units).
- Skip hidden intersection line ghosts.
- Skip other-object corner crossings — BETA corners on ALPHA faces.
- Identity mixing fix — Pass 3 with source tags, no proximity.
- Key propagation — merge rewrites into all segments.
- Same-object intersection-edge crossings — Pass 2 allows intersection-vs-edge from same object.

## Paused

- Pierce at vertex not labeled as corner. Cosmetic only.
