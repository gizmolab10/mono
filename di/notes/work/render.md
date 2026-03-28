# Render Pipeline

```
clear canvas
    │
    ▼
╔══════════════════════════╗
║   PHASE 1: DATA          ║
║   figure out what's       ║
║   visible — once          ║
╠══════════════════════════╣
║                          ║
║  1. project vertices     ║
║        │                 ║
║        ▼                 ║
║  2. grid + shadow        ║
║        │                 ║
║        ▼                 ║
║  3. fill faces           ║
║        │                 ║
║        ▼                 ║
║  4. occlusion index      ║
║        │                 ║
║        ▼                 ║
║  5. visible segments     ║
║        │                 ║
║        ▼                 ║
║  6. facets               ║
║                          ║
╠══════════════════════════╣
║   PHASE 2: DRAW          ║
║   everybody draws from    ║
║   the same answer         ║
╠══════════════════════════╣
║                          ║
║  7. intersection lines   ║
║        │                 ║
║        ▼                 ║
║  8. edges                ║
║        │                 ║
║        ▼                 ║
║  9. overlays             ║
║                          ║
╚══════════════════════════╝
```

## The nine stages

1. **Project** — push every vertex through the camera. cache screen positions.
2. **Grid** — optional background grid and ground shadow.
3. **Fill** — front-facing faces sorted back-to-front, filled white. painter's algorithm.
4. **Occlusion index** — for each front-facing face: compute plane, screen polygon, tag edges as silhouette or internal, build spatial index.
5. **Visible segments** — the heavy pass. clip edges and intersection lines against occluding faces. filter fake visible gaps. create endpoints. build the segment data everyone else uses.
6. **Facets** — build graph from segments and endpoints. trace closed regions on selected face. paint them.
7. **Intersection lines** — stroke precomputed visible segments.
8. **Edges** — draw from precomputed segments. batch by role: normal, guidance, rotation.
9. **Overlays** — wireframes, axes, hover, selection dots, dimensions, labels.

## The throughline

Compute visible segments once (stage 5), use them everywhere. Edges, intersections, and facets all drink from the same well.
