# Simpler Topology

**Next:** Wire intersection line endpoints into the edge graph. Details in "Active" section.
**Status:** All 44 tests passing, svelte-check clean. 4 facets painting (was 0). Debug logging in Topology_Simple and Facets.
**Design spec:** [simpler design.md](facets/designs/simpler%20design.md)
**History:** [facets/history.md](facets/history.md)

## Use Case

![[Screenshot 2026-04-03 at 11.41.13 AM.png]]

Four facets paint correctly: B→e→f→C on CGFB, a→b→B→C on DCBA, t→G→g→h on CGFB, and a→f→C on HGCD. The unpainted facet m→j→g→G→m on HGCD is the next target.

### Key points about m, j, g on face HGCD

- `g` and `j` are the two endpoints of the intersection line between ALPHA face HGCD and BETA face H'G'C'D'. `g` is on ALPHA edge CG. `j` is on BETA edge G'H'.
- `m` is an edge-edge crossing: where ALPHA edge GH meets BETA edge G'H'. It is NOT on any intersection line.
- Both `j` and `m` are on BETA edge G'H', at different positions.
- `j→m` is a visible edge segment (part of BETA edge G'H').
- `g→j` is the visible intersection line.
- The trace labels `j` as `m` because the fi-oc merge was collapsing them. After adding a world-distance check, they no longer merge. But the label assignment is sequential — the fi endpoint at `j`'s position still gets whatever letter comes next.

## Terms

### geometry

- **intersection line** — where two face planes cross, clipped to both face boundaries. Example: g→j (HGCD × H'G'C'D').
- **edge** — a mesh edge. Example: the thick line from G to H (ALPHA edge GH).
- **edge clip** — visible portion of an edge after occlusion clipping. Example: G→m (ALPHA edge GH before it goes behind BETA).
- **intersection clip** — visible portion of an intersection line after occlusion clipping. Example: g→j (survived clipping intact).
- **crossing** — where two visible clips meet on screen. Example: `m` (where ALPHA GH meets BETA G'H').
- **edge-edge crossing** — a crossing between edges from different objects. Example: `m` (ALPHA GH × BETA G'H').
- **fi** — face intersection endpoint. Where an intersection line starts or ends. Example: `g`, `j`, `a`, `f`, `e`, `h`.
- **oc** — occlusion clip endpoint. Where an edge goes behind a face. Example: `n` near H', where ALPHA edge GH disappears behind BETA edge E'H'.
- **ex** — edge crossing endpoint. Where two edges from different objects cross on screen. Example: `m`.
- **segment** — a line in the Facets graph, assigned to a specific face. Example: C→a on face HGCD.
- **facet** — a closed polygon traced from segments on a face. Example: the painted blue areas like B→e→f→C and a→f→C.
- **on_edge** — data on each fi endpoint: which face boundary edge it sits on. Example: `j` has on_edge = BETA edge G'H'.

### internal pipeline

- **merge** — rewriting one endpoint's key to another's because they're the same physical point.
- **split** — dividing a clip into two sub-clips at a crossing point.
- **split filter** — rejects splits at clip boundaries (t < 0.01 or t > 0.99).
- **clip** — a visible segment in the raw geometry list. Either an edge clip or an intersection clip.

## Active: wire `j` into the edge graph

### The problem

The intersection line `j→g` is correctly computed. Point `j` (the fi endpoint) is at the correct world position on both face planes. But `j` has only 1 segment on face HGCD (the intersection line). It needs to connect to ALPHA edge GH to close the facet.

The connection should come from splitting BETA edge G'H' at `j`, creating edge sub-clips that pass through `j`. Then `j` connects to both the intersection line and the edge graph.

### What the arrangement finds

Pass 2 finds these crossings involving edge GH/G'H':

- **Intersection clip × BETA edge G'H'**: ta=0.000, tb=-0.000. The crossing is at `j` — the start of the intersection clip and the start of BETA's edge clip. Both t values are ≈0. The split filter rejects both.
- **ALPHA edge GH × BETA edge G'H'**: ta=1.000, tb=0.200. The crossing is at `m` — the end of ALPHA's edge clip G→p. ta≈1 is rejected by the split filter. tb=0.200 would split BETA's clip.

### What was tried

**Boundary-crossing endpoint reuse**: when a crossing has t≈0 or t≈1, use the clip's existing endpoint as the crossing key instead of creating a new one. This correctly split BETA edge G'H' at `p`/`m`, creating the segment m→p. But it also falsely reused endpoints for unrelated crossings elsewhere, creating phantom segments. Reverted.

**Pass 1e edge split**: split edge clips at intersection line endpoints using on_edge data. Doesn't help — on_edge points to BETA's edge G'H', and the split needs to happen on BETA's edge clip, which then gets assigned to BETA's faces, not ALPHA's face HGCD.

### What's needed

A way to split BETA edge G'H' at `j` (tb≈0) AND at `m` (tb=0.200) without creating phantom segments. Then the sub-clip `j→m` appears in the output and connects `j` to `m`. Both `j` and `m` are visible on face HGCD — if the segment `j→m` is assigned to HGCD during Facets ingestion, the facet closes.

The targeted approach: only reuse boundary endpoints for crossings where the boundary clip is an intersection clip (not an edge clip). Intersection clips meeting edge clips at t≈0 are the "edge split at known point" case from the standard algorithm research. Edge-edge crossings at t≈1 are a different case that shouldn't reuse.

## Remaining dead ends

- **p, q** (on HGCD): oc endpoints on edge GH.
- **o** (on DCBA): oc endpoint on edge AB.
- **c** (on DCBA): fi endpoint disconnected on this face.

## Solved in this session

- **Fi-fi tier 2 merge** — same edge + shared face from other object. Pure topology.
- **Fi-fi tier 1 merge** — edge pair as merge key. Two edges cross at one point.
- **Fi-oc merge tightened** — face-level matching + world-distance check (> 5 units).
- **Skip fi-fi occluding segments** — hidden intersection line ghosts.
- **Skip other-object corner crossings** — BETA corners on ALPHA faces.
- **Identity mixing fix** — Pass 3 with source tags, no proximity.
- **Key propagation** — merge rewrites into all segments.
- **Same-object intersection-edge crossings** — Pass 2 allows intersection-vs-edge from same object.

## Paused: fi at vertex not labeled as corner

Cosmetic only.
