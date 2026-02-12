# Spatial Acceleration for Occlusion

**Started:** 2026-02-08
**Status:** Research

## Problem

Occlusion is brute-force O(edges × faces) — every edge checks every front-facing face from every other object. Intersection lines add O(face_pairs × faces) on top. Fine for a handful of objects, but will choke at scale.

## Goal

Accelerate the broad phase so only nearby face candidates are checked per edge. Keep the existing narrow-phase logic.

## Research

No drop-in JS/TS library does HLR with intersecting objects without a GPU.

### Libraries Considered

| Library                | HLR?<br>[[3D.primer]] | Intersecting objects?            | Verdict                                                        |
| ---------------------- | ------------------ | -------------------------------- | -------------------------------------------------------------- |
| three-plotter-renderer | Yes                | No — explicitly warns against it | Pen-plotter world, skips our hard case                         |
| three-svg-renderer     | Yes                | Unknown                          | Experimental, GPL-3, sparse docs                               |
| plotter-vision         | Yes                | No                               | Demo-quality, O(n²)                                            |
| opencascade.js         | Yes (exact)        | Yes                              | Industrial CAD kernel via WASM. Enormous bundle, C++-style API |

### Building Blocks

| Library        | What it does                                             | Fit                                                                                                     |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **flatbush**   | Static 2D R-tree (Mapbox). Zero-dep, tiny, battle-tested | Best candidate — project face bounding boxes into screen space, query per edge, cull 90%+ of candidates |
| rbush          | Dynamic 2D R-tree                                        | Needed only if faces change frame-to-frame without full rebuild                                         |
| isect          | Segment intersection detection (uses flatbush)           | Useful for edge-face boundary crossings in 2D                                                           |
| three-mesh-bvh | 3D BVH for raycasting<br>[[3D.primer]]                      | Fast but coupled to three.js                                                                            |

### Recommendation

**flatbush** as a spatial index for the existing algorithm. We already have the core logic — the brute force is just the broad phase. Flatbush turns it from O(n) to O(log n) per edge query. That's the "tiled bins" idea from code.debt, essentially.

opencascade.js is the "right" answer but it's bringing a crane to hang a picture.

## Plan

- [ ] Add flatbush dependency
- [ ] After projection, build a flatbush index from all front-facing face bounding boxes (screen space)
- [ ] For each edge, query the index for overlapping faces instead of iterating all
- [ ] Benchmark before/after
