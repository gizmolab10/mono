# Lacemaker — Facet #5

**Next:** Paint facet #5 (m→j→g→G→m on face HGCD).
**Status:** 45 tests passing, svelte-check clean. 4 facets painting. Lacemaker plan complete ([milestone 26](milestones/done/26.lacemaker.md)).
**Design spec:** [simpler design.md](facets/designs/simpler%20design.md)
**History:** [facets/history.md](facets/history.md)

## What was done

Lacemaker plan: renamed the pipeline (fi→pierce, oc+ex→cross, clip→part), unified keys so each point gets one key from birth, removed three merge steps, deleted the old pipeline. Three endpoint types remain: pierce, cross, corner. The file is now called Lacemaker.ts.

## Use case

![[Screenshot 2026-04-03 at 11.41.13 AM.png]]

Four facets paint: B→e→f→C on CGFB, a→b→B→C on DCBA, t→G→g→h on CGFB, a→f→C on HGCD. The unpainted facet m→j→g→G→m on HGCD is the next target.

- `g` and `j` are the two endpoints of the intersection line between ALPHA face HGCD and BETA face H'G'C'D'. `g` is on ALPHA edge CG. `j` is on BETA edge G'H'.
- `m` is a crossing: where ALPHA edge GH meets BETA edge G'H'. Not on any intersection line.
- Both `j` and `m` are on BETA edge G'H', at different positions.
- `j→m` is a visible edge segment (part of BETA edge G'H').
- `g→j` is the visible intersection line.

## Why facet #5 doesn't paint

Cross unification didn't close it. `j` is a pierce endpoint (where the intersection line meets a face's interior), not a cross endpoint. The edge and the intersection line meet at `j`, but the edge doesn't pick up the intersection line's key there.

**Approach:** When an intersection line and an edge meet, let the edge use the intersection line's key for that point. Don't do this when two edges meet — that creates phantom connections.

## Known limitations

**Pierce key for three-face intersections:** The current `pierce:edge:face` format only works when the intersection line ends at a boundary edge. When three faces from different objects meet at a single point, each intersection line pierces the third face's interior — no boundary edge. That case doesn't exist in the current scene but will in future use cases. Future key: `pierce:soA:soB:soC` (object IDs in canonical order, unique because objects are convex).

**Key length growth:** As more objects intersect, pierce keys may need more IDs. Future approach: build an overlap graph from bounding-box tests to determine the maximum group size before building any keys.

## Dead ends

- **p, q** (on HGCD): occlusion endpoints on edge GH.
- **o** (on DCBA): occlusion endpoint on edge AB.
- **c** (on DCBA): pierce endpoint disconnected on this face.

## Solved previously

- Lacemaker plan (milestone 26): key unification, merge removal, pipeline cleanup.
- Pierce-pierce merges (tier 1 and 2) — eliminated by pierce key unification.
- Pierce-occlusion merge — eliminated by cross key unification.
- Skip hidden intersection line ghosts.
- Skip other-object corner crossings.
- Identity mixing fix — Pass 3 with source tags, no proximity.
- Key propagation — merge rewrites into all segments.
- Same-object intersection-edge crossings.

## Paused

- Pierce at vertex not labeled as corner. Cosmetic only.
